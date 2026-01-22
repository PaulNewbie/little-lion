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
import userService from "../../../../services/userService";
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
  // New unified model for services (replaces oneOnOneServices + groupClassServices)
  serviceEnrollments: [],
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

  // NEW: Error state management
  const [validationErrors, setValidationErrors] = useState({});
  const [showErrors, setShowErrors] = useState(false);

  // NEW: Get detailed validation errors for current step
  const getValidationErrors = (step = formStep, data = studentInput) => {
    const errors = {};

    switch (step) {
      case 1:
        if (!data.firstName?.trim()) errors.firstName = "First name is required";
        if (!data.lastName?.trim()) errors.lastName = "Last name is required";
        if (!data.gender) errors.gender = "Gender is required";
        if (!data.dateOfBirth) errors.dateOfBirth = "Date of birth is required";
        if (!data.assessmentDates) errors.assessmentDates = "Assessment date is required";
        if (!data.examiner?.trim()) errors.examiner = "Examiner name is required";
        break;

      case 2:
        if (!data.reasonForReferral?.trim()) {
          errors.reasonForReferral = "Reason for referral is required";
        }
        break;

      case 3:
        if (!data.purposeOfAssessment?.length || data.purposeOfAssessment.length === 0) {
          errors.purposeOfAssessment = "At least one assessment purpose is required";
        } else {
          const emptyPurposes = data.purposeOfAssessment
            .map((purpose, index) => ({ purpose, index }))
            .filter(({ purpose }) => !purpose?.trim());

          if (emptyPurposes.length > 0) {
            errors.purposeOfAssessment = `Assessment purpose ${emptyPurposes.map(p => p.index + 1).join(", ")} cannot be empty`;
          }
        }
        break;

      case 4:
        if (!data.backgroundHistory?.familyBackground?.trim()) {
          errors.familyBackground = "Family background is required";
        }
        if (!data.backgroundHistory?.familyRelationships?.trim()) {
          errors.familyRelationships = "Family relationships information is required";
        }
        if (!data.backgroundHistory?.dailyLifeActivities?.trim()) {
          errors.dailyLifeActivities = "Daily life activities information is required";
        }
        if (!data.backgroundHistory?.medicalHistory?.trim()) {
          errors.medicalHistory = "Medical history is required";
        }
        if (!data.backgroundHistory?.developmentalBackground?.length) {
          errors.developmentalBackground = "At least one developmental background entry is required";
        } else {
          const invalidDevBg = data.backgroundHistory.developmentalBackground.some(
            (devBg) => !devBg.devBgTitle?.trim() || !devBg.devBgInfo?.trim()
          );
          if (invalidDevBg) {
            errors.developmentalBackground = "All developmental background entries must have both title and details";
          }
        }
        if (!data.backgroundHistory?.schoolHistory?.trim()) {
          errors.schoolHistory = "School history is required";
        }
        if (!data.backgroundHistory?.clinicalDiagnosis?.trim()) {
          errors.clinicalDiagnosis = "Clinical diagnosis is required";
        }
        if (!data.backgroundHistory?.interventions?.length) {
          errors.interventions = "At least one therapy/intervention is required";
        } else {
          const invalidIntervention = data.backgroundHistory.interventions.some(
            (intervention) => !intervention.name?.trim() || !intervention.frequency?.trim()
          );
          if (invalidIntervention) {
            errors.interventions = "All interventions must have both service and frequency selected";
          }
        }
        if (!data.backgroundHistory?.strengthsAndInterests?.trim()) {
          errors.strengthsAndInterests = "Strengths and interests information is required";
        }
        if (!data.backgroundHistory?.socialSkills?.trim()) {
          errors.socialSkills = "Social skills information is required";
        }
        break;

      case 5:
        if (!data.behaviorDuringAssessment?.trim()) {
          errors.behaviorDuringAssessment = "Behavior during assessment is required";
        }
        break;

      case 6:
        if (!data.assessmentTools?.length) {
          errors.assessmentTools = "At least one assessment tool is required";
        } else {
          const invalidTools = data.assessmentTools.some(
            (tool) => !tool.tool?.trim() || !tool.details?.trim()
          );
          if (invalidTools) {
            errors.assessmentTools = "All assessment tools must have both tool name and details";
          }
        }
        break;

      case 7:
        const missingResults = data.assessmentTools?.some((tool) => !tool.result?.trim());
        if (missingResults) {
          errors.assessmentResults = "All assessment tools must have results entered";
        }
        break;

      case 8:
        if (!data.assessmentSummary?.trim()) {
          errors.assessmentSummary = "Assessment summary is required";
        }
        const missingRecommendations = data.assessmentTools?.some(
          (tool) => !tool.recommendation?.trim()
        );
        if (missingRecommendations) {
          errors.recommendations = "All assessment tools must have recommendations";
        }
        break;

      case 9:
        const validEnrollments = data.serviceEnrollments?.filter(
          (enrollment) => enrollment.serviceId && enrollment.staffId
        );
        if (!validEnrollments?.length) {
          errors.serviceEnrollments = "At least one service enrollment with both service and staff assigned is required";
        }
        break;

      default:
        break;
    }

    return errors;
  };

  // Validate any step against provided data (defaults to current state)
  const validateStep = (step = formStep, data = studentInput) => {
    const errors = getValidationErrors(step, data);
    return Object.keys(errors).length === 0;
  };

  const findFirstIncompleteStep = (data = studentInput) => {
    for (let i = 1; i <= 9; i++) {
      if (!validateStep(i, data)) return i;
    }
    // If everything is valid, open at the final step (9)
    return 9;
  };

  useEffect(() => {
    if (show) {
      // Build the initial data object (merge defaults with editingStudent when present)
      let initialData = editingStudent
        ? {
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
          }
        : INITIAL_STUDENT_STATE;

      // Handle legacy data: convert oneOnOneServices/groupClassServices to serviceEnrollments
      if (editingStudent && !editingStudent.serviceEnrollments?.length) {
        const legacyEnrollments = [];

        // Convert oneOnOneServices (Therapy)
        (editingStudent.oneOnOneServices || []).forEach((service) => {
          if (service.serviceId) {
            legacyEnrollments.push({
              enrollmentId: service.enrollmentId || `legacy_${service.serviceId}`,
              serviceId: service.serviceId,
              serviceName: service.serviceName,
              serviceType: "Therapy",
              status: "active",
              staffId: service.staffId,
              staffName: service.staffName,
              staffRole: service.staffRole || "therapist",
              enrolledAt: editingStudent.createdAt || new Date().toISOString(),
              statusChangedAt: new Date().toISOString(),
              frequency: null,
              notes: null,
            });
          }
        });

        // Convert groupClassServices (Class)
        (editingStudent.groupClassServices || []).forEach((service) => {
          if (service.serviceId) {
            legacyEnrollments.push({
              enrollmentId: service.enrollmentId || `legacy_${service.serviceId}`,
              serviceId: service.serviceId,
              serviceName: service.serviceName,
              serviceType: "Class",
              status: "active",
              staffId: service.staffId,
              staffName: service.staffName,
              staffRole: service.staffRole || "teacher",
              enrolledAt: editingStudent.createdAt || new Date().toISOString(),
              statusChangedAt: new Date().toISOString(),
              frequency: null,
              notes: null,
            });
          }
        });

        if (legacyEnrollments.length > 0) {
          initialData.serviceEnrollments = legacyEnrollments;
        }
      }

      setStudentInput(initialData);

      // Determine which step to open: first incomplete step, or 9 if all complete
      setFormStep(findFirstIncompleteStep(initialData));

      setShowCloseConfirmation(false);
      // Reset error state when opening modal
      setValidationErrors({});
      setShowErrors(false);
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

    // Clear error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleNestedChange = (category, field, value) => {
    setStudentInput((prev) => ({
      ...prev,
      [category]:
        field === null ? value : { ...prev[category], [field]: value },
    }));

    // Clear error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Keep an API-compatible helper for existing checks
  const validateCurrentStep = () => validateStep(formStep, studentInput);

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
        // New unified service model (serviceEnrollments)
        serviceEnrollments: studentInput.serviceEnrollments || [],
        status: isFinalized ? "ENROLLED" : "ASSESSING",
        assessmentId, // Link to the assessment document
        childId, // Ensure childId is consistent
      };

      // 6. Save Child
      const savedChild = await childService.createOrUpdateChild(
        selectedParent.uid || selectedParent.id,
        childDataToSave
      );

      // 6b. Ensure the parent document includes this child's id
      try {
        await userService.addChildToParent(
          selectedParent.uid || selectedParent.id,
          savedChild.id
        );
      } catch (err) {
        // Non-fatal: log but don't block the success flow
        console.warn("Failed to link child to parent:", err);
      }

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
    const errors = getValidationErrors(formStep, studentInput);

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setShowErrors(true);
      // Scroll to top to show error summary
      const scrollContainer = document.querySelector('.enroll-form-scroll');
      if (scrollContainer) {
        scrollContainer.scrollTop = 0;
      }
      return;
    }

    // Clear errors if validation passed
    setValidationErrors({});
    setShowErrors(false);

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
          {/* NEW: Error Summary Banner */}
          {showErrors && Object.keys(validationErrors).length > 0 && (
            <div className="validation-error-banner">
              <div className="error-banner-header">
                <span className="error-icon">⚠️</span>
                <strong>Please fix the following errors:</strong>
              </div>
              <ul className="error-list">
                {Object.values(validationErrors).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {formStep === 1 && (
            <Step1IdentifyingData
              data={studentInput}
              onChange={handleInputChange}
              errors={validationErrors}
            />
          )}
          {formStep === 2 && (
            <Step2ReasonForReferral
              data={studentInput}
              onChange={handleInputChange}
              errors={validationErrors}
            />
          )}
          {formStep === 3 && (
            <Step3PurposeOfAssessment
              data={studentInput}
              onChange={handleInputChange}
              errors={validationErrors}
            />
          )}
          {formStep === 4 && (
            <Step4BackgroundHistory
              data={studentInput}
              onChange={handleNestedChange}
              errors={validationErrors}
            />
          )}
          {formStep === 5 && (
            <Step5BehaviorDuringAssessment
              data={studentInput}
              onChange={handleInputChange}
              errors={validationErrors}
            />
          )}
          {formStep === 6 && (
            <Step6AssessmentTools
              data={studentInput}
              onChange={handleNestedChange}
              errors={validationErrors}
            />
          )}
          {formStep === 7 && (
            <Step7AssessmentResults
              data={studentInput}
              onChange={handleNestedChange}
              errors={validationErrors}
            />
          )}
          {formStep === 8 && (
            <Step8SummaryRecommendations
              data={studentInput}
              onChange={handleNestedChange}
              errors={validationErrors}
            />
          )}
          {formStep === 9 && (
            <Step9ServiceEnrollment
              data={studentInput}
              onChange={handleInputChange}
              errors={validationErrors}
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
                onClick={() => {
                  setFormStep(formStep - 1);
                  setShowErrors(false);
                  setValidationErrors({});
                }}
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
