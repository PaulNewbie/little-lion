import React, { useState } from "react";
import "./EnrollStudentFormModal.jsx";

export default function EnrollStudentFormModal({
  show,
  onClose,
  selectedParent,
  onSave,
}) {
  const [formStep, setFormStep] = useState(1);
  const [studentInput, setStudentInput] = useState({
    firstName: "",
    lastName: selectedParent?.lastName || "",
    relationshipToClient: "biological child",
    reasonForReferral: "",
    purposeOfAssessment: "",
    backgroundHistory: {
      familyBackground: "",
      clinicalDiagnosis: "",
    },
    behaviorDuringAssessment: "",
    assessmentTools: "",
    assessmentResults: "",
    assessmentSummary: "",
    recommendations: "",
    service: "",
    assignedTeacherId: "",
  });

  if (!show) return null;

  const getStatusByStep = (step) => {
    if (step < 4) return "ASSESSING";
    if (step === 4) return "ASSESSMENT DONE";
    return "ENROLLED";
  };

  const handleInternalSave = (isFinal = false) => {
    if (!studentInput.firstName) return alert("Please enter Student Name");

    const finalData = {
      ...studentInput,
      status: isFinal ? "ENROLLED" : getStatusByStep(formStep),
    };

    onSave(finalData, isFinal);
    resetAndClose();
  };

  const resetAndClose = () => {
    setFormStep(1);
    onClose();
  };

  return (
    <div className="modalOverlay">
      <div className="modal multi-step-modal">
        <div className="modal-header-sticky">
          <div className="modal-header-flex">
            <h2>
              Step {formStep}/9:{" "}
              {formStep === 9 ? "Finalize Services" : "Assessment Section"}
            </h2>
            <button className="close-x-btn" onClick={resetAndClose}>
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
          {/* STEP 1: BASIC INFO */}
          {formStep === 1 && (
            <div className="form-section">
              <h3>1. Basic Information</h3>
              <div className="form-row">
                <div className="input-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    value={studentInput.firstName}
                    onChange={(e) =>
                      setStudentInput({
                        ...studentInput,
                        firstName: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="input-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={studentInput.lastName}
                    onChange={(e) =>
                      setStudentInput({
                        ...studentInput,
                        lastName: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="input-group">
                <label>Relationship to Parent/Guardian</label>
                <select
                  value={studentInput.relationshipToClient}
                  onChange={(e) =>
                    setStudentInput({
                      ...studentInput,
                      relationshipToClient: e.target.value,
                    })
                  }
                >
                  <option value="biological child">Biological Child</option>
                  <option value="legal ward">Legal Ward / Guardian</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 2: REFERRAL */}
          {formStep === 2 && (
            <div className="form-section">
              <h3>2. Reason for Referral</h3>
              <div className="input-group">
                <textarea
                  rows="6"
                  placeholder="Enter concerns from parents/teachers..."
                  value={studentInput.reasonForReferral}
                  onChange={(e) =>
                    setStudentInput({
                      ...studentInput,
                      reasonForReferral: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          )}

          {/* STEP 3: PURPOSE */}
          {formStep === 3 && (
            <div className="form-section">
              <h3>3. Purpose of Assessment</h3>
              <div className="input-group">
                <textarea
                  rows="6"
                  placeholder="e.g. Identify developmental delays..."
                  value={studentInput.purposeOfAssessment}
                  onChange={(e) =>
                    setStudentInput({
                      ...studentInput,
                      purposeOfAssessment: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          )}

          {/* STEP 4: BACKGROUND */}
          {formStep === 4 && (
            <div className="form-section">
              <h3>4. Background History</h3>
              <div className="input-group">
                <label>Family Background & Milestones</label>
                <textarea
                  rows="4"
                  value={studentInput.backgroundHistory.familyBackground}
                  onChange={(e) =>
                    setStudentInput({
                      ...studentInput,
                      backgroundHistory: {
                        ...studentInput.backgroundHistory,
                        familyBackground: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="input-group">
                <label>Clinical Diagnosis (if any)</label>
                <input
                  type="text"
                  value={studentInput.backgroundHistory.clinicalDiagnosis}
                  onChange={(e) =>
                    setStudentInput({
                      ...studentInput,
                      backgroundHistory: {
                        ...studentInput.backgroundHistory,
                        clinicalDiagnosis: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
          )}

          {/* STEP 5-8 follow same pattern... (truncated for brevity but included in full logic) */}
          {formStep === 5 && (
            <div className="form-section">
              <h3>5. Behavior During Assessment</h3>
              <textarea
                rows="6"
                value={studentInput.behaviorDuringAssessment}
                onChange={(e) =>
                  setStudentInput({
                    ...studentInput,
                    behaviorDuringAssessment: e.target.value,
                  })
                }
              />
            </div>
          )}

          {formStep === 6 && (
            <div className="form-section">
              <h3>6. Assessment Tools</h3>
              <textarea
                rows="6"
                value={studentInput.assessmentTools}
                onChange={(e) =>
                  setStudentInput({
                    ...studentInput,
                    assessmentTools: e.target.value,
                  })
                }
              />
            </div>
          )}

          {formStep === 7 && (
            <div className="form-section">
              <h3>7. Assessment Results</h3>
              <textarea
                rows="8"
                value={studentInput.assessmentResults}
                onChange={(e) =>
                  setStudentInput({
                    ...studentInput,
                    assessmentResults: e.target.value,
                  })
                }
              />
            </div>
          )}

          {formStep === 8 && (
            <div className="form-section">
              <h3>8. Summary & Recommendations</h3>
              <div className="input-group">
                <label>Summary</label>
                <textarea
                  rows="4"
                  value={studentInput.assessmentSummary}
                  onChange={(e) =>
                    setStudentInput({
                      ...studentInput,
                      assessmentSummary: e.target.value,
                    })
                  }
                />
              </div>
              <div className="input-group">
                <label>Recommendations</label>
                <textarea
                  rows="4"
                  value={studentInput.recommendations}
                  onChange={(e) =>
                    setStudentInput({
                      ...studentInput,
                      recommendations: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          )}

          {/* STEP 9: SERVICES */}
          {formStep === 9 && (
            <div className="form-section">
              <h3>9. Assign Services & Teachers</h3>
              <div className="service-assign-row">
                <div className="input-group">
                  <label>Service Type</label>
                  <select
                    value={studentInput.service}
                    onChange={(e) =>
                      setStudentInput({
                        ...studentInput,
                        service: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Service...</option>
                    <option value="Speech Therapy">Speech Therapy</option>
                    <option value="Occupational Therapy">
                      Occupational Therapy
                    </option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Assigned Teacher</label>
                  <select
                    value={studentInput.assignedTeacherId}
                    onChange={(e) =>
                      setStudentInput({
                        ...studentInput,
                        assignedTeacherId: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Teacher...</option>
                    <option value="teacher_1">Teacher Joy</option>
                    <option value="teacher_2">Teacher Grace</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modalActions sticky-footer">
          <div className="left-actions">
            <button
              className="save-draft-btn"
              onClick={() => handleInternalSave(false)}
            >
              Save Draft
            </button>
            <button className="cancel-btn-alt" onClick={resetAndClose}>
              Cancel
            </button>
          </div>
          <div className="right-actions">
            {formStep > 1 && (
              <button
                className="cancel-btn"
                onClick={() => setFormStep(formStep - 1)}
              >
                Back
              </button>
            )}
            {formStep < 9 ? (
              <button
                className="create-btn"
                onClick={() => setFormStep(formStep + 1)}
              >
                Next
              </button>
            ) : (
              <button
                className="create-btn"
                onClick={() => handleInternalSave(true)}
              >
                Finalize & Enroll
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
