import React, { useState, useEffect } from "react";
import "./EnrollStudentFormModal.css";
import Step1IdentifyingData from "./components/Step1IdentifyingData";
import Step2ReasonForReferral from "./components/Step2ReasonForReferral";
import Step3PurposeOfAssessment from "./components/Step3PurposeOfAssessment";
import Step4BackgroundHistory from "./components/Step4BackgroundHistory";
import Step5BehaviorDuringAssessment from "./components/Step5BehaviorDuringAssessment";
import Step6AssessmentTools from "./components/Step6AssessmentTools";
import Step7AssessmentResults from "./components/Step7AssessmentResults";
import Step8SummaryRecommendations from "./components/Step8SummaryRecommendations";
import Step9ServiceEnrollment from "./components/Step9ServiceEnrollment";
import manageChildren from "../enrollmentDatabase/manageChildren";
import manageAssessment from "../enrollmentDatabase/manageAssessment";

// Define the clean slate outside the component
const INITIAL_STUDENT_STATE = {
  firstName: "",
  middleName: "",
  lastName: "",
  nickname: "",
  dateOfBirth: "",
  gender: "",
  relationshipToClient: "biological child",
  photoUrl: "",
  active: true,
  address: "",
  school: "",
  gradeLevel: "",
  assessmentDates: new Date().toISOString().split("T")[0],
  examiner: "",
  ageAtAssessment: "",
  services: [],
  classes: [],
  reasonForReferral: "",
  purposeOfAssessment: [],
  backgroundHistory: {
    familyBackground: "",
    familyRelationships: "",
    dailyLifeActivities: "",
    medicalHistory: "",
    developmentalBackground: [{ devBgTitle: "", devBgInfo: "" }],
    schoolHistory: "",
    clinicalDiagnosis: "",
    interventions: [],
    strengthsAndInterests: "",
    socialSkills: "",
  },
  behaviorDuringAssessment: "",
  assessmentTools: [{ tool: "", details: "", result: "", recommendation: "" }],
  assessmentSummary: "",
};

export default function EnrollStudentFormModal({
  show,
  onClose,
  onSave,
  selectedParent,
  editingStudent, // Data passed from parent when clicking an ASSESSING student
}) {
  const [formStep, setFormStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [studentInput, setStudentInput] = useState(INITIAL_STUDENT_STATE);

  // --- AUTO-FILL LOGIC ---
  useEffect(() => {
    if (show) {
      if (editingStudent) {
        // We are editing: Merge existing data with INITIAL_STATE to ensure no fields are undefined
        setStudentInput({
          ...INITIAL_STUDENT_STATE,
          ...editingStudent,
          backgroundHistory: {
            ...INITIAL_STUDENT_STATE.backgroundHistory,
            ...(editingStudent.backgroundHistory || {}),
          },
          // Ensure arrays are preserved
          assessmentTools:
            editingStudent.assessmentTools ||
            INITIAL_STUDENT_STATE.assessmentTools,
          purposeOfAssessment: editingStudent.purposeOfAssessment || [],
        });
      } else {
        // We are creating new: Reset to empty
        setStudentInput(INITIAL_STUDENT_STATE);
      }
      setFormStep(1); // Reset to first step whenever modal opens
    }
  }, [show, editingStudent]);

  if (!show) return null;

  // --- HELPER FUNCTIONS ---
  const calculateAge = (dob) => {
    if (!dob) return "";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age >= 0 ? age.toString() : "";
  };

  const handleInputChange = (field, value) => {
    setStudentInput((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "dateOfBirth") {
        updated.ageAtAssessment = calculateAge(value);
      }
      return updated;
    });
  };

  const handleNestedChange = (category, field, value) => {
    setStudentInput((prev) => ({
      ...prev,
      [category]:
        field === null ? value : { ...prev[category], [field]: value },
    }));
  };

  const handleSave = async (isFinalized) => {
    setIsSaving(true);
    try {
      // Use existing ID if editing, otherwise generate new
      const childId =
        studentInput.childId || studentInput.id || crypto.randomUUID();

      // Save assessment data first
      const assessmentId = await manageAssessment.createOrUpdateAssessment(
        childId,
        studentInput
      );

      // IMPORTANT: Include Step 9 enrollment data
      const childDataToSave = {
        ...studentInput,
        childId,
        assessmentId,
        status: isFinalized ? "ENROLLED" : "ASSESSING",

        // Step 9 data (these come from the form state)
        oneOnOneServices: studentInput.oneOnOneServices || [],
        groupClassServices: studentInput.groupClassServices || [],
      };

      console.log("Saving child with enrollment data:", childDataToSave);

      const savedChild = await manageChildren.createOrUpdateChild(
        selectedParent.id,
        childDataToSave
      );

      onSave(savedChild);
      onClose();
      alert(isFinalized ? "Student enrolled successfully!" : "Progress saved!");
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save student: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNextOrSave = async () => {
    if (formStep === 9) {
      await handleSave(true);
    } else {
      setFormStep(formStep + 1);
    }
  };

  const getStepTitle = () => {
    const titles = {
      1: "I. IDENTIFYING DATA",
      2: "II. REASON FOR REFERRAL",
      3: "III. PURPOSE OF ASSESSMENT",
      4: "IV. BACKGROUND HISTORY",
      5: "V. BEHAVIOR DURING ASSESSMENT",
      6: "VI. ASSESSMENT TOOLS AND MEASURES",
      7: "VII. ASSESSMENT RESULTS",
      8: "VIII. SUMMARY AND RECOMMENDATIONS",
      9: "IX. SERVICE ENROLLMENT",
    };
    return titles[formStep] || "Assessment Section";
  };

  return (
    <div className="modalOverlay">
      <div className="multi-step-modal">
        {/* HEADER */}
        <div className="modal-header-sticky">
          <div className="modal-header-flex">
            <h2>
              Step {formStep}/9: {getStepTitle()}
            </h2>
            <button
              className="close-x-btn"
              onClick={onClose}
              disabled={isSaving}
            >
              ×
            </button>
          </div>
          <div className="step-indicator">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <div
                key={i}
                className={`step-dot ${formStep >= i ? "active" : ""}`}
              />
            ))}
          </div>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="enroll-form-scroll">
          {formStep === 1 && (
            <Step1IdentifyingData
              data={studentInput}
              onChange={handleInputChange}
            />
          )}
          {formStep === 2 && (
            <Step2ReasonForReferral
              data={studentInput}
              onChange={handleInputChange}
            />
          )}
          {formStep === 3 && (
            <Step3PurposeOfAssessment
              data={studentInput}
              onChange={handleInputChange}
            />
          )}
          {formStep === 4 && (
            <Step4BackgroundHistory
              data={studentInput}
              onChange={handleNestedChange}
            />
          )}
          {formStep === 5 && (
            <Step5BehaviorDuringAssessment
              data={studentInput}
              onChange={handleInputChange}
            />
          )}
          {formStep === 6 && (
            <Step6AssessmentTools
              data={studentInput}
              onChange={handleNestedChange}
            />
          )}
          {formStep === 7 && (
            <Step7AssessmentResults
              data={studentInput}
              onChange={handleNestedChange}
            />
          )}
          {formStep === 8 && (
            <Step8SummaryRecommendations
              data={studentInput}
              onChange={handleNestedChange}
            />
          )}
          {formStep === 9 && (
            <Step9ServiceEnrollment
              data={studentInput}
              onChange={handleInputChange}
            />
          )}
        </div>

        {/* FOOTER */}
        <div className="modalActions sticky-footer">
          <div className="left-actions">
            <button
              className="save-draft-btn"
              onClick={() => handleSave(false)}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Progress"}
            </button>
            <button
              className="cancel-btn-alt"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
          </div>
          <div className="right-actions">
            {formStep > 1 && (
              <button
                className="cancel-btn"
                onClick={() => setFormStep(formStep - 1)}
                disabled={isSaving}
              >
                Back
              </button>
            )}
            <button
              className="create-btn"
              onClick={handleNextOrSave}
              disabled={isSaving}
            >
              {isSaving
                ? "Saving..."
                : formStep === 9
                ? "Finalize & Enroll"
                : "Next Step"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
