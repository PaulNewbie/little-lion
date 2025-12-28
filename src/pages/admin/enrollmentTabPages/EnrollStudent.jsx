import React, { useState, useEffect } from "react";
import AdminSidebar from "../../../components/sidebar/AdminSidebar";
import EnrollStudentFormModal from "./enrollmentForm/EnrollStudentFormModal";
import "./EnrollStudent.css";
import authService from "../../../services/authService";

// ✅ CHANGE 1: Import New Services
import childService from "../../../services/childService";
import userService from "../../../services/userService"; // Replaces manageParents
import assessmentService from "../../../services/assessmentService"; // Replaces manageAssessment

function generatePassword() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  let password = "";
  for (let i = 0; i < 3; i++) password += letters[Math.floor(Math.random() * letters.length)];
  for (let i = 0; i < 3; i++) password += digits[Math.floor(Math.random() * digits.length)];
  return password;
}

const generatedPassword = generatePassword();

export default function EnrollStudent() {
  const [allParents, setAllParents] = useState([]);
  const [selectedParent, setSelectedParent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showParentForm, setShowParentForm] = useState(false);
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [parentInput, setParentInput] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
    password: generatedPassword,
  });
  const [allStudents, setAllStudents] = useState([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState(false);

  // --- Handlers ---
  const handleParentSubmit = async (e) => {
    e.preventDefault();
    try {
      const { email, password, ...profileData } = parentInput;
      const user = await authService.createParentAccount(email, password, {
        ...profileData,
        password: password,
      });

      setAllParents((prev) => [
        ...prev,
        {
          id: user.uid,
          firstName: parentInput.firstName,
          middleName: parentInput.middleName,
          lastName: parentInput.lastName,
        },
      ]);

      setShowParentForm(false);
      setParentInput({
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
        phone: "",
        password: generatePassword(),
      });
      alert(`Parent account created!\n\nEmail: ${email}\nPassword: ${password}\n\nPlease copy this now.`);
    } catch (error) {
      console.error("Creation Error:", error);
      alert(`Failed to create parent: ${error.message}`);
    }
  };

  // ✅ CHANGE 2: Use userService to get parents
  useEffect(() => {
    const fetchParents = async () => {
      try {
        const parentsFromDB = await userService.getUsersByRole("parent");
        setAllParents(parentsFromDB);
      } catch (error) {
        console.error("Failed to load parents");
      }
    };
    fetchParents();
  }, []);

  useEffect(() => {
    if (selectedParent) {
      setAllStudents([]);
      setIsLoadingChildren(true);
      const fetchChildren = async () => {
        try {
          // Note: userService uses 'uid', so we check both just in case
          const parentId = selectedParent.uid || selectedParent.id;
          const childrenFromDB = await childService.getChildrenByParentId(parentId);
          setAllStudents(childrenFromDB);
        } catch (error) {
          console.error("Failed to load children");
        } finally {
          setIsLoadingChildren(false);
        }
      };
      fetchChildren();
    } else {
      setAllStudents([]);
      setIsLoadingChildren(false);
    }
  }, [selectedParent]);

  // ✅ CHANGE 3: Use assessmentService to get assessment
  const handleStudentClick = async (student) => {
    if (student.status === "ASSESSING") {
      try {
        const assessmentData = await assessmentService.getAssessment(student.assessmentId);
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
  };

  const handleEnrollmentSave = (savedChild) => {
    setAllStudents((prev) => {
      const existingIndex = prev.findIndex((c) => c.id === savedChild.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = savedChild;
        return updated;
      } else {
        return [...prev, savedChild];
      }
    });
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
                  key={p.uid || p.id}
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

        {/* PARENT FORM MODAL */}
        {showParentForm && (
          <div className="modalOverlay">
            <div className="modal">
              <h2 className="services-header">New Parent / Guardian Account</h2>
              <form onSubmit={handleParentSubmit}>
                {/* (Keep existing inputs) */}
                <div className="form-row">
                  <div className="input-group">
                    <label>First Name</label>
                    <input type="text" required value={parentInput.firstName} onChange={(e) => setParentInput({...parentInput, firstName: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label>Middle Name</label>
                    <input type="text" required value={parentInput.middleName} onChange={(e) => setParentInput({...parentInput, middleName: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label>Last Name</label>
                    <input type="text" required value={parentInput.lastName} onChange={(e) => setParentInput({...parentInput, lastName: e.target.value})} />
                  </div>
                </div>
                <div className="input-group">
                  <label>Email Address</label>
                  <input type="email" required value={parentInput.email} onChange={(e) => setParentInput({ ...parentInput, email: e.target.value })} />
                </div>
                <div className="input-group">
                  <label>Phone Number</label>
                  <input type="text" required value={parentInput.phone} onChange={(e) => setParentInput({ ...parentInput, phone: e.target.value })} />
                </div>
                <div className="input-group">
                  <label>Password</label>
                  <input type="text" required value={parentInput.password} onChange={(e) => setParentInput({ ...parentInput, password: e.target.value })} />
                </div>
                <div className="modalActions">
                  <button type="button" className="cancel-btn" onClick={() => setShowParentForm(false)}>Cancel</button>
                  <button type="submit" className="create-btn">Create Account</button>
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