import { 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

class AuthService {
  // Sign in user
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Fetch user data from Firestore
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

  // Get user data from Firestore
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

  // Sign out user
  async signOut() {
    try {
      await signOut(auth);
    } catch (error) {
      throw new Error('Sign out failed: ' + error.message);
    }
  }

  // Create new user account (Admin only)
  async createUser(email, password, userData) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Send password reset email
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Get current user
  getCurrentUser() {
    return auth.currentUser;
  }

  // Auth state observer
  onAuthStateChanged(callback) {
    return auth.onAuthStateChanged(callback);
  }

  // Handle Firebase auth errors
  handleAuthError(error) {
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return new Error('Invalid email or password');
      case 'auth/email-already-in-use':
        return new Error('Email already in use');
      case 'auth/weak-password':
        return new Error('Password should be at least 6 characters');
      case 'auth/invalid-email':
        return new Error('Invalid email address');
      case 'auth/too-many-requests':
        return new Error('Too many attempts. Please try again later');
      default:
        return new Error(error.message || 'Authentication failed');
    }
  }
}

export default new AuthService();
