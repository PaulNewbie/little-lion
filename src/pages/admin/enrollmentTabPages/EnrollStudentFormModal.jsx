import React, { useState } from "react";
import "./EnrollStudentFormModal.css";

export default function EnrollStudentFormModal({ show, onClose, onSave }) {
  const [formStep, setFormStep] = useState(1);
  const [studentInput, setStudentInput] = useState({
    // STEP 1: IDENTIFYING DATA (Blank for typing)
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

    // STEP 2-8: ASSESSMENT CONTENT (Blank for typing)
    reasonForReferral: "",
    purposeOfAssessment: [""], // Initialized with 4 empty slots
    backgroundHistory: {
      familyBackground: "",
      familyRelationships: "",
      dailyLifeActivities: "",
      medicalHistory: "",
      developmentalBackground: [{ devBgTitle: "", devBgInfo: "" }],
      schoolHistory: "",
      clinicalDiagnosis: "",
      interventions: [
        { type: "Behavioral Management", frequency: "" },
        { type: "SPED One-on-One", frequency: "" },
        { type: "Occupational Therapy", frequency: "" },
        { type: "Speech Therapy", frequency: "" },
      ],
      strengthsAndInterests: "",
      socialSkills: "",
    },
    behaviorDuringAssessment: "",
    assessmentTools: {
      cognitive: "",
      language: "",
      socioEmotional: "",
      adaptiveBehavior: "",
      motorDevelopment: "",
    },
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
  });

  if (!show) return null;

  const handleInputChange = (field, value) => {
    setStudentInput((prev) => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (category, field, value) => {
    setStudentInput((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  //Function for step 3 assessments
  const handleAddPurpose = () => {
    setStudentInput((prev) => ({
      ...prev,
      purposeOfAssessment: [...prev.purposeOfAssessment, ""],
    }));
  };

  const handleRemovePurpose = (index) => {
    const newList = [...studentInput.purposeOfAssessment];
    newList.splice(index, 1);
    setStudentInput((prev) => ({ ...prev, purposeOfAssessment: newList }));
  };

  const handlePurposeChange = (index, value) => {
    const newList = [...studentInput.purposeOfAssessment];
    newList[index] = value;
    setStudentInput((prev) => ({ ...prev, purposeOfAssessment: newList }));
  };

  return (
    <div className="modalOverlay">
      <div className="modal multi-step-modal">
        {/* HEADER */}
        <div className="modal-header-sticky">
          <div className="modal-header-flex">
            <h2>
              Step {formStep}/9:{" "}
              {formStep === 1 ? "I. IDENTIFYING DATA" : "Assessment Section"}
            </h2>
            <button className="close-x-btn" onClick={onClose}>
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
          {/* STEP 1: IDENTIFYING DATA */}
          {formStep === 1 && (
            <div className="form-section">
              <h3>I. IDENTIFYING DATA</h3>
              <div className="form-row">
                <div className="input-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    value={studentInput.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    placeholder="Enter First Name"
                  />
                </div>
                <div className="input-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={studentInput.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    placeholder="Enter Last Name"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>Nickname</label>
                  <input
                    type="text"
                    value={studentInput.nickname}
                    onChange={(e) =>
                      handleInputChange("nickname", e.target.value)
                    }
                  />
                </div>
                <div className="input-group">
                  <label>Gender</label>
                  <input
                    type="text"
                    value={studentInput.gender}
                    onChange={(e) =>
                      handleInputChange("gender", e.target.value)
                    }
                    placeholder="Male/Female"
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Address</label>
                <input
                  type="text"
                  value={studentInput.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>Date of Birth</label>
                  <input
                    type="text"
                    value={studentInput.dateOfBirth}
                    onChange={(e) =>
                      handleInputChange("dateOfBirth", e.target.value)
                    }
                    placeholder="e.g. December 8, 2019"
                  />
                </div>
                <div className="input-group">
                  <label>Age</label>
                  <input
                    type="text"
                    value={studentInput.age}
                    onChange={(e) => handleInputChange("age", e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group">
                <label>School</label>
                <input
                  type="text"
                  value={studentInput.school}
                  onChange={(e) => handleInputChange("school", e.target.value)}
                />
              </div>

              <div className="input-group">
                <label>Grade Level</label>
                <input
                  type="text"
                  value={studentInput.gradeLevel}
                  onChange={(e) =>
                    handleInputChange("gradeLevel", e.target.value)
                  }
                />
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>Date/s of Assessment</label>
                  <input
                    type="text"
                    value={studentInput.assessmentDate}
                    onChange={(e) =>
                      handleInputChange("assessmentDate", e.target.value)
                    }
                  />
                </div>
                <div className="input-group">
                  <label>Examiner</label>
                  <input
                    type="text"
                    value={studentInput.examiner}
                    onChange={(e) =>
                      handleInputChange("examiner", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: REASON FOR REFERRAL */}
          {formStep === 2 && (
            <div className="form-section">
              <h3>II. REASON FOR REFERRAL</h3>
              <div className="input-group">
                <textarea
                  rows="10"
                  value={studentInput.reasonForReferral}
                  onChange={(e) =>
                    handleInputChange("reasonForReferral", e.target.value)
                  }
                  placeholder="Type referral details here..."
                />
              </div>
            </div>
          )}

          {/* STEP 3: PURPOSE OF ASSESSMENT */}
          {formStep === 3 && (
            <div className="form-section">
              <div className="section-header-flex">
                <h3>III. PURPOSE OF ASSESSMENT</h3>
              </div>

              <div className="dynamic-list-container">
                {studentInput.purposeOfAssessment.map((purpose, index) => (
                  <div className="dynamic-input-row">
                    <span className="row-index">{index + 1}</span>
                    <input
                      type="text"
                      placeholder="Enter purpose point..."
                      value={purpose}
                      onChange={(e) =>
                        handlePurposeChange(index, e.target.value)
                      }
                    />
                    <button
                      className="remove-row-btn"
                      onClick={() => handleRemovePurpose(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <button className="add-point-btn" onClick={handleAddPurpose}>
                + Add Assessment Purpose
              </button>
            </div>
          )}

          {/* Further steps (4-9) follow the same pattern of handleNestedChange... */}
          {formStep === 4 && (
            <div className="form-section">
              <h3>IV. BACKGROUND HISTORY</h3>

              {/* Diagnosis - Full Width Highlight */}
              <div className="input-group" style={{ marginBottom: "25px" }}>
                <label>Clinical Diagnosis</label>
                <input
                  type="text"
                  placeholder="Enter diagnosis (e.g., Autism Spectrum Disorder...)"
                  value={studentInput.backgroundHistory.clinicalDiagnosis}
                  onChange={(e) =>
                    handleNestedChange(
                      "backgroundHistory",
                      "clinicalDiagnosis",
                      e.target.value
                    )
                  }
                />
              </div>

              {/* Row 1: Family & Relationships */}
              <div className="form-row">
                <div className="input-group">
                  <label>Family Background</label>
                  <textarea
                    placeholder="Lives with parents..."
                    value={studentInput.backgroundHistory.familyBackground}
                    onChange={(e) =>
                      handleNestedChange(
                        "backgroundHistory",
                        "familyBackground",
                        e.target.value
                      )
                    }
                  />
                </div>
                <div className="input-group">
                  <label>Family Relationships</label>
                  <textarea
                    placeholder="Interactions with family/siblings..."
                    value={studentInput.backgroundHistory.familyRelationships}
                    onChange={(e) =>
                      handleNestedChange(
                        "backgroundHistory",
                        "familyRelationships",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>

              {/* Row 2: Daily Life & Medical */}
              <div className="form-row">
                <div className="input-group">
                  <label>Daily Life & Activities</label>
                  <textarea
                    placeholder="Feeding, bathing, interests..."
                    value={studentInput.backgroundHistory.dailyLifeActivities}
                    onChange={(e) =>
                      handleNestedChange(
                        "backgroundHistory",
                        "dailyLifeActivities",
                        e.target.value
                      )
                    }
                  />
                </div>
                <div className="input-group">
                  <label>Medical History</label>
                  <textarea
                    placeholder="Allergies, asthma, etc..."
                    value={studentInput.backgroundHistory.medicalHistory}
                    onChange={(e) =>
                      handleNestedChange(
                        "backgroundHistory",
                        "medicalHistory",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>

              {/* Developmental Milestones (Dynamic Style) */}
              <div className="input-group">
                <label>
                  Developmental Background & Milestones (e.g. BDI-3 Results)
                </label>
                <textarea
                  placeholder="Maternal history, milestones, etc..."
                  value={
                    studentInput.backgroundHistory.developmentalBackgroundInfo
                  } // Added to state
                  onChange={(e) =>
                    handleNestedChange(
                      "backgroundHistory",
                      "developmentalBackgroundInfo",
                      e.target.value
                    )
                  }
                />
              </div>

              {/* Row 3: School & Social */}
              <div className="form-row">
                <div className="input-group">
                  <label>School History</label>
                  <textarea
                    placeholder="Current and previous schools..."
                    value={studentInput.backgroundHistory.schoolHistory}
                    onChange={(e) =>
                      handleNestedChange(
                        "backgroundHistory",
                        "schoolHistory",
                        e.target.value
                      )
                    }
                  />
                </div>
                <div className="input-group">
                  <label>Social Skills</label>
                  <textarea
                    placeholder="Peer interaction, behavior regulation..."
                    value={studentInput.backgroundHistory.socialSkills}
                    onChange={(e) =>
                      handleNestedChange(
                        "backgroundHistory",
                        "socialSkills",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>

              {/* Row 4: Strengths (Full Width) */}
              <div className="input-group">
                <label>Strengths & Interests</label>
                <input
                  type="text"
                  placeholder="Alphabet, counting, swimming, etc."
                  value={studentInput.backgroundHistory.strengthsAndInterests}
                  onChange={(e) =>
                    handleNestedChange(
                      "backgroundHistory",
                      "strengthsAndInterests",
                      e.target.value
                    )
                  }
                />
              </div>

              {/* Therapies / Interventions Section */}
              <div className="service-assign-row" style={{ marginTop: "20px" }}>
                <div style={{ gridColumn: "span 2" }}>
                  <label
                    style={{
                      fontWeight: "700",
                      color: "#1e293b",
                      marginBottom: "10px",
                      display: "block",
                    }}
                  >
                    Current Therapies / Interventions
                  </label>
                </div>
                {studentInput.backgroundHistory.interventions.map(
                  (int, index) => (
                    <div
                      className="form-row"
                      key={index}
                      style={{ gridColumn: "span 2", marginBottom: "0" }}
                    >
                      <input
                        type="text"
                        value={int.type}
                        readOnly
                        style={{ background: "#f1f5f9" }}
                      />
                      <input
                        type="text"
                        placeholder="Frequency (e.g. 5x weekly)"
                        value={int.frequency}
                        onChange={(e) => {
                          const newInts = [
                            ...studentInput.backgroundHistory.interventions,
                          ];
                          newInts[index].frequency = e.target.value;
                          handleNestedChange(
                            "backgroundHistory",
                            "interventions",
                            newInts
                          );
                        }}
                      />
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="modalActions sticky-footer">
          <div className="left-actions">
            <button
              className="save-draft-btn"
              onClick={() => onSave(studentInput, false)}
            >
              Save Draft
            </button>
            <button className="cancel-btn-alt" onClick={onClose}>
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
            <button
              className="create-btn"
              onClick={() => setFormStep(formStep + 1)}
            >
              {formStep === 9 ? "Finalize & Enroll" : "Next Step"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
