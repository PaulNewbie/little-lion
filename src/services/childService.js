// src/services/childService.js
// COMPLETE VERSION with all methods including aliases for backward compatibility

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  arrayUnion,
  arrayRemove,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { trackRead } from '../utils/readCounter';

const COLLECTION_NAME = 'children';
const DEFAULT_PAGE_SIZE = 20;

class ChildService {
  // ==========================================================================
  // PAGINATION
  // ==========================================================================
  
  async getChildrenPaginated(options = {}) {
    const {
      limit: pageLimit = DEFAULT_PAGE_SIZE,
      startAfter: startAfterDoc = null,
      orderByField = 'lastName',
      orderDirection = 'asc',
      status = null,
    } = options;

    try {
      let q = query(
        collection(db, COLLECTION_NAME),
        orderBy(orderByField, orderDirection),
        limit(pageLimit)
      );

      if (status) {
        q = query(
          collection(db, COLLECTION_NAME),
          where('status', '==', status),
          orderBy(orderByField, orderDirection),
          limit(pageLimit)
        );
      }

      if (startAfterDoc) {
        q = query(q, startAfter(startAfterDoc));
      }

      const snapshot = await getDocs(q);
      trackRead(COLLECTION_NAME, snapshot.docs.length);
      
      const students = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        students,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
        hasMore: snapshot.docs.length === pageLimit,
        total: null
      };
    } catch (error) {
      console.error('Error fetching paginated children:', error);
      throw error;
    }
  }

  // ==========================================================================
  // ROLE-BASED QUERIES
  // ==========================================================================

  /**
   * Get children by parent ID
   */
  async getChildrenByParentId(parentId) {
    if (!parentId) {
      console.warn('getChildrenByParentId called without parentId');
      return [];
    }

    try {
      // Simple query without orderBy to avoid index requirement
      const q = query(
        collection(db, COLLECTION_NAME),
        where('parentId', '==', parentId)
      );

      const snapshot = await getDocs(q);
      trackRead(COLLECTION_NAME, snapshot.docs.length);
      
      // Sort client-side instead
      const children = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return children.sort((a, b) => 
        (a.lastName || '').localeCompare(b.lastName || '')
      );
    } catch (error) {
      console.error('Error fetching children by parent:', error);
      throw error;
    }
  }

  /**
   * Get children by staff ID (works for teachers AND therapists)
   */
  async getChildrenByStaffId(staffId) {
    if (!staffId) {
      console.warn('getChildrenByStaffId called without staffId');
      return [];
    }

    try {
      // Try with assignedStaffIds array first
      const q = query(
        collection(db, COLLECTION_NAME),
        where('assignedStaffIds', 'array-contains', staffId)
      );

      const snapshot = await getDocs(q);
      trackRead(COLLECTION_NAME, snapshot.docs.length);

      // FIX: If optimized query returns nothing, try fallback (in case data is legacy)
      if (snapshot.empty) {
        console.log('Optimized query found 0 students. Checking fallback for legacy data...');
        const fallbackResults = await this.getChildrenByStaffIdFallback(staffId);
        // Only return fallback if it actually found something
        if (fallbackResults.length > 0) {
            return fallbackResults;
        }
      }
      
      const children = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return children.sort((a, b) => 
        (a.lastName || '').localeCompare(b.lastName || '')
      );
    } catch (error) {
      // Fallback: search through enrolled services
      console.warn('Falling back to service-based staff query:', error.message);
      return this.getChildrenByStaffIdFallback(staffId);
    }
  }

  /**
   * Fallback: Get children by checking enrolled services
   */
  async getChildrenByStaffIdFallback(staffId) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('status', '==', 'ENROLLED')
      );

      const snapshot = await getDocs(q);
      trackRead(COLLECTION_NAME, snapshot.docs.length);
      
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(child => {
          const oneOnOne = child.oneOnOneServices || [];
          const groupClass = child.groupClassServices || [];
          const enrolledServices = child.enrolledServices || [];
          
          return [...oneOnOne, ...groupClass, ...enrolledServices].some(
            service => service.staffId === staffId
          );
        })
        .sort((a, b) => (a.lastName || '').localeCompare(b.lastName || ''));
    } catch (error) {
      console.error('Error in fallback staff query:', error);
      throw error;
    }
  }

  // ==========================================================================
  // ALIAS METHODS (for backward compatibility with existing components)
  // ==========================================================================

  /**
   * @alias for getChildrenByStaffId - used by TherapistDashboard
   */
  async getChildrenByTherapistId(therapistId) {
    return this.getChildrenByStaffId(therapistId);
  }

  /**
   * @alias for getChildrenByStaffId - used by TeacherDashboard
   */
  async getChildrenByTeacherId(teacherId) {
    return this.getChildrenByStaffId(teacherId);
  }

  /**
   * Get children by service name
   */
  async getChildrenByService(serviceName) {
    if (!serviceName) return [];

    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('status', '==', 'ENROLLED')
      );

      const snapshot = await getDocs(q);
      trackRead(COLLECTION_NAME, snapshot.docs.length);
      
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(child => {
          const allServices = [
            ...(child.oneOnOneServices || []),
            ...(child.groupClassServices || []),
            ...(child.enrolledServices || [])
          ];
          return allServices.some(s => s.serviceName === serviceName);
        });
    } catch (error) {
      console.error('Error fetching children by service:', error);
      throw error;
    }
  }

  // ==========================================================================
  // SINGLE DOCUMENT OPERATIONS
  // ==========================================================================

  async getChildById(childId) {
    if (!childId) return null;

    try {
      const docRef = doc(db, COLLECTION_NAME, childId);
      const docSnap = await getDoc(docRef);
      trackRead(COLLECTION_NAME, 1);
      
      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } catch (error) {
      console.error('Error fetching child:', error);
      throw error;
    }
  }

  async createOrUpdateChild(parentId, childData) {
    try {
      const childId = childData.childId || childData.id || doc(collection(db, COLLECTION_NAME)).id;
      const docRef = doc(db, COLLECTION_NAME, childId);

      const assignedStaffIds = this.extractStaffIds(childData);

      const dataToSave = {
        ...childData,
        id: childId,
        parentId,
        assignedStaffIds,
        updatedAt: serverTimestamp(),
      };

      Object.keys(dataToSave).forEach(key => {
        if (dataToSave[key] === undefined) {
          delete dataToSave[key];
        }
      });

      const existingDoc = await getDoc(docRef);
      trackRead(COLLECTION_NAME, 1);
      
      if (existingDoc.exists()) {
        await updateDoc(docRef, dataToSave);
      } else {
        dataToSave.createdAt = serverTimestamp();
        await setDoc(docRef, dataToSave);
      }

      return { id: childId, ...dataToSave };
    } catch (error) {
      console.error('Error saving child:', error);
      throw error;
    }
  }

  extractStaffIds(childData) {
    const staffIds = new Set();

    const serviceArrays = [
      childData.oneOnOneServices,
      childData.groupClassServices,
      childData.enrolledServices,
    ];

    serviceArrays.forEach(services => {
      if (Array.isArray(services)) {
        services.forEach(service => {
          if (service.staffId) {
            staffIds.add(service.staffId);
          }
        });
      }
    });

    return Array.from(staffIds);
  }

  async addServiceToChild(childId, serviceData) {
    try {
      const docRef = doc(db, COLLECTION_NAME, childId);
      
      const arrayField = serviceData.serviceType === 'Therapy' 
        ? 'oneOnOneServices' 
        : serviceData.serviceType === 'Class'
          ? 'groupClassServices'
          : 'enrolledServices';

      await updateDoc(docRef, {
        [arrayField]: arrayUnion(serviceData),
        assignedStaffIds: arrayUnion(serviceData.staffId),
        updatedAt: serverTimestamp(),
      });

      return true;
    } catch (error) {
      console.error('Error adding service to child:', error);
      throw error;
    }
  }

  async removeServiceFromChild(childId, serviceData) {
    try {
      const docRef = doc(db, COLLECTION_NAME, childId);
      
      const arrayField = serviceData.serviceType === 'Therapy' 
        ? 'oneOnOneServices' 
        : serviceData.serviceType === 'Class'
          ? 'groupClassServices'
          : 'enrolledServices';

      await updateDoc(docRef, {
        [arrayField]: arrayRemove(serviceData),
        updatedAt: serverTimestamp(),
      });

      const child = await this.getChildById(childId);
      const newStaffIds = this.extractStaffIds(child);
      
      await updateDoc(docRef, {
        assignedStaffIds: newStaffIds,
      });

      return true;
    } catch (error) {
      console.error('Error removing service from child:', error);
      throw error;
    }
  }

  // ==========================================================================
  // LEGACY METHOD - Keep for backward compatibility
  // ==========================================================================

  async getAllChildren() {
    console.warn(
      '⚠️ getAllChildren() is deprecated and expensive. ' +
      'Use getChildrenPaginated() or role-specific methods instead.'
    );

    try {
      // Simple query without orderBy to avoid index issues
      const snapshot = await getDocs(collection(db, COLLECTION_NAME));
      trackRead(COLLECTION_NAME, snapshot.docs.length);
      
      const children = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort client-side
      return children.sort((a, b) => 
        (a.lastName || '').localeCompare(b.lastName || '')
      );
    } catch (error) {
      console.error('Error fetching all children:', error);
      throw error;
    }
  }

  // ==========================================================================
  // BATCH OPERATIONS
  // ==========================================================================

  async batchUpdateChildren(updates) {
    if (!updates || updates.length === 0) return;

    try {
      const batch = writeBatch(db);

      updates.forEach(({ id, data }) => {
        const docRef = doc(db, COLLECTION_NAME, id);
        batch.update(docRef, {
          ...data,
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();
      console.log(`Batch updated ${updates.length} children`);
    } catch (error) {
      console.error('Error in batch update:', error);
      throw error;
    }
  }
}

const childService = new ChildService();
export default childService;