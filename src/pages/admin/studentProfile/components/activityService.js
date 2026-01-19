import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc,
  deleteDoc, // <--- ADDED THIS IMPORT
  doc,       // <--- ADDED THIS IMPORT
  serverTimestamp,
  orderBy 
} from 'firebase/firestore';
import { db } from '../../../../config/firebase';

class ActivityService {
  
  // =========================================================
  // 1. Create a 1:1 Therapy Session (Legacy/Alternative)
  // =========================================================
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

  // =========================================================
  // 2. Create a Group Class Activity (Teacher Dashboard)
  // =========================================================
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

  // =========================================================
  // 3. Get activities for a specific child (Unified Parent View)
  // =========================================================
  async getActivitiesByChild(childId) {
    try {
      const activitiesRef = collection(db, 'activities');
      const q1 = query(activitiesRef, where('studentId', '==', childId));
      const q2 = query(activitiesRef, where('participatingStudentIds', 'array-contains', childId));

      const sessionsRef = collection(db, 'therapy_sessions');
      const q3 = query(sessionsRef, where('childId', '==', childId));

      const [snap1, snap2, snap3] = await Promise.all([
        getDocs(q1), 
        getDocs(q2),
        getDocs(q3)
      ]);
      
      const results = [];
      const seenIds = new Set(); 

      const addResult = (doc, sourceCollection) => {
        if (!seenIds.has(doc.id)) {
          seenIds.add(doc.id);
          const data = doc.data();
          results.push({ 
            id: doc.id, 
            ...data,
            type: sourceCollection === 'therapy_sessions' ? 'therapy_session' : data.type,
            _collection: sourceCollection 
          });
        }
      };

      snap1.forEach(doc => addResult(doc, 'activities'));
      snap2.forEach(doc => addResult(doc, 'activities'));
      snap3.forEach(doc => addResult(doc, 'therapy_sessions'));

      return results.sort((a, b) => new Date(b.date) - new Date(a.date));
      
    } catch (error) {
      console.error("Error fetching activities:", error);
      throw new Error('Failed to fetch activities: ' + error.message);
    }
  }

  // =========================================================
  // 4. Get All Group Activities (Admin Calendar)
  // =========================================================
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

  // =========================================================
  // 5. MESSAGING METHODS (Comments)
  // =========================================================

  async getComments(activityId, collectionName) {
    try {
      if (!activityId || !collectionName) return [];
      
      const commentsRef = collection(db, collectionName, activityId, 'comments');
      const q = query(commentsRef, orderBy('createdAt', 'asc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching comments:", error);
      return [];
    }
  }

  async addComment(activityId, collectionName, commentData) {
    try {
      if (!activityId || !collectionName) throw new Error("Invalid activity ID or collection");
      
      const commentsRef = collection(db, collectionName, activityId, 'comments');
      await addDoc(commentsRef, {
        ...commentData,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
       console.error("Error adding comment:", error);
       throw error; 
    }
  }

  // --- NEW METHOD ADDED HERE ---
  async deleteComment(activityId, collectionName, commentId) {
    try {
      if (!activityId || !collectionName || !commentId) throw new Error("Invalid IDs");
      
      // Construct the path: collection -> document -> subcollection (comments) -> commentId
      const commentRef = doc(db, collectionName, activityId, 'comments', commentId);
      
      await deleteDoc(commentRef);
    } catch (error) {
       console.error("Error deleting comment:", error);
       throw error; 
    }
  }
}

// =========================================================
// 6. Standalone Export for Therapist Session Form
// =========================================================
export const saveSessionActivity = async (sessionData) => {
  try {
    const finalData = {
      ...sessionData,
      type: 'therapy_session', 
      sessionType: sessionData.type, 
      title: sessionData.title || `${sessionData.serviceName} Session`,
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