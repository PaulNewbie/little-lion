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
// async enrollChild(childData, parentId) {
//     try {
//       // 1. Extract assignments
//       const therapyServices = childData.therapyServices || [];
//       const groupClasses = childData.groupClasses || [];

//       // 2. Build Quick Access Arrays (For Security Rules & Queries)
//       // These arrays only contain UIDs for fast "array-contains" queries
//       const therapistIds = therapyServices.map(s => s.therapistId).filter(Boolean);
//       const teacherIds = groupClasses.map(s => s.teacherId).filter(Boolean);

//       // 3. Save to Firestore
//       const childRef = await addDoc(collection(db, 'children'), {
//         firstName: childData.firstName,
//         lastName: childData.lastName,
//         dateOfBirth: childData.dateOfBirth,
//         gender: childData.gender,
//         medicalInfo: childData.medicalInfo,
//         photoUrl: childData.photoUrl || '',
        
//         // Linking
//         parentIds: [parentId],
        
//         // REVISED: Specific Arrays
//         therapyServices: therapyServices, // Array of objects: { serviceId, serviceName, therapistId, therapistName }
//         groupClasses: groupClasses,       // Array of objects: { classId, className, teacherId, teacherName }
        
//         // REVISED: Permission Arrays
//         therapistIds: therapistIds,       // Array of strings: ['uid1', 'uid2']
//         teacherIds: teacherIds,           // Array of strings: ['uid3']
        
//         createdAt: new Date().toISOString(),
//         active: true
//       });

//       // 4. Update Parent
//       const parentRef = doc(db, 'users', parentId);
//       await updateDoc(parentRef, {
//         childrenIds: arrayUnion(childRef.id)
//       });

//       return childRef.id;
//     } catch (error) {
//       console.error("Enrollment Error:", error);
//       throw new Error('Failed to enroll child: ' + error.message);
//     }
//   }

  async enrollChild(childData, parentId) {
    try {
      const therapistIds = childData.therapyServices?.map(s => s.therapistId).filter(Boolean) || [];
      const teacherIds = childData.groupClasses?.map(s => s.teacherId).filter(Boolean) || [];

      const childRef = await addDoc(collection(db, 'children'), {
        ...childData,
        parentIds: [parentId],
        therapistIds,
        teacherIds,
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

  // 2. Get children for a specific parent
  async getChildrenByParentId(parentId) {
    try {
      const q = query(
        collection(db, 'children'), 
        where('parentIds', 'array-contains', parentId)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

  // 4.  Gel specific who enroll for = Teacher Dashboard
async getChildrenByTeacherId(teacherId) {
    try {
      const q = query(
        collection(db, 'children'), 
        where('teacherIds', 'array-contains', teacherId),
        where('active', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error('Failed to fetch your class students: ' + error.message);
    }
  }

  // 5. Get children assigned to a specific THERAPIST
  async getChildrenByTherapistId(therapistId) {
    try {
      const q = query(
        collection(db, 'children'), 
        where('therapistIds', 'array-contains', therapistId),
        where('active', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error('Failed to fetch your therapy students: ' + error.message);
    }
  }

  // 6. Get ALL children
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

  // 7. Add a service to an existing child
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