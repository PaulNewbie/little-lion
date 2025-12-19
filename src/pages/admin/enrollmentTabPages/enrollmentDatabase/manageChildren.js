// enrollmentDatabase/manageChildren.js
import { db } from "../../../../config/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const manageChildren = {
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

      parentId,
      status: data.status,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, "children", childId), childPayload, {
      merge: true,
    });

    return { id: childId, ...childPayload };
  },
};

export default manageChildren;
