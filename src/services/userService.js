// src/services/userService.js
// FIXED VERSION - Removed orderBy to avoid index requirements
// Sorting is done client-side instead

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc,
  query, 
  where, 
  orderBy,
  arrayUnion,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { trackRead } from '../utils/readCounter';

const COLLECTION_NAME = 'users';
const METADATA_COLLECTION = 'metadata';

class UserService {
  
  /**
   * Get all staff (teachers + therapists) in ONE query
   * Sorting done client-side to avoid index requirement
   */
  async getAllStaff() {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('role', 'in', ['teacher', 'therapist'])
      );

      const snapshot = await getDocs(q);
      trackRead(COLLECTION_NAME, snapshot.docs.length);
      
      const staff = snapshot.docs.map(doc => ({
        id: doc.id,
        uid: doc.id,
        ...doc.data()
      }));
      
      // Sort client-side
      return staff.sort((a, b) => 
        (a.lastName || '').localeCompare(b.lastName || '')
      );
    } catch (error) {
      console.error('Error fetching staff:', error);
      throw error;
    }
  }

  /**
   * Get users by role
   * Sorting done client-side to avoid index requirement
   */
  async getUsersByRole(role) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('role', '==', role)
      );

      const snapshot = await getDocs(q);
      trackRead(COLLECTION_NAME, snapshot.docs.length);
      
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        uid: doc.id,
        ...doc.data()
      }));
      
      // Sort client-side
      return users.sort((a, b) => 
        (a.lastName || '').localeCompare(b.lastName || '')
      );
    } catch (error) {
      console.error(`Error fetching ${role}s:`, error);
      throw error;
    }
  }

  /**
   * Get a single user by ID
   */
  async getUserById(userId) {
    if (!userId) return null;

    try {
      const docRef = doc(db, COLLECTION_NAME, userId);
      const docSnap = await getDoc(docRef);
      trackRead(COLLECTION_NAME, 1);
      
      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        uid: docSnap.id,
        ...docSnap.data()
      };
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUser(userId, updates) {
    try {
      const docRef = doc(db, COLLECTION_NAME, userId);
      
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Add child to parent's childrenIds array
   */
  async addChildToParent(parentId, childId) {
    try {
      const docRef = doc(db, COLLECTION_NAME, parentId);
      
      await updateDoc(docRef, {
        childrenIds: arrayUnion(childId),
        updatedAt: serverTimestamp(),
      });

      return true;
    } catch (error) {
      console.error('Error adding child to parent:', error);
      throw error;
    }
  }

  /**
   * Get staff summary from metadata collection
   */
  async getStaffSummary() {
    try {
      const docRef = doc(db, METADATA_COLLECTION, 'staffSummary');
      const docSnap = await getDoc(docRef);
      trackRead(METADATA_COLLECTION, 1);

      if (!docSnap.exists()) {
        console.log('Staff summary not found, generating...');
        return this.generateAndSaveStaffSummary();
      }

      const data = docSnap.data();
      
      return {
        teachers: data.teachers || [],
        therapists: data.therapists || [],
        allStaff: [...(data.teachers || []), ...(data.therapists || [])],
        lastUpdated: data.lastUpdated?.toDate(),
      };
    } catch (error) {
      console.error('Error fetching staff summary:', error);
      return this.generateStaffSummaryFromQuery();
    }
  }

  /**
   * Generate and save staff summary
   */
  async generateAndSaveStaffSummary() {
    const summary = await this.generateStaffSummaryFromQuery();
    
    try {
      const docRef = doc(db, METADATA_COLLECTION, 'staffSummary');
      await setDoc(docRef, {
        teachers: summary.teachers,
        therapists: summary.therapists,
        lastUpdated: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error saving staff summary:', error);
    }

    return summary;
  }

  /**
   * Generate staff summary from direct queries
   */
  async generateStaffSummaryFromQuery() {
    const allStaff = await this.getAllStaff();

    const teachers = allStaff
      .filter(s => s.role === 'teacher')
      .map(t => ({
        id: t.id,
        uid: t.uid,
        name: `${t.firstName || ''} ${t.lastName || ''}`.trim(),
        firstName: t.firstName,
        lastName: t.lastName,
        specializations: t.specializations || [],
        photo: t.profilePhoto || t.photoUrl || null,
        email: t.email,
      }));

    const therapists = allStaff
      .filter(s => s.role === 'therapist')
      .map(t => ({
        id: t.id,
        uid: t.uid,
        name: `${t.firstName || ''} ${t.lastName || ''}`.trim(),
        firstName: t.firstName,
        lastName: t.lastName,
        specializations: t.specializations || [],
        photo: t.profilePhoto || t.photoUrl || null,
        email: t.email,
        licenseType: t.licenseType,
      }));

    return {
      teachers,
      therapists,
      allStaff: [...teachers, ...therapists],
      lastUpdated: new Date(),
    };
  }

  /**
   * Get staff by specialization
   */
  async getStaffBySpecialization(serviceName) {
    try {
      const summary = await this.getStaffSummary();
      
      return summary.allStaff.filter(staff => 
        staff.specializations?.includes(serviceName)
      );
    } catch (error) {
      console.error('Error fetching staff by specialization:', error);
      throw error;
    }
  }

  /**
   * Batch update users
   */
  async batchUpdateUsers(updates) {
    if (!updates || updates.length === 0) return;

    try {
      const batch = writeBatch(db);

      updates.forEach(({ id, data }) => {
        const docRef = doc(db, COLLECTION_NAME, id);
        batch.update(docRef, {
          ...data,
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();
      console.log(`Batch updated ${updates.length} users`);
    } catch (error) {
      console.error('Error in batch update:', error);
      throw error;
    }
  }
}

const userService = new UserService();
export default userService;