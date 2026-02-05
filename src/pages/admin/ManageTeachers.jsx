import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useManageTeachers from '../../hooks/useManageTeachers';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import Sidebar from '../../components/sidebar/Sidebar';
import { getAdminConfig } from '../../components/sidebar/sidebarConfigs';
import TeacherCard from '../shared/TeacherCard';
import ActivationModal from '../../components/admin/ActivationModal';
import SpecializationManagerModal from '../../components/admin/SpecializationManagerModal';
import Loading from '../../components/common/Loading';
import { useChildrenByStaff } from '../../hooks/useCachedData';
import { ROUTES } from '../../routes/routeConfig';
import "./css/OneOnOne.css";
import "./css/ManageTeacher.css";
import "./studentProfile/StudentProfile.css";
import "../../components/common/Header.css";

// Pagination config
const PAGE_SIZE = 10;

const ManageTeachers = () => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const {
    teachers,
    loading,
    error,
    createTeacher,
    newTeacher,
    handleInputChange,
    setSpecializations,
    services,
    updateTeacher
  } = useManageTeachers();

  // Track if user attempted to submit without specialization
  const [showSpecError, setShowSpecError] = useState(false);
  
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Initialize state with passed ID if it exists, otherwise null
  const [selectedTeacherId, setSelectedTeacherId] = useState(location.state?.selectedStaffId || null);

  // Activation Modal State
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [newUserData, setNewUserData] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Specialization Manager Modal State
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [staffForSpecUpdate, setStaffForSpecUpdate] = useState(null);

  // Student filter by specialization
  const [studentSpecFilter, setStudentSpecFilter] = useState(null);
  // Student search
  const [studentSearch, setStudentSearch] = useState('');
  // Ref for scrolling to student section
  const studentSectionRef = useRef(null);
  // Pagination state for enrolled students
  const [studentDisplayCount, setStudentDisplayCount] = useState(PAGE_SIZE);

  // Use cached data hook
  const {
    data: assignedStudents = [],
    isLoading: loadingStudents
  } = useChildrenByStaff(selectedTeacherId);

  // Effect to update selection if navigating while component is already mounted
  useEffect(() => {
    if (location.state?.selectedStaffId) {
      setSelectedTeacherId(location.state.selectedStaffId);
    }
  }, [location.state]);

  // Reset filter, search, and pagination when changing teacher selection
  useEffect(() => {
    setStudentSpecFilter(null);
    setStudentSearch('');
    setStudentDisplayCount(PAGE_SIZE);
  }, [selectedTeacherId]);

  // Filter teachers based on search query
  const filteredTeachers = teachers.filter(teacher =>
    `${teacher.firstName} ${teacher.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Find the full teacher object if one is selected
  const selectedTeacher = selectedTeacherId 
    ? teachers.find(t => t.uid === selectedTeacherId) 
    : null;

  // Helper to show which service the student is taking with this teacher
  const getStudentServices = (student) => {
    const all = [...(student.groupClassServices || []), ...(student.oneOnOneServices || [])];
    return all
      .filter(s => s.staffId === selectedTeacherId)
      .map(s => s.serviceName)
      .join(", ");
  };

  // Handler for clicking a specialization to filter students
  const handleSpecializationFilter = (spec) => {
    if (studentSpecFilter === spec) {
      setStudentSpecFilter(null); // Toggle off if already selected
    } else {
      setStudentSpecFilter(spec);
      // Scroll to student section
      setTimeout(() => {
        studentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  // Filter students based on selected specialization and search (all filtered)
  const allFilteredStudents = useMemo(() => {
    return assignedStudents.filter(student => {
      // Search filter
      const searchMatch = !studentSearch ||
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(studentSearch.toLowerCase());

      // Specialization filter
      const specMatch = !studentSpecFilter || (() => {
        const all = [...(student.groupClassServices || []), ...(student.oneOnOneServices || [])];
        return all.some(s => s.staffId === selectedTeacherId && s.serviceName === studentSpecFilter);
      })();

      return searchMatch && specMatch;
    });
  }, [assignedStudents, studentSearch, studentSpecFilter, selectedTeacherId]);

  // Paginated students to display
  const filteredStudents = useMemo(() => {
    return allFilteredStudents.slice(0, studentDisplayCount);
  }, [allFilteredStudents, studentDisplayCount]);

  // Check if there are more students to load
  const hasMoreStudents = allFilteredStudents.length > studentDisplayCount;

  // Handle Load More for students
  const handleLoadMoreStudents = () => {
    setStudentDisplayCount(prev => prev + PAGE_SIZE);
  };

  // Reset pagination when search/filter changes
  useEffect(() => {
    setStudentDisplayCount(PAGE_SIZE);
  }, [studentSearch, studentSpecFilter]);

  const handleCreateTeacher = async (e) => {
    e.preventDefault();

    // Validate specialization - at least one required
    const validSpecs = newTeacher.specializations.filter(s => s && s.trim() !== '');
    if (validSpecs.length === 0) {
      setShowSpecError(true);
      toast.error('Please select at least one specialization for this teacher.');
      return;
    }

    setIsCreating(true);
    setShowSpecError(false);

    const result = await createTeacher(e);

    setIsCreating(false);

    if (result.success) {
      setShowForm(false);
      setNewUserData(result.user);
      setShowActivationModal(true);
    } else {
      toast.error('Failed to create teacher: ' + result.error);
    }
  };

  // Handler for opening the Specialization Manager
  const handleOpenSpecManager = (teacher) => {
    setStaffForSpecUpdate(teacher);
    setShowSpecModal(true);
  };

  // Handler for saving specialization changes
  const handleSaveSpecs = async (teacherId, updates) => {
    const result = await updateTeacher(teacherId, updates);
    if (result.success) {
      toast.success("Specializations updated successfully!");
    } else {
      toast.error("Failed to update: " + result.error);
    }
  };

  // Handler for Back Button
  const handleBack = () => {
    if (location.state?.returnTo) {
      navigate(location.state.returnTo, { state: location.state.returnState });
    } else {
      setSelectedTeacherId(null);
    }
  };

  // Handler for navigating to student profile
  const handleStudentClick = (student) => {
    navigate(ROUTES.ADMIN.STUDENT_PROFILE, {
      state: {
        studentId: student.id,
        student: student,
        returnTo: ROUTES.ADMIN.MANAGE_TEACHERS,
        returnState: { selectedStaffId: selectedTeacherId }
      }
    });
  };

  return (
    <div className="ooo-container teacher-page">
      <Sidebar {...getAdminConfig(isSuperAdmin)} />
      {loading ? (
        <Loading role="admin" message="Loading teachers" variant="content" />
      ) : (
      <div className="ooo-main">

        {/* ================= HEADER ================= */}
        <div className="ll-header">
          <div className="ll-header-content">
            <div className="header-title">
              <h1>
                {selectedTeacherId ? "TEACHER PROFILE" : "TEACHER PROFILES"}
              </h1>
              {!selectedTeacherId && (
                <p className="header-subtitle">Add and Manage Teacher Accounts</p>
              )}
            </div>

            {/* Hide search when viewing a specific profile */}
            {!selectedTeacherId && (
              <div className="search-wrapper">
                <span className="search-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="M21 21l-4.35-4.35"/>
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search teacher name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ll-search"
                />
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-error-banner">
            ⚠️ Error: {error}
          </div>
        )}

        {/* Content Area - Swaps between LIST and DETAIL view */}
        <div className="ooo-content-area">
          
          {selectedTeacherId && selectedTeacher ? (
            /* ---------------- VIEW: SINGLE TEACHER PROFILE ---------------- */
            <div style={{ paddingBottom: '120px', width: '100%' }}>
              <TeacherCard
                teacher={selectedTeacher}
                isSuperAdmin={isSuperAdmin}
                onManageSpecs={handleOpenSpecManager}
                onSpecializationClick={handleSpecializationFilter}
                activeFilter={studentSpecFilter}
              />

              {/* --- ENROLLED STUDENTS SECTION --- */}
              <div ref={studentSectionRef} style={{ marginTop: '30px' }}>
                {/* Header row with title */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  {/* Search and Filter Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    {/* Search Input */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      gap: '8px'
                    }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Search</span>
                      <input
                        type="text"
                        placeholder="Student name..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        style={{
                          border: 'none',
                          outline: 'none',
                          fontSize: '0.85rem',
                          width: '140px',
                          color: '#0f172a'
                        }}
                      />
                      {studentSearch && (
                        <button
                          onClick={() => setStudentSearch('')}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: 0,
                            fontSize: '0.9rem',
                            lineHeight: 1
                          }}
                        >
                          x
                        </button>
                      )}
                    </div>

                    {/* Filter Dropdown */}
                    <select
                      value={studentSpecFilter || ''}
                      onChange={(e) => setStudentSpecFilter(e.target.value || null)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        color: studentSpecFilter ? '#0369a1' : '#64748b',
                        backgroundColor: studentSpecFilter ? '#f0f9ff' : 'white',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="">All Specializations</option>
                      {selectedTeacher?.specializations?.map((spec, idx) => (
                        <option key={idx} value={spec}>{spec}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {loadingStudents ? (
                   <p style={{ color: '#666', fontStyle: 'italic' }}>Loading students...</p>
                ) : filteredStudents.length === 0 ? (
                   <div className="mt-empty-state">
                     <p>{studentSpecFilter
                       ? `No students enrolled in "${studentSpecFilter}" with this teacher.`
                       : 'No students currently assigned to this teacher.'
                     }</p>
                   </div>
                ) : (
                  <>
                    <div className="sp-grid">
                      {filteredStudents.map(student => (
                        <div
                          key={student.id}
                          className="sp-card"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleStudentClick(student)}
                          title={`View ${student.firstName}'s profile`}
                        >
                          <div className="sp-card-image-box">
                            {student.photoUrl ? (
                              <img src={student.photoUrl} className="sp-photo" alt="" />
                            ) : (
                              <div className="sp-photo-placeholder">
                                {student.firstName?.[0]}
                              </div>
                            )}
                          </div>
                          <div className="sp-card-body">
                            <p className="sp-name">{student.lastName}, {student.firstName}</p>
                            <p className="sp-therapist">{getStudentServices(student)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination Load More */}
                    {hasMoreStudents && (
                      <div style={{ textAlign: 'center', marginTop: '24px', padding: '16px 0' }}>
                        <button
                          onClick={handleLoadMoreStudents}
                          style={{
                            padding: '12px 32px',
                            background: 'transparent',
                            border: '2px solid #0052A1',
                            color: '#0052A1',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '0.9375rem',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => { e.target.style.background = '#0052A1'; e.target.style.color = 'white'; }}
                          onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#0052A1'; }}
                        >
                          Load More Students
                        </button>
                        <div style={{ marginTop: '8px', fontSize: '0.875rem', color: '#64748b' }}>
                          Showing {filteredStudents.length} of {allFilteredStudents.length} students
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

          ) : (
            /* ---------------- VIEW: TEACHER GRID LIST ---------------- */
            <>
              {filteredTeachers.length === 0 ? (
                <div className="mt-empty-state">
                  <p className="mt-empty-text">
                    {searchQuery ? 'No teachers found matching your search.' : 'No teachers yet.'}
                  </p>
                </div>
              ) : (
                <div className="mt-grid">
                  {filteredTeachers.map(teacher => (
                    <div
                      key={teacher.uid}
                      className={`mt-card ${teacher.profileCompleted ? 'is-clickable' : 'is-locked'}`}
                      onClick={() => {
                        if (teacher.profileCompleted) setSelectedTeacherId(teacher.uid);
                        else toast.info("This teacher has not completed their profile yet.");
                      }}
                    >
                      {/* Colored Banner with Status Badge */}
                      <div className="mt-card-banner">
                        <div className={`mt-badge ${teacher.profileCompleted ? 'complete' : 'incomplete'}`}>
                          {teacher.profileCompleted ? 'Active' : 'Pending Setup'}
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="mt-card-content">
                        {/* Avatar with Status Dot */}
                        <div className="mt-avatar-container">
                          {teacher.profilePhoto ? (
                            <img src={teacher.profilePhoto} alt="" className="mt-avatar-img" />
                          ) : (
                            <span>{teacher.firstName?.[0]}{teacher.lastName?.[0]}</span>
                          )}
                          <div
                            className={`mt-status-dot ${teacher.profileCompleted ? 'active' : 'pending'}`}
                            title={teacher.profileCompleted ? "Profile Complete" : "Profile Incomplete"}
                          />
                        </div>

                        {/* Teacher Name */}
                        <h3 className="mt-teacher-name">
                          {teacher.firstName} {teacher.lastName}
                        </h3>

                        {/* Specialization Tags */}
                        <div className="mt-tags-wrapper">
                          {teacher.specializations?.length > 0 ? (
                            <>
                              {teacher.specializations.slice(0, 2).map((spec, idx) => (
                                <span key={idx} className="mt-tag" title={spec}>
                                  {spec.length > 15 ? spec.substring(0, 15) + '...' : spec}
                                </span>
                              ))}
                              {teacher.specializations.length > 2 && (
                                <span className="mt-tag mt-tag-more">+{teacher.specializations.length - 2}</span>
                              )}
                            </>
                          ) : (
                            <span className="mt-tag">No specialization</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* FAB Button - Only show when NOT viewing a profile */}
        {!selectedTeacherId && (
          <button
            onClick={() => setShowForm(true)}
            className="mt-fab"
          >
            + ADD TEACHER
          </button>
        )}

        {/* Modal for Creating New Teacher Account */}
        {showForm && (
          <div className="mt-modal-overlay" onClick={() => { setShowForm(false); setShowSpecError(false); }}>
            <div className="mt-form-container" onClick={(e) => e.stopPropagation()}>
              <h2 className="mt-form-title">ADD TEACHER</h2>

              <form onSubmit={handleCreateTeacher}>
                <div className="mt-form-row">
                  <input
                    name="lastName"
                    placeholder="Surname *"
                    value={newTeacher.lastName}
                    onChange={handleInputChange}
                    required
                    className="mt-input"
                  />
                  <input
                    name="firstName"
                    placeholder="First Name *"
                    value={newTeacher.firstName}
                    onChange={handleInputChange}
                    required
                    className="mt-input"
                  />
                </div>

                <input
                  name="middleName"
                  placeholder="Middle Name (Optional)"
                  value={newTeacher.middleName || ''}
                  onChange={handleInputChange}
                  className="mt-input-full"
                />

                <input
                  name="email"
                  type="email"
                  placeholder="Email Address *"
                  value={newTeacher.email}
                  onChange={handleInputChange}
                  required
                  className="mt-input-full"
                />

                {/* ===== SPECIALIZATION SECTION (REQUIRED) ===== */}
                <div style={{
                  marginTop: '24px',
                  marginBottom: '24px',
                  padding: '20px',
                  backgroundColor: showSpecError ? '#fef2f2' : '#f0f9ff',
                  borderRadius: '12px',
                  border: showSpecError ? '2px solid #ef4444' : '2px solid #0ea5e9'
                }}>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    color: showSpecError ? '#dc2626' : '#0369a1',
                    letterSpacing: '0.5px',
                    marginBottom: '16px'
                  }}>
                    Specialization <span style={{ color: '#ef4444' }}>*</span>
                  </h3>

                  <p style={{
                    fontSize: '13px',
                    color: showSpecError ? '#dc2626' : '#64748b',
                    marginBottom: '16px',
                    fontWeight: showSpecError ? '500' : '400'
                  }}>
                    {showSpecError
                      ? 'Please select at least one class/service this teacher will handle.'
                      : 'Select the class or service this teacher will handle.'}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Render Dynamic Rows */}
                    {newTeacher.specializations.map((currentSpec, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          animation: 'fadeIn 0.3s ease-out'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <select
                            style={{
                              width: '100%',
                              padding: '12px 14px',
                              border: currentSpec ? '2px solid #22c55e' : '1px solid #ddd',
                              borderRadius: '8px',
                              fontSize: '14px',
                              backgroundColor: currentSpec ? '#f0fdf4' : 'white',
                              outline: 'none',
                              fontWeight: currentSpec ? '500' : '400',
                              color: currentSpec ? '#166534' : '#333'
                            }}
                            value={currentSpec}
                            onChange={(e) => {
                              const updatedSpecs = [...newTeacher.specializations];
                              updatedSpecs[index] = e.target.value;
                              setSpecializations(updatedSpecs);
                              if (e.target.value) setShowSpecError(false);
                            }}
                          >
                            <option value="">-- Select Class/Service --</option>
                            {services
                              .filter((service) => {
                                const isCurrentlySelected = service.name === currentSpec;
                                const isAlreadyUsed = newTeacher.specializations.includes(service.name);
                                return isCurrentlySelected || !isAlreadyUsed;
                              })
                              .map((service) => (
                                <option key={service.id} value={service.name}>
                                  {service.name.toUpperCase()}
                                </option>
                              ))}
                          </select>
                        </div>

                        {/* Confirmation checkmark for selected */}
                        {currentSpec && (
                          <span style={{
                            color: '#22c55e',
                            fontSize: '14px',
                            fontWeight: 'bold'
                          }}>Selected</span>
                        )}

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => {
                            const updatedSpecs = newTeacher.specializations.filter((_, i) => i !== index);
                            setSpecializations(updatedSpecs);
                          }}
                          style={{
                            border: 'none',
                            background: '#fee2e2',
                            color: '#ef4444',
                            borderRadius: '8px',
                            width: '40px',
                            height: '40px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            transition: 'all 0.2s'
                          }}
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    {/* Add Button */}
                    {services && newTeacher.specializations.length < services.length && (
                      <button
                        type="button"
                        onClick={() => {
                          const updatedSpecs = [...newTeacher.specializations, ''];
                          setSpecializations(updatedSpecs);
                        }}
                        style={{
                          alignSelf: 'flex-start',
                          marginTop: '8px',
                          background: 'white',
                          border: '2px dashed #0ea5e9',
                          color: '#0369a1',
                          padding: '10px 20px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <span style={{ fontSize: '16px' }}>+</span> ADD SPECIALIZATION
                      </button>
                    )}

                    {/* Empty state with prompt */}
                    {newTeacher.specializations.length === 0 && (
                      <div style={{
                        padding: '16px',
                        backgroundColor: showSpecError ? '#fee2e2' : '#e0f2fe',
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}>
                        <p style={{
                          fontSize: '13px',
                          color: showSpecError ? '#dc2626' : '#0369a1',
                          margin: 0,
                          fontWeight: '500'
                        }}>
                          {showSpecError
                            ? 'At least one specialization is required!'
                            : 'Click "ADD SPECIALIZATION" to select a class/service'}
                        </p>
                      </div>
                    )}

                    {/* Success confirmation */}
                    {newTeacher.specializations.filter(s => s && s.trim() !== '').length > 0 && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 14px',
                        backgroundColor: '#dcfce7',
                        borderRadius: '8px',
                        marginTop: '8px'
                      }}>
                        <span style={{ fontSize: '13px', color: '#166534', fontWeight: '600' }}>
                          {newTeacher.specializations.filter(s => s && s.trim() !== '').length} specialization(s) selected
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {/* ===== END SPECIALIZATION SECTION ===== */}

                <div className="mt-info-box">
                  <strong>ℹ️ How it works:</strong>
                  <p>
                    After creating the account, a QR code will appear.
                    The teacher can scan it to set up their password and complete their profile.
                  </p>
                </div>

                <div className="mt-action-row">
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setShowSpecError(false); }}
                    disabled={isCreating}
                    className="mt-btn-cancel"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className={`mt-btn-submit ${isCreating ? 'loading' : 'normal'}`}
                  >
                    {isCreating ? 'CREATING...' : 'CREATE ACCOUNT'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Activation Modal */}
        <ActivationModal
          isOpen={showActivationModal}
          onClose={() => {
            setShowActivationModal(false);
            setNewUserData(null);
          }}
          userData={newUserData}
        />

        {/* Specialization Manager Modal */}
        <SpecializationManagerModal
          isOpen={showSpecModal}
          onClose={() => {
            setShowSpecModal(false);
            setStaffForSpecUpdate(null);
          }}
          staff={staffForSpecUpdate}
          allServices={services}
          onSave={handleSaveSpecs}
          role="teacher"
        />

      </div>
      )}
    </div>
  );
};

export default ManageTeachers;