// EnrollStudent.jsx
import React, { useState, useEffect, useMemo } from "react";
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

// Pagination constants
const PAGE_SIZE = 10;

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

  // Fetch all parents (cached for 30 min - subsequent visits = 0 reads)
  const { data: allParents = [], isLoading: isLoadingParents } = useParents();

  // Client-side pagination state
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  const [selectedParent, setSelectedParent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [parentPhoto, setParentPhoto] = useState(null);
  const [parentPhotoPreview, setParentPhotoPreview] = useState(null);

  // Modal Toggle
  const [showParentForm, setShowParentForm] = useState(false);
  const [showEnrollForm, setShowEnrollForm] = useState(false);

  // NEW: State for editing existing student
  const [editingStudent, setEditingStudent] = useState(null);


  // NEW: State for children summary modal
  const [showChildrenModal, setShowChildrenModal] = useState(false);

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



  // Handle student click - if ASSESSING, load and edit; if ENROLLED, show profile inline
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
      // Show student profile inline instead of navigating
      setViewingChildProfile(student);
    }
  };

  // Handle guardian card click - show children modal
  const handleGuardianClick = (parent) => {
    setSelectedParent(parent);
    setShowChildrenModal(true);
  };

  // Handle closing children modal
  const handleCloseChildrenModal = () => {
    setShowChildrenModal(false);
    setSelectedParent(null);
  };

  // Handle viewing a child from the modal - route based on status
  const handleViewChildFromModal = async (child) => {
    if (child.status === "ASSESSING") {
      // For ASSESSING students, open the enrollment form to continue assessment
      try {
        // Fetch the full assessment data
        const assessmentData = await assessmentService.getAssessment(
          child.assessmentId
        );

        // Combine child data with assessment data
        const fullStudentData = {
          ...child,
          ...assessmentData,
        };

        setShowChildrenModal(false);
        setEditingStudent(fullStudentData);
        setShowEnrollForm(true);
      } catch (error) {
        console.error("Failed to load assessment data:", error);
        showToast("Failed to load student assessment data. Please try again.", "error");
      }
    } else {
      // For ENROLLED students, navigate to Student Profile page
      const parentData = selectedParent;
      setShowChildrenModal(false);
      setSelectedParent(null);
      navigate('/admin/StudentProfile', {
        state: {
          student: child,
          studentId: child.id,
          fromEnrollment: true,
          parentData: parentData
        }
      });
    }
  };

  // Calculate profile completion for a child
  const calculateProfileCompletion = (child) => {
    const steps = [
      { check: () => child.firstName && child.lastName && child.gender && child.dateOfBirth },
      { check: () => child.reasonForReferral },
      { check: () => child.purposeOfAssessment?.length > 0 },
      { check: () => child.backgroundHistory?.familyBackground },
      { check: () => child.backgroundHistory?.dailyLifeActivities || child.backgroundHistory?.medicalHistory },
      { check: () => child.backgroundHistory?.schoolHistory },
      { check: () => child.backgroundHistory?.clinicalDiagnosis },
      { check: () => child.backgroundHistory?.strengthsAndInterests },
      { check: () => child.behaviorDuringAssessment },
      { check: () => child.assessmentTools?.some(t => t.tool) },
      { check: () => child.assessmentTools?.some(t => t.result) },
      { check: () => child.assessmentSummary },
      { check: () => child.serviceEnrollments?.length > 0 },
    ];

    const completedSteps = steps.filter(step => step.check()).length;
    return {
      completed: completedSteps,
      total: steps.length,
      percentage: Math.round((completedSteps / steps.length) * 100)
    };
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

  // Filter parents by search term
  const filteredParents = useMemo(() => {
    if (!searchTerm.trim()) {
      return allParents;
    }
    return allParents.filter((p) =>
      `${p.firstName} ${p.middleName} ${p.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [allParents, searchTerm]);

  // Client-side pagination - show only displayCount items
  const displayedParents = useMemo(() => {
    return filteredParents.slice(0, displayCount);
  }, [filteredParents, displayCount]);

  // Check if there are more to load
  const hasMore = displayCount < filteredParents.length;

  // Load more handler
  const handleLoadMore = () => {
    setDisplayCount(prev => prev + PAGE_SIZE);
  };

  // Reset display count when search changes
  useEffect(() => {
    setDisplayCount(PAGE_SIZE);
  }, [searchTerm]);

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
                  <p className="header-subtitle">
                    Select a guardian to view their children
                  </p>
                </div>
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
              </div>
            </div>

            {/* CONTENT AREA */}
            <div className="ooo-content-area">
          {/* PARENT GRID VIEW - Show when no parent selected */}
          {!selectedParent || showChildrenModal ? (
            <>
              {/* Loading State */}
              {isLoadingParents && (
                <div className="pagination-loading">
                  <div className="csm-spinner"></div>
                  <p>Loading guardians...</p>
                </div>
              )}

              {/* Empty State */}
              {!isLoadingParents && displayedParents.length === 0 && (
                <div className="pagination-empty">
                  <p>{searchTerm ? 'No guardians found matching your search.' : 'No guardians found.'}</p>
                </div>
              )}

              <div className="mt-grid">
                {displayedParents.map((p) => (
                  <div
                    key={p.uid}
                    className={`mt-card ${p.accountStatus !== "pending_setup" ? 'is-clickable' : 'is-clickable'}`}
                    onClick={() => handleGuardianClick(p)}
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

              {/* Load More Button */}
              {hasMore && (
                <div className="pagination-controls">
                  <button
                    className="pagination-btn load-more-btn"
                    onClick={handleLoadMore}
                  >
                    Load More Guardians
                  </button>
                  <div className="pagination-info">
                    <span className="pagination-text">
                      Showing {displayedParents.length} of {filteredParents.length} guardians
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* FLOATING ACTION BUTTON - Hidden when modal is open */}
        {!showChildrenModal && (
          <button
            className="add-fab secondary-fab"
            onClick={() => setShowParentForm(true)}
          >
            + Guardian Account
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
            currentUser={currentUser}
          />
        )}

        {/* NEW: ACTIVATION MODAL - Shows QR code after account creation */}
        <ActivationModal
          isOpen={showActivationModal}
          onClose={handleCloseActivationModal}
          userData={newUserData}
          onEmailSent={() => console.log("Activation email sent")}
        />

        {/* CHILDREN SUMMARY MODAL */}
        {showChildrenModal && selectedParent && (
          <div className="modal-overlay children-modal-overlay" onClick={handleCloseChildrenModal}>
            <div className="children-summary-modal" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="csm-header">
                <div className="csm-header-left">
                  <div className="csm-parent-avatar">
                    {selectedParent.profilePhoto ? (
                      <img src={selectedParent.profilePhoto} alt="" />
                    ) : (
                      <span>{selectedParent.firstName[0]}{selectedParent.lastName[0]}</span>
                    )}
                  </div>
                  <div className="csm-header-info">
                    <h2>{selectedParent.firstName} {selectedParent.lastName}</h2>
                    <span className="csm-subtitle">Guardian</span>
                  </div>
                </div>
                <button className="csm-close-btn" onClick={handleCloseChildrenModal}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="csm-content">
                {isLoadingChildren ? (
                  <div className="csm-loading">
                    <div className="csm-spinner"></div>
                    <p>Loading children...</p>
                  </div>
                ) : allStudents.length === 0 ? (
                  <div className="csm-empty">
                    <div className="csm-empty-icon">🦁</div>
                    <h3>No Children Enrolled</h3>
                    <p>This guardian doesn't have any children enrolled yet.</p>
                    <button className="csm-enroll-btn" onClick={() => {
                      setShowChildrenModal(false);
                      setShowEnrollForm(true);
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14"/>
                      </svg>
                      Enroll a Child
                    </button>
                  </div>
                ) : (
                  <div className="csm-children-list">
                    {allStudents.map((child) => {
                      const completion = calculateProfileCompletion(child);
                      const isEnrolled = child.status === "ENROLLED";

                      return (
                        <div
                          key={child.id}
                          className={`csm-child-card ${isEnrolled ? 'enrolled' : 'assessing'}`}
                          onClick={() => handleViewChildFromModal(child)}
                        >
                          {/* Child Photo */}
                          <div className="csm-child-photo">
                            {child.profilePhoto ? (
                              <img src={child.profilePhoto} alt="" />
                            ) : (
                              <div className="csm-photo-placeholder">
                                <span>{child.firstName[0]}</span>
                              </div>
                            )}
                            <div className={`csm-status-badge ${isEnrolled ? 'enrolled' : 'assessing'}`}>
                              {isEnrolled ? (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                                </svg>
                              ) : (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                                </svg>
                              )}
                            </div>
                          </div>

                          {/* Child Info */}
                          <div className="csm-child-info">
                            <h3 className="csm-child-name">{child.firstName} {child.lastName}</h3>
                            <div className="csm-child-meta">
                              <span className={`csm-status-tag ${isEnrolled ? 'enrolled' : 'assessing'}`}>
                                {isEnrolled ? 'Enrolled' : 'Assessing'}
                              </span>
                              {child.dateOfBirth && (
                                <span className="csm-age">
                                  {Math.floor((new Date() - new Date(child.dateOfBirth)) / 31557600000)} yrs old
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Profile Completion */}
                          <div className="csm-completion">
                            {isEnrolled ? (
                              <div className="csm-complete-badge">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M20 6L9 17l-5-5"/>
                                </svg>
                                <span>Complete</span>
                              </div>
                            ) : (
                              <div className="csm-progress-wrapper">
                                <div className="csm-progress-bar">
                                  <div
                                    className="csm-progress-fill"
                                    style={{ width: `${completion.percentage}%` }}
                                  />
                                </div>
                                <span className="csm-progress-text">
                                  {completion.completed}/{completion.total} steps
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Arrow */}
                          <div className="csm-child-arrow">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M9 18l6-6-6-6"/>
                            </svg>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Enroll Another Child Button */}
                <div className="csm-footer">
                  <button
                    className="csm-enroll-another-btn"
                    onClick={() => {
                      setShowChildrenModal(false);
                      setShowEnrollForm(true);
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                    Enroll Another Child
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

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
