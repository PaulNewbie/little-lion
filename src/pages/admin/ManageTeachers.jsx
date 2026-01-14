import React, { useState } from 'react';
import useManageTeachers from '../../hooks/useManageTeachers';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from '../../components/sidebar/Sidebar';
import { getAdminConfig } from '../../components/sidebar/sidebarConfigs';
import TeacherCard from '../shared/TeacherCard';
import ActivationModal from '../../components/admin/ActivationModal';
// 1. IMPORT THE CACHED HOOK
import { useChildrenByStaff } from '../../hooks/useCachedData'; 
import "./css/OneOnOne.css"; 
import "./css/ManageTeacher.css";

const ManageTeachers = () => {
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const {
    teachers,
    loading, 
    error, 
    createTeacher, 
    newTeacher, 
    handleInputChange, 
    services 
  } = useManageTeachers();
  
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for Profile View (Determines if we show List or Detail)
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);

  // Activation Modal State
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [newUserData, setNewUserData] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // 2. USE THE CACHED HOOK (Saves reads, handles loading auto-magically)
  const { 
    data: assignedStudents = [], 
    isLoading: loadingStudents 
  } = useChildrenByStaff(selectedTeacherId);

  if (loading) return <div className="pg-loading">Loading teachers...</div>;

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
      alert('Failed to create teacher: ' + result.error);
    }
  };

  return (
    <div className="ooo-container">
      <Sidebar {...getAdminConfig(isSuperAdmin)} />
      <div className="ooo-main">
        
        {/* ================= HEADER ================= */}
        <div className="ooo-header">
          <div className="mt-header-wrapper">
            
            {/* Left side: Back Button + Title */}
            <div className="mt-header-left">
              {/* Back Button – ONLY shows on Teacher Profile */}
              {selectedTeacherId && (
                <span
                  className="mt-back-btn"
                  onClick={() => setSelectedTeacherId(null)}
                >
                  ‹
                </span>
              )}

              <div className="header-title">
                <h1>
                  {selectedTeacherId ? "TEACHER PROFILE" : "TEACHER PROFILES"}
                </h1>
                
                {/* Hide subtitle when viewing detail */}
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
            /* 3. SCROLL FIX: Removed height:100% and added paddingBottom */
            <div style={{ paddingBottom: '120px', width: '100%' }}>
              <TeacherCard teacher={selectedTeacher} />

              {/* --- NEW SECTION: ENROLLED STUDENTS --- */}
              <div style={{ marginTop: '30px' }}>
                <h3 className="mt-section-title">
                  Enrolled Students ({assignedStudents.length})
                </h3>
                
                {loadingStudents ? (
                   <p style={{ color: '#666', fontStyle: 'italic' }}>Loading students...</p>
                ) : assignedStudents.length === 0 ? (
                   <div className="mt-empty-state">
                     <p>No students currently assigned to this teacher.</p>
                   </div>
                ) : (
                  <div className="ooo-grid">
                    {assignedStudents.map(student => (
                      <div key={student.id} className="ooo-card" style={{ cursor: 'default' }}>
                        <div className="ooo-photo-area">
                          {student.photoUrl ? <img src={student.photoUrl} alt="" /> : <span>📷</span>}
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
                        else alert("This teacher has not completed their profile yet.");
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
      </div>
    </div>
  );
};

export default ManageTeachers;