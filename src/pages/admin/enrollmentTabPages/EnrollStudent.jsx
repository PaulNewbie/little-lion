import React, { useState } from "react";
import AdminSidebar from "../../../components/sidebar/AdminSidebar";
import "../css/EnrollStudent.css";

// Initial Mock Data
const initialParents = [
  { id: 1, firstName: "Juan", lastName: "Dela Cruz" },
  { id: 2, firstName: "Maria", lastName: "Santos" },
];

const initialStudents = [
  {
    id: 101,
    parentId: 1,
    firstName: "Mark",
    lastName: "Dela Cruz",
    status: "ENROLLED",
  },
];

export default function EnrollStudent() {
  const [allParents, setAllParents] = useState(initialParents);
  const [allStudents, setAllStudents] = useState(initialStudents);
  const [selectedParent, setSelectedParent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Modals Toggle
  const [showParentForm, setShowParentForm] = useState(false);
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [formStep, setFormStep] = useState(1);

  // Form States
  const [parentInput, setParentInput] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [studentInput, setStudentInput] = useState({
    firstName: "",
    nickname: "",
    dob: "",
    gender: "Male",
    referral: "",
    background: "",
    behavior: "",
    summary: "",
    service: "",
  });

  // --- Handlers ---
  const handleParentSubmit = (e) => {
    e.preventDefault();
    const newParent = {
      id: Date.now(),
      firstName: parentInput.firstName,
      lastName: parentInput.lastName,
    };
    setAllParents([...allParents, newParent]);
    setShowParentForm(false);
    setParentInput({ firstName: "", lastName: "", email: "", password: "" });
  };

  const getStatusByStep = (step) => {
    if (step < 4) return "ASSESSING";
    if (step === 4) return "ASSESSMENT DONE";
    return "ENROLLED";
  };

  const saveEnrollment = (isFinal = false) => {
    if (!studentInput.firstName) return alert("Please enter Student Name");

    const newStudent = {
      id: Date.now(),
      parentId: selectedParent.id,
      firstName: studentInput.firstName,
      lastName: selectedParent.lastName,
      status: isFinal ? "ENROLLED" : getStatusByStep(formStep),
    };

    setAllStudents([...allStudents, newStudent]);
    setShowEnrollForm(false);
    setFormStep(1);
    setStudentInput({
      firstName: "",
      nickname: "",
      dob: "",
      referral: "",
      background: "",
      behavior: "",
      summary: "",
      service: "",
    });
  };

  const filteredParents = allParents.filter((p) =>
    `${p.firstName} ${p.lastName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="ooo-container">
      <AdminSidebar />
      <div className="ooo-main">
        {/* HEADER */}
        <div className="ooo-header">
          <div className="header-title">
            <h1>STUDENT ENROLLMENT</h1>
            <p className="header-subtitle">
              Manage accounts and enrollment progress
            </p>
          </div>
          <div className="search-wrapper">
            <input
              type="text"
              className="ooo-search"
              placeholder="SEARCH PARENT NAME..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="ooo-content-area">
          {!selectedParent ? (
            <div className="ooo-grid">
              {filteredParents.map((p) => (
                <div
                  key={p.id}
                  className="ooo-card"
                  onClick={() => setSelectedParent(p)}
                >
                  <div className="ooo-photo-area">👤</div>
                  <div className="ooo-card-info">
                    <p className="ooo-name">
                      {p.lastName}, {p.firstName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="profile-wrapper">
              <div className="profile-top">
                <span
                  className="back-arrow"
                  onClick={() => setSelectedParent(null)}
                >
                  ←
                </span>
                <h2>{selectedParent.lastName} Family</h2>
              </div>
              <div className="profile-info">
                <h3 className="services-header">Family Children</h3>
                <div className="services-list">
                  {allStudents
                    .filter((s) => s.parentId === selectedParent.id)
                    .map((s) => (
                      <div key={s.id} className="service-row">
                        <div className="service-left">
                          👶 {s.lastName}, {s.firstName}
                        </div>
                        <div
                          className={`status-badge ${s.status
                            .toLowerCase()
                            .replace(" ", "-")}`}
                        >
                          {s.status}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FAB */}
        {!selectedParent ? (
          <button
            className="add-fab secondary-fab"
            onClick={() => setShowParentForm(true)}
          >
            + Parent / Guardian Account
          </button>
        ) : (
          <button className="add-fab" onClick={() => setShowEnrollForm(true)}>
            + Enroll Student
          </button>
        )}

        {/* PARENT MODAL */}
        {showParentForm && (
          <div className="modalOverlay">
            <div className="modal">
              <h2 className="services-header">New Parent / Guardian Account</h2>
              <form onSubmit={handleParentSubmit}>
                <div className="form-row">
                  <div className="input-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      required
                      value={parentInput.firstName}
                      onChange={(e) =>
                        setParentInput({
                          ...parentInput,
                          firstName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="input-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      required
                      value={parentInput.lastName}
                      onChange={(e) =>
                        setParentInput({
                          ...parentInput,
                          lastName: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    required
                    value={parentInput.email}
                    onChange={(e) =>
                      setParentInput({ ...parentInput, email: e.target.value })
                    }
                  />
                </div>
                <div className="input-group">
                  <label>Password</label>
                  <input
                    type="password"
                    required
                    value={parentInput.password}
                    onChange={(e) =>
                      setParentInput({
                        ...parentInput,
                        password: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="modalActions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setShowParentForm(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="create-btn">
                    Create Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ENROLLMENT WIZARD */}
        {showEnrollForm && (
          <div className="modalOverlay">
            <div className="modal multi-step-modal">
              <div className="modal-header-sticky">
                <div className="modal-header-flex">
                  <h2>
                    Step {formStep}/9:{" "}
                    {formStep === 9
                      ? "Finalize Services"
                      : "Assessment Section"}
                  </h2>
                  <button
                    className="close-x-btn"
                    onClick={() => setShowEnrollForm(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="step-indicator">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                    <div
                      key={i}
                      className={`step-dot ${formStep >= i ? "active" : ""}`}
                    ></div>
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
                          value={
                            studentInput.lastName || selectedParent.lastName
                          }
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
                        <option value="biological child">
                          Biological Child
                        </option>
                        <option value="legal ward">
                          Legal Ward / Guardian
                        </option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* STEP 2: REASON FOR REFERRAL */}
                {formStep === 2 && (
                  <div className="form-section">
                    <h3>2. Reason for Referral</h3>
                    <div className="input-group">
                      <textarea
                        rows="6"
                        value={studentInput.reasonForReferral}
                        placeholder="Enter concerns from parents/teachers..."
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

                {/* STEP 3: PURPOSE OF ASSESSMENT */}
                {formStep === 3 && (
                  <div className="form-section">
                    <h3>3. Purpose of Assessment</h3>
                    <div className="input-group">
                      <label>Goals & Objectives (List format)</label>
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

                {/* STEP 4: BACKGROUND HISTORY */}
                {formStep === 4 && (
                  <div className="form-section">
                    <h3>4. Background History</h3>
                    <div className="input-group">
                      <label>Family Background & Milestones</label>
                      <textarea
                        rows="4"
                        placeholder="Family environment, medical history..."
                        value={studentInput.backgroundHistory?.familyBackground}
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
                        value={
                          studentInput.backgroundHistory?.clinicalDiagnosis
                        }
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

                {/* STEP 5: BEHAVIOR DURING ASSESSMENT */}
                {formStep === 5 && (
                  <div className="form-section">
                    <h3>5. Behavior During Assessment</h3>
                    <div className="input-group">
                      <textarea
                        rows="6"
                        placeholder="Observations on attention, motor activity, and motivation..."
                        value={studentInput.behaviorDuringAssessment}
                        onChange={(e) =>
                          setStudentInput({
                            ...studentInput,
                            behaviorDuringAssessment: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {/* STEP 6: ASSESSMENT TOOLS */}
                {formStep === 6 && (
                  <div className="form-section">
                    <h3>6. Assessment Tools & Measures</h3>
                    <div className="input-group">
                      <label>Cognitive / Language / Motor Tools</label>
                      <textarea
                        rows="6"
                        placeholder="e.g. BDI-3, ECCD Checklist, Language Probes..."
                        value={studentInput.assessmentTools}
                        onChange={(e) =>
                          setStudentInput({
                            ...studentInput,
                            assessmentTools: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {/* STEP 7: ASSESSMENT RESULTS */}
                {formStep === 7 && (
                  <div className="form-section">
                    <h3>7. Assessment Results</h3>
                    <div className="input-group">
                      <textarea
                        rows="8"
                        placeholder="Summarize performance in communication, social, and motor domains..."
                        value={studentInput.assessmentResults}
                        onChange={(e) =>
                          setStudentInput({
                            ...studentInput,
                            assessmentResults: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {/* STEP 8: SUMMARY & RECOMMENDATIONS */}
                {formStep === 8 && (
                  <div className="form-section">
                    <h3>8. Summary & Recommendations</h3>
                    <div className="input-group">
                      <label>Executive Summary</label>
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
                      <label>Specific Recommendations (ST, OT, SPED)</label>
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

                {/* STEP 9: SERVICES & TEACHER ASSIGNMENT */}
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
                          <option value="Behavioral Management">
                            Behavioral Management
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
                          {/* Map your teacher list here */}
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
                    type="button"
                    className="save-draft-btn"
                    onClick={() => saveEnrollment(false)}
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
                    style={{
                      background: "#fee2e2",
                      color: "#dc2626",
                      marginLeft: "10px",
                    }}
                    onClick={() => setShowEnrollForm(false)}
                  >
                    Cancel
                  </button>
                </div>
                <div className="right-actions">
                  {formStep > 1 && (
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={() => setFormStep(formStep - 1)}
                    >
                      Back
                    </button>
                  )}
                  {formStep < 9 ? (
                    <button
                      type="button"
                      className="create-btn"
                      onClick={() => setFormStep(formStep + 1)}
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="create-btn"
                      onClick={() => saveEnrollment(true)}
                    >
                      Finalize & Enroll
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
