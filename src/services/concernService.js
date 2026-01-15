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
        status: 'waiting_for_staff',
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
     2. ADD MESSAGE (Parent or Staff)
     ---------------------------------------------------- */
  async addMessageToConcern(concernId, text, senderInfo, role) {
    try {
      // 1️⃣ Add message to subcollection
      await addDoc(
        collection(db, 'concerns', concernId, 'messages'),
        {
          senderId: senderInfo.id,
          senderName: senderInfo.name,
          role, // 'parent' | 'super_admin' | 'admin'
          text,
          createdAt: serverTimestamp()
        }
      );

      // 2️⃣ Update concern metadata
      await updateDoc(doc(db, 'concerns', concernId), {
        status: role === 'staff'
          ? 'waiting_for_parent'
          : 'waiting_for_staff',
        lastUpdated: serverTimestamp()
      });

    } catch (error) {
      throw new Error('Failed to send message: ' + error.message);
    }
  }

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
    });
  }


  /* ----------------------------------------------------
     3. CLOSE CONCERN (Staff/Admin only)
     ---------------------------------------------------- */
  async closeConcern(concernId, closedByName) {
    try {
      await updateDoc(doc(db, 'concerns', concernId), {
        status: 'solved',
        closedBy: closedByName,
        closedAt: serverTimestamp()
      });
    } catch (error) {
      throw new Error('Failed to close concern: ' + error.message);
    }
  }


  /* ----------------------------------------------------
   4. GET CONCERNS BY PARENT (List View + Messages)
   ---------------------------------------------------- */
  async getConcernsByParent(parentId) {
    const q = query(
      collection(db, 'concerns'),
      where('createdByUserId', '==', parentId)
    );

    const snapshot = await getDocs(q);

    // For each concern, fetch messages subcollection
    const concerns = await Promise.all(snapshot.docs.map(async (docSnap) => {
      const concern = { id: docSnap.id, ...docSnap.data() };

      const messagesSnapshot = await getDocs(
        collection(db, 'concerns', docSnap.id, 'messages')
      );

      concern.messages = messagesSnapshot.docs
        .map(m => ({ id: m.id, ...m.data() }))
        .sort((a, b) => a.createdAt?.seconds - b.createdAt?.seconds); // sort by timestamp

      return concern;
    }));
    
    return concerns;
  }

  /* ----------------------------------------------------
   5. GET ALL CONCERNS (ADMIN)
   ---------------------------------------------------- */
    async getAllConcerns() {
      try {
        const q = query(
          collection(db, 'concerns'),
          orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);

        const concerns = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const concern = {
              id: docSnap.id,
              ...docSnap.data()
            };

            const messagesSnapshot = await getDocs(
              query(
                collection(db, 'concerns', docSnap.id, 'messages'),
                orderBy('createdAt', 'asc')
              )
            );

            concern.messages = messagesSnapshot.docs.map(m => ({
              id: m.id,
              ...m.data()
            }));

            return concern;
          })
        );

        return concerns;

      } catch (error) {
        console.error('getAllConcerns error:', error);
        throw new Error('Failed to fetch all concerns');
      }
    }


    async updateConcernStatus(concernId, status) {
      try {
        await updateDoc(doc(db, 'concerns', concernId), {
          status,
          lastUpdated: serverTimestamp()
        });
      } catch (error) {
        throw new Error('Failed to update status');
      }
    }




  // async getConcernsByStaff(staffId) {
  //   const q = query(
  //     collection(db, 'concerns'),
  //     where('targetStaffId', '==', staffId)
  //   );

  //   const snapshot = await getDocs(q);

  //   const concerns = await Promise.all(snapshot.docs.map(async (docSnap) => {
  //     const concern = { id: docSnap.id, ...docSnap.data() };

  //     const messagesSnapshot = await getDocs(
  //       collection(db, 'concerns', docSnap.id, 'messages')
  //     );

  //     concern.messages = messagesSnapshot.docs
  //       .map(m => ({ id: m.id, ...m.data() }))
  //       .sort((a, b) => a.createdAt?.seconds - b.createdAt?.seconds);

  //     return concern;
  //   }));

  //   return concerns;
  // }

}

const concernService = new ConcernService();
export default concernService;
