// EnrollStudent.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from '../../../hooks/useAuth';
import Sidebar from '../../../components/sidebar/Sidebar';
import { getAdminConfig, getTeacherConfig, getTherapistConfig } from '../../../components/sidebar/sidebarConfigs';
import EnrollStudentFormModal from "./enrollmentForm/EnrollStudentFormModal";
import ActivationModal from "../../../components/admin/ActivationModal";
import GeneralFooter from "../../../components/footer/generalfooter";
import "./EnrollStudent.css";
import authService from "../../../services/authService";

// Firebase services
import childService from "../../../services/childService";
import userService from "../../../services/userService";
import assessmentService from "../../../services/assessmentService";

import { useParents, useChildrenByParent, useCacheInvalidation } from "../../../hooks/useCachedData";

// REMOVED: generatePassword function - no longer needed!

export default function EnrollStudent() {
  const { currentUser } = useAuth();

  // Determine sidebar config based on user role
  const getSidebarConfig = () => {
    switch (currentUser?.role) {
      case 'teacher':
        return getTeacherConfig();
      case 'therapist':
        return getTherapistConfig();
      case 'super_admin':
        return getAdminConfig(true);
      default:
        return getAdminConfig(false);
    }
  };

  const { data: allParents = [], isLoading: isLoadingParents } = useParents();
  const [selectedParent, setSelectedParent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [parentPhoto, setParentPhoto] = useState(null);
  const [parentPhotoPreview, setParentPhotoPreview] = useState(null);

  // Modal Toggle
  const [showParentForm, setShowParentForm] = useState(false);
  const [showEnrollForm, setShowEnrollForm] = useState(false);

  // NEW: State for editing existing student
  const [editingStudent, setEditingStudent] = useState(null);

  // NEW: Activation Modal State
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [newUserData, setNewUserData] = useState(null);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  // Form State for Parent - REMOVED password field!
  const [parentInput, setParentInput] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  // Students from Firebase
  const { data: allStudents = [], isLoading: isLoadingChildren } = useChildrenByParent(selectedParent?.uid);
  const { invalidateParents, invalidateChildrenByParent } = useCacheInvalidation();

  const navigate = useNavigate();
  const location = useLocation();

  // --- Handlers ---
  const handleParentSubmit = async (e) => {
    e.preventDefault();
    setIsCreatingAccount(true);

    try {
      // 1. Get form data - NO password!
      const { email, ...profileData } = parentInput;

      // 2. Create the account using updated authService
      // This now returns user data WITH activationCode
      const result = await authService.createParentAccount(email, {
        ...profileData,
        email: email,
      });

      // 3. refetch parents automatically
      invalidateParents();

      // 4. Reset Form & close parent form modal
      setShowParentForm(false);
      setParentInput({
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
        phone: "",
      });

      // 5. NEW: Show activation modal with QR code
      setNewUserData({
        uid: result.uid,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: email,
        activationCode: result.activationCode,
      });
      setShowActivationModal(true);

    } catch (error) {
      console.error("Creation Error:", error);
      alert(`Failed to create parent: ${error.message}`);
    } finally {
      setIsCreatingAccount(false);
    }
  };

  // Handle closing activation modal
  const handleCloseActivationModal = () => {
    setShowActivationModal(false);
    setNewUserData(null);
  };

  //setSelectedParent when going back to enrollment from studentProfile
  useEffect(() => {
    if (location.state?.selectedParent) {
      setSelectedParent(location.state.selectedParent);
    }
  }, [location.state]);



  // Handle student click - if ASSESSING, load and edit
  const handleStudentClick = async (student) => {
    if (student.status === "ASSESSING") {
      try {
        // Fetch the full assessment data
        const assessmentData = await assessmentService.getAssessment(
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
    } else if (student.status === "ENROLLED") {
      // Go to student profile page
      navigate("/admin/StudentProfile", {
        state: {
          studentId: student.id,
          fromEnrollment: true,
          parent: selectedParent,
        },
      });
    }
  };

  const handleEnrollmentSave = (savedChild) => {
    // Update local state with saved child from Firebase
    if (selectedParent?.uid) {
      invalidateChildrenByParent(selectedParent.uid);
    }

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
      <Sidebar {...getSidebarConfig()} />
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
              <span className="search-icon">🔍</span>
              <input
                className="sp-search"
                placeholder="Search by name..."
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
                  key={p.uid}
                  className="ooo-card"
                  onClick={() => setSelectedParent(p)}
                >
                  <div className="ooo-photo-area">👤</div>
                  <div className="ooo-card-info">
                    <p className="ooo-name">
                      {p.lastName}, {p.firstName}{" "}
                      {p.middleName ? p.middleName[0] + "." : ""}
                    </p>
                    {/* Show pending badge if account not activated */}
                    {p.accountStatus === "pending_setup" && (
                      <span style={{
                        fontSize: '11px',
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        marginTop: '4px',
                        display: 'inline-block'
                      }}>
                        ⏳ Pending Activation
                      </span>
                    )}
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
                          cursor: "pointer",
                          transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "rgba(0, 123, 255, 0.05)";
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
                          {s.status === "ASSESSING" && "✏️"}
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

        {/* NEW PARENT ACCOUNT MODAL - UPDATED: No password field! */}
        {showParentForm && (
          <div className="modalOverlay">
            <div className="modal">
              <h2 className="services-header create-parent-header">
                New Parent / Guardian Account
              </h2>
              <form className="parent-form" onSubmit={handleParentSubmit}>
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

                {/* Photo upload section - keeping existing functionality */}
                {parentPhotoPreview && (
                  <div className="input-group">
                    <label>Photo Preview</label>
                    <img 
                      src={parentPhotoPreview} 
                      alt="Preview" 
                      style={{ maxWidth: '100px', borderRadius: '8px' }}
                    />
                  </div>
                )}

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
                    type="tel"
                    value={parentInput.phone}
                    onChange={(e) =>
                      setParentInput({ ...parentInput, phone: e.target.value })
                    }
                    placeholder="09XX-XXX-XXXX"
                  />
                </div>

                {/* INFO BOX: Explain the new activation flow */}
                <div style={{
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '6px',
                  padding: '12px',
                  marginTop: '8px',
                  fontSize: '13px',
                  color: '#0369a1'
                }}>
                  <strong>ℹ️ How activation works:</strong>
                  <p style={{ margin: '4px 0 0 0' }}>
                    After creating the account, a QR code will appear. 
                    The parent can scan it to set up their password.
                  </p>
                </div>

                {/* REMOVED: Password field - no longer needed! */}
              </form>
              <div className="modalActions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowParentForm(false)}
                  disabled={isCreatingAccount}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="create-btn"
                  onClick={handleParentSubmit}
                  disabled={isCreatingAccount}
                >
                  {isCreatingAccount ? "Creating..." : "Create Account"}
                </button>
              </div>
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

        {/* NEW: ACTIVATION MODAL - Shows QR code after account creation */}
        <ActivationModal
          isOpen={showActivationModal}
          onClose={handleCloseActivationModal}
          userData={newUserData}
          onEmailSent={() => console.log("Activation email sent")}
        />
        {/* FOOTER */}
        <GeneralFooter pageLabel="Enrollment" />
      </div>
    </div>
  );
}