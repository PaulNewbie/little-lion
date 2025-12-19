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

      // STEP 6, 7, 8
      assessmentTools: data.assessmentTools,

      // STEP 8: OVERALL SUMMARY
      assessmentSummary: data.assessmentSummary,

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
