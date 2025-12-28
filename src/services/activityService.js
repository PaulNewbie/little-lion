import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

class ActivityService {
  
  // 1. Create a 1:1 Therapy Session (Legacy/Alternative)
  // Note: The new TherapySessionForm uses the standalone saveSessionActivity function below.
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

  // 2. Create a Group Class Activity (Teacher Dashboard)
  // Keeps writing to the general 'activities' collection
  async createGroupActivity(activityData) {
    try {
      const docRef = await addDoc(collection(db, 'activities'), {
        ...activityData,
        type: 'group_activity', 
        createdAt: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      throw new Error('Failed to save group activity: ' + error.message);
    }
  }

  // 3. Get activities for a specific child (Unified Parent View)
  // MERGES data from 'activities' (Group) and 'therapy_sessions' (Clinical)
  async getActivitiesByChild(childId) {
    try {
      // A. Query General Activities (Group & Class Events)
      const activitiesRef = collection(db, 'activities');
      // Case 1: Child is specifically tagged (Legacy 1:1 or specific assignments)
      const q1 = query(activitiesRef, where('studentId', '==', childId));
      // Case 2: Child is part of a group activity
      const q2 = query(activitiesRef, where('participatingStudentIds', 'array-contains', childId));

      // B. Query Clinical Therapy Sessions (New Collection)
      const sessionsRef = collection(db, 'therapy_sessions');
      const q3 = query(sessionsRef, where('childId', '==', childId));

      // Execute all queries in parallel
      const [snap1, snap2, snap3] = await Promise.all([
        getDocs(q1), 
        getDocs(q2),
        getDocs(q3)
      ]);
      
      const results = [];
      const seenIds = new Set(); // Helper to prevent duplicates

      // Helper function to push to results safely
      const addResult = (doc, sourceCollection) => {
        if (!seenIds.has(doc.id)) {
          seenIds.add(doc.id);
          const data = doc.data();
          results.push({ 
            id: doc.id, 
            ...data,
            // Ensure type is 'therapy_session' for clinical notes so Parent UI uses the correct card
            type: sourceCollection === 'therapy_sessions' ? 'therapy_session' : data.type,
            _collection: sourceCollection 
          });
        }
      };

      // Process General Activities
      snap1.forEach(doc => addResult(doc, 'activities'));
      snap2.forEach(doc => addResult(doc, 'activities'));

      // Process Therapy Sessions
      snap3.forEach(doc => addResult(doc, 'therapy_sessions'));

      // Sort combined list by Date Descending (Newest First)
      // Note: Ensure your documents all have a consistent 'date' ISO string field
      return results.sort((a, b) => new Date(b.date) - new Date(a.date));
      
    } catch (error) {
      console.error("Error fetching activities:", error);
      throw new Error('Failed to fetch activities: ' + error.message);
    }
  }

  // 4. Get All Group Activities (Admin Calendar)
  // Only looks at 'activities' collection to avoid fetching private clinical notes
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
}

// 5. Standalone Export for Therapist Session Form
// Explicitly writes to 'therapy_sessions' collection
export const saveSessionActivity = async (sessionData) => {
  try {
    // We modify the data slightly before saving to ensure compatibility
    const finalData = {
      ...sessionData,
      // Force 'type' to 'therapy_session' so ChildActivities.jsx renders the correct card.
      // We store the specific sub-type (activity vs observation) in 'sessionType'.
      type: 'therapy_session', 
      sessionType: sessionData.type, 
      
      // Auto-generate a title if one is missing
      title: sessionData.title || `${sessionData.serviceName} Session`,
      
      // Ensure we have server timestamps for data integrity
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'therapy_sessions'), finalData);
    return docRef.id;
  } catch (error) {
    console.error("Error adding session document: ", error);
    throw error;
  }
};

const activityServiceInstance = new ActivityService();
export default activityServiceInstance;