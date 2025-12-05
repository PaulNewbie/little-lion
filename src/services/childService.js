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
import { db } from '../config/firebase';

class ChildService {
  // 1. Enroll child (Admin feature)
  async enrollChild(childData, parentId) {
    try {
      const childRef = await addDoc(collection(db, 'children'), {
        ...childData,
        parentIds: [parentId],
        createdAt: new Date().toISOString(),
        active: true,
        services: childData.services || [] 
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

  // 2. Get children for a specific parent
  async getChildrenByParentId(parentId) {
    try {
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

  // 3. Get children enrolled in a specific service (For Teachers)
  async getChildrenByService(serviceType) {
    try {
      // NOTE: We fetch all and filter client-side because 'services' is an array of objects
      const querySnapshot = await getDocs(collection(db, 'children'));
      const allChildren = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      return allChildren.filter(child => 
        child.services && child.services.some(s => s.serviceName === serviceType)
      );
    } catch (error) {
      throw new Error('Failed to fetch assigned children: ' + error.message);
    }
  }

  // 4. Get ALL children
  async getAllChildren() {
    try {
      const querySnapshot = await getDocs(collection(db, 'children'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error('Failed to fetch all children: ' + error.message);
    }
  }

  // 5. Add a service to an existing child
  async addServiceToChild(childId, serviceData) {
    try {
      const childRef = doc(db, 'children', childId);
      await updateDoc(childRef, {
        services: arrayUnion(serviceData)
      });
    } catch (error) {
      throw new Error('Failed to assign service: ' + error.message);
    }
  }
}

const childServiceInstance = new ChildService();
export default childServiceInstance;