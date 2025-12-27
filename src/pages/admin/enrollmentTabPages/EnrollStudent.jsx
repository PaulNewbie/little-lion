// EnrollStudent.jsx
import React, { useState, useEffect } from "react";
import AdminSidebar from "../../../components/sidebar/AdminSidebar";
import EnrollStudentFormModal from "./enrollmentForm/EnrollStudentFormModal";
import "../css/EnrollStudent.css";
import authService from "../../../services/authService";

// Firebase services
import manageParents from "./enrollmentDatabase/manageParents";
// import manageChildren from "../enrollmentDatabase/manageChildren"; // Old Import
import childService from "../../../services/childService"; // New Import 
import manageAssessment from "./enrollmentDatabase/manageAssessment";

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

  // NEW: State for editing existing student
  const [editingStudent, setEditingStudent] = useState(null);

  // Form State for Parent
  const [parentInput, setParentInput] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
    password: generatedPassword,
  });

  // Students from Firebase
  const [allStudents, setAllStudents] = useState([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState(false);

  // --- Handlers ---
  const handleParentSubmit = async (e) => {
    e.preventDefault();

    try {
      // 1. Separate email and password
      const { email, password, ...profileData } = parentInput;

      // 2. Create the account
      // ⚠️ PASS 'password' INSIDE THE 3RD ARGUMENT TO STORE IT IN FIRESTORE
      const user = await authService.createParentAccount(email, password, {
        ...profileData,
        password: password, // <--- ADD THIS to save it in the database
      });

      // 3. Update the UI list
      setAllParents((prev) => [
        ...prev,
        {
          id: user.uid,
          firstName: parentInput.firstName,
          middleName: parentInput.middleName,
          lastName: parentInput.lastName,
        },
      ]);

      // 4. Reset Form
      setShowParentForm(false);
      setParentInput({
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
        phone: "",
        password: generatePassword(), // Generate a NEW password for the next user
      });

      // 5. Alert the admin with the password just to be sure
      alert(
        `Parent account created!\n\nEmail: ${email}\nPassword: ${password}\n\nPlease copy this now.`
      );
    } catch (error) {
      console.error("Creation Error:", error);
      alert(`Failed to create parent: ${error.message}`);
    }
  };

  // Get parents from db
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

  // Get students when parent is selected - WITH IMMEDIATE CLEAR
  useEffect(() => {
    if (selectedParent) {
      // ✅ CLEAR IMMEDIATELY when parent changes
      setAllStudents([]);
      setIsLoadingChildren(true);

      const fetchChildren = async () => {
        try {
          const childrenFromDB = await childService.getChildrenByParentId(
            selectedParent.id
          );
          setAllStudents(childrenFromDB);
        } catch (error) {
          console.error("Failed to load children");
        } finally {
          setIsLoadingChildren(false);
        }
      };

      fetchChildren();
    } else {
      // Clear when going back to parent list
      setAllStudents([]);
      setIsLoadingChildren(false);
    }
  }, [selectedParent]);

  // NEW: Handle student click - if ASSESSING, load and edit
  const handleStudentClick = async (student) => {
    if (student.status === "ASSESSING") {
      try {
        // Fetch the full assessment data
        const assessmentData = await manageAssessment.getAssessment(
          student.assessmentId
        );

        // Combine child data with assessment data
        const fullStudentData = {
          ...student,
          ...assessmentData,
        };

        setEditingStudent(fullStudentData);
        setShowEnrollForm(true);
      } catch (error) {
        console.error("Failed to load assessment data:", error);
        alert("Failed to load student assessment data. Please try again.");
      }
    }
    // If status is ENROLLED, do nothing or show a view-only modal
  };

  const handleEnrollmentSave = (savedChild) => {
    // Update local state with saved child from Firebase
    setAllStudents((prev) => {
      const existingIndex = prev.findIndex((c) => c.id === savedChild.id);
      if (existingIndex >= 0) {
        // Update existing student
        const updated = [...prev];
        updated[existingIndex] = savedChild;
        return updated;
      } else {
        // Add new student
        return [...prev, savedChild];
      }
    });

    // Clear editing state
    setEditingStudent(null);
  };

  const handleCloseEnrollForm = () => {
    setShowEnrollForm(false);
    setEditingStudent(null);
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
                      {p.lastName}, {p.firstName}{" "}
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
                  {isLoadingChildren ? (
                    <p style={{ textAlign: "center", padding: "20px" }}>
                      Loading children...
                    </p>
                  ) : allStudents.length === 0 ? (
                    <p style={{ textAlign: "center", padding: "20px" }}>
                      No children enrolled yet
                    </p>
                  ) : (
                    allStudents.map((s) => (
                      <div
                        key={s.id}
                        className="service-row"
                        onClick={() => handleStudentClick(s)}
                        style={{
                          cursor:
                            s.status === "ASSESSING" ? "pointer" : "default",
                          transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          if (s.status === "ASSESSING") {
                            e.currentTarget.style.backgroundColor =
                              "rgba(0, 123, 255, 0.05)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <div className="service-left">
                          👶 {s.lastName}, {s.firstName}{" "}
                          {s.nickname ? `"${s.nickname}"` : ""}
                        </div>
                        <div
                          className={`status-badge ${
                            s.status?.toLowerCase() || "enrolled"
                          }`}
                        >
                          {s.status || "ENROLLED"}
                          {s.status === "ASSESSING" && " ✏️"}
                        </div>
                      </div>
                    ))
                  )}
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
            onClose={handleCloseEnrollForm}
            selectedParent={selectedParent}
            onSave={handleEnrollmentSave}
            editingStudent={editingStudent}
          />
        )}
      </div>
    </div>
  );
}
