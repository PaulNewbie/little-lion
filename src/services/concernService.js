import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp
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
        parentId: concernData.parentId,
        parentName: concernData.parentName,
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
          senderId: concernData.parentId,
          senderName: concernData.parentName,
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
          role, // 'parent' | 'staff'
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

  /* ----------------------------------------------------
     3. CLOSE CONCERN (Staff/Admin only)
     ---------------------------------------------------- */
  async closeConcern(concernId, closedByName) {
    try {
      await updateDoc(doc(db, 'concerns', concernId), {
        status: 'closed',
        closedBy: closedByName,
        closedAt: serverTimestamp()
      });
    } catch (error) {
      throw new Error('Failed to close concern: ' + error.message);
    }
  }

  /* ----------------------------------------------------
     4. GET CONCERNS BY PARENT (List View)
     ---------------------------------------------------- */
  async getConcernsByParent(parentId) {
    const q = query(
      collection(db, 'concerns'),
      where('parentId', '==', parentId)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  /* ----------------------------------------------------
     5. GET CONCERNS BY STAFF
     ---------------------------------------------------- */
  async getConcernsByStaff(staffId) {
    const q = query(
      collection(db, 'concerns'),
      where('targetStaffId', '==', staffId)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
}

const concernService = new ConcernService();
export default concernService;
