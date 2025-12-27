import { db } from "../../../../config/firebase";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

const manageChildren = {
  // 1. Create or Update Child
  async createOrUpdateChild(parentId, data) {
    const childId = data.childId || crypto.randomUUID();

    // Process services and classes from Step 9
    const processedServices = (data.oneOnOneServices || []).map((service) => ({
      serviceId: service.serviceId,
      serviceName: service.serviceName,
      serviceType: service.serviceType,
      staffId: service.staffId,
      staffName: service.staffName,
      staffRole: "therapist",
    }));

    const processedClasses = (data.groupClassServices || []).map((service) => ({
      serviceId: service.serviceId,
      serviceName: service.serviceName,
      serviceType: service.serviceType,
      staffId: service.staffId,
      staffName: service.staffName,
      staffRole: "teacher", // Classes are always taught by teachers
    }));

    // Extract unique staff IDs for quick lookup
    const therapistIds = processedServices
      .filter((s) => s.staffRole === "therapist")
      .map((s) => s.staffId);

    const teacherIds = [
      ...processedServices
        .filter((s) => s.staffRole === "teacher")
        .map((s) => s.staffId),
      ...processedClasses.map((s) => s.staffId),
    ];

    const childPayload = {
      // STEP 1: IDENTIFYING DATA
      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,
      nickname: data.nickname,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      relationshipToClient: data.relationshipToClient,
      photoUrl: data.photoUrl,
      active: data.active !== false, // Default to true
      address: data.address,
      school: data.school,
      gradeLevel: data.gradeLevel,
      assessmentDates: data.assessmentDates,
      examiner: data.examiner,
      ageAtAssessment: data.ageAtAssessment,

      // STEP 9: SERVICE ENROLLMENT (NEW FORMAT)
    enrolledServices: [
      ...processedServices.map(s => ({ ...s, type: 'Therapy' })), 
      ...processedClasses.map(s => ({ ...s, type: 'Class' }))
    ],

      // Quick lookup arrays for queries
      therapistIds: [...new Set(therapistIds)], // Remove duplicates
      teacherIds: [...new Set(teacherIds)], // Remove duplicates

      // 🔗 LINK TO ASSESSMENT
      assessmentId: data.assessmentId || null,

      parentId, // Link to parent
      status: data.status || "ENROLLED",
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    };

    console.log("Saving child with services:", childPayload.services);
    console.log("Saving child with classes:", childPayload.classes);

    // Save to Firestore
    await setDoc(doc(db, "children", childId), childPayload, {
      merge: true,
    });

    return { id: childId, ...childPayload };
  },

  // ✅ 2. Fetch Children for a Specific Parent
  async getChildrenByParent(parentId) {
    try {
      const q = query(
        collection(db, "children"),
        where("parentId", "==", parentId)
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching children:", error);
      return [];
    }
  },
};

export default manageChildren;
