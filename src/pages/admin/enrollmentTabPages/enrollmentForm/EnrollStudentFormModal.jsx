// EnrollStudentFormModal.jsx
import React, { useState } from "react";
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

export default function EnrollStudentFormModal({
  show,
  onClose,
  onSave,
  selectedParent,
}) {
  const [formStep, setFormStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Helper to get today's date in YYYY-MM-DD format
  const getTodayDate = () => new Date().toISOString().split("T")[0];

  const [studentInput, setStudentInput] = useState({
    // STEP 1: IDENTIFYING DATA (Matches your JSON Step 1)
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
    assessmentDates: getTodayDate(), // Changed from assessmentDate to match JSON
    examiner: "",
    ageAtAssessment: "", // Changed from age to match JSON

    // STEP 9 DATA (Moved to top as per your request)
    services: [], // Array of objects: { serviceId, serviceName, teacherId, teacherName }
    classes: [], // Array of objects: { classId, className, teacherId, teacherName }

    // STEP 2: REASON FOR REFERRAL
    reasonForReferral: "",

    // STEP 3: PURPOSE OF ASSESSMENT
    purposeOfAssessment: [], // Array of strings

    // STEP 4: BACKGROUND HISTORY
    backgroundHistory: {
      familyBackground: "",
      familyRelationships: "",
      dailyLifeActivities: "",
      medicalHistory: "",
      developmentalBackground: [{ devBgTitle: "", devBgInfo: "" }],
      schoolHistory: "",
      clinicalDiagnosis: "",
      interventions: [], // Array of objects: { type, frequency }
      strengthsAndInterests: "",
      socialSkills: "",
    },

    // STEP 5: BEHAVIOR DURING ASSESSMENT
    behaviorDuringAssessment: "",

    // STEPS 6, 7, 8: ASSESSMENT TOOLS, RESULTS, RECOMMENDATIONS
    assessmentTools: [
      {
        tool: "", // Step 6: Tool name
        details: "", // Step 6: Tool details
        result: "", // Step 7: Assessment result for this tool
        recommendation: "", // Step 8: Recommendation for this tool
      },
    ],

    // STEP 8: OVERALL SUMMARY (single input, not per tool)
    assessmentSummary: "",
  });

  if (!show) return null;

  //Age Calculator
  // Add this helper function inside your Modal or a utility file
  const calculateAge = (dob) => {
    if (!dob) return "";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age.toString() : "";
  };

  // Inside your handleInputChange in EnrollStudentFormModal:
  const handleInputChange = (field, value) => {
    setStudentInput((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto-calculate age if DOB changes
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
        field === null
          ? value
          : {
              ...prev[category],
              [field]: value,
            },
    }));
  };

  const handleSave = async (isFinalized) => {
    setIsSaving(true);
    try {
      const childId = studentInput.childId || crypto.randomUUID();

      // Create/Update assessment (Steps 2-8)
      const assessmentId = await manageAssessment.createOrUpdateAssessment(
        childId,
        studentInput
      );

      // Create/Update child (Step 1 & 9) with assessmentId link
      const savedChild = await manageChildren.createOrUpdateChild(
        selectedParent.id,
        {
          ...studentInput,
          childId,
          assessmentId,
          status: isFinalized ? "ENROLLED" : "ASSESSING",
        }
      );

      // Update parent component state
      onSave(savedChild);

      // Close modal
      onClose();

      alert(
        isFinalized
          ? "Student enrolled successfully!"
          : "Student data saved! Status: ASSESSING"
      );
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save student. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNextOrSave = async () => {
    if (formStep === 9) {
      // Final step - mark as ENROLLED
      await handleSave(true);
    } else {
      // Move to next step without saving
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
