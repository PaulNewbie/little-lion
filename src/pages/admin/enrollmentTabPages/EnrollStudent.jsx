import React, { useState, useEffect } from "react";
import AdminSidebar from "../../../components/sidebar/AdminSidebar";
import EnrollStudentFormModal from "./enrollmentForm/EnrollStudentFormModal";
import "../css/EnrollStudent.css";

// Firebase parent service
import manageParents from "./enrollmentDatabase/manageParents";

function generatePassword() {
  // 🔐 Password generator: 3 letters + 3 digits (ALL CAPS)
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";

  let password = "";

  for (let i = 0; i < 3; i++) {
    password += letters[Math.floor(Math.random() * letters.length)];
  }

  for (let i = 0; i < 3; i++) {
    password += digits[Math.floor(Math.random() * digits.length)];
  }

  return password;
}

const generatedPassword = generatePassword();

export default function EnrollStudent() {
  const [allParents, setAllParents] = useState([]);
  const [selectedParent, setSelectedParent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal Toggle
  const [showParentForm, setShowParentForm] = useState(false);
  const [showEnrollForm, setShowEnrollForm] = useState(false);

  // Form State for Parent
  const [parentInput, setParentInput] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
    password: generatedPassword,
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
          id: savedParent.id,
          firstName: savedParent.firstName,
          middleName: savedParent.middleName,
          lastName: savedParent.lastName,
        },
      ]);

      setShowParentForm(false);
      setParentInput({
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
        phone: "",
        password: generatedPassword,
      });

      alert("Parent account created successfully!");
    } catch (error) {
      alert("Failed to create parent. Check console.");
    }
  };

  //get data from db
  useEffect(() => {
    const fetchParents = async () => {
      try {
        const parentsFromDB = await manageParents.getParents();
        setAllParents(parentsFromDB);
      } catch (error) {
        console.error("Failed to load parents");
      }
    };

    fetchParents();
  }, []);

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
    `${p.firstName} ${p.middleName} ${p.lastName}`
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
                      {p.lastName}, {p.firstName},{" "}
                      {p.middleName ? p.middleName[0] + "." : ""}
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
                          👶 {s.lastName}, {s.firstName} {s.middleName}
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
                    <label>Middle Name</label>
                    <input
                      type="text"
                      required
                      value={parentInput.middleName}
                      onChange={(e) =>
                        setParentInput({
                          ...parentInput,
                          middleName: e.target.value,
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
