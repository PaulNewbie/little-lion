import React, { useState, useEffect, useRef } from 'react';
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
import "./css/OneOnOne.css";
import "./css/ManageTeacher.css";

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
    services,
    updateTeacher
  } = useManageTeachers();
  
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

  // Reset filter and search when changing teacher selection
  useEffect(() => {
    setStudentSpecFilter(null);
    setStudentSearch('');
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

  // Filter students based on selected specialization and search
  const filteredStudents = assignedStudents.filter(student => {
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

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    
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

  return (
    <div className="ooo-container">
      <Sidebar {...getAdminConfig(isSuperAdmin)} />
      {loading ? (
        <Loading role="admin" message="Loading teachers" variant="content" />
      ) : (
      <div className="ooo-main">

        {/* ================= HEADER ================= */}
        <div className="ooo-header">
          <div className="mt-header-wrapper">
            
            {/* Left side: Back Button + Title */}
            <div className="mt-header-left">
              {selectedTeacherId && (
                <span
                  className="mt-back-btn"
                  onClick={handleBack}
                >
                  ‹
                </span>
              )}

              <div className="header-title">
                <h1>
                  {selectedTeacherId ? "TEACHER PROFILE" : "TEACHER PROFILES"}
                </h1>
                
                {!selectedTeacherId && (
                  <p className="header-subtitle">Add and Manage Teacher Accounts</p>
                )}
              </div>
            </div>
            
            {/* Hide search when viewing a specific profile to avoid confusion */}
            {!selectedTeacherId && (
              <div className="mt-search-container">
                <span className="mt-search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search teacher name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mt-search-input"
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
                  <h3 className="mt-section-title" style={{ margin: 0 }}>
                    Enrolled Students ({filteredStudents.length}{(studentSpecFilter || studentSearch) ? ` of ${assignedStudents.length}` : ''})
                  </h3>

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
                  <div className="ooo-grid">
                    {filteredStudents.map(student => (
                      <div key={student.id} className="ooo-card" style={{ cursor: 'default' }}>
                        <div className="ooo-photo-area">
                          {student.photoUrl ? (
                            <img src={student.photoUrl} alt="" />
                          ) : (
                            <div style={{
                              width: '100%',
                              height: '100%',
                              backgroundColor: '#e2e8f0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.5rem',
                              color: '#64748b',
                              fontWeight: 'bold'
                            }}>
                              {student.firstName?.[0]}{student.lastName?.[0]}
                            </div>
                          )}
                        </div>
                        <div className="ooo-card-info">
                          <p className="ooo-name">{student.firstName} {student.lastName}</p>
                          <p className="ooo-sub" style={{ color: '#2563eb', fontWeight: '500' }}>
                            {getStudentServices(student)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          ) : (
            /* ---------------- VIEW: TEACHER GRID LIST ---------------- */
            <>
              <div className="mt-section-title-wrapper">
                <h2 className="mt-section-title">
                  Teacher Accounts
                </h2>
              </div>

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
                      <div>
                        {/* Status Badge (Dot) */}
                        <div 
                          className={`mt-status-dot ${teacher.profileCompleted ? 'active' : 'pending'}`}
                          title={teacher.profileCompleted ? "Profile Complete" : "Profile Incomplete"} 
                        />

                        {/* Avatar */}
                        <div className="mt-avatar-container">
                          {teacher.profilePhoto ? (
                            <img src={teacher.profilePhoto} alt="" className="mt-avatar-img" />
                          ) : '👤'}
                        </div>

                        <h3 className="mt-teacher-name">
                          {teacher.firstName} {teacher.lastName}
                        </h3>
                        
                        {/* Status Text */}
                        <div className={`mt-badge ${teacher.profileCompleted ? 'complete' : 'incomplete'}`}>
                          {teacher.profileCompleted ? '✅ Profile Active' : '⚠️ Setup Pending'}
                        </div>

                        <div className="mt-tags-wrapper">
                          {teacher.specializations?.slice(0, 2).map((spec, idx) => (
                            <span key={idx} className="mt-tag">
                              {spec}
                            </span>
                          ))}
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
          <div className="mt-modal-overlay" onClick={() => setShowForm(false)}>
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
                  name="email" 
                  type="email" 
                  placeholder="Email Address *" 
                  value={newTeacher.email} 
                  onChange={handleInputChange} 
                  required 
                  className="mt-input-full"
                />

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
                    onClick={() => setShowForm(false)} 
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