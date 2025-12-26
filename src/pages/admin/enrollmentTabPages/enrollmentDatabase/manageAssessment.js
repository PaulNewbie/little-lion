// enrollmentDatabase/manageAssessment.js
import { db } from "../../../../config/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

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
    };

    // Only set createdAt for new assessments (when assessmentId doesn't exist in data)
    if (!data.assessmentId) {
      assessmentPayload.createdAt = serverTimestamp();
    }

    await setDoc(doc(db, "assessments", assessmentId), assessmentPayload, {
      merge: true,
    });

    return assessmentId;
  },

  async getAssessment(assessmentId) {
    if (!assessmentId) {
      throw new Error("Assessment ID is required");
    }

    const assessmentRef = doc(db, "assessments", assessmentId);
    const assessmentSnap = await getDoc(assessmentRef);

    if (!assessmentSnap.exists()) {
      throw new Error("Assessment not found");
    }

    return assessmentSnap.data();
  },
};

export default manageAssessment;
