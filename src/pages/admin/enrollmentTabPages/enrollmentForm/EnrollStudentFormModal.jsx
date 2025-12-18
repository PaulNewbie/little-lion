import React, { useState } from "react";
import Step1Form from "./components/Step1Form";
import Step2Form from "./components/Step2Form";
import Step3Form from "./components/Step3Form";
import "./EnrollStudentFormModal.css";

export default function EnrollStudentFormModal({
  show,
  onClose,
  onSave,
  selectedParent,
}) {
  const [formStep, setFormStep] = useState(1);
  const [studentInput, setStudentInput] = useState({
    firstName: "",
    lastName: "",
    nickname: "",
    address: "",
    reasonForReferral: "",
    purposeOfAssessment: "",
  });

  if (!show) return null;

  const handleNext = () => setFormStep((prev) => prev + 1);
  const handlePrev = () => setFormStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(studentInput);
    setStudentInput({
      firstName: "",
      lastName: "",
      nickname: "",
      address: "",
      reasonForReferral: "",
      purposeOfAssessment: "",
    });
    setFormStep(1);
  };

  return (
    <div className="modalOverlay">
      <div className="modal">
        <h2>Enroll Student for {selectedParent?.lastName} Family</h2>
        <form onSubmit={handleSubmit}>
          {/* STEP 1: IDENTIFYING DATA */}
          {formStep === 1 && (
            <Step1Form
              studentInput={studentInput}
              setStudentInput={setStudentInput}
            />
          )}

          {/* STEP 2: REASON FOR REFERRAL */}
          {formStep === 2 && (
            <Step2Form
              studentInput={studentInput}
              setStudentInput={setStudentInput}
            />
          )}

          {/* STEP 3: PURPOSE OF ASSESSMENT */}
          {formStep === 3 && (
            <Step3Form
              studentInput={studentInput}
              setStudentInput={setStudentInput}
            />
          )}

          <div className="modalActions">
            {formStep > 1 && (
              <button type="button" className="prev-btn" onClick={handlePrev}>
                Previous
              </button>
            )}
            {formStep < 3 ? (
              <button type="button" className="next-btn" onClick={handleNext}>
                Next
              </button>
            ) : (
              <button type="submit" className="save-btn">
                Enroll Student
              </button>
            )}
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
