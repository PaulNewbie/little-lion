import React, { useState } from "react";
import AdminSidebar from "../../../components/sidebar/AdminSidebar";
import EnrollStudentFormModal from "./enrollmentForm/EnrollStudentFormModal";
import "../css/EnrollStudent.css";

// Firebase parent service
import manageParents from "./enrollmentDatabase/manageParents";

// Mock initial parents for UI
const initialParents = [
  { id: 1, firstName: "Juan", lastName: "Dela Cruz" },
  { id: 2, firstName: "Maria", lastName: "Santos" },
];

export default function EnrollStudent() {
  const [allParents, setAllParents] = useState(initialParents);
  const [selectedParent, setSelectedParent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal Toggle
  const [showParentForm, setShowParentForm] = useState(false);
  const [showEnrollForm, setShowEnrollForm] = useState(false);

  // Form State for Parent
  const [parentInput, setParentInput] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "ABC-123",
  });

  // Mock Students
  const [allStudents, setAllStudents] = useState([]);

  // --- Handlers ---
  const handleParentSubmit = async (e) => {
    e.preventDefault();

    try {
      const savedParent = await manageParents.createParent(parentInput);

      // UI update only
      setAllParents((prev) => [
        ...prev,
        {
          id: savedParent.uid,
          firstName: savedParent.firstName,
          lastName: savedParent.lastName,
        },
      ]);

      setShowParentForm(false);
      setParentInput({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "ABC-123",
      });

      alert("Parent account created successfully!");
    } catch (error) {
      alert("Failed to create parent. Check console.");
    }
  };

  const handleEnrollmentSave = (studentData) => {
    // Add new student linked to selected parent
    const newStudent = {
      ...studentData,
      id: Date.now(),
      parentId: selectedParent.id,
    };
    setAllStudents([...allStudents, newStudent]);
    setShowEnrollForm(false);
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

        {/* PARENT GRID VIEW */}
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
                          className={`status-badge ${
                            s.status?.toLowerCase() || "enrolled"
                          }`}
                        >
                          {s.status || "ENROLLED"}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FLOATING ACTION BUTTON */}
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

        {/* NEW PARENT ACCOUNT MODAL */}
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
                  <label>Phone Number</label>
                  <input
                    type="text"
                    required
                    value={parentInput.phone}
                    onChange={(e) =>
                      setParentInput({ ...parentInput, phone: e.target.value })
                    }
                  />
                </div>
                <div className="input-group">
                  <label>Password</label>
                  <input
                    type="text"
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

        {/* ENROLL STUDENT MODAL */}
        {selectedParent && (
          <EnrollStudentFormModal
            show={showEnrollForm}
            onClose={() => setShowEnrollForm(false)}
            selectedParent={selectedParent}
            onSave={handleEnrollmentSave}
          />
        )}
      </div>
    </div>
  );
}
