import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  orderBy
} from 'firebase/firestore';

import { db } from '../config/firebase';

class ConcernService {

  /* ----------------------------------------------------
     1. CREATE CONCERN (Parent starts the thread)
     ---------------------------------------------------- */
  async createConcern(concernData) {
    try {
      // 1️⃣ Create concern document (NO messages array)
      const concernRef = await addDoc(collection(db, 'concerns'), {
        createdByUserId: concernData.createdByUserId,
        createdByUserName: concernData.createdByUserName,
        childId: concernData.childId,
        childName: concernData.childName,
        subject: concernData.subject,
        status: 'pending',
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });

      // 2️⃣ Create first message in subcollection
      await addDoc(
        collection(db, 'concerns', concernRef.id, 'messages'),
        {
          senderId: concernData.createdByUserId,
          senderName: concernData.createdByUserName,
          role: 'parent',
          text: concernData.message,
          createdAt: serverTimestamp()
        }
      );

      return concernRef.id;
    } catch (error) {
      throw new Error('Failed to create concern: ' + error.message);
    }
  }

  /* ----------------------------------------------------
     2. ADD MESSAGE (Parent or Admin)
     ---------------------------------------------------- */
  async addMessageToConcern(concernId, text, senderInfo, role) {
    try {
      // 1️⃣ Add message to subcollection
      await addDoc(
        collection(db, 'concerns', concernId, 'messages'),
        {
          senderId: senderInfo.id,
          senderName:
            role === 'admin' || role === 'super_admin'
              ? 'Admin'
              : senderInfo.name,
          role, // 'parent' | 'super_admin' | 'admin'
          text,
          createdAt: serverTimestamp()
        }
      );

      // 2️⃣ Update concern metadata with lastUpdated timestamp
      // If admin replies, set to 'ongoing'. If parent replies, keep current status
      const updateData = {
        lastUpdated: serverTimestamp()
      };
      
      if (role === 'admin' || role === 'super_admin') {
        updateData.status = 'ongoing';
      }
      
      await updateDoc(doc(db, 'concerns', concernId), updateData);

    } catch (error) {
      throw new Error('Failed to send message: ' + error.message);
    }
  }

  /* ----------------------------------------------------
     3. LISTEN TO CONCERN MESSAGES (Real-time)
     ---------------------------------------------------- */
  listenToConcernMessages(concernId, callback) {
    const q = query(
      collection(db, 'concerns', concernId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(messages);
    }, (error) => {
      console.error('Error listening to messages:', error);
      callback([]);
    });
  }

  /* ----------------------------------------------------
     4. UPDATE CONCERN STATUS
     ---------------------------------------------------- */
  async updateConcernStatus(concernId, status) {
    try {
      await updateDoc(doc(db, 'concerns', concernId), {
        status,
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      throw new Error('Failed to update status: ' + error.message);
    }
  }

  /* ----------------------------------------------------
     5. CLOSE CONCERN (Admin only)
     ---------------------------------------------------- */
  async closeConcern(concernId, closedByName) {
    try {
      await updateDoc(doc(db, 'concerns', concernId), {
        status: 'solved',
        closedBy: closedByName,
        closedAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      throw new Error('Failed to close concern: ' + error.message);
    }
  }

  /* ----------------------------------------------------
     6. LISTEN TO ALL CONCERNS (Admin - Real-time)
     ✅ UPDATED: Now orders by lastUpdated for most recent activity
     ---------------------------------------------------- */
  listenToAllConcerns(callback) {
    const q = query(
      collection(db, 'concerns'),
      orderBy('lastUpdated', 'desc') // ✅ Changed from createdAt to lastUpdated
    );

    return onSnapshot(q, (snapshot) => {
      const concerns = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      callback(concerns);
    }, (error) => {
      console.error('Error listening to all concerns:', error);
      callback([]);
    });
  }

  /* ----------------------------------------------------
     7. LISTEN TO CONCERNS BY PARENT (Real-time)
     ⚠️ NO orderBy in query to avoid composite index requirement
     Sorting happens client-side in the hook
     ---------------------------------------------------- */
  listenToConcernsByParent(parentId, callback) {
    const q = query(
      collection(db, 'concerns'),
      where('createdByUserId', '==', parentId)
      // NO orderBy! To avoid needing composite index
    );

    return onSnapshot(q, (snapshot) => {
      const concerns = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      callback(concerns);
    }, (error) => {
      console.error('Error listening to parent concerns:', error);
      callback([]);
    });
  }

  /* ----------------------------------------------------
     8. GET ALL CONCERNS (One-time fetch)
     ✅ UPDATED: Now orders by lastUpdated
     ---------------------------------------------------- */
  async getAllConcerns() {
    try {
      const q = query(
        collection(db, 'concerns'),
        orderBy('lastUpdated', 'desc') // ✅ Changed from createdAt to lastUpdated
      );

      const snapshot = await getDocs(q);

      const concerns = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      return concerns;

    } catch (error) {
      console.error('getAllConcerns error:', error);
      throw new Error('Failed to fetch all concerns');
    }
  }

  /* ----------------------------------------------------
     9. GET CONCERNS BY PARENT (One-time fetch)
     ⚠️ NO orderBy to avoid composite index requirement
     ---------------------------------------------------- */
  async getConcernsByParent(parentId) {
    const q = query(
      collection(db, 'concerns'),
      where('createdByUserId', '==', parentId)
    );

    const snapshot = await getDocs(q);

    const concerns = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
    
    return concerns;
  }
}

const concernService = new ConcernService();
export default concernService;