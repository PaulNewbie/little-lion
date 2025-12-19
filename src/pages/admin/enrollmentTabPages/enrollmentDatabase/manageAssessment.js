// enrollmentDatabase/manageAssessment.js
import { db } from "../../../../config/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const manageAssessment = {
  async createOrUpdateAssessment(childId, data) {
    const assessmentId = data.assessmentId || crypto.randomUUID();

    const assessmentPayload = {
      assessmentId,
      childId,

      // STEP 2
      reasonForReferral: data.reasonForReferral,

      // STEP 3
      purposeOfAssessment: data.purposeOfAssessment,

      // STEP 4
      backgroundHistory: data.backgroundHistory,

      // STEP 5
      behaviorDuringAssessment: data.behaviorDuringAssessment,

      // STEP 6
      assessmentTools: data.assessmentTools,

      // STEP 7
      assessmentResults: data.assessmentResults,

      // STEP 8
      recommendations: data.recommendations,

      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, "assessments", assessmentId), assessmentPayload, {
      merge: true,
    });

    return assessmentId;
  },
};

export default manageAssessment;
