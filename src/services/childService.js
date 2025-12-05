import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  arrayUnion 
} from 'firebase/firestore';
import { db } from './firebase';

class ChildService {
  // Add a new child and link to parent
  async enrollChild(childData, parentId) {
    try {
      // 1. Add child to 'children' collection
      const childRef = await addDoc(collection(db, 'children'), {
        ...childData,
        parentIds: [parentId], // Link to parent
        createdAt: new Date().toISOString(),
        active: true
      });

      // 2. Update parent's document to include this child's ID
      const parentRef = doc(db, 'users', parentId);
      await updateDoc(parentRef, {
        childrenIds: arrayUnion(childRef.id)
      });

      return childRef.id;
    } catch (error) {
      throw new Error('Failed to enroll child: ' + error.message);
    }
  }
}

export default new ChildService();