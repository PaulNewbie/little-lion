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

/**
 * @typedef {Object} ServiceAssignment
 * @property {string} serviceId - The ID of the service from the 'services' collection
 * @property {string} serviceName - The name of the service (e.g., 'Speech Therapy')
 * @property {string} [therapistId] - UID of the therapist (for 1:1)
 * @property {string} [therapistName] - Name of the therapist
 * @property {string} [teacherId] - UID of the teacher (for classes)
 * @property {string} [teacherName] - Name of the teacher
 */

/**
 * @typedef {Object} ChildData
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} dateOfBirth - ISO Date string (YYYY-MM-DD)
 * @property {string} gender - 'male' | 'female' | 'select'
 * @property {string} [medicalInfo] - Optional medical notes
 * @property {string} [photoUrl] - URL to profile image
 * @property {ServiceAssignment[]} [therapyServices] - List of 1:1 therapies
 * @property {ServiceAssignment[]} [groupClasses] - List of group classes
 */

class ChildService {
  /**
   * Enrolls a new child and links them to a parent.
   * @param {ChildData} childData - The full child profile object
   * @param {string} parentId - The UID of the parent user
   * @returns {Promise<string>} The ID of the newly created child document
   */
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
      const q = query(collection(db, 'children'), where('parentId', '==', parentId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error('Failed to fetch children: ' + error.message);
    }
  }

  // 3. Get children enrolled in a specific service (For Teachers)
  async getChildrenByService(serviceType) {
    try {
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
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error('Failed to fetch your therapy students: ' + error.message);
    }
  }

  async getAllChildren() {
    try {
      const querySnapshot = await getDocs(collection(db, 'children'));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error('Failed to fetch all children: ' + error.message);
    }
  }

  // 7. Add a service to an existing child
  /**
   * Adds a specific service to an existing child.
   * @param {string} childId 
   * @param {ServiceAssignment} serviceData 
   */
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
  
  async assignService(childId, serviceData) {
    try {
      const childRef = doc(db, 'children', childId);
      
      // Standardize the object structure
      const standardizedService = {
        serviceId: serviceData.serviceId,
        serviceName: serviceData.serviceName,
        type: serviceData.type || 'Therapy', // 'Therapy' or 'Class'
        staffId: serviceData.staffId || serviceData.therapistId || serviceData.teacherId,
        staffName: serviceData.staffName || serviceData.therapistName || serviceData.teacherName,
        staffRole: serviceData.staffRole || (serviceData.teacherId ? 'teacher' : 'therapist')
      };

      const updates = {
        enrolledServices: arrayUnion(standardizedService)
      };

      // Maintain the quick-lookup arrays (Keep these! They are useful for querying)
      if (standardizedService.staffRole === 'therapist') {
        updates.therapistIds = arrayUnion(standardizedService.staffId);
      } else if (standardizedService.staffRole === 'teacher') {
        updates.teacherIds = arrayUnion(standardizedService.staffId);
      }

      await updateDoc(childRef, updates);
    } catch (error) {
      throw new Error('Failed to assign service: ' + error.message);
    }
  }

  // DEPRECATED WRAPPERS (Keep these so your old code doesn't break immediately)
  async assignTherapyService(childId, data) {
    return this.assignService(childId, { ...data, type: 'Therapy', staffRole: 'therapist' });
  }

  async assignGroupClass(childId, data) {
    return this.assignService(childId, { ...data, type: 'Class', staffRole: 'teacher' });
  }
}

const childServiceInstance = new ChildService();
export default childServiceInstance;