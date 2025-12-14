import { 
  collection, 
  query, 
  where, 
  getDocs, 
//  orderBy,
  addDoc 
} from 'firebase/firestore';
import { db } from '../config/firebase';

class ActivityService {

// 1. Create a 1:1 Therapy Session (Phase 3)
  async createTherapySession(sessionData) {
    try {
      const docRef = await addDoc(collection(db, 'activities'), {
        ...sessionData,
        type: 'therapy_session', 
        createdAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      throw new Error('Failed to save therapy session: ' + error.message);
    }
  }

  // 2. NEW: Create a Group Class Activity (Phase 4)
  async createGroupActivity(activityData) {
    try {
      const docRef = await addDoc(collection(db, 'activities'), {
        ...activityData,
        type: 'group_activity', // Strict Type
        createdAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      throw new Error('Failed to save group activity: ' + error.message);
    }
  }

  // 3. Get activities for a specific child (Unified View for Parents)
  async getActivitiesByChild(childId) {
    try {
      const activitiesRef = collection(db, 'activities');
      // Fetches both 1:1 sessions AND group activities where child was tagged
      // Note: Firestore doesn't support logical OR across different fields easily.
      // We perform two queries and merge/sort client-side for the Parent View.
      
      const q1 = query(activitiesRef, where('studentId', '==', childId));
      const q2 = query(activitiesRef, where('participatingStudentIds', 'array-contains', childId));

      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      
      const results = [];
      snap1.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
      snap2.forEach(doc => {
        // Avoid duplicates if any
        if (!results.find(r => r.id === doc.id)) {
          results.push({ id: doc.id, ...doc.data() });
        }
      });

      return results.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
      console.error("Error fetching activities:", error);
      throw new Error('Failed to fetch activities: ' + error.message);
    }
  }

  // 4. Get All Group Activities (Admin Calendar)
  async getAllPlayGroupActivities() {
    try {
      const q = query(
        collection(db, 'activities'),
        where('type', '==', 'group_activity')
      );
      
      const querySnapshot = await getDocs(q);
      const activities = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
      throw new Error('Failed to fetch group activities: ' + error.message);
    }
  }

  // // 5. Get activities for a specific child on a specific date
  // async getChildActivitiesByDate(childId, date) {
  //   try {
  //     const q = query(
  //       collection(db, 'activities'),
  //       where('participatingStudentIds', 'array-contains', childId),
  //       where('date', '==', date)
  //     );
  //     const querySnapshot = await getDocs(q);
  //     return querySnapshot.docs.map(doc => ({
  //       id: doc.id,
  //       ...doc.data()
  //     }));
  //   } catch (error) {
  //     throw new Error('Failed to fetch activities by date: ' + error.message);
  //   }
  // }

}

const activityServiceInstance = new ActivityService();
export default activityServiceInstance;