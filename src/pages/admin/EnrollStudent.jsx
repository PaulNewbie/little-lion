import React, { useState } from "react";
import AdminSidebar from "../../components/sidebar/AdminSidebar";
import "./css/EnrollStudent.css";

// Static Data
const parents = [
  { id: 1, firstName: "Juan", lastName: "Dela Cruz" },
  { id: 2, firstName: "Maria", lastName: "Santos" },
  { id: 3, firstName: "Pedro", lastName: "Reyes" },
  { id: 4, firstName: "Ana", lastName: "Lopez" },
  { id: 5, firstName: "Luis", lastName: "Garcia" },
  { id: 6, firstName: "Clara", lastName: "Torres" },
];

const students = [
  { id: 1, parentId: 1, firstName: "Mark", lastName: "Dela Cruz" },
  { id: 2, parentId: 2, firstName: "Liza", lastName: "Santos" },
  { id: 3, parentId: 1, firstName: "Tony", lastName: "Dela Cruz" },
  { id: 4, parentId: 3, firstName: "Ella", lastName: "Reyes" },
];

export default function EnrollStudent() {
  const [selectedParent, setSelectedParent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showParentForm, setShowParentForm] = useState(false);
  const [parentForm, setParentForm] = useState({ email: "", password: "" });

  const handleBack = () => setSelectedParent(null);

  const filteredParents = parents.filter((p) =>
    `${p.firstName} ${p.lastName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const handleCreateParent = (e) => {
    e.preventDefault();
    console.log("New Parent Account:", parentForm);
    setParentForm({ email: "", password: "" });
    setShowParentForm(false);
  };

  return (
    <div className="ooo-container">
      <AdminSidebar />

      <div className="ooo-main">
        {/* HEADER - COPIED FROM STUDENT PROFILE */}
        <div className="ooo-header">
          <div className="header-title">
            <h1>STUDENT ENROLLMENT</h1>
            <p className="header-subtitle">
              Manage parent accounts and student registration
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
            <span className="search-icon">🔍</span>
          </div>
        </div>

        <div className="ooo-content-area">
          {!selectedParent ? (
            <>
              <h2 className="services-header">Parent Accounts</h2>
              <div className="ooo-grid">
                {filteredParents.map((parent) => (
                  <div
                    key={parent.id}
                    className="ooo-card"
                    onClick={() => setSelectedParent(parent)}
                  >
                    <div className="ooo-photo-area">
                      {parent.photoUrl ? (
                        <img
                          src={parent.photoUrl}
                          alt=""
                          className="ooo-photo"
                        />
                      ) : (
                        <span style={{ fontSize: "40px" }}>👤</span>
                      )}
                    </div>
                    <div className="ooo-card-info">
                      <p className="ooo-name">
                        {parent.lastName}, {parent.firstName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="profile-wrapper">
              <div className="profile-top">
                <div className="left-group">
                  <span className="back-arrow" onClick={handleBack}>
                    ←
                  </span>
                  <h2>{selectedParent.firstName}'s Family</h2>
                </div>
              </div>

              <div className="profile-info">
                <h2 className="services-header">Registered Children</h2>
                <div className="services-list">
                  {students
                    .filter((s) => s.parentId === selectedParent.id)
                    .map((student) => (
                      <div key={student.id} className="service-row">
                        <div className="service-left">
                          <span className="service-icon">👶</span>
                          {student.lastName}, {student.firstName}
                        </div>
                        <div className="teacher-name">Enrolled</div>
                      </div>
                    ))}
                  {students.filter((s) => s.parentId === selectedParent.id)
                    .length === 0 && (
                    <p className="no-activity-msg">
                      No students found for this parent.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Floating Action Button */}
        <button
          className="add-fab"
          onClick={() => setShowParentForm(true)}
          title="Add Parent"
        >
          +
        </button>

        {/* Modal simplified to match the clean design */}
        {showParentForm && (
          <div className="modalOverlay">
            <div className="modal">
              <h2 className="services-header">Create Parent Account</h2>
              <form onSubmit={handleCreateParent}>
                <div style={{ marginBottom: "15px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontWeight: "600",
                    }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    className="ooo-search"
                    style={{ paddingLeft: "15px" }}
                    value={parentForm.email}
                    onChange={(e) =>
                      setParentForm({ ...parentForm, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontWeight: "600",
                    }}
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    className="ooo-search"
                    style={{ paddingLeft: "15px" }}
                    value={parentForm.password}
                    onChange={(e) =>
                      setParentForm({ ...parentForm, password: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="modalActions">
                  <button
                    type="button"
                    onClick={() => setShowParentForm(false)}
                    className="cancel-btn"
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
      </div>
    </div>
  );
}
