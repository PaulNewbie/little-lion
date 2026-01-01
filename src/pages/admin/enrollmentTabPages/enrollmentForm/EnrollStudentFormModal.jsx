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
import childService from "../../../../services/childService";
import assessmentService from "../../../../services/assessmentService";
import { generateUUID } from "../../../../utils/constants";

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
  oneOnOneServices: [],
  groupClassServices: [],
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
  editingStudent,
}) {
  const [formStep, setFormStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [studentInput, setStudentInput] = useState(INITIAL_STUDENT_STATE);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);

  useEffect(() => {
    if (show) {
      if (editingStudent) {
        setStudentInput({
          ...INITIAL_STUDENT_STATE,
          ...editingStudent,
          backgroundHistory: {
            ...INITIAL_STUDENT_STATE.backgroundHistory,
            ...(editingStudent.backgroundHistory || {}),
          },
          assessmentTools:
            editingStudent.assessmentTools ||
            INITIAL_STUDENT_STATE.assessmentTools,
          purposeOfAssessment: editingStudent.purposeOfAssessment || [],
        });
      } else {
        setStudentInput(INITIAL_STUDENT_STATE);
      }
      setFormStep(1);
      setShowCloseConfirmation(false);
    }
  }, [show, editingStudent]);

  if (!show) return null;

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

  const validateCurrentStep = () => {
    switch (formStep) {
      case 1:
        return !!(
          studentInput.firstName &&
          studentInput.lastName &&
          studentInput.gender &&
          studentInput.dateOfBirth &&
          studentInput.assessmentDates &&
          studentInput.examiner
        );
      case 2:
        return !!studentInput.reasonForReferral;
      case 3:
        return studentInput.purposeOfAssessment?.length > 0;
      case 4:
        return !!(
          studentInput.backgroundHistory?.familyBackground &&
          studentInput.backgroundHistory?.familyRelationships &&
          studentInput.backgroundHistory?.dailyLifeActivities &&
          studentInput.backgroundHistory?.medicalHistory &&
          studentInput.backgroundHistory?.developmentalBackground?.length > 0 &&
          studentInput.backgroundHistory?.developmentalBackground.every(
            (devBack) => devBack.devBgTitle && devBack.devBgInfo
          ) &&
          studentInput.backgroundHistory?.schoolHistory &&
          studentInput.backgroundHistory?.clinicalDiagnosis &&
          studentInput.backgroundHistory?.interventions?.length > 0 &&
          studentInput.backgroundHistory?.interventions.every(
            (intervention) => intervention.name && intervention.frequency
          ) &&
          studentInput.backgroundHistory?.strengthsAndInterests &&
          studentInput.backgroundHistory?.socialSkills
        );
      case 5:
        return !!studentInput.behaviorDuringAssessment;
      case 6:
        return (
          studentInput.assessmentTools?.length > 0 &&
          studentInput.assessmentTools.every(
            (tool) => tool.tool && tool.details
          )
        );
      case 7:
        return studentInput.assessmentTools?.every((tool) => tool.result);
      case 8:
        return (
          !!studentInput.assessmentSummary &&
          studentInput.assessmentTools?.every((tool) => tool.recommendation)
        );
      case 9:
        const hasTherapy =
          studentInput.oneOnOneServices?.length > 0 &&
          studentInput.oneOnOneServices.every(
            (service) => service.serviceId && service.staffId
          );
        const hasClasses =
          studentInput.groupClassServices?.length > 0 &&
          studentInput.groupClassServices.every(
            (class_) => class_.serviceId && class_.staffId
          );
        return hasTherapy || hasClasses;
      default:
        return true;
    }
  };

  const handleSave = async (isFinalized) => {
    setIsSaving(true);
    try {
      // 1. Ensure we have a childId
      const childId = studentInput.childId || studentInput.id || generateUUID();

      // 2. Prepare Assessment Data (Steps 2-8)
      // We include the 'id' here so your service knows to update the existing doc
      const assessmentDataToSave = {
        id: studentInput.assessmentId || null,
        reasonForReferral: studentInput.reasonForReferral,
        purposeOfAssessment: studentInput.purposeOfAssessment,
        backgroundHistory: studentInput.backgroundHistory,
        behaviorDuringAssessment: studentInput.behaviorDuringAssessment,
        assessmentTools: studentInput.assessmentTools,
        assessmentSummary: studentInput.assessmentSummary,
      };

      // 3. Save Assessment using your exact service signature
      const assessmentId = await assessmentService.createOrUpdateAssessment(
        childId,
        assessmentDataToSave
      );

      // 4. Update state so subsequent "Save Progress" clicks use the same assessmentId
      setStudentInput((prev) => ({
        ...prev,
        assessmentId,
        childId,
      }));

      // 5. Prepare Child Data (Steps 1 and 9)
      const childDataToSave = {
        firstName: studentInput.firstName,
        middleName: studentInput.middleName,
        lastName: studentInput.lastName,
        nickname: studentInput.nickname,
        dateOfBirth: studentInput.dateOfBirth,
        gender: studentInput.gender,
        relationshipToClient: studentInput.relationshipToClient,
        photoUrl: studentInput.photoUrl,
        active: studentInput.active,
        address: studentInput.address,
        school: studentInput.school,
        gradeLevel: studentInput.gradeLevel,
        assessmentDates: studentInput.assessmentDates,
        examiner: studentInput.examiner,
        ageAtAssessment: studentInput.ageAtAssessment,
        oneOnOneServices: studentInput.oneOnOneServices || [],
        groupClassServices: studentInput.groupClassServices || [],
        status: isFinalized ? "ENROLLED" : "ASSESSING",
        assessmentId, // Link to the assessment document
        childId, // Ensure childId is consistent
      };

      // 6. Save Child
      const savedChild = await childService.createOrUpdateChild(
        selectedParent.uid || selectedParent.id,
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
    if (!validateCurrentStep()) {
      alert("Please fill in all required fields before proceeding.");
      return;
    }
    if (formStep === 9) {
      await handleSave(true);
    } else {
      setFormStep(formStep + 1);
    }
  };

  const handleCloseClick = () => setShowCloseConfirmation(true);
  const handleConfirmClose = () => {
    setShowCloseConfirmation(false);
    onClose();
  };
  const handleSaveAndClose = async () => {
    setShowCloseConfirmation(false);
    await handleSave(false);
    onClose();
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
        <div className="modal-header-sticky">
          <div className="modal-header-flex">
            <h2>
              Step {formStep}/9: {getStepTitle()}
            </h2>
            <button
              className="close-x-btn"
              onClick={handleCloseClick}
              disabled={isSaving}
              type="button"
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

        <div className="modalActions sticky-footer">
          <div className="left-actions">
            <button
              className="save-draft-btn"
              onClick={() => handleSave(false)}
              disabled={isSaving}
              type="button"
            >
              {isSaving ? "Saving..." : "Save Progress"}
            </button>
            <button
              className="cancel-btn-alt"
              onClick={handleCloseClick}
              disabled={isSaving}
              type="button"
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
                type="button"
              >
                Back
              </button>
            )}
            <button
              className="create-btn"
              onClick={handleNextOrSave}
              disabled={isSaving}
              type="button"
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

      {showCloseConfirmation && (
        <div className="modalOverlay" style={{ zIndex: 1001 }}>
          <div
            className="multi-step-modal"
            style={{ maxWidth: "450px", maxHeight: "auto" }}
          >
            <div className="modal-header-sticky">
              <div className="modal-header-flex">
                <h2 style={{ fontSize: "1.25rem" }}>⚠️ Unsaved Changes</h2>
              </div>
            </div>
            <div className="enroll-form-scroll" style={{ padding: "2rem" }}>
              <p
                style={{
                  margin: "0 0 1.5rem 0",
                  color: "#64748b",
                  lineHeight: "1.6",
                }}
              >
                You have unsaved changes. What would you like to do?
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <button
                  onClick={handleSaveAndClose}
                  disabled={isSaving}
                  style={{
                    padding: "0.875rem 1.5rem",
                    backgroundColor: "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "0.5rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "0.9375rem",
                  }}
                >
                  💾 Save Progress & Close
                </button>
                <button
                  onClick={handleConfirmClose}
                  style={{
                    padding: "0.875rem 1.5rem",
                    backgroundColor: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "0.5rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "0.9375rem",
                  }}
                >
                  🗑️ Discard Changes & Close
                </button>
                <button
                  onClick={() => setShowCloseConfirmation(false)}
                  style={{
                    padding: "0.875rem 1.5rem",
                    backgroundColor: "#f1f5f9",
                    color: "#334155",
                    border: "none",
                    borderRadius: "0.5rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "0.9375rem",
                  }}
                >
                  ← Continue Editing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
