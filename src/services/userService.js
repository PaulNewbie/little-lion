import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where 
} from 'firebase/firestore';
import { db } from '../config/firebase';

class UserService {
  // Create new user in Firestore
  async createUser(uid, userData) {
    try {
      await setDoc(doc(db, 'users', uid), {
        ...userData,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      throw new Error('Failed to create user: ' + error.message);
    }
  }

  // Get user by ID
  async getUserById(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      return { uid: userDoc.id, ...userDoc.data() };
    } catch (error) {
      throw new Error('Failed to fetch user: ' + error.message);
    }
  }

  // Get all users by role
  async getUsersByRole(role) {
    try {
      const q = query(collection(db, 'users'), where('role', '==', role));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error('Failed to fetch users: ' + error.message);
    }
  }

  // Update user
  async updateUser(uid, updates) {
    try {
      await updateDoc(doc(db, 'users', uid), {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      throw new Error('Failed to update user: ' + error.message);
    }
  }

  // Delete user
  async deleteUser(uid) {
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (error) {
      throw new Error('Failed to delete user: ' + error.message);
    }
  }

  // Get all teachers
  async getAllTeachers() {
    return this.getUsersByRole('teacher');
  }

  // Get all parents
  async getAllParents() {
    return this.getUsersByRole('parent');
  }

  // Find a user by their email (for enroll multiple child in one parent account)
  async getUserByEmail(email) {
    try {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      // Return the first match (email should be unique)
      const userDoc = querySnapshot.docs[0];
      return { uid: userDoc.id, ...userDoc.data() };
    } catch (error) {
      throw new Error('Failed to find user by email: ' + error.message);
    }
  }
}

export default new UserService();
