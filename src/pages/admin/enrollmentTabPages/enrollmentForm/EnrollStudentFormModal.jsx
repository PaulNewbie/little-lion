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

export default function EnrollStudentFormModal({
  show,
  onClose,
  onSave,
  selectedParent,
}) {
  const [formStep, setFormStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [studentInput, setStudentInput] = useState({
    // STEP 1: IDENTIFYING DATA
    firstName: "",
    lastName: "",
    nickname: "",
    address: "",
    dateOfBirth: "",
    age: "",
    gender: "",
    school: "",
    gradeLevel: "",
    assessmentDate: "",
    examiner: "",
    relationshipToClient: "biological child",

    // STEP 2-8: ASSESSMENT CONTENT
    reasonForReferral: "",
    purposeOfAssessment: [""],
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
    assessmentTools: [{ tool: "", details: "" }],
    assessmentResults: {
      cognitive: "",
      communication: "",
      socioEmotional: "",
      adaptiveBehavior: "",
      motorDevelopment: "",
    },
    assessmentSummary: "",
    recommendations: {
      cognitive: "",
      language: "",
      socioEmotional: "",
      adaptive: "",
      motor: "",
    },
    service: "",
    assignedTeacherId: "",
    assignedServices: [],
  });

  if (!show) return null;

  const handleInputChange = (field, value) => {
    setStudentInput((prev) => ({ ...prev, [field]: value }));
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
      // Save to Firebase
      const savedChild = await manageChildren.createChild(selectedParent.id, {
        ...studentInput,
        status: isFinalized ? "ENROLLED" : "ASSESSING",
      });

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
      // Not final step - save as ASSESSING and move to next step
      setIsSaving(true);
      try {
        await manageChildren.createChild(selectedParent.id, {
          ...studentInput,
          status: "ASSESSING",
        });
        setFormStep(formStep + 1);
      } catch (error) {
        console.error("Auto-save error:", error);
      } finally {
        setIsSaving(false);
      }
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
              onClick={async () => {
                // Auto-save as ASSESSING when closing
                // setIsSaving(true);
                try {
                  await manageChildren.createChild(selectedParent.id, {
                    ...studentInput,
                    status: "ASSESSING",
                  });
                  onClose();
                } catch (error) {
                  console.error("Auto-save on close error:", error);
                  onClose();
                } finally {
                  setIsSaving(false);
                }
              }}
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
              onClick={async () => {
                // Auto-save as ASSESSING when canceling
                // setIsSaving(true);
                try {
                  await manageChildren.createChild(selectedParent.id, {
                    ...studentInput,
                    status: "ASSESSING",
                  });
                  onClose();
                } catch (error) {
                  console.error("Auto-save on cancel error:", error);
                  onClose();
                } finally {
                  setIsSaving(false);
                }
              }}
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
