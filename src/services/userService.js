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
  arrayUnion
} from 'firebase/firestore';
import { db } from '../config/firebase';

class UserService {
  
  /**
  * Adds a specialization to a staff member's profile if it doesn't exist.
   * @param {string} uid - The staff member's User ID
   * @param {string} specialization - The name of the service (e.g. "Speech Therapy")
   */
  async addSpecialization(uid, specialization) {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        specializations: arrayUnion(specialization)
      });
    } catch (error) {
      console.error("Failed to update staff specialization:", error);
      // We don't throw here because this is a "secondary" action. 
      // If it fails, we don't want to crash the whole enrollment process.
    }
  }

  /**
   * Add a child ID to a parent's `childrenIds` array (non-fatal)
   * @param {string} uid - Parent user UID
   * @param {string} childId - Child document id
   */
  async addChildToParent(uid, childId) {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        childrenIds: arrayUnion(childId),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Failed to add child to parent:", error);
      // Non-fatal: do not throw so enrollment flow continues
    }
  }

  // --- BASIC CRUD ---

  // Create or Overwrite User (Used by Auth Services)
  async createUser(uid, userData) {
    try {
      await setDoc(doc(db, 'users', uid), {
        ...userData,
        createdAt: new Date().toISOString(),
        active: true // Default to active
      });
    } catch (error) {
      throw new Error('Failed to create user: ' + error.message);
    }
  }

  // Get User by ID
  async getUserById(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (!userDoc.exists()) throw new Error('User not found');
      return { uid: userDoc.id, ...userDoc.data() };
    } catch (error) {
      throw new Error('Failed to fetch user: ' + error.message);
    }
  }

  // Update User (Generic)
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

  // Hard Delete (Permanent)
  async deleteUser(uid) {
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (error) {
      throw new Error('Failed to delete user: ' + error.message);
    }
  }

  // Soft Delete (Mark as inactive - Used by Teachers/Therapists)
  async softDeleteUser(uid) {
    try {
      await this.updateUser(uid, {
        active: false,
        deletedAt: new Date().toISOString()
      });
    } catch (error) {
      throw new Error('Failed to deactivate user: ' + error.message);
    }
  }

  // ----------------------- QUERIES ------------------------

  // Get Users by Role (Replaces getAllTeachers, getAllTherapists, getAllParents)
  async getUsersByRole(role) {
    try {
      const q = query(collection(db, 'users'), where('role', '==', role));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Failed to fetch ${role}s: ` + error.message);
    }
  }

  // Get Users by Specialization (Replaces teacherService specific logic)
  async getUsersBySpecialization(role, specialization) {
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', role),
        where('specializations', 'array-contains', specialization)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error('Failed to search users by specialization: ' + error.message);
    }
  }

  // Get All Active Staff (Combined Teachers & Therapists)
  async getAllStaff() {
    try {
      const q = query(collection(db, 'users'), where('role', 'in', ['teacher', 'therapist']));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error('Failed to fetch staff: ' + error.message);
    }
  }

  // Find by Email (Helper for Auth)
  async getUserByEmail(email) {
    try {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;
      return { uid: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    } catch (error) {
      throw new Error('Failed to find user by email: ' + error.message);
    }
  }
}

const userServiceInstance = new UserService();
export default userServiceInstance;