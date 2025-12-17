import React, { useState } from "react";
import AdminSidebar from "../../components/sidebar/AdminSidebar";
import "./css/EnrollStudent.css";

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
            + Parent Account
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
              <h2 className="services-header">New Parent Account</h2>
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
                    Step {formStep}: {getStatusByStep(formStep)}
                  </h2>
                </div>
                <div className="step-indicator">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`step-dot ${formStep >= i ? "active" : ""}`}
                    ></div>
                  ))}
                </div>
              </div>

              <div className="enroll-form-scroll">
                {formStep === 1 && (
                  <div className="form-section">
                    <h3>Basic Information</h3>
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
                          value={selectedParent.lastName}
                          readOnly
                        />
                      </div>
                    </div>
                    <div className="input-group">
                      <label>Reason for Referral</label>
                      <textarea
                        rows="3"
                        value={studentInput.referral}
                        onChange={(e) =>
                          setStudentInput({
                            ...studentInput,
                            referral: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                )}
                {formStep === 2 && (
                  <div className="form-section">
                    <h3>Background History</h3>
                    <textarea
                      rows="6"
                      placeholder="Family background and history..."
                      value={studentInput.background}
                      onChange={(e) =>
                        setStudentInput({
                          ...studentInput,
                          background: e.target.value,
                        })
                      }
                    />
                  </div>
                )}
                {formStep === 3 && (
                  <div className="form-section">
                    <h3>Behavior During Assessment</h3>
                    <textarea
                      rows="6"
                      placeholder="Observation notes..."
                      value={studentInput.behavior}
                      onChange={(e) =>
                        setStudentInput({
                          ...studentInput,
                          behavior: e.target.value,
                        })
                      }
                    />
                  </div>
                )}
                {formStep === 4 && (
                  <div className="form-section">
                    <h3>Summary & Recommendations</h3>
                    <textarea
                      rows="6"
                      placeholder="Summary of results..."
                      value={studentInput.summary}
                      onChange={(e) =>
                        setStudentInput({
                          ...studentInput,
                          summary: e.target.value,
                        })
                      }
                    />
                  </div>
                )}
                {formStep === 5 && (
                  <div className="form-section">
                    <h3>Services Enrollment</h3>
                    <select
                      className="ooo-search"
                      style={{ paddingLeft: "10px" }}
                      value={studentInput.service}
                      onChange={(e) =>
                        setStudentInput({
                          ...studentInput,
                          service: e.target.value,
                        })
                      }
                    >
                      <option value="">Select Service...</option>
                      <option value="speech">Speech Therapy</option>
                      <option value="ot">Occupational Therapy</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="modalActions sticky-footer">
                <button
                  type="button"
                  className="save-draft-btn"
                  onClick={() => saveEnrollment(false)}
                >
                  Save & Close
                </button>
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
                  {formStep < 5 ? (
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
                      Finalize Enrollment
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
