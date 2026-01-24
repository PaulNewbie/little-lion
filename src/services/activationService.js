// src/services/activationService.js

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  deleteField,
  serverTimestamp
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  updatePassword,
  sendPasswordResetEmail,
  getAuth
} from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { db, auth, firebaseConfig } from '../config/firebase';
import {
  generateActivationCode,
  generateAdminAssistCode,
  normalizeCode
} from '../utils/codeGenerator';

// Constants
const ACTIVATION_EXPIRY_DAYS = 14;
const ADMIN_CODE_EXPIRY_MINUTES = 10;

class ActivationService {

  /**
   * Generate activation data for a new user
   * Called when admin creates an account
   * @param {string} tempPassword - The temporary password for this account
   * @returns {object} Activation fields to add to user document
   */
  generateActivationData(tempPassword) {
    const now = Date.now();
    const expiryMs = ACTIVATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    const code = generateActivationCode();

    console.log('📝 Generated activation code:', code);

    return {
      accountStatus: 'pending_setup',
      activationCode: code,
      activationExpiry: now + expiryMs,
      activationCreatedAt: now,
      // Store temp password (base64 encoded) - will be deleted after activation
      _tempKey: btoa(tempPassword)
    };
  }

  /**
   * Create a document in the public activation_codes collection
   * This allows unauthenticated users to validate their code
   * @param {string} userId - The user's UID
   * @param {object} userData - User data (firstName, lastName, email, role)
   * @param {object} activationData - Activation data from generateActivationData
   */
  async createActivationCodeDocument(userId, userData, activationData) {
    try {
      const codeDocRef = doc(db, 'activation_codes', activationData.activationCode);

      await setDoc(codeDocRef, {
        code: activationData.activationCode,
        codeNormalized: normalizeCode(activationData.activationCode),
        userId: userId,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role || 'parent',
        expiry: activationData.activationExpiry,
        createdAt: activationData.activationCreatedAt,
        _tempKey: activationData._tempKey
      });

      console.log('✅ Created activation_codes document for:', activationData.activationCode);
      return { success: true };
    } catch (error) {
      console.error('Error creating activation code document:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate an activation code using the public activation_codes collection
   * @param {string} code - The activation code to validate
   * @returns {object} { valid: boolean, user?: object, error?: string }
   */
  async validateActivationCode(code) {
    try {
      const normalizedCode = normalizeCode(code);
      const formattedCode = this.formatStoredCode(normalizedCode);

      console.log('🔍 Validating activation code:', {
        originalCode: code,
        normalizedCode,
        formattedCode
      });

      // First, try to get the document directly by ID (the code is the document ID)
      const codeDocRef = doc(db, 'activation_codes', formattedCode);
      const codeDoc = await getDoc(codeDocRef);

      if (codeDoc.exists()) {
        console.log('✅ Found activation code document');
        return this.checkActivationCodeStatus(codeDoc);
      }

      // If not found by ID, try querying by code field
      const codesRef = collection(db, 'activation_codes');
      const q = query(codesRef, where('code', '==', formattedCode));
      const snapshot = await getDocs(q);

      console.log('🔍 Query results:', snapshot.size, 'documents found');

      if (snapshot.empty) {
        // Try with uppercase
        const q2 = query(codesRef, where('code', '==', code.toUpperCase()));
        const snapshot2 = await getDocs(q2);

        if (snapshot2.empty) {
          console.log('❌ No activation code found');
          return { valid: false, error: 'Invalid activation code' };
        }

        return this.checkActivationCodeStatus(snapshot2.docs[0]);
      }

      return this.checkActivationCodeStatus(snapshot.docs[0]);

    } catch (error) {
      console.error('Error validating activation code:', error);
      return { valid: false, error: `Failed: ${error.code || error.message || 'unknown'}` };
    }
  }

  /**
   * Helper to format stored code consistently
   */
  formatStoredCode(normalizedCode) {
    if (normalizedCode.length === 8) {
      return `${normalizedCode.slice(0, 4)}-${normalizedCode.slice(4)}`;
    }
    return normalizedCode;
  }

  /**
   * Check activation code status from activation_codes document
   */
  checkActivationCodeStatus(codeDoc) {
    const codeData = codeDoc.data();

    console.log('🔍 Checking activation status:', {
      expiry: codeData.expiry,
      expiryDate: new Date(codeData.expiry).toISOString(),
      now: Date.now(),
      isExpired: Date.now() > codeData.expiry
    });

    // Check if expired
    if (Date.now() > codeData.expiry) {
      console.log('❌ Activation code expired');
      return {
        valid: false,
        error: 'expired',
        user: {
          uid: codeData.userId,
          firstName: codeData.firstName,
          lastName: codeData.lastName,
          email: codeData.email,
          role: codeData.role
        }
      };
    }

    console.log('✅ Activation code valid');
    return {
      valid: true,
      user: {
        uid: codeData.userId,
        firstName: codeData.firstName,
        lastName: codeData.lastName,
        email: codeData.email,
        role: codeData.role,
        _tempKey: codeData._tempKey,
        activationCode: codeData.code
      }
    };
  }

  /**
   * Get user's children (for parent accounts)
   * @param {string} parentId - Parent's UID
   * @returns {array} List of children
   */
  async getChildrenForParent(parentId) {
    try {
      const childrenRef = collection(db, 'children');
      const q = query(childrenRef, where('parentId', '==', parentId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching children:', error);
      return [];
    }
  }

  /**
   * Complete the activation process - Direct password setting
   * Signs in with temp password, updates to new password, marks account active
   * @param {string} uid - User's UID
   * @param {string} email - User's email
   * @param {string} newPassword - The new password chosen by user
   * @param {string} activatedBy - 'self' or 'admin'
   * @param {string} activationCode - The activation code (to delete the document)
   * @returns {object} { success: boolean, error?: string }
   */
  async completeActivation(uid, email, newPassword, activatedBy = 'self', activationCode = null) {
    let tempApp = null;

    try {
      // 1. Get the temp password from activation_codes collection first
      let tempKey = null;

      if (activationCode) {
        const codeDocRef = doc(db, 'activation_codes', activationCode);
        const codeDoc = await getDoc(codeDocRef);
        if (codeDoc.exists()) {
          tempKey = codeDoc.data()._tempKey;
        }
      }

      // Fallback: try to get from users collection
      if (!tempKey) {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          tempKey = userDoc.data()._tempKey;
        }
      }

      if (!tempKey) {
        // Fallback to email reset if no temp key (shouldn't happen)
        console.warn('No temp key found, falling back to email reset');
        await sendPasswordResetEmail(auth, email, {
          url: `${window.location.origin}/login?activated=true`
        });
        await this.markAccountAsActive(uid, activatedBy, activationCode);
        return { success: true, method: 'email_reset' };
      }

      // 2. Decode temp password
      const tempPassword = atob(tempKey);

      // 3. Create a temporary Firebase app to sign in (avoid affecting current session)
      tempApp = initializeApp(firebaseConfig, 'activationApp-' + Date.now());
      const tempAuth = getAuth(tempApp);

      // 4. Sign in with temp password
      const userCredential = await signInWithEmailAndPassword(tempAuth, email, tempPassword);

      // 5. Update to new password
      await updatePassword(userCredential.user, newPassword);

      // 6. Sign out from temp app
      await tempAuth.signOut();

      // 7. Mark account as active and remove temp key
      await this.markAccountAsActive(uid, activatedBy, activationCode);

      return { success: true, method: 'direct' };

    } catch (error) {
      console.error('Error completing activation:', error);

      // If sign-in fails, the temp password might have been changed already
      // Fall back to email reset
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        try {
          await sendPasswordResetEmail(auth, email, {
            url: `${window.location.origin}/login?activated=true`
          });
          await this.markAccountAsActive(uid, activatedBy, activationCode);
          return { success: true, method: 'email_reset', fallback: true };
        } catch (resetError) {
          return { success: false, error: 'Failed to set password. Please contact support.' };
        }
      }

      return { success: false, error: error.message };
    } finally {
      // Clean up temp app
      if (tempApp) {
        try {
          const { deleteApp } = await import('firebase/app');
          await deleteApp(tempApp);
        } catch (e) {
          console.warn('Failed to delete temp app:', e);
        }
      }
    }
  }

  /**
   * Mark account as active in Firestore and delete activation_codes document
   * @param {string} uid - User's UID
   * @param {string} activatedBy - 'self' or 'admin'
   * @param {string} activationCode - The activation code to delete
   */
  async markAccountAsActive(uid, activatedBy = 'self', activationCode = null) {
    const userRef = doc(db, 'users', uid);

    // First, set the active status
    await updateDoc(userRef, {
      accountStatus: 'active',
      activatedAt: new Date().toISOString(),
      activatedBy: activatedBy,
      updatedAt: serverTimestamp()
    });

    // Then, delete all activation-related fields in a separate update
    await updateDoc(userRef, {
      activationCode: deleteField(),
      activationExpiry: deleteField(),
      activationCreatedAt: deleteField(),
      _tempKey: deleteField(),
      mustChangePassword: deleteField(),
      password: deleteField(),
      adminAssistCode: deleteField(),
      adminAssistExpiry: deleteField()
    });

    // Delete the activation_codes document
    if (activationCode) {
      try {
        const codeDocRef = doc(db, 'activation_codes', activationCode);
        await deleteDoc(codeDocRef);
        console.log('✅ Deleted activation_codes document:', activationCode);
      } catch (error) {
        console.warn('Failed to delete activation_codes document:', error);
      }
    }
  }

  /**
   * Regenerate activation code (for resend)
   * Also generates a new temp password
   * @param {string} uid - User's UID
   * @param {string} email - User's email (needed to reset in Firebase Auth)
   * @param {object} userData - User data for creating new activation code doc
   * @returns {object} { success: boolean, newCode?: string, error?: string }
   */
  async regenerateActivationCode(uid, email, userData = null) {
    try {
      // Generate new temp password
      const { generateSecurePassword } = await import('../utils/codeGenerator');
      const newTempPassword = generateSecurePassword(24);

      // Get existing user data if not provided
      if (!userData) {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          userData = userDoc.data();
        }
      }

      // Delete old activation_codes document if exists
      if (userData?.activationCode) {
        try {
          await deleteDoc(doc(db, 'activation_codes', userData.activationCode));
        } catch (e) {
          console.warn('Could not delete old activation code:', e);
        }
      }

      // Generate new activation data
      const activationData = this.generateActivationData(newTempPassword);

      // Update Firestore users collection
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        ...activationData,
        updatedAt: serverTimestamp()
      });

      // Create new activation_codes document
      await this.createActivationCodeDocument(uid, {
        email,
        firstName: userData?.firstName || '',
        lastName: userData?.lastName || '',
        role: userData?.role || 'parent'
      }, activationData);

      // Note: We can't easily update the Firebase Auth password without signing in
      // The user will need to use email reset if they already changed their password
      await sendPasswordResetEmail(auth, email);

      return { success: true, newCode: activationData.activationCode };
    } catch (error) {
      console.error('Error regenerating code:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate admin-assist code for in-person activation
   * @param {string} uid - User's UID
   * @returns {object} { success: boolean, code?: string, expiry?: number, error?: string }
   */
  async generateAdminAssistCodeForUser(uid) {
    try {
      const adminCode = generateAdminAssistCode();
      const expiry = Date.now() + (ADMIN_CODE_EXPIRY_MINUTES * 60 * 1000);

      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        adminAssistCode: adminCode,
        adminAssistExpiry: expiry,
        updatedAt: serverTimestamp()
      });

      return { success: true, code: adminCode, expiry };
    } catch (error) {
      console.error('Error generating admin assist code:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate admin-assist code
   * @param {string} code - The admin assist code
   * @returns {object} { valid: boolean, user?: object, error?: string }
   */
  async validateAdminAssistCode(code) {
    try {
      const normalizedCode = normalizeCode(code);
      const formattedCode = `${normalizedCode.slice(0, 3)}-${normalizedCode.slice(3, 6)}-${normalizedCode.slice(6, 9)}`;

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('adminAssistCode', '==', formattedCode));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return { valid: false, error: 'Invalid admin code' };
      }

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();

      // Check if expired (10 minutes)
      if (Date.now() > userData.adminAssistExpiry) {
        return { valid: false, error: 'Admin code has expired' };
      }

      // Check if already activated
      if (userData.accountStatus === 'active') {
        return { valid: false, error: 'Account is already activated' };
      }

      return { valid: true, user: { uid: userDoc.id, ...userData } };
    } catch (error) {
      console.error('Error validating admin code:', error);
      return { valid: false, error: 'Failed to validate code' };
    }
  }

  /**
   * Clear admin-assist code after use
   * @param {string} uid - User's UID
   */
  async clearAdminAssistCode(uid) {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        adminAssistCode: deleteField(),
        adminAssistExpiry: deleteField()
      });
    } catch (error) {
      console.error('Error clearing admin code:', error);
    }
  }

  /**
   * Get all pending activation accounts
   * @returns {array} List of pending users
   */
  async getPendingAccounts() {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('accountStatus', '==', 'pending_setup'));
      const snapshot = await getDocs(q);

      const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));

      // Sort by creation date (newest first)
      users.sort((a, b) => (b.activationCreatedAt || 0) - (a.activationCreatedAt || 0));

      return users;
    } catch (error) {
      console.error('Error fetching pending accounts:', error);
      return [];
    }
  }

  /**
   * Get user by UID
   * @param {string} uid - User's UID
   * @returns {object|null} User data or null
   */
  async getUserById(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (!userDoc.exists()) return null;
      return { uid: userDoc.id, ...userDoc.data() };
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }
}

const activationServiceInstance = new ActivationService();
export default activationServiceInstance;
