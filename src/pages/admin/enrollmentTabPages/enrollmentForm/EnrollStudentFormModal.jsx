import React, { useState, useEffect, useRef, useCallback } from "react";
import "./EnrollStudentFormModal.css";
import Step1IdentifyingData from "./components/Step1IdentifyingData";
import Step2ReasonForReferral from "./components/Step2ReasonForReferral";
import Step3PurposeOfAssessment from "./components/Step3PurposeOfAssessment";
// Step 4 split into 5 sub-steps for better UX
import Step4AFamilyInfo from "./components/Step4AFamilyInfo";
import Step4BDailyLifeMedical from "./components/Step4BDailyLifeMedical";
import Step4CDevelopmentEducation from "./components/Step4CDevelopmentEducation";
import Step4DDiagnosisInterventions from "./components/Step4DDiagnosisInterventions";
import Step4EPersonalProfile from "./components/Step4EPersonalProfile";
import Step5BehaviorDuringAssessment from "./components/Step5BehaviorDuringAssessment";
import Step6AssessmentTools from "./components/Step6AssessmentTools";
import Step7AssessmentResults from "./components/Step7AssessmentResults";
import Step8SummaryRecommendations from "./components/Step8SummaryRecommendations";
import Step9ServiceEnrollment from "./components/Step9ServiceEnrollment";
import StepIndicator from "./components/StepIndicator";
import Toast from "./components/Toast";
import childService from "../../../../services/childService";
import assessmentService from "../../../../services/assessmentService";
import userService from "../../../../services/userService";
import { generateUUID } from "../../../../utils/constants";

// Auto-save interval in milliseconds (30 seconds)
const AUTO_SAVE_INTERVAL = 30000;

// Total number of steps in the form
const TOTAL_STEPS = 13;

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

  // NEW: Track completed steps for navigation
  const [completedSteps, setCompletedSteps] = useState([]);

  // NEW: Auto-save state
  const [lastSaved, setLastSaved] = useState(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const autoSaveTimerRef = useRef(null);
  const hasUnsavedChanges = useRef(false);

  // NEW: Toast notification state
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ show: false, message: "", type: "success" });
  };

  // NEW: Get detailed validation errors for current step
  // Updated for 13-step form (Step 4 split into 4A-4E)
  const getValidationErrors = (step = formStep, data = studentInput) => {
    const errors = {};

    switch (step) {
      // Step 1: Identifying Data
      case 1:
        if (!data.firstName?.trim()) errors.firstName = "First name is required";
        if (!data.lastName?.trim()) errors.lastName = "Last name is required";
        if (!data.gender) errors.gender = "Gender is required";
        if (!data.dateOfBirth) errors.dateOfBirth = "Date of birth is required";
        if (!data.assessmentDates) errors.assessmentDates = "Assessment date is required";
        if (!data.examiner?.trim()) errors.examiner = "Examiner name is required";
        break;

      // Step 2: Reason for Referral
      case 2:
        if (!data.reasonForReferral?.trim()) {
          errors.reasonForReferral = "Reason for referral is required";
        }
        break;

      // Step 3: Purpose of Assessment
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

      // Step 4: Family Information (was part of old Step 4)
      case 4:
        if (!data.backgroundHistory?.familyBackground?.trim()) {
          errors.familyBackground = "Family background is required";
        }
        if (!data.backgroundHistory?.familyRelationships?.trim()) {
          errors.familyRelationships = "Family relationships information is required";
        }
        break;

      // Step 5: Daily Life & Medical (was part of old Step 4)
      case 5:
        if (!data.backgroundHistory?.dailyLifeActivities?.trim()) {
          errors.dailyLifeActivities = "Daily life activities information is required";
        }
        if (!data.backgroundHistory?.medicalHistory?.trim()) {
          errors.medicalHistory = "Medical history is required";
        }
        break;

      // Step 6: Development & Education (was part of old Step 4)
      case 6:
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
        break;

      // Step 7: Diagnosis & Interventions (was part of old Step 4)
      case 7:
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
        break;

      // Step 8: Personal Profile (was part of old Step 4)
      case 8:
        if (!data.backgroundHistory?.strengthsAndInterests?.trim()) {
          errors.strengthsAndInterests = "Strengths and interests information is required";
        }
        if (!data.backgroundHistory?.socialSkills?.trim()) {
          errors.socialSkills = "Social skills information is required";
        }
        break;

      // Step 9: Behavior During Assessment (was old Step 5)
      case 9:
        if (!data.behaviorDuringAssessment?.trim()) {
          errors.behaviorDuringAssessment = "Behavior during assessment is required";
        }
        break;

      // Step 10: Assessment Tools (was old Step 6)
      case 10:
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

      // Step 11: Assessment Results (was old Step 7)
      case 11:
        const missingResults = data.assessmentTools?.some((tool) => !tool.result?.trim());
        if (missingResults) {
          errors.assessmentResults = "All assessment tools must have results entered";
        }
        break;

      // Step 12: Summary & Recommendations (was old Step 8)
      case 12:
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

      // Step 13: Service Enrollment (was old Step 9)
      case 13:
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
    for (let i = 1; i <= TOTAL_STEPS; i++) {
      if (!validateStep(i, data)) return i;
    }
    // If everything is valid, open at the final step
    return TOTAL_STEPS;
  };

  // Calculate which steps are completed based on data
  const calculateCompletedSteps = useCallback((data = studentInput) => {
    const completed = [];
    for (let i = 1; i <= TOTAL_STEPS; i++) {
      if (validateStep(i, data)) {
        completed.push(i);
      }
    }
    return completed;
  }, []);

  // Handle clicking on a step to navigate
  const handleStepClick = (step) => {
    // Only allow navigation to completed steps or current step
    if (step <= formStep || completedSteps.includes(step)) {
      setFormStep(step);
      setShowErrors(false);
      setValidationErrors({});
    }
  };

  // Auto-save function
  const performAutoSave = useCallback(async () => {
    if (!hasUnsavedChanges.current || isSaving) return;

    setIsAutoSaving(true);
    try {
      // 1. Ensure we have a childId
      const childId = studentInput.childId || studentInput.id || generateUUID();

      // 2. Prepare Assessment Data
      const assessmentDataToSave = {
        id: studentInput.assessmentId || null,
        reasonForReferral: studentInput.reasonForReferral,
        purposeOfAssessment: studentInput.purposeOfAssessment,
        backgroundHistory: studentInput.backgroundHistory,
        behaviorDuringAssessment: studentInput.behaviorDuringAssessment,
        assessmentTools: studentInput.assessmentTools,
        assessmentSummary: studentInput.assessmentSummary,
      };

      // 3. Save Assessment
      const assessmentId = await assessmentService.createOrUpdateAssessment(
        childId,
        assessmentDataToSave
      );

      // 4. Prepare Child Data
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
        serviceEnrollments: studentInput.serviceEnrollments || [],
        status: "ASSESSING",
        assessmentId,
        childId,
      };

      // 5. Save Child (only if we have a parent selected)
      if (selectedParent?.uid || selectedParent?.id) {
        await childService.createOrUpdateChild(
          selectedParent.uid || selectedParent.id,
          childDataToSave
        );
      }

      // Update state
      setStudentInput((prev) => ({
        ...prev,
        assessmentId,
        childId,
      }));

      setLastSaved(new Date());
      hasUnsavedChanges.current = false;
    } catch (error) {
      console.error("Auto-save error:", error);
      // Don't show alert for auto-save failures
    } finally {
      setIsAutoSaving(false);
    }
  }, [studentInput, selectedParent, isSaving]);

  // Set up auto-save interval
  useEffect(() => {
    if (show) {
      autoSaveTimerRef.current = setInterval(() => {
        performAutoSave();
      }, AUTO_SAVE_INTERVAL);

      return () => {
        if (autoSaveTimerRef.current) {
          clearInterval(autoSaveTimerRef.current);
        }
      };
    }
  }, [show, performAutoSave]);

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

      // Determine which step to open: first incomplete step, or 13 if all complete
      setFormStep(findFirstIncompleteStep(initialData));

      // Calculate initially completed steps
      setCompletedSteps(calculateCompletedSteps(initialData));

      setShowCloseConfirmation(false);
      // Reset error state when opening modal
      setValidationErrors({});
      setShowErrors(false);

      // Reset auto-save state
      setLastSaved(null);
      hasUnsavedChanges.current = false;
    }
  }, [show, editingStudent, calculateCompletedSteps]);

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
      // Update completed steps
      setCompletedSteps(calculateCompletedSteps(updated));
      return updated;
    });

    // Mark as having unsaved changes
    hasUnsavedChanges.current = true;

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
    setStudentInput((prev) => {
      const updated = {
        ...prev,
        [category]:
          field === null ? value : { ...prev[category], [field]: value },
      };
      // Update completed steps
      setCompletedSteps(calculateCompletedSteps(updated));
      return updated;
    });

    // Mark as having unsaved changes
    hasUnsavedChanges.current = true;

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
      showToast(
        isFinalized ? "Student enrolled successfully!" : "Progress saved!",
        "success"
      );
      // Delay close slightly so user sees the toast
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      console.error("Save error:", error);
      showToast("Failed to save: " + error.message, "error");
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

    if (formStep === TOTAL_STEPS) {
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
      4: "IV-A. FAMILY INFORMATION",
      5: "IV-B. DAILY LIFE & MEDICAL",
      6: "IV-C. DEVELOPMENT & EDUCATION",
      7: "IV-D. DIAGNOSIS & INTERVENTIONS",
      8: "IV-E. PERSONAL PROFILE",
      9: "V. BEHAVIOR DURING ASSESSMENT",
      10: "VI. ASSESSMENT TOOLS AND MEASURES",
      11: "VII. ASSESSMENT RESULTS",
      12: "VIII. SUMMARY AND RECOMMENDATIONS",
      13: "IX. SERVICE ENROLLMENT",
    };
    return titles[formStep] || "Assessment Section";
  };

  // Helper function for step dot tooltips
  const getStepTitleForDot = (step) => {
    const titles = {
      1: "Identifying Data",
      2: "Reason for Referral",
      3: "Purpose of Assessment",
      4: "Family Information",
      5: "Daily Life & Medical",
      6: "Development & Education",
      7: "Diagnosis & Interventions",
      8: "Personal Profile",
      9: "Behavior During Assessment",
      10: "Assessment Tools",
      11: "Assessment Results",
      12: "Summary & Recommendations",
      13: "Service Enrollment",
    };
    return titles[step] || "";
  };

  // Format time since last save
  const formatTimeSince = (date) => {
    if (!date) return null;
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 5) return "just now";
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    return "over an hour ago";
  };

  return (
    <div className="modalOverlay">
      <div className="multi-step-modal">
        <div className="modal-header-sticky">
          <div className="modal-header-flex">
            <div className="header-left">
              <h2>
                Step {formStep}/{TOTAL_STEPS}: {getStepTitle()}
              </h2>
              {/* Auto-save indicator */}
              <div className="auto-save-indicator">
                {isAutoSaving ? (
                  <span className="saving">
                    <span className="saving-dot"></span>
                    Saving...
                  </span>
                ) : lastSaved ? (
                  <span className="saved">
                    ✓ Draft saved {formatTimeSince(lastSaved)}
                  </span>
                ) : null}
              </div>
            </div>
            <button
              className="close-x-btn"
              onClick={handleCloseClick}
              disabled={isSaving}
              type="button"
            >
              ×
            </button>
          </div>

          {/* NEW: Grouped Step Indicator */}
          <StepIndicator
            currentStep={formStep}
            totalSteps={TOTAL_STEPS}
            onStepClick={handleStepClick}
            completedSteps={completedSteps}
          />
        </div>

        <div className="enroll-form-scroll">
          {/* NEW: Error Summary Banner */}
          {showErrors && Object.keys(validationErrors).length > 0 && (
            <div className="validation-error-banner">
              <div className="error-banner-header">
                <strong>Please fix the following errors:</strong>
              </div>
              <ul className="error-list">
                {Object.values(validationErrors).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Step 1: Identifying Data */}
          {formStep === 1 && (
            <Step1IdentifyingData
              data={studentInput}
              onChange={handleInputChange}
              errors={validationErrors}
            />
          )}

          {/* Step 2: Reason for Referral */}
          {formStep === 2 && (
            <Step2ReasonForReferral
              data={studentInput}
              onChange={handleInputChange}
              errors={validationErrors}
            />
          )}

          {/* Step 3: Purpose of Assessment */}
          {formStep === 3 && (
            <Step3PurposeOfAssessment
              data={studentInput}
              onChange={handleInputChange}
              errors={validationErrors}
            />
          )}

          {/* Steps 4-8: Background History (split into 5 sub-steps) */}
          {formStep === 4 && (
            <Step4AFamilyInfo
              data={studentInput}
              onChange={handleNestedChange}
              errors={validationErrors}
            />
          )}
          {formStep === 5 && (
            <Step4BDailyLifeMedical
              data={studentInput}
              onChange={handleNestedChange}
              errors={validationErrors}
            />
          )}
          {formStep === 6 && (
            <Step4CDevelopmentEducation
              data={studentInput}
              onChange={handleNestedChange}
              errors={validationErrors}
            />
          )}
          {formStep === 7 && (
            <Step4DDiagnosisInterventions
              data={studentInput}
              onChange={handleNestedChange}
              errors={validationErrors}
            />
          )}
          {formStep === 8 && (
            <Step4EPersonalProfile
              data={studentInput}
              onChange={handleNestedChange}
              errors={validationErrors}
            />
          )}

          {/* Step 9: Behavior During Assessment */}
          {formStep === 9 && (
            <Step5BehaviorDuringAssessment
              data={studentInput}
              onChange={handleInputChange}
              errors={validationErrors}
            />
          )}

          {/* Step 10: Assessment Tools */}
          {formStep === 10 && (
            <Step6AssessmentTools
              data={studentInput}
              onChange={handleNestedChange}
              errors={validationErrors}
            />
          )}

          {/* Step 11: Assessment Results */}
          {formStep === 11 && (
            <Step7AssessmentResults
              data={studentInput}
              onChange={handleNestedChange}
              errors={validationErrors}
            />
          )}

          {/* Step 12: Summary & Recommendations */}
          {formStep === 12 && (
            <Step8SummaryRecommendations
              data={studentInput}
              onChange={handleNestedChange}
              errors={validationErrors}
            />
          )}

          {/* Step 13: Service Enrollment */}
          {formStep === 13 && (
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
                : formStep === TOTAL_STEPS
                ? "Finalize & Enroll"
                : "Next Step"}
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />

      {showCloseConfirmation && (
        <div className="modalOverlay" style={{ zIndex: 1001 }}>
          <div
            className="multi-step-modal"
            style={{ maxWidth: "450px", maxHeight: "auto" }}
          >
            <div className="modal-header-sticky">
              <div className="modal-header-flex">
                <h2 style={{ fontSize: "1.25rem" }}>Unsaved Changes</h2>
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
                  Save Progress & Close
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
                  Discard Changes & Close
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
