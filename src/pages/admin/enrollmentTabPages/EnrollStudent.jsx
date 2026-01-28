// EnrollStudent.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from '../../../hooks/useAuth';
import Sidebar from '../../../components/sidebar/Sidebar';
import { getAdminConfig, getTeacherConfig, getTherapistConfig } from '../../../components/sidebar/sidebarConfigs';
import EnrollStudentFormModal from "./enrollmentForm/EnrollStudentFormModal";
import ActivationModal from "../../../components/admin/ActivationModal";
import GeneralFooter from "../../../components/footer/generalfooter";
import Toast from "./enrollmentForm/components/Toast";
import "./EnrollStudent.css";
import "../css/ManageTeacher.css";
import "../css/OneOnOne.css";
import "../../../components/common/Header.css";
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

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const showToast = (message, type = "success") => setToast({ show: true, message, type });
  const hideToast = () => setToast({ show: false, message: "", type: "success" });

  // Form State for Parent - REMOVED password and phone fields!
  const [parentInput, setParentInput] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
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
      showToast(`Failed to create parent: ${error.message}`, "error");
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
        showToast("Failed to load student assessment data. Please try again.", "error");
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
    <div className="ooo-container enrollment-page">
      <Sidebar {...getSidebarConfig()} />
      <div className="ooo-main">
        <div className="ooo-page">
          <div className="ooo-content">
            {/* HEADER */}
            <div className="ll-header">
              <div className="ll-header-content">
                <div className="header-title">
                  <h1>STUDENT ENROLLMENT</h1>
                </div>
                {!selectedParent && (
                  <div className="search-wrapper">
                    <span className="search-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="M21 21l-4.35-4.35"/>
                      </svg>
                    </span>
                    <input
                      className="ll-search"
                      placeholder="Search guardian name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* PARENT GRID VIEW */}
            <div className="ooo-content-area">
          {!selectedParent ? (
            <div className="mt-grid">
              {filteredParents.map((p) => (
                <div
                  key={p.uid}
                  className={`mt-card ${p.accountStatus !== "pending_setup" ? 'is-clickable' : 'is-clickable'}`}
                  onClick={() => setSelectedParent(p)}
                >
                  {/* Colored Banner with Status Badge */}
                  <div className="mt-card-banner">
                    <div className={`mt-badge ${p.accountStatus !== "pending_setup" ? 'complete' : 'incomplete'}`}>
                      {p.accountStatus !== "pending_setup" ? 'Active' : 'Pending Setup'}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="mt-card-content">
                    {/* Avatar with Status Dot */}
                    <div className="mt-avatar-container">
                      {p.profilePhoto ? (
                        <img src={p.profilePhoto} alt="" className="mt-avatar-img" />
                      ) : (
                        <span>{p.firstName?.[0]}{p.lastName?.[0]}</span>
                      )}
                      <div
                        className={`mt-status-dot ${p.accountStatus !== "pending_setup" ? 'active' : 'pending'}`}
                        title={p.accountStatus !== "pending_setup" ? "Account Active" : "Pending Activation"}
                      />
                    </div>

                    {/* Parent Name */}
                    <h3 className="mt-teacher-name">
                      {p.firstName} {p.lastName}
                    </h3>

                    {/* Role Tag */}
                    <div className="mt-tags-wrapper">
                      <span className="mt-tag">Guardian</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="profile-wrapper">
              <div className="profile-top">
                <span className="back-arrow" onClick={() => setSelectedParent(null)}>
                  <svg width="20" height="20" viewBox="0 0 32 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M11.6255 22.8691C9.89159 24.4549 9.89159 27.1866 11.6255 28.7724L30.3211 45.8712C31.7604 47.1876 31.7604 49.455 30.3211 50.7714C29.0525 51.9316 27.1081 51.9316 25.8395 50.7714L1.01868 28.0705C0.366419 27.4738 0 26.6645 0 25.8208C0 24.977 0.366419 24.1678 1.01868 23.571L25.8395 0.87018C27.1081 -0.290054 29.0525 -0.290057 30.3211 0.870177C31.7604 2.1865 31.7604 4.45398 30.3211 5.7703L11.6255 22.8691Z"
                      fill="#636363"
                    />
                  </svg>
                </span>
                <h2>{selectedParent.lastName.toUpperCase()} FAMILY</h2>
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
            + Guardian Account
          </button>
        ) : (
          <button className="add-fab" onClick={() => setShowEnrollForm(true)}>
            + Enroll Student
          </button>
        )}

        {/* NEW PARENT ACCOUNT MODAL - UPDATED: No password or phone field! */}
        {showParentForm && (
          <div className="modalOverlay">
            <div className="modal" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
              <h2 className="services-header create-parent-header">
                Guardian Account
              </h2>
              <form className="parent-form" onSubmit={handleParentSubmit}>

                {/* GUARDIAN DETAILS SECTION */}
                <div style={{
                  padding: '20px',
                  backgroundColor: '#fef7ed',
                  borderRadius: '12px',
                  border: '2px solid #f97316',
                  marginBottom: '20px'
                }}>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    color: '#c2410c',
                    letterSpacing: '0.5px',
                    marginBottom: '16px'
                  }}>
                    Guardian Details <span style={{ color: '#ef4444' }}>*</span>
                  </h3>

                  <p style={{
                    fontSize: '13px',
                    color: '#64748b',
                    marginBottom: '16px'
                  }}>
                    Enter the guardian's name and email address for account creation.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>First Name</label>
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
                        disabled={isCreatingAccount}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          border: parentInput.firstName ? '2px solid #22c55e' : '1px solid #ddd',
                          borderRadius: '8px',
                          fontSize: '14px',
                          backgroundColor: parentInput.firstName ? '#f0fdf4' : 'white',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>Last Name</label>
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
                        disabled={isCreatingAccount}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          border: parentInput.lastName ? '2px solid #22c55e' : '1px solid #ddd',
                          borderRadius: '8px',
                          fontSize: '14px',
                          backgroundColor: parentInput.lastName ? '#f0fdf4' : 'white',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>Middle Name (Optional)</label>
                    <input
                      type="text"
                      value={parentInput.middleName}
                      onChange={(e) =>
                        setParentInput({
                          ...parentInput,
                          middleName: e.target.value,
                        })
                      }
                      disabled={isCreatingAccount}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>Email Address</label>
                    <input
                      type="email"
                      required
                      value={parentInput.email}
                      onChange={(e) =>
                        setParentInput({ ...parentInput, email: e.target.value })
                      }
                      disabled={isCreatingAccount}
                      placeholder="guardian@email.com"
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        border: parentInput.email ? '2px solid #22c55e' : '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        backgroundColor: parentInput.email ? '#f0fdf4' : 'white',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Photo upload section - keeping existing functionality */}
                  {parentPhotoPreview && (
                    <div style={{ marginTop: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>Photo Preview</label>
                      <img
                        src={parentPhotoPreview}
                        alt="Preview"
                        style={{ maxWidth: '100px', borderRadius: '8px' }}
                      />
                    </div>
                  )}

                  {(parentInput.firstName && parentInput.lastName && parentInput.email) && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      backgroundColor: '#dcfce7',
                      borderRadius: '8px',
                      marginTop: '12px'
                    }}>
                      <span style={{ fontSize: '13px', color: '#166534', fontWeight: '600' }}>
                        Guardian details complete
                      </span>
                    </div>
                  )}
                </div>

                {/* INFO BOX: Explain the new activation flow */}
                <div style={{
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '8px',
                  padding: '14px',
                  fontSize: '13px',
                  color: '#0369a1'
                }}>
                  <strong>How activation works:</strong>
                  <p style={{ margin: '6px 0 0 0' }}>
                    After creating the account, a QR code will appear.
                    The parent can scan it to set up their password.
                  </p>
                </div>
              </form>
              <div className="modalActions" style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  className="enroll-cancel-btn"
                  onClick={() => setShowParentForm(false)}
                  disabled={isCreatingAccount}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="enroll-create-btn"
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

        {/* Toast Notification */}
        <Toast
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
          </div>
          {/* FOOTER */}
          <GeneralFooter pageLabel="Enrollment" />
        </div>
      </div>
    </div>
  );
}