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
      interventions: [],
      strengthsAndInterests: "",
      socialSkills: "",
    },
    behaviorDuringAssessment: "",
    assessmentTools: [
      {
        tool: "",
        details: "",
      },
    ],

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
      [category]:
        field === null
          ? value
          : {
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

  // Functions for Step 4: Developmental Background
  const handleAddDevBg = () => {
    setStudentInput((prev) => ({
      ...prev,
      backgroundHistory: {
        ...prev.backgroundHistory,
        developmentalBackground: [
          ...prev.backgroundHistory.developmentalBackground,
          { devBgTitle: "", devBgInfo: "" },
        ],
      },
    }));
  };

  const handleRemoveDevBg = (index) => {
    const newList = [...studentInput.backgroundHistory.developmentalBackground];
    newList.splice(index, 1);
    handleNestedChange("backgroundHistory", "developmentalBackground", newList);
  };

  const handleDevBgChange = (index, field, value) => {
    const newList = [...studentInput.backgroundHistory.developmentalBackground];
    newList[index] = { ...newList[index], [field]: value };
    handleNestedChange("backgroundHistory", "developmentalBackground", newList);
  };

  //Step 4 Therapies/ Intervention
  // 1. Add a new intervention entry
  const handleAddIntervention = () => {
    const newInts = [
      ...studentInput.backgroundHistory.interventions,
      { type: "", frequency: "" },
    ];
    handleNestedChange("backgroundHistory", "interventions", newInts);
  };

  // 2. Remove an intervention entry
  const handleRemoveIntervention = (index) => {
    const newInts = studentInput.backgroundHistory.interventions.filter(
      (_, i) => i !== index
    );
    handleNestedChange("backgroundHistory", "interventions", newInts);
  };

  // Predefined list of services
  const SERVICE_OPTIONS = [
    "Behavioral Management",
    "SPED One-on-One",
    "Occupational Therapy",
    "Speech Therapy",
    "Physical Therapy",
    "Counseling",
  ];

  // STEP 6: Assessment Tools & Measures
  const handleAddAssessmentTool = () => {
    const newTools = [
      ...studentInput.assessmentTools,
      { tool: "", details: "" },
    ];
    handleNestedChange("assessmentTools", null, newTools);
  };

  const handleRemoveAssessmentTool = (index) => {
    const newTools = studentInput.assessmentTools.filter((_, i) => i !== index);
    handleNestedChange("assessmentTools", null, newTools);
  };

  const handleAssessmentToolChange = (index, field, value) => {
    const newTools = [...studentInput.assessmentTools];
    newTools[index] = { ...newTools[index], [field]: value };
    handleNestedChange("assessmentTools", null, newTools);
  };

  // const handleNestedChange = (category, field, value) => {
  //   setStudentInput((prev) => ({
  //     ...prev,
  //     [category]:
  //       field === null
  //         ? value
  //         : {
  //             ...prev[category],
  //             [field]: value,
  //           },
  //   }));
  // };

  return (
    <div className="modalOverlay">
      <div className="multi-step-modal">
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
          {/* STEP 4: BACKGROUND HISTORY */}
          {formStep === 4 && (
            <div className="form-section">
              <h3 className="section-title">IV. BACKGROUND HISTORY</h3>

              {/* 1. Family Background */}
              <div className="input-group">
                <label>Family Background</label>
                <textarea
                  rows="4"
                  value={studentInput.backgroundHistory.familyBackground}
                  onChange={(e) =>
                    handleNestedChange(
                      "backgroundHistory",
                      "familyBackground",
                      e.target.value
                    )
                  }
                  placeholder="Parents, residence, and occupations..."
                />
              </div>

              {/* 2. Family Relationships */}
              <div className="input-group">
                <label>Family Relationships</label>
                <textarea
                  rows="3"
                  value={studentInput.backgroundHistory.familyRelationships}
                  onChange={(e) =>
                    handleNestedChange(
                      "backgroundHistory",
                      "familyRelationships",
                      e.target.value
                    )
                  }
                  placeholder="Interactions, communication style, and siblings..."
                />
              </div>

              {/* 3. Daily Life & Activities */}
              <div className="input-group">
                <label>Daily Life & Activities</label>
                <textarea
                  rows="3"
                  value={studentInput.backgroundHistory.dailyLifeActivities}
                  onChange={(e) =>
                    handleNestedChange(
                      "backgroundHistory",
                      "dailyLifeActivities",
                      e.target.value
                    )
                  }
                  placeholder="Independence levels and preferred activities..."
                />
              </div>

              {/* 4. Medical History */}
              <div className="input-group">
                <label>Medical History</label>
                <textarea
                  rows="2"
                  value={studentInput.backgroundHistory.medicalHistory}
                  onChange={(e) =>
                    handleNestedChange(
                      "backgroundHistory",
                      "medicalHistory",
                      e.target.value
                    )
                  }
                  placeholder="Dermatitis, allergies, asthma, etc..."
                />
              </div>

              {/* 5. Developmental Background (Dynamic Mapping) */}
              <div className="form-section-group input-group">
                <label>Developmental Background</label>

                {studentInput.backgroundHistory.developmentalBackground.map(
                  (item, index) => (
                    <div className="dev-bg-entry" key={index}>
                      <div className="dev-bg-header">
                        <span className="dev-bg-number">
                          Developmental Entry #{index + 1}
                        </span>
                        {studentInput.backgroundHistory.developmentalBackground
                          .length > 1 && (
                          <button
                            className="remove-entry-btn"
                            onClick={() => handleRemoveDevBg(index)}
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="dev-bg-grid">
                        <div className="input-group">
                          <label>Title</label>
                          <input
                            type="text"
                            placeholder="e.g. Maternal History"
                            value={item.devBgTitle}
                            onChange={(e) =>
                              handleDevBgChange(
                                index,
                                "devBgTitle",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div
                          className="input-group"
                          style={{ marginBottom: 0 }}
                        >
                          <label>Details</label>
                          <textarea
                            rows="3"
                            placeholder="Enter specific details..."
                            value={item.devBgInfo}
                            onChange={(e) =>
                              handleDevBgChange(
                                index,
                                "devBgInfo",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )
                )}

                <button className="add-point-btn" onClick={handleAddDevBg}>
                  + Add Milestone/History Entry
                </button>
              </div>

              {/* 6. School History */}
              <div className="input-group">
                <label>School History</label>
                <textarea
                  rows="2"
                  value={studentInput.backgroundHistory.schoolHistory}
                  onChange={(e) =>
                    handleNestedChange(
                      "backgroundHistory",
                      "schoolHistory",
                      e.target.value
                    )
                  }
                  placeholder="Current and previous school placements..."
                />
              </div>

              {/* 7. Clinical Diagnosis */}
              <div className="input-group highlight-box">
                <label>Clinical Diagnosis</label>
                <textarea
                  rows="3"
                  value={studentInput.backgroundHistory.clinicalDiagnosis}
                  onChange={(e) =>
                    handleNestedChange(
                      "backgroundHistory",
                      "clinicalDiagnosis",
                      e.target.value
                    )
                  }
                  placeholder="Diagnosis and support requirements..."
                />
              </div>

              {/* 8. Interventions */}
              <div className="form-section-group input-group">
                <label>Therapies / Interventions</label>

                {/* Header Row for Desktop/Tablets */}
                {studentInput.backgroundHistory.interventions.length > 0 && (
                  <div
                    className="intervention-grid-header"
                    style={{
                      display: "flex",
                      gap: "15px",
                      marginBottom: "8px",
                      paddingRight: "45px",
                    }}
                  >
                    <label
                      style={{ flex: 2, fontSize: "0.85rem", color: "#64748b" }}
                    >
                      Type of Service
                    </label>
                    <label
                      style={{ flex: 1, fontSize: "0.85rem", color: "#64748b" }}
                    >
                      Frequency
                    </label>
                  </div>
                )}

                {studentInput.backgroundHistory.interventions.map(
                  (int, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "15px",
                        marginBottom: "10px",
                      }}
                    >
                      {/* Type Dropdown */}
                      <div style={{ flex: 2 }}>
                        <select
                          style={{ width: "100%" }}
                          value={int.type}
                          onChange={(e) => {
                            const newInts = [
                              ...studentInput.backgroundHistory.interventions,
                            ];
                            newInts[index].type = e.target.value;
                            handleNestedChange(
                              "backgroundHistory",
                              "interventions",
                              newInts
                            );
                          }}
                        >
                          <option value="" disabled>
                            Select Service
                          </option>
                          {SERVICE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Frequency Input */}
                      <div style={{ flex: 1 }}>
                        <input
                          type="text"
                          style={{ width: "100%" }}
                          placeholder="e.g. 2x weekly"
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

                      {/* Delete Button */}
                      <button
                        type="button"
                        className="remove-entry-btn"
                        style={{ padding: "8px", minWidth: "35px" }}
                        onClick={() => handleRemoveIntervention(index)}
                      >
                        ✕
                      </button>
                    </div>
                  )
                )}

                <button
                  className="add-point-btn"
                  type="button"
                  style={{ marginTop: "10px" }}
                  onClick={handleAddIntervention}
                >
                  + Add Service
                </button>
              </div>

              {/* 9. Strengths & Interests */}
              <div className="input-group">
                <label>Strengths & Interests</label>
                <textarea
                  rows="3"
                  value={studentInput.backgroundHistory.strengthsAndInterests}
                  onChange={(e) =>
                    handleNestedChange(
                      "backgroundHistory",
                      "strengthsAndInterests",
                      e.target.value
                    )
                  }
                  placeholder="Academic skills and hobbies..."
                />
              </div>

              {/* 10. Social Skills */}
              <div className="input-group">
                <label>Social Skills</label>
                <textarea
                  rows="2"
                  value={studentInput.backgroundHistory.socialSkills}
                  onChange={(e) =>
                    handleNestedChange(
                      "backgroundHistory",
                      "socialSkills",
                      e.target.value
                    )
                  }
                  placeholder="Peer interaction and behavior regulation..."
                />
              </div>
            </div>
          )}

          {/* STEP 5: BEHAVIOR DURING ASSESSMENT */}
          {formStep === 5 && (
            <div className="form-section">
              <h3>V. BEHAVIOR DURING ASSESSMENT</h3>
              <div className="input-group">
                <textarea
                  rows="8"
                  value={studentInput.behaviorDuringAssessment}
                  onChange={(e) =>
                    handleInputChange(
                      "behaviorDuringAssessment",
                      e.target.value
                    )
                  }
                  placeholder="Describe the student's behavior during assessment..."
                />
              </div>
            </div>
          )}

          {/* STEP 6: ASSESSMENT TOOLS AND MEASURES */}
          {formStep === 6 && (
            <div className="form-section">
              <h3>VI. ASSESSMENT TOOLS AND MEASURES</h3>

              {studentInput.assessmentTools.length > 0 && (
                <div className="assessment-tools-header">
                  <label>Tool / Measure</label>
                  <label>Details</label>
                </div>
              )}

              {studentInput.assessmentTools.map((item, index) => (
                <div className="assessment-tool-row" key={index}>
                  <div className="assessment-tool-field">
                    <input
                      type="text"
                      placeholder="e.g. Cognitive / Pre-academic Skills"
                      value={item.tool}
                      onChange={(e) =>
                        handleAssessmentToolChange(
                          index,
                          "tool",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div className="assessment-tool-field">
                    <textarea
                      rows="2"
                      placeholder="Observation, structured tasks, ECCD Checklist..."
                      value={item.details}
                      onChange={(e) =>
                        handleAssessmentToolChange(
                          index,
                          "details",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <button
                    type="button"
                    className="remove-entry-btn"
                    onClick={() => handleRemoveAssessmentTool(index)}
                  >
                    ✕
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="add-point-btn"
                onClick={handleAddAssessmentTool}
              >
                + Add Tool / Measure
              </button>
            </div>
          )}

          {/* STEP 7: ASSESSMENT RESULTS */}
          {formStep === 7 && (
            <div className="form-section">
              <h3>VII. ASSESSMENT RESULTS</h3>

              {studentInput.assessmentTools.length > 0 && (
                <div className="assessment-tools-header">
                  <label>Tool / Measure</label>
                  <label>Result</label>
                </div>
              )}

              {studentInput.assessmentTools.map((item, index) => (
                <div className="assessment-tool-row" key={index}>
                  {/* DISPLAY TOOL (READ-ONLY TEXT) */}
                  <div className="assessment-tool-field">
                    <div className="readonly-field">
                      {item.tool || "No tool specified"}
                    </div>
                  </div>

                  {/* RESULT INPUT */}
                  <div className="assessment-tool-field">
                    <textarea
                      rows="4"
                      placeholder="Enter assessment result..."
                      value={item.result || ""}
                      onChange={(e) => {
                        const newTools = [...studentInput.assessmentTools];
                        newTools[index].result = e.target.value;
                        handleNestedChange("assessmentTools", null, newTools);
                      }}
                    />
                  </div>
                </div>
              ))}
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
