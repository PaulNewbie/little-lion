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
import {
  generateEnrollmentId,
  generateStaffHistoryId,
  SERVICE_ENROLLMENT_STATUS
} from '../utils/constants';

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
  // SEARCH
  // ==========================================================================

  /**
   * Search children by name (firstName or lastName prefix match)
   * Used for searching students not yet loaded in pagination
   * @param {string} searchTerm - The search term (minimum 2 characters)
   * @param {number} maxResults - Maximum results to return (default 10)
   */
  async searchChildren(searchTerm, maxResults = 10) {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }

    try {
      // Capitalize first letter for proper matching (names are typically capitalized)
      const normalizedTerm = searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1).toLowerCase();
      const endTerm = normalizedTerm + '\uf8ff';

      // Search by firstName prefix
      const firstNameQuery = query(
        collection(db, COLLECTION_NAME),
        where('firstName', '>=', normalizedTerm),
        where('firstName', '<', endTerm),
        limit(maxResults)
      );

      // Search by lastName prefix
      const lastNameQuery = query(
        collection(db, COLLECTION_NAME),
        where('lastName', '>=', normalizedTerm),
        where('lastName', '<', endTerm),
        limit(maxResults)
      );

      // Execute both queries in parallel
      const [firstNameSnapshot, lastNameSnapshot] = await Promise.all([
        getDocs(firstNameQuery),
        getDocs(lastNameQuery)
      ]);

      // Track reads
      const totalReads = firstNameSnapshot.docs.length + lastNameSnapshot.docs.length;
      trackRead(COLLECTION_NAME, totalReads);

      // Combine and deduplicate results
      const resultsMap = new Map();

      firstNameSnapshot.docs.forEach(doc => {
        resultsMap.set(doc.id, { id: doc.id, ...doc.data() });
      });

      lastNameSnapshot.docs.forEach(doc => {
        if (!resultsMap.has(doc.id)) {
          resultsMap.set(doc.id, { id: doc.id, ...doc.data() });
        }
      });

      // Convert to array and limit results
      const results = Array.from(resultsMap.values()).slice(0, maxResults);

      return results;
    } catch (error) {
      console.error('Error searching children:', error);
      return [];
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
      // UPDATED: Added status filter to avoid reading inactive/archived students
      const q = query(
        collection(db, COLLECTION_NAME),
        where('assignedStaffIds', 'array-contains', staffId),
        where('status', '==', 'ENROLLED') 
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
      // Note: If the new query requires an index you haven't created yet, 
      // this catch block will safely trigger the fallback automatically.
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

  /**
   * Fetch multiple children by their IDs
   * Efficient batch fetch with caching support
   * @param {string[]} childIds - Array of child document IDs
   * @returns {Promise<object[]>} Array of child objects
   */
  async getChildrenByIds(childIds) {
    if (!childIds || childIds.length === 0) return [];

    // Remove duplicates
    const uniqueIds = [...new Set(childIds)];

    try {
      // Firestore 'in' query supports max 30 items, so batch if needed
      const BATCH_SIZE = 30;
      const batches = [];

      for (let i = 0; i < uniqueIds.length; i += BATCH_SIZE) {
        batches.push(uniqueIds.slice(i, i + BATCH_SIZE));
      }

      const results = [];

      for (const batchIds of batches) {
        // Use documentId() with 'in' for efficient batch fetch
        const q = query(
          collection(db, COLLECTION_NAME),
          where('__name__', 'in', batchIds)
        );

        const snapshot = await getDocs(q);
        trackRead(COLLECTION_NAME, snapshot.docs.length);

        snapshot.docs.forEach(doc => {
          results.push({ id: doc.id, ...doc.data() });
        });
      }

      return results;
    } catch (error) {
      console.error('Error fetching children by IDs:', error);
      throw error;
    }
  }

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

      // Process serviceEnrollments - convert flat format to full structure if needed
      let processedEnrollments = [];
      if (childData.serviceEnrollments && childData.serviceEnrollments.length > 0) {
        const now = new Date().toISOString();
        processedEnrollments = childData.serviceEnrollments
          .filter(e => e.serviceId && e.staffId) // Only save complete enrollments
          .map(enrollment => {
            // If enrollment already has currentStaff structure, keep it
            if (enrollment.currentStaff) {
              return enrollment;
            }
            // Convert flat format (from Step 9) to full structure
            return {
              enrollmentId: enrollment.enrollmentId || generateEnrollmentId(),
              serviceId: enrollment.serviceId,
              serviceName: enrollment.serviceName,
              serviceType: enrollment.serviceType,
              status: enrollment.status || SERVICE_ENROLLMENT_STATUS.ACTIVE,
              currentStaff: {
                staffId: enrollment.staffId,
                staffName: enrollment.staffName,
                staffRole: enrollment.staffRole,
                assignedAt: enrollment.enrolledAt || now,
                assignedBy: parentId // Using parentId as fallback; ideally pass adminId
              },
              staffHistory: enrollment.staffHistory || [],
              enrolledAt: enrollment.enrolledAt || now,
              statusChangedAt: enrollment.statusChangedAt || now,
              statusChangeReason: enrollment.statusChangeReason || null,
              frequency: enrollment.frequency || null,
              notes: enrollment.notes || null,
              lastActivityDate: enrollment.lastActivityDate || null
            };
          });
      }

      // Compute staff IDs from the new serviceEnrollments format
      const { assignedStaffIds, allHistoricalStaffIds } =
        this.computeStaffIdsFromEnrollments(processedEnrollments);

      // Build data to save - using new model only
      const dataToSave = {
        ...childData,
        id: childId,
        parentId,
        serviceEnrollments: processedEnrollments,
        assignedStaffIds,
        allHistoricalStaffIds,
        updatedAt: serverTimestamp(),
      };

      // Remove legacy arrays if present (don't save them anymore)
      delete dataToSave.oneOnOneServices;
      delete dataToSave.groupClassServices;
      delete dataToSave.enrolledServices;
      // Remove temporary fields
      delete dataToSave._tempId;

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

  /**
   * Update child's photo - specifically for parent use
   * Only updates the photoUrl field to minimize permission requirements
   * @param {string} childId - The child's document ID
   * @param {string} parentId - The parent's user ID (for verification)
   * @param {string} photoUrl - The new photo URL from Cloudinary
   */
  async updateChildPhoto(childId, parentId, photoUrl) {
    try {
      const docRef = doc(db, COLLECTION_NAME, childId);

      // Verify the child exists and belongs to this parent
      const childDoc = await getDoc(docRef);
      trackRead(COLLECTION_NAME, 1);

      if (!childDoc.exists()) {
        throw new Error('Child not found');
      }

      const childData = childDoc.data();
      if (childData.parentId !== parentId) {
        throw new Error('You do not have permission to update this child');
      }

      // Only update the photo URL field
      await updateDoc(docRef, {
        photoUrl: photoUrl,
        updatedAt: serverTimestamp()
      });

      return { id: childId, photoUrl };
    } catch (error) {
      console.error('Error updating child photo:', error);
      throw error;
    }
  }

  // ==========================================================================
  // ADDITIONAL REPORTS METHODS (PDF uploads for admin use)
  // ==========================================================================

  /**
   * Add an additional report (PDF) to a child's profile
   * @param {string} childId - The child's document ID
   * @param {object} reportData - Report metadata { id, fileName, fileUrl, description, uploadedBy }
   */
  async addAdditionalReport(childId, reportData) {
    try {
      const docRef = doc(db, COLLECTION_NAME, childId);

      const childDoc = await getDoc(docRef);
      trackRead(COLLECTION_NAME, 1);

      if (!childDoc.exists()) {
        throw new Error('Child not found');
      }

      const report = {
        ...reportData,
        uploadedAt: new Date().toISOString(),
      };

      await updateDoc(docRef, {
        additionalReports: arrayUnion(report),
        updatedAt: serverTimestamp()
      });

      return report;
    } catch (error) {
      console.error('Error adding additional report:', error);
      throw error;
    }
  }

  /**
   * Remove an additional report from a child's profile
   * @param {string} childId - The child's document ID
   * @param {object} reportData - The exact report object to remove
   */
  async removeAdditionalReport(childId, reportData) {
    try {
      const docRef = doc(db, COLLECTION_NAME, childId);

      const childDoc = await getDoc(docRef);
      trackRead(COLLECTION_NAME, 1);

      if (!childDoc.exists()) {
        throw new Error('Child not found');
      }

      await updateDoc(docRef, {
        additionalReports: arrayRemove(reportData),
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error removing additional report:', error);
      throw error;
    }
  }

  /**
   * Get all additional reports for a child
   * @param {string} childId - The child's document ID
   */
  async getAdditionalReports(childId) {
    try {
      const docRef = doc(db, COLLECTION_NAME, childId);
      const childDoc = await getDoc(docRef);
      trackRead(COLLECTION_NAME, 1);

      if (!childDoc.exists()) {
        throw new Error('Child not found');
      }

      return childDoc.data().additionalReports || [];
    } catch (error) {
      console.error('Error getting additional reports:', error);
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
      const snapshot = await getDocs(query(collection(db, COLLECTION_NAME), limit(200)));
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

  // ==========================================================================
  // SERVICE ENROLLMENTS - New Data Model
  // ==========================================================================

  /**
   * Add a new service enrollment to a child
   * @param {string} childId - The child's document ID
   * @param {object} enrollmentData - Service enrollment details
   * @param {string} enrollmentData.serviceId - FK to services collection
   * @param {string} enrollmentData.serviceName - Service display name
   * @param {string} enrollmentData.serviceType - 'Therapy' or 'Class'
   * @param {object} enrollmentData.staff - Staff assignment {staffId, staffName, staffRole}
   * @param {string} enrollmentData.frequency - Service frequency (optional)
   * @param {string} enrollmentData.notes - Admin notes (optional)
   * @param {string} assignedBy - User ID of admin making the assignment
   */
  async addServiceEnrollment(childId, enrollmentData, assignedBy) {
    if (!childId || !enrollmentData.serviceId || !enrollmentData.staff?.staffId) {
      throw new Error('Missing required fields: childId, serviceId, and staff.staffId');
    }

    try {
      const child = await this.getChildById(childId);
      if (!child) {
        throw new Error(`Child not found: ${childId}`);
      }

      const serviceEnrollments = child.serviceEnrollments || [];

      // Check if service is already enrolled (active or inactive)
      const existingEnrollment = serviceEnrollments.find(
        e => e.serviceId === enrollmentData.serviceId
      );

      if (existingEnrollment) {
        if (existingEnrollment.status === SERVICE_ENROLLMENT_STATUS.ACTIVE) {
          throw new Error('Service is already active for this student');
        }
        // If inactive, we'll reactivate it instead
        return this.reactivateServiceEnrollment(
          childId,
          existingEnrollment.enrollmentId,
          enrollmentData.staff,
          assignedBy
        );
      }

      const now = new Date().toISOString();
      const newEnrollment = {
        enrollmentId: generateEnrollmentId(),
        serviceId: enrollmentData.serviceId,
        serviceName: enrollmentData.serviceName,
        serviceType: enrollmentData.serviceType,
        status: SERVICE_ENROLLMENT_STATUS.ACTIVE,
        enrolledAt: now,
        statusChangedAt: now,
        statusChangeReason: null,
        currentStaff: {
          staffId: enrollmentData.staff.staffId,
          staffName: enrollmentData.staff.staffName,
          staffRole: enrollmentData.staff.staffRole,
          assignedAt: now,
          assignedBy: assignedBy
        },
        staffHistory: [],
        frequency: enrollmentData.frequency || null,
        notes: enrollmentData.notes || null,
        lastActivityDate: null
      };

      serviceEnrollments.push(newEnrollment);

      // Recompute staff IDs
      const { assignedStaffIds, allHistoricalStaffIds } =
        this.computeStaffIdsFromEnrollments(serviceEnrollments);

      const docRef = doc(db, COLLECTION_NAME, childId);
      await updateDoc(docRef, {
        serviceEnrollments,
        assignedStaffIds,
        allHistoricalStaffIds,
        updatedAt: serverTimestamp()
      });

      return newEnrollment;
    } catch (error) {
      console.error('Error adding service enrollment:', error);
      throw error;
    }
  }

  /**
   * Change the staff assigned to a service enrollment
   * @param {string} childId - The child's document ID
   * @param {string} enrollmentId - The enrollment ID to update
   * @param {object} newStaff - New staff {staffId, staffName, staffRole}
   * @param {string} removalReason - Reason for removing previous staff
   * @param {string} changedBy - User ID making the change
   */
  async changeServiceStaff(childId, enrollmentId, newStaff, removalReason, changedBy) {
    if (!childId || !enrollmentId || !newStaff?.staffId) {
      throw new Error('Missing required fields: childId, enrollmentId, and newStaff.staffId');
    }

    try {
      const child = await this.getChildById(childId);
      if (!child) {
        throw new Error(`Child not found: ${childId}`);
      }

      const serviceEnrollments = child.serviceEnrollments || [];
      const enrollmentIndex = serviceEnrollments.findIndex(
        e => e.enrollmentId === enrollmentId
      );

      if (enrollmentIndex === -1) {
        throw new Error(`Enrollment not found: ${enrollmentId}`);
      }

      const enrollment = serviceEnrollments[enrollmentIndex];

      if (enrollment.status !== SERVICE_ENROLLMENT_STATUS.ACTIVE) {
        throw new Error('Cannot change staff on an inactive service');
      }

      const now = new Date().toISOString();

      // Move current staff to history
      if (enrollment.currentStaff) {
        const historyEntry = {
          historyId: generateStaffHistoryId(),
          staffId: enrollment.currentStaff.staffId,
          staffName: enrollment.currentStaff.staffName,
          staffRole: enrollment.currentStaff.staffRole,
          assignedAt: enrollment.currentStaff.assignedAt,
          removedAt: now,
          removalReason: removalReason || 'Staff Changed',
          removedBy: changedBy,
          durationDays: this.calculateDurationDays(
            enrollment.currentStaff.assignedAt,
            now
          )
        };
        enrollment.staffHistory.unshift(historyEntry); // Most recent first
      }

      // Set new current staff
      enrollment.currentStaff = {
        staffId: newStaff.staffId,
        staffName: newStaff.staffName,
        staffRole: newStaff.staffRole,
        assignedAt: now,
        assignedBy: changedBy
      };

      serviceEnrollments[enrollmentIndex] = enrollment;

      // Recompute staff IDs
      const { assignedStaffIds, allHistoricalStaffIds } =
        this.computeStaffIdsFromEnrollments(serviceEnrollments);

      const docRef = doc(db, COLLECTION_NAME, childId);
      await updateDoc(docRef, {
        serviceEnrollments,
        assignedStaffIds,
        allHistoricalStaffIds,
        updatedAt: serverTimestamp()
      });

      return enrollment;
    } catch (error) {
      console.error('Error changing service staff:', error);
      throw error;
    }
  }

  /**
   * Deactivate a service enrollment (preserves history)
   * @param {string} childId - The child's document ID
   * @param {string} enrollmentId - The enrollment ID to deactivate
   * @param {string} reason - Reason for deactivation
   * @param {string} deactivatedBy - User ID making the change
   */
  async deactivateServiceEnrollment(childId, enrollmentId, reason, deactivatedBy) {
    if (!childId || !enrollmentId) {
      throw new Error('Missing required fields: childId and enrollmentId');
    }

    try {
      const child = await this.getChildById(childId);
      if (!child) {
        throw new Error(`Child not found: ${childId}`);
      }

      const serviceEnrollments = child.serviceEnrollments || [];
      const enrollmentIndex = serviceEnrollments.findIndex(
        e => e.enrollmentId === enrollmentId
      );

      if (enrollmentIndex === -1) {
        throw new Error(`Enrollment not found: ${enrollmentId}`);
      }

      const enrollment = serviceEnrollments[enrollmentIndex];

      if (enrollment.status === SERVICE_ENROLLMENT_STATUS.INACTIVE) {
        throw new Error('Service is already inactive');
      }

      const now = new Date().toISOString();

      // Move current staff to history with 'Service Deactivated' reason
      if (enrollment.currentStaff) {
        const historyEntry = {
          historyId: generateStaffHistoryId(),
          staffId: enrollment.currentStaff.staffId,
          staffName: enrollment.currentStaff.staffName,
          staffRole: enrollment.currentStaff.staffRole,
          assignedAt: enrollment.currentStaff.assignedAt,
          removedAt: now,
          removalReason: 'Service Deactivated',
          removedBy: deactivatedBy,
          durationDays: this.calculateDurationDays(
            enrollment.currentStaff.assignedAt,
            now
          )
        };
        enrollment.staffHistory.unshift(historyEntry);
      }

      // Update enrollment status
      enrollment.status = SERVICE_ENROLLMENT_STATUS.INACTIVE;
      enrollment.statusChangedAt = now;
      enrollment.statusChangeReason = reason || 'No reason provided';
      enrollment.currentStaff = null;

      serviceEnrollments[enrollmentIndex] = enrollment;

      // Recompute staff IDs (active staff will exclude this service's staff)
      const { assignedStaffIds, allHistoricalStaffIds } =
        this.computeStaffIdsFromEnrollments(serviceEnrollments);

      const docRef = doc(db, COLLECTION_NAME, childId);
      await updateDoc(docRef, {
        serviceEnrollments,
        assignedStaffIds,
        allHistoricalStaffIds,
        updatedAt: serverTimestamp()
      });

      return enrollment;
    } catch (error) {
      console.error('Error deactivating service enrollment:', error);
      throw error;
    }
  }

  /**
   * Reactivate an inactive service enrollment
   * @param {string} childId - The child's document ID
   * @param {string} enrollmentId - The enrollment ID to reactivate
   * @param {object} newStaff - New staff assignment {staffId, staffName, staffRole}
   * @param {string} reactivatedBy - User ID making the change
   */
  async reactivateServiceEnrollment(childId, enrollmentId, newStaff, reactivatedBy) {
    if (!childId || !enrollmentId || !newStaff?.staffId) {
      throw new Error('Missing required fields: childId, enrollmentId, and newStaff.staffId');
    }

    try {
      const child = await this.getChildById(childId);
      if (!child) {
        throw new Error(`Child not found: ${childId}`);
      }

      const serviceEnrollments = child.serviceEnrollments || [];
      const enrollmentIndex = serviceEnrollments.findIndex(
        e => e.enrollmentId === enrollmentId
      );

      if (enrollmentIndex === -1) {
        throw new Error(`Enrollment not found: ${enrollmentId}`);
      }

      const enrollment = serviceEnrollments[enrollmentIndex];

      if (enrollment.status === SERVICE_ENROLLMENT_STATUS.ACTIVE) {
        throw new Error('Service is already active');
      }

      const now = new Date().toISOString();

      // Reactivate with new staff
      enrollment.status = SERVICE_ENROLLMENT_STATUS.ACTIVE;
      enrollment.statusChangedAt = now;
      enrollment.statusChangeReason = null;
      enrollment.currentStaff = {
        staffId: newStaff.staffId,
        staffName: newStaff.staffName,
        staffRole: newStaff.staffRole,
        assignedAt: now,
        assignedBy: reactivatedBy
      };

      serviceEnrollments[enrollmentIndex] = enrollment;

      // Recompute staff IDs
      const { assignedStaffIds, allHistoricalStaffIds } =
        this.computeStaffIdsFromEnrollments(serviceEnrollments);

      const docRef = doc(db, COLLECTION_NAME, childId);
      await updateDoc(docRef, {
        serviceEnrollments,
        assignedStaffIds,
        allHistoricalStaffIds,
        updatedAt: serverTimestamp()
      });

      return enrollment;
    } catch (error) {
      console.error('Error reactivating service enrollment:', error);
      throw error;
    }
  }

  /**
   * Get all service enrollments for a child
   * @param {string} childId - The child's document ID
   * @param {object} options - Filter options
   * @param {string} options.status - Filter by status ('active', 'inactive', or null for all)
   */
  async getServiceEnrollments(childId, options = {}) {
    try {
      const child = await this.getChildById(childId);
      if (!child) {
        throw new Error(`Child not found: ${childId}`);
      }

      let enrollments = child.serviceEnrollments || [];

      if (options.status) {
        enrollments = enrollments.filter(e => e.status === options.status);
      }

      return enrollments;
    } catch (error) {
      console.error('Error getting service enrollments:', error);
      throw error;
    }
  }

  /**
   * Get complete staff history for a child across all services
   * @param {string} childId - The child's document ID
   */
  async getStaffHistory(childId) {
    try {
      const child = await this.getChildById(childId);
      if (!child) {
        throw new Error(`Child not found: ${childId}`);
      }

      const serviceEnrollments = child.serviceEnrollments || [];
      const allHistory = [];

      for (const enrollment of serviceEnrollments) {
        // Include current staff for active services
        if (enrollment.currentStaff && enrollment.status === SERVICE_ENROLLMENT_STATUS.ACTIVE) {
          allHistory.push({
            ...enrollment.currentStaff,
            serviceName: enrollment.serviceName,
            serviceType: enrollment.serviceType,
            enrollmentId: enrollment.enrollmentId,
            isCurrent: true,
            removedAt: null,
            removalReason: null
          });
        }

        // Include historical staff
        for (const history of enrollment.staffHistory || []) {
          allHistory.push({
            ...history,
            serviceName: enrollment.serviceName,
            serviceType: enrollment.serviceType,
            enrollmentId: enrollment.enrollmentId,
            isCurrent: false
          });
        }
      }

      // Sort by assignedAt descending (most recent first)
      allHistory.sort((a, b) =>
        new Date(b.assignedAt) - new Date(a.assignedAt)
      );

      return allHistory;
    } catch (error) {
      console.error('Error getting staff history:', error);
      throw error;
    }
  }

  /**
   * Update enrollment metadata (frequency, notes)
   * @param {string} childId - The child's document ID
   * @param {string} enrollmentId - The enrollment ID to update
   * @param {object} updates - Fields to update {frequency, notes}
   */
  async updateEnrollmentMetadata(childId, enrollmentId, updates) {
    if (!childId || !enrollmentId) {
      throw new Error('Missing required fields: childId and enrollmentId');
    }

    try {
      const child = await this.getChildById(childId);
      if (!child) {
        throw new Error(`Child not found: ${childId}`);
      }

      const serviceEnrollments = child.serviceEnrollments || [];
      const enrollmentIndex = serviceEnrollments.findIndex(
        e => e.enrollmentId === enrollmentId
      );

      if (enrollmentIndex === -1) {
        throw new Error(`Enrollment not found: ${enrollmentId}`);
      }

      // Only allow updating specific metadata fields
      const allowedFields = ['frequency', 'notes', 'lastActivityDate'];
      for (const key of Object.keys(updates)) {
        if (allowedFields.includes(key)) {
          serviceEnrollments[enrollmentIndex][key] = updates[key];
        }
      }

      const docRef = doc(db, COLLECTION_NAME, childId);
      await updateDoc(docRef, {
        serviceEnrollments,
        updatedAt: serverTimestamp()
      });

      return serviceEnrollments[enrollmentIndex];
    } catch (error) {
      console.error('Error updating enrollment metadata:', error);
      throw error;
    }
  }

  // ==========================================================================
  // SERVICE ENROLLMENT HELPERS
  // ==========================================================================

  /**
   * Compute assigned staff IDs from service enrollments
   * Returns both active staff IDs and all historical staff IDs
   */
  computeStaffIdsFromEnrollments(serviceEnrollments) {
    const activeStaffIds = new Set();
    const allStaffIds = new Set();

    for (const enrollment of serviceEnrollments || []) {
      // Current staff (only from active enrollments)
      if (
        enrollment.currentStaff?.staffId &&
        enrollment.status === SERVICE_ENROLLMENT_STATUS.ACTIVE
      ) {
        activeStaffIds.add(enrollment.currentStaff.staffId);
      }

      // All current staff (for historical tracking)
      if (enrollment.currentStaff?.staffId) {
        allStaffIds.add(enrollment.currentStaff.staffId);
      }

      // Historical staff
      for (const history of enrollment.staffHistory || []) {
        if (history.staffId) {
          allStaffIds.add(history.staffId);
        }
      }
    }

    return {
      assignedStaffIds: Array.from(activeStaffIds),
      allHistoricalStaffIds: Array.from(allStaffIds)
    };
  }

  /**
   * Calculate duration in days between two dates
   */
  calculateDurationDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Migrate a child from old service arrays to new serviceEnrollments format
   * @param {string} childId - The child's document ID
   * @param {string} migratedBy - User ID performing the migration
   */
  async migrateToServiceEnrollments(childId, migratedBy) {
    try {
      const child = await this.getChildById(childId);
      if (!child) {
        throw new Error(`Child not found: ${childId}`);
      }

      // Skip if already migrated
      if (child.serviceEnrollments && child.serviceEnrollments.length > 0) {
        console.log(`Child ${childId} already has serviceEnrollments, skipping migration`);
        return { skipped: true, enrollments: child.serviceEnrollments };
      }

      const serviceEnrollments = [];
      const now = new Date().toISOString();
      const enrolledAt = child.createdAt?.toDate?.()?.toISOString() || now;

      // Migrate oneOnOneServices (Therapy)
      for (const service of child.oneOnOneServices || []) {
        serviceEnrollments.push({
          enrollmentId: generateEnrollmentId(),
          serviceId: service.serviceId || `legacy_${service.serviceName?.replace(/\s+/g, '_').toLowerCase()}`,
          serviceName: service.serviceName,
          serviceType: 'Therapy',
          status: SERVICE_ENROLLMENT_STATUS.ACTIVE,
          enrolledAt: enrolledAt,
          statusChangedAt: now,
          statusChangeReason: null,
          currentStaff: {
            staffId: service.staffId,
            staffName: service.staffName,
            staffRole: service.staffRole || 'therapist',
            assignedAt: enrolledAt,
            assignedBy: migratedBy
          },
          staffHistory: [],
          frequency: null,
          notes: 'Migrated from legacy oneOnOneServices',
          lastActivityDate: null
        });
      }

      // Migrate groupClassServices (Class)
      for (const service of child.groupClassServices || []) {
        serviceEnrollments.push({
          enrollmentId: generateEnrollmentId(),
          serviceId: service.serviceId || `legacy_${service.serviceName?.replace(/\s+/g, '_').toLowerCase()}`,
          serviceName: service.serviceName,
          serviceType: 'Class',
          status: SERVICE_ENROLLMENT_STATUS.ACTIVE,
          enrolledAt: enrolledAt,
          statusChangedAt: now,
          statusChangeReason: null,
          currentStaff: {
            staffId: service.staffId,
            staffName: service.staffName,
            staffRole: service.staffRole || 'teacher',
            assignedAt: enrolledAt,
            assignedBy: migratedBy
          },
          staffHistory: [],
          frequency: null,
          notes: 'Migrated from legacy groupClassServices',
          lastActivityDate: null
        });
      }

      // Migrate enrolledServices (generic/legacy)
      for (const service of child.enrolledServices || []) {
        const serviceType = service.type === 'Therapy' ? 'Therapy' : 'Class';
        serviceEnrollments.push({
          enrollmentId: generateEnrollmentId(),
          serviceId: service.serviceId || `legacy_${service.serviceName?.replace(/\s+/g, '_').toLowerCase()}`,
          serviceName: service.serviceName,
          serviceType: serviceType,
          status: SERVICE_ENROLLMENT_STATUS.ACTIVE,
          enrolledAt: enrolledAt,
          statusChangedAt: now,
          statusChangeReason: null,
          currentStaff: {
            staffId: service.staffId,
            staffName: service.staffName,
            staffRole: service.staffRole || (serviceType === 'Therapy' ? 'therapist' : 'teacher'),
            assignedAt: enrolledAt,
            assignedBy: migratedBy
          },
          staffHistory: [],
          frequency: null,
          notes: 'Migrated from legacy enrolledServices',
          lastActivityDate: null
        });
      }

      // Compute staff IDs from new enrollments
      const { assignedStaffIds, allHistoricalStaffIds } =
        this.computeStaffIdsFromEnrollments(serviceEnrollments);

      const docRef = doc(db, COLLECTION_NAME, childId);
      await updateDoc(docRef, {
        serviceEnrollments,
        assignedStaffIds,
        allHistoricalStaffIds,
        // Preserve legacy arrays for rollback (prefix with underscore)
        _legacy_oneOnOneServices: child.oneOnOneServices || [],
        _legacy_groupClassServices: child.groupClassServices || [],
        _legacy_enrolledServices: child.enrolledServices || [],
        updatedAt: serverTimestamp()
      });

      console.log(`Migrated child ${childId}: ${serviceEnrollments.length} service enrollments`);
      return { skipped: false, enrollments: serviceEnrollments };
    } catch (error) {
      console.error('Error migrating to service enrollments:', error);
      throw error;
    }
  }

  /**
   * Batch migrate all children to serviceEnrollments format
   * @param {string} migratedBy - User ID performing the migration
   * @param {object} options - Migration options
   * @param {number} options.batchSize - Number of children per batch (default: 50)
   */
  async batchMigrateToServiceEnrollments(migratedBy, options = {}) {
    const { batchSize = 50 } = options;

    try {
      // Get all children that don't have serviceEnrollments yet
      const snapshot = await getDocs(collection(db, COLLECTION_NAME));
      trackRead(COLLECTION_NAME, snapshot.docs.length);

      const childrenToMigrate = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(child =>
          !child.serviceEnrollments || child.serviceEnrollments.length === 0
        );

      console.log(`Found ${childrenToMigrate.length} children to migrate`);

      const results = {
        total: childrenToMigrate.length,
        migrated: 0,
        skipped: 0,
        failed: 0,
        errors: []
      };

      // Process in batches
      for (let i = 0; i < childrenToMigrate.length; i += batchSize) {
        const batch = childrenToMigrate.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async (child) => {
            try {
              const result = await this.migrateToServiceEnrollments(child.id, migratedBy);
              if (result.skipped) {
                results.skipped++;
              } else {
                results.migrated++;
              }
            } catch (error) {
              results.failed++;
              results.errors.push({ childId: child.id, error: error.message });
            }
          })
        );

        console.log(`Processed batch ${Math.floor(i / batchSize) + 1}: ${i + batch.length}/${childrenToMigrate.length}`);
      }

      console.log('Migration complete:', results);
      return results;
    } catch (error) {
      console.error('Error in batch migration:', error);
      throw error;
    }
  }

  // ==========================================================================
  // BACKWARD COMPATIBILITY - Query methods that work with new model
  // ==========================================================================

  /**
   * Extract staff IDs - Updated to work with both old and new data models
   */
  extractStaffIdsV2(childData) {
    const staffIds = new Set();

    // New model: serviceEnrollments
    if (childData.serviceEnrollments) {
      for (const enrollment of childData.serviceEnrollments) {
        if (
          enrollment.currentStaff?.staffId &&
          enrollment.status === SERVICE_ENROLLMENT_STATUS.ACTIVE
        ) {
          staffIds.add(enrollment.currentStaff.staffId);
        }
      }
    }

    // Legacy model: separate arrays (for backward compatibility)
    const legacyArrays = [
      childData.oneOnOneServices,
      childData.groupClassServices,
      childData.enrolledServices
    ];

    for (const services of legacyArrays) {
      if (Array.isArray(services)) {
        for (const service of services) {
          if (service.staffId) {
            staffIds.add(service.staffId);
          }
        }
      }
    }

    return Array.from(staffIds);
  }
}

const childService = new ChildService();
export default childService;