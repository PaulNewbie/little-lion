// src/utils/denormalization.js
// STRATEGY 3: Denormalization Helpers
// Functions to embed summary data and keep it in sync

import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  query, 
  where,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * DENORMALIZATION STRATEGY OVERVIEW
 * 
 * The Problem:
 * To display a student card, you currently need to read:
 * 1. Child document (1 read)
 * 2. Parent document (1 read)
 * 3. Each assigned staff member (2-5 reads)
 * 4. Each service detail (2-5 reads)
 * Total: 6-12 reads PER student card
 * 
 * The Solution:
 * Embed frequently-needed summary data directly in the child document.
 * When parent/staff update their info, we update the embedded copies too.
 * 
 * NEW Child Document Structure:
 * {
 *   id: "child123",
 *   firstName: "Maria",
 *   lastName: "Santos",
 *   status: "ENROLLED",
 *   
 *   // Embedded parent summary (saves 1 read per card)
 *   parentSummary: {
 *     id: "parent456",
 *     name: "Juan Santos",
 *     phone: "555-1234",
 *     email: "juan@email.com"
 *   },
 *   
 *   // Embedded service summaries (saves 2-5 reads per card)
 *   enrolledServices: [
 *     {
 *       serviceId: "service1",
 *       serviceName: "Speech Therapy",
 *       serviceType: "Therapy",
 *       staffId: "staff1",
 *       staffName: "Dr. Reyes",
 *       staffPhoto: "..."
 *     }
 *   ],
 *   
 *   // Denormalized for efficient queries
 *   assignedStaffIds: ["staff1", "staff2"]
 * }
 */

// =============================================================================
// PARENT SUMMARY HELPERS
// =============================================================================

/**
 * Create a parent summary object from full parent data
 */
export function createParentSummary(parent) {
  if (!parent) return null;
  
  return {
    id: parent.id || parent.uid,
    name: `${parent.firstName || ''} ${parent.lastName || ''}`.trim(),
    firstName: parent.firstName,
    lastName: parent.lastName,
    phone: parent.phone || null,
    email: parent.email || null,
    photo: parent.profilePhoto || parent.photoUrl || null,
  };
}

/**
 * Update parent summary in all their children
 * Call this when a parent updates their profile
 */
export async function updateParentSummaryInChildren(parentId, parentData) {
  try {
    const parentSummary = createParentSummary({ id: parentId, ...parentData });
    
    // Find all children of this parent
    const childrenQuery = query(
      collection(db, 'children'),
      where('parentId', '==', parentId)
    );
    const snapshot = await getDocs(childrenQuery);
    
    if (snapshot.empty) {
      console.log('No children found for parent:', parentId);
      return;
    }
    
    // Batch update all children
    const batch = writeBatch(db);
    snapshot.docs.forEach(childDoc => {
      batch.update(childDoc.ref, { 
        parentSummary,
        updatedAt: serverTimestamp()
      });
    });
    
    await batch.commit();
    console.log(`Updated parent summary in ${snapshot.size} children`);
  } catch (error) {
    console.error('Error updating parent summary:', error);
    throw error;
  }
}

// =============================================================================
// STAFF SUMMARY HELPERS
// =============================================================================

/**
 * Create a staff summary object from full staff data
 */
export function createStaffSummary(staff) {
  if (!staff) return null;
  
  return {
    id: staff.id || staff.uid,
    name: `${staff.firstName || ''} ${staff.lastName || ''}`.trim(),
    firstName: staff.firstName,
    lastName: staff.lastName,
    role: staff.role,
    photo: staff.profilePhoto || staff.photoUrl || null,
    specializations: staff.specializations || [],
  };
}

/**
 * Update staff summary in enrolled services across all children
 * Call this when a staff member updates their profile
 */
export async function updateStaffSummaryInChildren(staffId, staffData) {
  try {
    const newStaffName = `${staffData.firstName || ''} ${staffData.lastName || ''}`.trim();
    const newStaffPhoto = staffData.profilePhoto || staffData.photoUrl || null;
    
    // Find all children with this staff member assigned
    const childrenQuery = query(
      collection(db, 'children'),
      where('assignedStaffIds', 'array-contains', staffId)
    );
    const snapshot = await getDocs(childrenQuery);
    
    if (snapshot.empty) {
      console.log('No children assigned to staff:', staffId);
      return;
    }
    
    // Batch update all children
    const batch = writeBatch(db);
    
    snapshot.docs.forEach(childDoc => {
      const childData = childDoc.data();
      
      // Update oneOnOneServices
      const updatedOneOnOne = (childData.oneOnOneServices || []).map(service => 
        service.staffId === staffId 
          ? { ...service, staffName: newStaffName, staffPhoto: newStaffPhoto }
          : service
      );
      
      // Update groupClassServices
      const updatedGroupClass = (childData.groupClassServices || []).map(service => 
        service.staffId === staffId 
          ? { ...service, staffName: newStaffName, staffPhoto: newStaffPhoto }
          : service
      );
      
      // Update enrolledServices (if using this array)
      const updatedEnrolled = (childData.enrolledServices || []).map(service => 
        service.staffId === staffId 
          ? { ...service, staffName: newStaffName, staffPhoto: newStaffPhoto }
          : service
      );
      
      batch.update(childDoc.ref, { 
        oneOnOneServices: updatedOneOnOne,
        groupClassServices: updatedGroupClass,
        enrolledServices: updatedEnrolled,
        updatedAt: serverTimestamp()
      });
    });
    
    await batch.commit();
    console.log(`Updated staff summary in ${snapshot.size} children`);
  } catch (error) {
    console.error('Error updating staff summary:', error);
    throw error;
  }
}

// =============================================================================
// SERVICE SUMMARY HELPERS
// =============================================================================

/**
 * Create a service enrollment object with all display data
 */
export function createServiceEnrollment(service, staff) {
  return {
    serviceId: service.id,
    serviceName: service.name,
    serviceType: service.type,
    serviceColor: service.color || null,
    staffId: staff.id || staff.uid,
    staffName: `${staff.firstName || ''} ${staff.lastName || ''}`.trim(),
    staffPhoto: staff.profilePhoto || staff.photoUrl || null,
    staffRole: staff.role,
    enrolledAt: new Date().toISOString(),
  };
}

/**
 * Update service name in all children's enrolled services
 * Call this when a service is renamed
 */
export async function updateServiceNameInChildren(serviceId, newServiceName) {
  try {
    // This is expensive - we need to query all enrolled children
    // Consider maintaining a reverse index: services/{serviceId}/enrolledChildren
    const childrenQuery = query(
      collection(db, 'children'),
      where('status', '==', 'ENROLLED')
    );
    const snapshot = await getDocs(childrenQuery);
    
    const batch = writeBatch(db);
    let updateCount = 0;
    
    snapshot.docs.forEach(childDoc => {
      const childData = childDoc.data();
      let needsUpdate = false;
      
      const updateServices = (services) => services.map(service => {
        if (service.serviceId === serviceId) {
          needsUpdate = true;
          return { ...service, serviceName: newServiceName };
        }
        return service;
      });
      
      const updatedOneOnOne = updateServices(childData.oneOnOneServices || []);
      const updatedGroupClass = updateServices(childData.groupClassServices || []);
      const updatedEnrolled = updateServices(childData.enrolledServices || []);
      
      if (needsUpdate) {
        batch.update(childDoc.ref, {
          oneOnOneServices: updatedOneOnOne,
          groupClassServices: updatedGroupClass,
          enrolledServices: updatedEnrolled,
          updatedAt: serverTimestamp()
        });
        updateCount++;
      }
    });
    
    if (updateCount > 0) {
      await batch.commit();
      console.log(`Updated service name in ${updateCount} children`);
    }
  } catch (error) {
    console.error('Error updating service name:', error);
    throw error;
  }
}

// =============================================================================
// MIGRATION HELPER - Run once to add denormalized data to existing documents
// =============================================================================

/**
 * One-time migration to add parentSummary to all children
 * Run this once from your admin panel or a script
 */
export async function migrateAddParentSummaries() {
  console.log('Starting parent summary migration...');
  
  try {
    // Get all children
    const childrenSnapshot = await getDocs(collection(db, 'children'));
    
    // Get all parents
    const parentsQuery = query(
      collection(db, 'users'),
      where('role', '==', 'parent')
    );
    const parentsSnapshot = await getDocs(parentsQuery);
    
    // Create parent lookup map
    const parentMap = new Map();
    parentsSnapshot.docs.forEach(doc => {
      parentMap.set(doc.id, { id: doc.id, ...doc.data() });
    });
    
    // Batch update children
    const batch = writeBatch(db);
    let count = 0;
    
    childrenSnapshot.docs.forEach(childDoc => {
      const childData = childDoc.data();
      const parent = parentMap.get(childData.parentId);
      
      if (parent && !childData.parentSummary) {
        batch.update(childDoc.ref, {
          parentSummary: createParentSummary(parent)
        });
        count++;
      }
      
      // Firestore batch limit is 500
      if (count >= 400) {
        console.warn('Batch limit approaching - run migration again for remaining documents');
      }
    });
    
    await batch.commit();
    console.log(`Migration complete: Added parent summaries to ${count} children`);
    
    return { success: true, count };
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Migration to backfill assignedStaffIds on all children.
 * Extracts staff IDs from BOTH:
 *  - New model: serviceEnrollments[].currentStaff.staffId (active only)
 *  - Legacy arrays: oneOnOneServices, groupClassServices, enrolledServices
 *
 * Options:
 *  - forceRecompute: if true, recomputes even if assignedStaffIds already exists
 */
export async function migrateAddAssignedStaffIds({ forceRecompute = false } = {}) {
  console.log('Starting assignedStaffIds migration...', { forceRecompute });

  try {
    const childrenSnapshot = await getDocs(collection(db, 'children'));

    const batch = writeBatch(db);
    let count = 0;
    let skipped = 0;

    childrenSnapshot.docs.forEach(childDoc => {
      const childData = childDoc.data();

      // Skip if already has assignedStaffIds (unless forceRecompute)
      if (!forceRecompute && childData.assignedStaffIds && childData.assignedStaffIds.length > 0) {
        skipped++;
        return;
      }

      const staffIds = new Set();

      // NEW MODEL: serviceEnrollments (active enrollments only)
      if (Array.isArray(childData.serviceEnrollments)) {
        childData.serviceEnrollments.forEach(enrollment => {
          if (enrollment.status === 'active' && enrollment.currentStaff?.staffId) {
            staffIds.add(enrollment.currentStaff.staffId);
          }
        });
      }

      // LEGACY: oneOnOneServices, groupClassServices, enrolledServices
      [
        childData.oneOnOneServices,
        childData.groupClassServices,
        childData.enrolledServices,
      ].forEach(services => {
        if (Array.isArray(services)) {
          services.forEach(service => {
            if (service.staffId) {
              staffIds.add(service.staffId);
            }
          });
        }
      });

      if (staffIds.size > 0) {
        batch.update(childDoc.ref, {
          assignedStaffIds: Array.from(staffIds)
        });
        count++;
      } else {
        console.warn(`Child ${childDoc.id} (${childData.firstName} ${childData.lastName}) has no staff IDs in any model`);
      }
    });

    if (count > 0) {
      await batch.commit();
    }
    console.log(`Migration complete: Updated ${count} children, skipped ${skipped}`);

    return { success: true, count, skipped, total: childrenSnapshot.size };
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Run all migrations
 */
export async function runAllMigrations() {
  console.log('=== Starting all migrations ===');
  
  const results = {
    parentSummaries: await migrateAddParentSummaries(),
    assignedStaffIds: await migrateAddAssignedStaffIds(),
  };
  
  console.log('=== Migration Results ===', results);
  return results;
}

// Export all helpers
export default {
  createParentSummary,
  createStaffSummary,
  createServiceEnrollment,
  updateParentSummaryInChildren,
  updateStaffSummaryInChildren,
  updateServiceNameInChildren,
  migrateAddParentSummaries,
  migrateAddAssignedStaffIds,
  runAllMigrations,
};
