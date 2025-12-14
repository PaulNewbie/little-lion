import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  addDoc 
} from 'firebase/firestore';
import { db } from '../config/firebase';

class ActivityService {

// 1. Create a 1:1 Therapy Session
  async createTherapySession(sessionData) {
    try {
      // Ensure strict type and fields
      const docRef = await addDoc(collection(db, 'activities'), {
        ...sessionData,
        type: 'therapy_session', // Strict Type
        createdAt: new Date().toISOString(),
        // adminFeedback: null (Initialized empty)
      });
      return docRef.id;
    } catch (error) {
      throw new Error('Failed to save therapy session: ' + error.message);
    }
  }

  // 2. Get activities for a specific child (General View)
  async getActivitiesByChild(childId) {
    try {
      const activitiesRef = collection(db, 'activities');
      // This query handles both therapy sessions (studentId) AND group activities (participatingStudentIds)
      // Note: Firestore allows basic OR queries or client-side merging. 
      // For simplicity, we might need two queries or rely on a "taggedStudents" array if we unified them.
      // OPTIMIZATION: We will handle the merging in the Component or use a compound index.
      
      // Let's assume for now we fetch types separately or use a unified 'studentIds' field for querying.
      // Ideally: 
      // Therapy Session -> studentId: "123"
      // Group Activity -> participatingStudentIds: ["123", "456"]
      // To query both, we can search where 'studentId' == ID OR 'participatingStudentIds' contains ID.
      // Since Firestore doesn't do logical OR easily across fields, we will filter in client for Phase 5.
      
      const q = query(
        activitiesRef,
        where('studentId', '==', childId), // Fetch 1:1 sessions
        orderBy('date', 'desc')
      );
      
      // We will add the Group Activity fetch in the Parent Component later.
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Error fetching activities:", error);
      throw new Error('Failed to fetch activities: ' + error.message);
    }
  }

  // 2. Get activities for a specific child on a specific date
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

  // 3. NEW: Get ALL Play Group activities (For Admin Calendar Landing Page)
async getAllPlayGroupActivities() {
    try {
      const q = query(
        collection(db, 'activities'),
        where('type', '==', 'group_activity') // Updated string to match plan
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
}

const activityServiceInstance = new ActivityService();
export default activityServiceInstance;