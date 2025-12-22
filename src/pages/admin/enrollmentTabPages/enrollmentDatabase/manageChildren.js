import { db } from "../../../../config/firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp 
} from "firebase/firestore";

const manageChildren = {
  // 1. Create or Update Child
  async createOrUpdateChild(parentId, data) {
    const childId = data.childId || crypto.randomUUID();

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
      active: data.active,
      address: data.address,
      school: data.school,
      gradeLevel: data.gradeLevel,
      assessmentDates: data.assessmentDates,
      examiner: data.examiner,
      ageAtAssessment: data.ageAtAssessment,

      // STEP 9: SERVICE ENROLLMENT
      services: data.services,
      classes: data.classes,

      // 🔗 LINK TO ASSESSMENT
      assessmentId: data.assessmentId || null,

      parentId, // This links the child to the parent
      status: data.status,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    };

    // Save to Firestore
    await setDoc(doc(db, "children", childId), childPayload, {
      merge: true,
    });

    return { id: childId, ...childPayload };
  },

  // ✅ 2. ADD THIS FUNCTION: Fetch Children for a Specific Parent
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
  }
};

export default manageChildren;