// src/services/authService.js

import { 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  getAuth,
  onAuthStateChanged 
} from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, firebaseConfig } from '../config/firebase';
import { generateSecurePassword } from '../utils/codeGenerator';
import activationService from './activationService';
import { getDefaultPermissions } from '../utils/permissions'; // ADD THIS IMPORT

class AuthService {
  // 1. Sign in user
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      let userData;
      try {
        userData = await this.getUserData(user.uid);
      } catch (fetchError) {
        await signOut(auth);
        throw new Error('Unable to sign in. Please contact an administrator.');
      }

      // Check if account is deactivated
      if (userData.accountStatus === 'inactive') {
        await signOut(auth);
        throw new Error('Your account has been deactivated. Please contact an administrator.');
      }

      return {
        uid: user.uid,
        email: user.email,
        ...userData
      };
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // 2. Create Parent Account (NO CHANGES - parents don't need enrollment permission)
  async createParentAccount(email, parentData) {
    let tempApp = null;
    try {
      const tempPassword = generateSecurePassword(24);
      
      tempApp = initializeApp(firebaseConfig, 'tempApp-' + Date.now());
      const tempAuth = getAuth(tempApp);
      const userCredential = await createUserWithEmailAndPassword(tempAuth, email, tempPassword);
      const user = userCredential.user;

      const activationData = activationService.generateActivationData(tempPassword);

      await setDoc(doc(db, 'users', user.uid), {
        ...parentData,
        uid: user.uid,
        email: email,
        role: 'parent',
        childrenIds: [],
        active: true,
        ...activationData,
        createdAt: new Date().toISOString()
      });

      // Create activation_codes document for public validation
      await activationService.createActivationCodeDocument(user.uid, {
        email,
        firstName: parentData.firstName,
        lastName: parentData.lastName,
        role: 'parent'
      }, activationData);

      return {
        uid: user.uid,
        email: email,
        ...parentData,
        activationCode: activationData.activationCode
      };
    } catch (error) {
      throw this.handleAuthError(error);
    } finally {
      if (tempApp) {
        const { deleteApp } = await import('firebase/app');
        await deleteApp(tempApp);
      }
    }
  }

  // 3. Create Therapist Account (UPDATED - with default permissions)
  async createTherapistAccount(email, therapistData) {
    let tempApp = null;
    try {
      const tempPassword = generateSecurePassword(24);
      
      tempApp = initializeApp(firebaseConfig, 'tempApp-Therapist-' + Date.now());
      const tempAuth = getAuth(tempApp);
      const userCredential = await createUserWithEmailAndPassword(tempAuth, email, tempPassword);
      const user = userCredential.user;

      const activationData = activationService.generateActivationData(tempPassword);

      await setDoc(doc(db, 'users', user.uid), {
        ...therapistData,
        uid: user.uid,
        email: email,
        role: 'therapist',
        specializations: therapistData.specializations || [],
        active: true,
        profileCompleted: false,
        permissions: getDefaultPermissions('therapist'),
        permissionsHistory: [],
        ...activationData,
        createdAt: new Date().toISOString()
      });

      // Create activation_codes document for public validation
      await activationService.createActivationCodeDocument(user.uid, {
        email,
        firstName: therapistData.firstName,
        lastName: therapistData.lastName,
        role: 'therapist'
      }, activationData);

      return {
        uid: user.uid,
        email: email,
        ...therapistData,
        activationCode: activationData.activationCode
      };
    } catch (error) {
      throw this.handleAuthError(error);
    } finally {
      if (tempApp) {
        const { deleteApp } = await import('firebase/app');
        await deleteApp(tempApp);
      }
    }
  }

  // 4. Create Teacher Account (UPDATED - with default permissions)
  async createTeacherAccount(email, teacherData) {
    let tempApp = null;
    try {
      const tempPassword = generateSecurePassword(24);
      
      tempApp = initializeApp(firebaseConfig, 'tempApp-' + Date.now());
      const tempAuth = getAuth(tempApp);
      const userCredential = await createUserWithEmailAndPassword(tempAuth, email, tempPassword);
      const user = userCredential.user;

      const activationData = activationService.generateActivationData(tempPassword);

      await setDoc(doc(db, 'users', user.uid), {
        ...teacherData,
        uid: user.uid,
        email: email,
        role: 'teacher',
        specializations: teacherData.specializations || [],
        active: true,
        permissions: getDefaultPermissions('teacher'),
        permissionsHistory: [],
        ...activationData,
        createdAt: new Date().toISOString()
      });

      // Create activation_codes document for public validation
      await activationService.createActivationCodeDocument(user.uid, {
        email,
        firstName: teacherData.firstName,
        lastName: teacherData.lastName,
        role: 'teacher'
      }, activationData);

      return {
        uid: user.uid,
        email: email,
        ...teacherData,
        activationCode: activationData.activationCode
      };
    } catch (error) {
      throw this.handleAuthError(error);
    } finally {
      if (tempApp) {
        const { deleteApp } = await import('firebase/app');
        await deleteApp(tempApp);
      }
    }
  }

  // 5. Create Admin Account (UPDATED - with default permissions)
  async createAdminAccount(email, adminData) {
    let tempApp = null;
    try {
      const tempPassword = generateSecurePassword(24);
      
      tempApp = initializeApp(firebaseConfig, 'tempApp-Admin-' + Date.now());
      const tempAuth = getAuth(tempApp);
      const userCredential = await createUserWithEmailAndPassword(tempAuth, email, tempPassword);
      const user = userCredential.user;

      const activationData = activationService.generateActivationData(tempPassword);

      await setDoc(doc(db, 'users', user.uid), {
        ...adminData,
        uid: user.uid,
        email: email,
        role: 'admin',
        active: true,
        permissions: getDefaultPermissions('admin'),
        permissionsHistory: [],
        ...activationData,
        createdAt: new Date().toISOString()
      });

      // Create activation_codes document for public validation
      await activationService.createActivationCodeDocument(user.uid, {
        email,
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        role: 'admin'
      }, activationData);

      return {
        uid: user.uid,
        email: email,
        ...adminData,
        activationCode: activationData.activationCode
      };
    } catch (error) {
      throw this.handleAuthError(error);
    } finally {
      if (tempApp) {
        const { deleteApp } = await import('firebase/app');
        await deleteApp(tempApp);
      }
    }
  }

  // 6. Get user data
  async getUserData(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }
      return userDoc.data();
    } catch (error) {
      throw new Error('Failed to fetch user data: ' + error.message);
    }
  }

  // 7. Sign out
  async signOut() {
    try {
      await signOut(auth);
    } catch (error) {
      throw new Error('Sign out failed: ' + error.message);
    }
  }

  // 8. Reset Password
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // 9. Auth State Observer
  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  }

  // 10. Error Handler
  handleAuthError(error) {
    console.error("Auth Error:", error);
    switch (error.code) {
      case 'auth/email-already-in-use':
        return new Error('This email is already registered.');
      case 'auth/weak-password':
        return new Error('Password should be at least 6 characters.');
      case 'auth/invalid-email':
        return new Error('Invalid email address.');
      case 'auth/user-not-found':
        return new Error('No account found with this email.');
      case 'auth/wrong-password':
        return new Error('Incorrect password.');
      case 'auth/invalid-credential':
        return new Error('Invalid email or password.');
      default:
        return new Error(error.message || 'Authentication failed');
    }
  }
}

const authServiceInstance = new AuthService();
export default authServiceInstance;