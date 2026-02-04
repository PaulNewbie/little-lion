import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  onSnapshot,
  limit
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
      const q1 = query(activitiesRef, where('studentId', '==', childId), limit(50));
      // Case 2: Child is part of a group activity
      const q2 = query(activitiesRef, where('participatingStudentIds', 'array-contains', childId), limit(50));

      // B. Query Clinical Therapy Sessions (New Collection)
      const sessionsRef = collection(db, 'therapy_sessions');
      const q3 = query(sessionsRef, where('childId', '==', childId), limit(50));

      // Execute all queries in parallel - use allSettled so one permission error
      // doesn't block all results (e.g. if childrenIds backfill is still pending)
      const settled = await Promise.allSettled([
        getDocs(q1),
        getDocs(q2),
        getDocs(q3)
      ]);

      const [res1, res2, res3] = settled;

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

      // Process General Activities (skip if query was rejected due to permissions)
      if (res1.status === 'fulfilled') {
        res1.value.forEach(doc => addResult(doc, 'activities'));
      }
      if (res2.status === 'fulfilled') {
        res2.value.forEach(doc => addResult(doc, 'activities'));
      }

      // Process Therapy Sessions
      if (res3.status === 'fulfilled') {
        res3.value.forEach(doc => addResult(doc, 'therapy_sessions'));
      }

      // Sort combined list by Date Descending (Newest First)
      return results.sort((a, b) => new Date(b.date) - new Date(a.date));
      
    } catch (error) {
      console.error("Error fetching activities:", error);
      throw new Error('Failed to fetch activities: ' + error.message);
    }
  }

  // 4. Get All Group Activities (Admin Calendar)
  // Only looks at 'activities' collection to avoid fetching private clinical notes
  async getAllPlayGroupActivities(maxResults = 50) {
    try {
      const q = query(
        collection(db, 'activities'),
        where('type', '==', 'group_activity'),
        limit(maxResults)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error('Failed to fetch group activities: ' + error.message);
    }
  }

  // 5a. Real-time listener for a child's activities (Parent/Admin view)
  // Merges activities + therapy_sessions via onSnapshot for live updates
  // Returns unsubscribe function for cleanup
  listenToChildActivities(childId, callback) {
    const activitiesRef = collection(db, 'activities');
    const sessionsRef = collection(db, 'therapy_sessions');

    // Three queries matching getActivitiesByChild
    const q1 = query(activitiesRef, where('studentId', '==', childId), limit(50));
    const q2 = query(activitiesRef, where('participatingStudentIds', 'array-contains', childId), limit(50));
    const q3 = query(sessionsRef, where('childId', '==', childId), limit(50));

    // Track data from each listener independently
    let data1 = [], data2 = [], data3 = [];
    const merge = () => {
      const seenIds = new Set();
      const results = [];
      const addResult = (item) => {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          results.push(item);
        }
      };
      data1.forEach(addResult);
      data2.forEach(addResult);
      data3.forEach(addResult);
      results.sort((a, b) => new Date(b.date) - new Date(a.date));
      callback(results);
    };

    const unsub1 = onSnapshot(q1, (snap) => {
      data1 = snap.docs.map(doc => ({ id: doc.id, ...doc.data(), _collection: 'activities' }));
      merge();
    }, (err) => { console.error('Activity listener q1 error:', err); });

    const unsub2 = onSnapshot(q2, (snap) => {
      data2 = snap.docs.map(doc => ({ id: doc.id, ...doc.data(), _collection: 'activities' }));
      merge();
    }, (err) => { console.error('Activity listener q2 error:', err); });

    const unsub3 = onSnapshot(q3, (snap) => {
      data3 = snap.docs.map(doc => ({
        id: doc.id, ...doc.data(),
        type: 'therapy_session',
        _collection: 'therapy_sessions'
      }));
      merge();
    }, (err) => { console.error('Activity listener q3 error:', err); });

    // Return combined unsubscribe
    return () => { unsub1(); unsub2(); unsub3(); };
  }

  // 5b. Real-time listener for Play Group Activities (Admin Dashboard)
  // Returns unsubscribe function for cleanup
  listenToPlayGroupActivities(callback, maxResults = 50) {
    const q = query(
      collection(db, 'activities'),
      where('type', '==', 'group_activity'),
      limit(maxResults)
    );

    return onSnapshot(q, (snapshot) => {
      const activities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(activities);
    }, (error) => {
      console.error('Error listening to play group activities:', error);
      callback([]);
    });
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