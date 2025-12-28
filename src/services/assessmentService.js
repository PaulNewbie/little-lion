import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import { generateUUID } from "../utils/constants";

class AssessmentService {
  async createOrUpdateAssessment(childId, data) {
    const assessmentId = data.assessmentId || generateUUID();

    const assessmentPayload = {
      assessmentId,
      childId,
      // Mapping fields directly to ensure clean data
      reasonForReferral: data.reasonForReferral || "",
      purposeOfAssessment: data.purposeOfAssessment || [],
      backgroundHistory: data.backgroundHistory || {},
      behaviorDuringAssessment: data.behaviorDuringAssessment || "",
      assessmentTools: data.assessmentTools || [],
      assessmentSummary: data.assessmentSummary || "",
      updatedAt: serverTimestamp(),
    };

    // Only set createdAt for new assessments
    if (!data.assessmentId) {
      assessmentPayload.createdAt = serverTimestamp();
    }

    await setDoc(doc(db, "assessments", assessmentId), assessmentPayload, {
      merge: true,
    });

    return assessmentId;
  }

  async getAssessment(assessmentId) {
    if (!assessmentId) throw new Error("Assessment ID is required");

    const assessmentRef = doc(db, "assessments", assessmentId);
    const assessmentSnap = await getDoc(assessmentRef);

    if (!assessmentSnap.exists()) {
      throw new Error("Assessment not found");
    }

    return assessmentSnap.data();
  }
}

const assessmentServiceInstance = new AssessmentService();
export default assessmentServiceInstance;