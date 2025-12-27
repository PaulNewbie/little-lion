import { 
  collection, 
  doc, 
  setDoc,      
  updateDoc, 
  arrayUnion,
  query,
  where,
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { generateUUID } from '../utils/constants';

class ChildService {

  /* ============================================================================
     SECTION 1: CORE ENROLLMENT (Merged from manageChildren.js)
     This is the robust logic used by your Admin Enrollment Wizard.
  ============================================================================ */

  /**
   * Creates or Updates a Child Profile with full enrollment data.
   * This handles standardizing services, staff IDs, and linking to the parent.
   * * @param {string} parentId - The UID of the parent
   * @param {object} data - The full form data object (identifying info + services)
   */
  async createOrUpdateChild(parentId, data) {
    const childId = data.childId || generateUUID();

    // 1. Process 1-on-1 Services (Standardize Naming)
    const processedServices = (data.oneOnOneServices || []).map((service) => ({
      serviceId: service.serviceId,
      serviceName: service.serviceName,
      type: "Therapy",              // Standardized Type
      staffId: service.staffId,     // Standardized ID
      staffName: service.staffName, // Standardized Name
      staffRole: "therapist",       // Standardized Role
    }));

    // 2. Process Group Classes (Standardize Naming)
    const processedClasses = (data.groupClassServices || []).map((service) => ({
      serviceId: service.serviceId,
      serviceName: service.serviceName,
      type: "Class",                // Standardized Type
      staffId: service.staffId,     // Standardized ID
      staffName: service.staffName, // Standardized Name
      staffRole: "teacher",         // Standardized Role
    }));

    // 3. Create Quick-Lookup Arrays (For Queries)
    // Extract unique staff IDs so we can query "where therapistIds contains X"
    const therapistIds = processedServices.map((s) => s.staffId);
    
    const teacherIds = [
      ...processedServices.filter((s) => s.staffRole === "teacher").map((s) => s.staffId),
      ...processedClasses.map((s) => s.staffId),
    ];

    // 4. Construct the Payload
    const childPayload = {
      // --- Identifying Data ---
      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,
      nickname: data.nickname,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      relationshipToClient: data.relationshipToClient,
      photoUrl: data.photoUrl,
      active: data.active !== false,
      address: data.address,
      school: data.school,
      gradeLevel: data.gradeLevel,
      
      // --- Assessment Data ---
      assessmentDates: data.assessmentDates || [],
      examiner: data.examiner || "",
      ageAtAssessment: data.ageAtAssessment || "",
      
      // Saving the Narrative Fields (Steps 2-5 & 8)
      reasonForReferral: data.reasonForReferral || "",
      purposeOfAssessment: data.purposeOfAssessment || [],
      backgroundHistory: data.backgroundHistory || {}, // Stores the big object from Step 4
      behaviorDuringAssessment: data.behaviorDuringAssessment || "",
      assessmentSummary: data.assessmentSummary || "", // Step 8 Summary
      
      assessmentTools: data.assessmentTools || [], // Contains Tools, Results, AND Recommendations
      assessmentId: data.assessmentId || null,

      // --- SERVICE ENROLLMENT (Single Source of Truth) ---
      // We combine both lists into one 'enrolledServices' array
      enrolledServices: [ ...processedServices, ...processedClasses ],

      // --- Lookup Arrays ---
      therapistIds: [...new Set(therapistIds)], // Remove duplicates
      teacherIds: [...new Set(teacherIds)],     // Remove duplicates

      // --- Metadata ---
      parentId, 
      status: data.status || "ENROLLED",
      updatedAt: serverTimestamp(),
      createdAt: data.createdAt || serverTimestamp(), 
      // (If it's an update, we might want to preserve original creation date, 
      // but if data.createdAt is undefined, it's new)
    };

    console.log("🦁 Saving Child Profile via ChildService:", childPayload);

    // 5. Save to Firestore (Merge prevents overwriting missing fields)
    await setDoc(doc(db, "children", childId), childPayload, {
      merge: true,
    });

    return { id: childId, ...childPayload };
  }

  /* ============================================================================
     SECTION 2: DATA FETCHING (Existing ChildService Logic)
     Used by Dashboards and Lists.
  ============================================================================ */

  // Get children for a specific parent
  async getChildrenByParentId(parentId) {
    try {
      const q = query(collection(db, 'children'), where('parentId', '==', parentId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error('Failed to fetch children: ' + error.message);
    }
  }

  // Get children assigned to a specific TEACHER
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

  // Get children assigned to a specific THERAPIST
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

  // Get All Children (Admin)
  async getAllChildren() {
    try {
      const querySnapshot = await getDocs(collection(db, 'children'));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error('Failed to fetch all children: ' + error.message);
    }
  }

  /* ============================================================================
     SECTION 3: SERVICE MODIFICATION (Unified Logic)
     Used by Manual Add Buttons in Profile.
  ============================================================================ */

  async assignService(childId, serviceData) {
    try {
      const childRef = doc(db, 'children', childId);
      
      // Standardize the object structure to match 'createOrUpdateChild' format
      const standardizedService = {
        serviceId: serviceData.serviceId,
        serviceName: serviceData.serviceName,
        type: serviceData.type || 'Therapy', 
        
        // Handle varying naming conventions from inputs
        staffId: serviceData.staffId || serviceData.therapistId || serviceData.teacherId,
        staffName: serviceData.staffName || serviceData.therapistName || serviceData.teacherName,
        staffRole: serviceData.staffRole || (serviceData.teacherId ? 'teacher' : 'therapist')
      };

      const updates = {
        enrolledServices: arrayUnion(standardizedService)
      };

      // Maintain the quick-lookup arrays
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

  // Wrappers for backward compatibility
  async assignTherapyService(childId, data) {
    return this.assignService(childId, { ...data, type: 'Therapy', staffRole: 'therapist' });
  }

  async assignGroupClass(childId, data) {
    return this.assignService(childId, { ...data, type: 'Class', staffRole: 'teacher' });
  }
}

const childServiceInstance = new ChildService();
export default childServiceInstance;