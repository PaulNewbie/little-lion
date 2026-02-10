import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useManageTherapists from '../../hooks/useManageTherapists';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import Sidebar from '../../components/sidebar/Sidebar';
import { getAdminConfig } from '../../components/sidebar/sidebarConfigs';
import TherapistCard from '../shared/TherapistCard';
import ActivationModal from '../../components/admin/ActivationModal';
import SpecializationManagerModal from '../../components/admin/SpecializationManagerModal';
import Loading from '../../components/common/Loading';
import { useChildrenByStaff } from '../../hooks/useCachedData';
import { ROUTES } from '../../routes/routeConfig';
import "./css/OneOnOne.css";
import "./css/ManageTeacher.css";
import "./css/managetherapist.css";
import "./studentProfile/StudentProfile.css";
import "../../components/common/Header.css";

// Pagination config
const PAGE_SIZE = 10; 

const ManageTherapists = () => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const {
    therapists,
    services,
    loading,
    error,
    newTherapist,
    handleInputChange,
    toggleSpecialization,
    setSpecializations,
    createTherapist,
    updateTherapist
  } = useManageTherapists();

  // Track if user attempted to submit without specialization
  const [showSpecError, setShowSpecError] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Initialize state with passed ID if it exists
  const [selectedTherapistId, setSelectedTherapistId] = useState(location.state?.selectedStaffId || null);

  // Activation Modal State
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [newUserData, setNewUserData] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Specialization Manager Modal State
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [staffForSpecUpdate, setStaffForSpecUpdate] = useState(null);

  // Patient filter by specialization
  const [patientSpecFilter, setPatientSpecFilter] = useState(null);
  // Patient search
  const [patientSearch, setPatientSearch] = useState('');
  // Ref for scrolling to patient section
  const patientSectionRef = useRef(null);
  // Pagination state for assigned patients
  const [patientDisplayCount, setPatientDisplayCount] = useState(PAGE_SIZE);

  // Use cached data
  const {
    data: assignedStudents = [],
    isLoading: loadingStudents
  } = useChildrenByStaff(selectedTherapistId);

  // Effect to handle navigation updates
  useEffect(() => {
    if (location.state?.selectedStaffId) {
      setSelectedTherapistId(location.state.selectedStaffId);
    }
  }, [location.state]);

  // Reset filter, search, and pagination when changing therapist selection
  useEffect(() => {
    setPatientSpecFilter(null);
    setPatientSearch('');
    setPatientDisplayCount(PAGE_SIZE);
  }, [selectedTherapistId]);

  const filteredTherapists = therapists.filter(t =>
    `${t.firstName} ${t.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to show which service the student is taking
  const getStudentServices = (student) => {
    const all = [...(student.oneOnOneServices || []), ...(student.groupClassServices || [])];
    return all
      .filter(s => s.staffId === selectedTherapistId)
      .map(s => s.serviceName)
      .join(", ");
  };

  // Handler for clicking a specialization to filter patients
  const handleSpecializationFilter = (spec) => {
    if (patientSpecFilter === spec) {
      setPatientSpecFilter(null); // Toggle off if already selected
    } else {
      setPatientSpecFilter(spec);
      // Scroll to patient section
      setTimeout(() => {
        patientSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  // Filter patients based on selected specialization and search (all filtered)
  const allFilteredPatients = useMemo(() => {
    return assignedStudents.filter(student => {
      // Search filter
      const searchMatch = !patientSearch ||
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(patientSearch.toLowerCase());

      // Specialization filter
      const specMatch = !patientSpecFilter || (() => {
        const all = [...(student.oneOnOneServices || []), ...(student.groupClassServices || [])];
        return all.some(s => s.staffId === selectedTherapistId && s.serviceName === patientSpecFilter);
      })();

      return searchMatch && specMatch;
    });
  }, [assignedStudents, patientSearch, patientSpecFilter, selectedTherapistId]);

  // Paginated patients to display
  const filteredPatients = useMemo(() => {
    return allFilteredPatients.slice(0, patientDisplayCount);
  }, [allFilteredPatients, patientDisplayCount]);

  // Check if there are more patients to load
  const hasMorePatients = allFilteredPatients.length > patientDisplayCount;

  // Handle Load More for patients
  const handleLoadMorePatients = () => {
    setPatientDisplayCount(prev => prev + PAGE_SIZE);
  };

  // Reset pagination when search/filter changes
  useEffect(() => {
    setPatientDisplayCount(PAGE_SIZE);
  }, [patientSearch, patientSpecFilter]);

  const handleCreateTherapist = async (e) => {
    e.preventDefault();

    // Validate specialization - at least one required
    const validSpecs = newTherapist.specializations.filter(s => s && s.trim() !== '');
    if (validSpecs.length === 0) {
      setShowSpecError(true);
      toast.error('Please select at least one specialization for this therapist.');
      return;
    }

    setIsCreating(true);
    setShowSpecError(false);

    const result = await createTherapist(e);

    setIsCreating(false);

    if (result.success) {
      setShowForm(false);
      setNewUserData(result.user);
      setShowActivationModal(true);
    } else {
      toast.error('Failed to create therapist: ' + result.error);
    }
  };

  // Handler for opening the Specialization Manager
  const handleOpenSpecManager = (therapist) => {
    setStaffForSpecUpdate(therapist);
    setShowSpecModal(true);
  };

  // Handler for saving specialization changes
  const handleSaveSpecs = async (therapistId, updates) => {
    const result = await updateTherapist(therapistId, updates);
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
      setSelectedTherapistId(null);
    }
  };

  // Handler for navigating to student profile
  const handlePatientClick = (student) => {
    navigate(ROUTES.ADMIN.STUDENT_PROFILE, {
      state: {
        studentId: student.id,
        student: student,
        returnTo: ROUTES.ADMIN.MANAGE_THERAPISTS,
        returnState: { selectedStaffId: selectedTherapistId }
      }
    });
  };

  const selectedTherapist = selectedTherapistId 
    ? therapists.find(t => t.uid === selectedTherapistId) 
    : null;

  return (
    <div className="ooo-container therapist-page">
      <Sidebar {...getAdminConfig(isSuperAdmin)} />
      {loading ? (
        <Loading role="admin" message="Loading therapists" variant="content" />
      ) : (
      <div className="ooo-main">
        {/* ================= HEADER ================= */}
        <div className="ll-header">
          <div className="ll-header-content">
            <div className="header-title">
              <h1>
                {selectedTherapistId ? "THERAPIST PROFILE" : "THERAPIST PROFILES"}
              </h1>
              {!selectedTherapistId && (
                <p className="header-subtitle">Add and Manage Therapist Accounts</p>
              )}
            </div>

            {/* Hide search when viewing a specific profile */}
            {!selectedTherapistId && (
              <div className="search-wrapper">
                <span className="search-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="M21 21l-4.35-4.35"/>
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search therapist name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ll-search"
                />
              </div>
            )}
          </div>
        </div>

        {error && <div className="mt-error-banner">⚠️ Error: {error}</div>}

        {/* ================= CONTENT AREA ================= */}
        <div className="ooo-content-area">
          
          {selectedTherapistId ? (
              <div style={{ paddingBottom: '120px', width: '100%' }}>
    
                <TherapistCard
                  therapist={selectedTherapist}
                  serviceName="Therapist Profile"
                  isSuperAdmin={isSuperAdmin}
                  onManageSpecs={handleOpenSpecManager}
                  onSpecializationClick={handleSpecializationFilter}
                  activeFilter={patientSpecFilter}
                />

              {/* --- ASSIGNED PATIENTS SECTION --- */}
              <div ref={patientSectionRef} style={{ marginTop: '30px' }}>
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
                        placeholder="Patient name..."
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        style={{
                          border: 'none',
                          outline: 'none',
                          fontSize: '0.85rem',
                          width: '140px',
                          color: '#0f172a'
                        }}
                      />
                      {patientSearch && (
                        <button
                          onClick={() => setPatientSearch('')}
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
                      value={patientSpecFilter || ''}
                      onChange={(e) => setPatientSpecFilter(e.target.value || null)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        color: patientSpecFilter ? '#7e22ce' : '#64748b',
                        backgroundColor: patientSpecFilter ? '#faf5ff' : 'white',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="">All Specializations</option>
                      {selectedTherapist?.specializations?.map((spec, idx) => (
                        <option key={idx} value={spec}>{spec}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {loadingStudents ? (
                   <p style={{ color: '#666', fontStyle: 'italic' }}>Loading patients...</p>
                ) : filteredPatients.length === 0 ? (
                   <div className="mt-empty-state">
                     <p>{patientSpecFilter
                       ? `No patients enrolled in "${patientSpecFilter}" with this therapist.`
                       : 'No patients currently assigned to this therapist.'
                     }</p>
                   </div>
                ) : (
                  <>
                    <div className="sp-grid">
                      {filteredPatients.map(student => (
                        <div
                          key={student.id}
                          className="sp-card"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handlePatientClick(student)}
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
                    {hasMorePatients && (
                      <div style={{ textAlign: 'center', marginTop: '24px', padding: '16px 0' }}>
                        <button
                          onClick={handleLoadMorePatients}
                          style={{
                            padding: '12px 32px',
                            background: 'transparent',
                            border: '2px solid #7e22ce',
                            color: '#7e22ce',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '0.9375rem',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => { e.target.style.background = '#7e22ce'; e.target.style.color = 'white'; }}
                          onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#7e22ce'; }}
                        >
                          Load More Patients
                        </button>
                        <div style={{ marginTop: '8px', fontSize: '0.875rem', color: '#64748b' }}>
                          Showing {filteredPatients.length} of {allFilteredPatients.length} patients
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

          ) : (
            /* ---------------- VIEW: LIST (Matches Teacher Grid) ---------------- */
            <>
              {filteredTherapists.length === 0 ? (
                <div className="mt-empty-state">
                  <p className="mt-empty-text">
                    {searchQuery
                      ? 'No therapists found matching your search.'
                      : 'No therapists yet.'}
                  </p>
                </div>
              ) : (
                <div className="mt-grid">
                  {filteredTherapists.map(t => (
                    <div
                      key={t.uid}
                      className={`mt-card ${t.profileCompleted ? 'is-clickable' : 'is-locked'}`}
                      onClick={() => {
                        if (t.profileCompleted) {
                          setSelectedTherapistId(t.uid);
                        } else {
                          toast.info("This therapist has not completed their profile yet.");
                        }
                      }}
                    >
                      {/* Colored Banner with Status Badge */}
                      <div className="mt-card-banner">
                        <div className={`mt-badge ${t.profileCompleted ? 'complete' : 'incomplete'}`}>
                          {t.profileCompleted ? 'Active' : 'Pending Setup'}
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="mt-card-content">
                        {/* Avatar with Status Dot */}
                        <div className="mt-avatar-container">
                          {t.profilePhoto ? (
                            <img src={t.profilePhoto} alt="" className="mt-avatar-img" />
                          ) : (
                            <span>{t.firstName?.[0]}{t.lastName?.[0]}</span>
                          )}
                          <div
                            className={`mt-status-dot ${t.profileCompleted ? 'active' : 'pending'}`}
                            title={t.profileCompleted ? "Profile Complete" : "Profile Incomplete"}
                          />
                        </div>

                        {/* Therapist Name */}
                        <h3 className="mt-teacher-name">
                          {t.firstName} {t.lastName}
                        </h3>

                        {/* Specialization Tags */}
                        <div className="mt-tags-wrapper">
                          {t.specializations?.length ? (
                            <>
                              {t.specializations.slice(0, 2).map((s, i) => (
                                <span key={i} className="mt-tag" title={s}>
                                  {s.length > 15 ? s.substring(0, 15) + '...' : s}
                                </span>
                              ))}
                              {t.specializations.length > 2 && (
                                <span className="mt-tag mt-tag-more">+{t.specializations.length - 2}</span>
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

        {/* FAB */}
        {!selectedTherapistId && (
          <button className="mt-fab" onClick={() => setShowForm(true)}>
            + ADD THERAPIST 
          </button>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="mt-modal-overlay" onClick={() => { setShowForm(false); setShowSpecError(false); }}>
            <div className="mt-form-container" onClick={(e) => e.stopPropagation()}>
              <h2 className="mt-form-title">ADD THERAPIST</h2>

              <form onSubmit={handleCreateTherapist}>
                {/* Personal Info */}
                <div style={{ marginBottom: '24px' }}>
                  <div className="mt-form-row">
                    <input name="lastName" placeholder="Surname *" value={newTherapist.lastName} onChange={handleInputChange} required className="mt-input" />
                    <input name="firstName" placeholder="First Name *" value={newTherapist.firstName} onChange={handleInputChange} required className="mt-input" />
                  </div>
                  <input name="middleName" placeholder="Middle Name (Optional)" value={newTherapist.middleName || ''} onChange={handleInputChange} className="mt-input-full" style={{ marginBottom: 0 }} />
                </div>

                {/* Email */}
                <input name="email" type="email" placeholder="Email Address *" value={newTherapist.email} onChange={handleInputChange} required className="mt-input-full" />

                {/* ===== SPECIALIZATION SECTION (REQUIRED) ===== */}
                <div style={{
                  marginTop: '24px',
                  marginBottom: '24px',
                  padding: '20px',
                  backgroundColor: showSpecError ? '#fef2f2' : '#faf5ff',
                  borderRadius: '12px',
                  border: showSpecError ? '2px solid #ef4444' : '2px solid #a855f7'
                }}>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    color: showSpecError ? '#dc2626' : '#7e22ce',
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
                      ? 'Please select at least one therapy service this therapist will provide.'
                      : 'Select the therapy service(s) this therapist will provide.'}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Render Dynamic Rows */}
                    {newTherapist.specializations.map((currentSpec, index) => (
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
                              const updatedSpecs = [...newTherapist.specializations];
                              updatedSpecs[index] = e.target.value;
                              setSpecializations(updatedSpecs);
                              if (e.target.value) setShowSpecError(false);
                            }}
                          >
                            <option value="">-- Select Therapy Service --</option>
                            {services
                              .filter((service) => {
                                const isCurrentlySelected = service.name === currentSpec;
                                const isAlreadyUsed = newTherapist.specializations.includes(service.name);
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
                            const updatedSpecs = newTherapist.specializations.filter((_, i) => i !== index);
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
                    {services && newTherapist.specializations.length < services.length && (
                      <button
                        type="button"
                        onClick={() => {
                          const updatedSpecs = [...newTherapist.specializations, ''];
                          setSpecializations(updatedSpecs);
                        }}
                        style={{
                          alignSelf: 'flex-start',
                          marginTop: '8px',
                          background: 'white',
                          border: '2px dashed #a855f7',
                          color: '#7e22ce',
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
                    {newTherapist.specializations.length === 0 && (
                      <div style={{
                        padding: '16px',
                        backgroundColor: showSpecError ? '#fee2e2' : '#f3e8ff',
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}>
                        <p style={{
                          fontSize: '13px',
                          color: showSpecError ? '#dc2626' : '#7e22ce',
                          margin: 0,
                          fontWeight: '500'
                        }}>
                          {showSpecError
                            ? 'At least one specialization is required!'
                            : 'Click "ADD SPECIALIZATION" to select a therapy service'}
                        </p>
                      </div>
                    )}

                    {/* Success confirmation */}
                    {newTherapist.specializations.filter(s => s && s.trim() !== '').length > 0 && (
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
                          {newTherapist.specializations.filter(s => s && s.trim() !== '').length} specialization(s) selected
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {/* ===== END SPECIALIZATION SECTION ===== */}

                <div className="mt-info-box">
                  <strong>ℹ️ How it works:</strong>
                  <p>After creating the account, a QR code will appear. The therapist can scan it to set up their password and complete their profile.</p>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setShowSpecError(false); }}
                    disabled={isCreating}
                    style={{ flex: 1, background: 'white', color: '#000', padding: '12px 24px', border: '2px solid #000', borderRadius: '6px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase', transition: 'all 0.2s' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    style={{ flex: 1, background: isCreating ? '#d8b4fe' : '#a855f7', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '700', cursor: isCreating ? 'not-allowed' : 'pointer', textTransform: 'uppercase', transition: 'all 0.2s' }}
                  >
                    {isCreating ? 'Creating...' : 'Add Therapist'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
          role="therapist"
        />
  
      </div>
      )}
    </div>
  );
};

export default ManageTherapists;