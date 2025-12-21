import { 
  collection, addDoc, query, where, getDocs, updateDoc, doc, arrayUnion 
} from 'firebase/firestore';
import { db } from '../config/firebase';

class InquiryService {
  // 1. Send Initial Inquiry (Starts the thread)
  async createInquiry(inquiryData) {
    try {
      const docRef = await addDoc(collection(db, 'inquiries'), {
        ...inquiryData,
        status: 'waiting_for_staff',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        messages: [{
          senderId: inquiryData.parentId,
          senderName: inquiryData.parentName,
          text: inquiryData.message,
          timestamp: new Date().toISOString(),
          type: 'parent'
        }]
      });
      return docRef.id;
    } catch (error) {
      throw new Error('Failed to send inquiry: ' + error.message);
    }
  }

  // 2. Add Message to Thread (Universal for Parent & Staff)
  async addMessageToThread(inquiryId, text, senderInfo, type) {
    try {
      const inquiryRef = doc(db, 'inquiries', inquiryId);
      const newMessage = {
        senderId: senderInfo.id,
        senderName: senderInfo.name,
        text: text,
        timestamp: new Date().toISOString(),
        type: type 
      };

      await updateDoc(inquiryRef, {
        messages: arrayUnion(newMessage),
        status: type === 'staff' ? 'waiting_for_parent' : 'waiting_for_staff',
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      throw new Error('Failed to send message: ' + error.message);
    }
  }

  // 3. Close Conversation (Teacher/Therapist only)
  async closeInquiry(inquiryId, closedByName) {
    try {
      const inquiryRef = doc(db, 'inquiries', inquiryId);
      await updateDoc(inquiryRef, {
        status: 'closed',
        closedAt: new Date().toISOString(),
        closedBy: closedByName
      });
    } catch (error) {
      throw new Error('Failed to close inquiry: ' + error.message);
    }
  }

  async getInquiriesByParent(parentId) {
    const q = query(collection(db, 'inquiries'), where('parentId', '==', parentId));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return data.sort((a, b) => new Date(b.lastUpdated || b.createdAt) - new Date(a.lastUpdated || a.createdAt));
  }

  async getInquiriesByStaff(staffId) {
    const q = query(collection(db, 'inquiries'), where('targetId', '==', staffId));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return data.sort((a, b) => new Date(b.lastUpdated || b.createdAt) - new Date(a.lastUpdated || a.createdAt));
  }
}

const inquiryServiceInstance = new InquiryService();
export default inquiryServiceInstance;