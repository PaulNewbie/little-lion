import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import { generateUUID } from "../utils/constants";

class AssessmentService {
  // assessmentService.js
  // assessmentService.js
  async createOrUpdateAssessment(childId, assessmentData) {
    try {
      // If assessmentData already has an .id, use it. Otherwise, generate a new one.
      const assessmentId = assessmentData.id || generateUUID();

      const assessmentRef = doc(db, "assessments", assessmentId);

      const payload = {
        ...assessmentData,
        id: assessmentId, // Ensure the ID is saved inside the document
        childId,
        updatedAt: serverTimestamp(),
        createdAt: assessmentData.createdAt || serverTimestamp(),
      };

      // Use merge: true so saving "Progress" doesn't delete data from other steps
      await setDoc(assessmentRef, payload, { merge: true });
      return assessmentId;
    } catch (error) {
      console.error("Error in assessmentService:", error);
      throw error;
    }
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
