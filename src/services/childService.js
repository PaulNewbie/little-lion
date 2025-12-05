import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  arrayUnion,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from './firebase';

class ChildService {
  // 1. Enroll child (Admin feature)
  async enrollChild(childData, parentId) {
    try {
      const childRef = await addDoc(collection(db, 'children'), {
        ...childData,
        parentIds: [parentId],
        createdAt: new Date().toISOString(),
        active: true
      });

      const parentRef = doc(db, 'users', parentId);
      await updateDoc(parentRef, {
        childrenIds: arrayUnion(childRef.id)
      });

      return childRef.id;
    } catch (error) {
      throw new Error('Failed to enroll child: ' + error.message);
    }
  }

  // 2. NEW: Get children for a specific parent
  async getChildrenByParentId(parentId) {
    try {
      // Query the 'children' collection where the 'parentIds' array contains the parentId
      const q = query(
        collection(db, 'children'), 
        where('parentIds', 'array-contains', parentId)
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error('Failed to fetch children: ' + error.message);
    }
  }
}

export default new ChildService();