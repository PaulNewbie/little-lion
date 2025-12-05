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
import { auth, db, firebaseConfig } from './firebase';

class AuthService {
  // 1. Sign in user
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const userData = await this.getUserData(user.uid);
      
      return {
        uid: user.uid,
        email: user.email,
        ...userData
      };
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // 2. Create Parent Account
  async createParentAccount(email, password, parentData) {
    let tempApp = null;
    try {
      // Create a secondary app instance so we don't log out the admin
      tempApp = initializeApp(firebaseConfig, 'tempApp');
      const tempAuth = getAuth(tempApp);

      // Create the user in the secondary auth
      const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
      const user = userCredential.user;

      // Save to Firestore using the MAIN db instance
      await setDoc(doc(db, 'users', user.uid), {
        ...parentData,
        uid: user.uid,
        role: 'parent',
        createdAt: new Date().toISOString()
      });

      return user;
    } catch (error) {
      throw this.handleAuthError(error);
    } finally {
      // Clean up the temporary app instance
      if (tempApp) {
        const { deleteApp } = await import('firebase/app');
        await deleteApp(tempApp);
      }
    }
  }

  // 3. Get user data
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

  // 4. Sign out
  async signOut() {
    try {
      await signOut(auth);
    } catch (error) {
      throw new Error('Sign out failed: ' + error.message);
    }
  }

  // 5. Reset Password
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // 6. Auth State Observer (Fixed: Added this method back)
  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  }

  // 7. Error Handler
  handleAuthError(error) {
    console.error("Auth Error:", error);
    switch (error.code) {
      case 'auth/email-already-in-use':
        return new Error('This email is already registered.');
      case 'auth/weak-password':
        return new Error('Password should be at least 6 characters.');
      case 'auth/invalid-email':
        return new Error('Invalid email address.');
      default:
        return new Error(error.message || 'Authentication failed');
    }
  }
}

const authServiceInstance = new AuthService();
export default authServiceInstance;