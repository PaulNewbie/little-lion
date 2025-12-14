import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../config/firebase';

class InquiryService {
  // 1. Send Inquiry (Parent)
  async createInquiry(inquiryData) {
    try {
      const docRef = await addDoc(collection(db, 'inquiries'), {
        ...inquiryData,
        status: 'pending',
        createdAt: new Date().toISOString(),
        reply: null // No reply yet
      });
      return docRef.id;
    } catch (error) {
      throw new Error('Failed to send inquiry: ' + error.message);
    }
  }

  // 2. Get Inquiries for a Parent (To view sent messages)
  async getInquiriesByParent(parentId) {
    try {
      const q = query(
        collection(db, 'inquiries'),
        where('parentId', '==', parentId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching parent inquiries:", error);
      throw new Error('Failed to fetch inquiries.');
    }
  }

  // 3. Get Inquiries for Staff (Teacher/Therapist Inbox)
  async getInquiriesByStaff(staffId) {
    try {
      const q = query(
        collection(db, 'inquiries'),
        where('targetId', '==', staffId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching staff inquiries:", error);
      throw new Error('Failed to fetch inquiries.');
    }
  }

  // 4. Reply to Inquiry (Staff)
  async replyToInquiry(inquiryId, replyMessage, responderInfo) {
    try {
      const inquiryRef = doc(db, 'inquiries', inquiryId);
      await updateDoc(inquiryRef, {
        reply: {
          message: replyMessage,
          responderName: responderInfo.name,
          timestamp: new Date().toISOString()
        },
        status: 'answered'
      });
    } catch (error) {
      throw new Error('Failed to send reply: ' + error.message);
    }
  }
}

const inquiryServiceInstance = new InquiryService();
export default inquiryServiceInstance;