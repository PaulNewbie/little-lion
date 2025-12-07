import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../config/firebase';

class ActivityService {
  // 1. Get all activities for a specific child (for Admin or Parent view)
  async getActivitiesByChild(childId) {
    try {
      const activitiesRef = collection(db, 'activities');
      // Query activities where this child's ID is in the participation array
      const q = query(
        activitiesRef,
        where('participatingStudentIds', 'array-contains', childId),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Error fetching activities by child:", error);
      throw new Error('Failed to fetch activities: ' + error.message);
    }
  }

  // 2. Get activities for a specific child on a specific date
  // This is useful if we want to separate the calls, 
  // but usually, we can just filter the results from getActivitiesByChild client-side for simplicity.
  async getChildActivitiesByDate(childId, date) {
    try {
      const q = query(
        collection(db, 'activities'),
        where('participatingStudentIds', 'array-contains', childId),
        where('date', '==', date)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error('Failed to fetch activities by date: ' + error.message);
    }
  }
}

const activityServiceInstance = new ActivityService();
export default activityServiceInstance;