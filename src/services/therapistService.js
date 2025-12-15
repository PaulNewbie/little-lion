import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  updateDoc, 
  query,
  where 
} from 'firebase/firestore';
import { db } from '../config/firebase';

class TherapistService {
  // 1. Get all therapists
  async getAllTherapists() {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'therapist'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error('Failed to fetch therapists: ' + error.message);
    }
  }

  // 2. Delete therapist (soft delete)
  async deleteTherapist(therapistId) {
    try {
      await updateDoc(doc(db, 'users', therapistId), {
        active: false,
        deletedAt: new Date().toISOString()
      });
    } catch (error) {
      throw new Error('Failed to delete therapist: ' + error.message);
    }
  }
  
  // 3. Get all active staff (Teachers + Therapists)
  async getAllStaff() {
    try {
      // Firebase 'in' query supports up to 10 values
      const q = query(collection(db, 'users'), where('role', 'in', ['teacher', 'therapist']));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error('Failed to fetch staff: ' + error.message);
    }
  }
}

const therapistServiceInstance = new TherapistService();
export default therapistServiceInstance;