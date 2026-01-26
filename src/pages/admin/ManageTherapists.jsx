import React, { useState, useEffect, useRef } from 'react';
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
import "./css/OneOnOne.css";      
import "./css/ManageTeacher.css"; 
import "./css/managetherapist.css"; 

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
    createTherapist,
    updateTherapist
  } = useManageTherapists();

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

  // Reset filter and search when changing therapist selection
  useEffect(() => {
    setPatientSpecFilter(null);
    setPatientSearch('');
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

  // Filter patients based on selected specialization and search
  const filteredPatients = assignedStudents.filter(student => {
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

  const handleCreateTherapist = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    
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

  const selectedTherapist = selectedTherapistId 
    ? therapists.find(t => t.uid === selectedTherapistId) 
    : null;

  return (
    <div className="ooo-container">
      <Sidebar {...getAdminConfig(isSuperAdmin)} />
      {loading ? (
        <Loading role="admin" message="Loading therapists" variant="content" />
      ) : (
      <div className="ooo-main">
        {/* ================= HEADER ================= */}
        <div className="ooo-header">
          <div className="mt-header-wrapper">
            
            <div className="mt-header-left">
              {selectedTherapistId && (
                <span
                  className="mt-back-btn"
                  onClick={handleBack}
                >
                  ‹
                </span>
              )}

              {/* Title matches Teacher UI */}
              <div className="header-title">
                <h1>
                  {selectedTherapistId ? "THERAPIST PROFILE" : "THERAPIST PROFILES"}
                </h1>
                
                {!selectedTherapistId && (
                  <p className="header-subtitle">
                    Add and Manage Therapist Accounts
                  </p>
                )}
              </div>
            </div>

            {/* Search Box */}
            {!selectedTherapistId && (
              <div className="mt-search-container">
                <span className="mt-search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search therapist name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mt-search-input"
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
                  <h3 className="mt-section-title" style={{ margin: 0 }}>
                    Assigned Patients ({filteredPatients.length}{(patientSpecFilter || patientSearch) ? ` of ${assignedStudents.length}` : ''})
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
                  <div className="ooo-grid">
                    {filteredPatients.map(student => (
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
            /* ---------------- VIEW: LIST (Matches Teacher Grid) ---------------- */
            <>
              <div className="mt-section-title-wrapper">
                <h2 className="mt-section-title">Therapist Accounts</h2>
              </div>

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
                      className={`mt-card ${
                        t.profileCompleted ? 'is-clickable' : 'is-locked'
                      }`}
                      onClick={() => {
                        if (t.profileCompleted) {
                          setSelectedTherapistId(t.uid);
                        } else {
                          toast.info("This therapist has not completed their profile yet.");
                        }
                      }}
                    >
                      <div>
                        {/* Status Dot */}
                        <div 
                          className={`mt-status-dot ${t.profileCompleted ? 'active' : 'pending'}`}
                          title={t.profileCompleted ? "Profile Complete" : "Profile Incomplete"} 
                        />

                        {/* Avatar */}
                        <div className="mt-avatar-container">
                          {t.profilePhoto ? (
                            <img src={t.profilePhoto} alt="" className="mt-avatar-img" />
                          ) : (
                            '👤'
                          )}
                        </div>

                        <h3 className="mt-teacher-name">
                          {t.firstName} {t.lastName}
                        </h3>

                        {/* Status Badge */}
                        <div className={`mt-badge ${t.profileCompleted ? 'complete' : 'incomplete'}`}>
                          {t.profileCompleted ? '✅ Profile Active' : '⚠️ Setup Pending'}
                        </div>

                        {/* Specializations Tags */}
                        <div className="mt-tags-wrapper">
                          {t.specializations?.length ? (
                            t.specializations.slice(0, 2).map((s, i) => (
                              <span key={i} className="mt-tag">
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="mt-tag">No specs</span>
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
          <div className="mt-modal-overlay" onClick={() => setShowForm(false)}>
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
                
                <div className="mt-info-box">
                    <strong>ℹ️ How it works:</strong>
                    <p>After creating the account, a QR code will appear. The therapist can scan it to set up their password and complete their profile.</p>
                </div>

                {/* Specialization Section */}
                <div style={{ marginBottom: "32px" }}>
                  <h3
                    style={{
                      fontSize: "12px",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      color: "#666",
                      letterSpacing: "0.5px",
                      marginBottom: "16px",
                    }}
                  >
                    Specialization
                  </h3>

                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {/* Render Dynamic Rows */}
                    {newTherapist.specializations.map((currentSpec, index) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "15px",
                          marginBottom: "10px",
                        }}
                      >
                        {/* Service Dropdown */}
                        <div style={{ flex: 1 }}>
                          <select
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              border: "1px solid #ddd",
                              borderRadius: "6px",
                              fontSize: "13px",
                              backgroundColor: "white",
                              outline: "none",
                            }}
                            value={currentSpec}
                            onChange={(e) => {
                              const updatedSpecs = [...newTherapist.specializations];
                              updatedSpecs[index] = e.target.value;
                              Object.assign(newTherapist, { specializations: updatedSpecs }); 
                              setNewUserData({ ...newUserData }); 
                            }}
                          >
                            <option value="" disabled>
                              Select Specialization
                            </option>
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

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => {
                            const updatedSpecs = newTherapist.specializations.filter((_, i) => i !== index);
                            Object.assign(newTherapist, { specializations: updatedSpecs }); 
                            setNewUserData({ ...newUserData }); 
                          }}
                          style={{
                            border: "none",
                            background: "#fee2e2",
                            color: "#ef4444",
                            borderRadius: "6px",
                            width: "38px",
                            height: "38px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "background 0.2s",
                          }}
                          title="Remove specialization"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}

                    {/* Add Button */}
                    {services && newTherapist.specializations.length < services.length && (
                      <button
                        type="button"
                        onClick={() => {
                           const updatedSpecs = [...newTherapist.specializations, ""];
                           Object.assign(newTherapist, { specializations: updatedSpecs });
                           setNewUserData({ ...newUserData }); 
                        }}
                        style={{
                          alignSelf: "flex-start",
                          marginTop: "5px",
                          background: "white",
                          border: "1px dashed #3b82f6",
                          color: "#3b82f6",
                          padding: "8px 16px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <span>+</span> ADD SPECIALIZATION
                      </button>
                    )}
                    
                    {newTherapist.specializations.length === 0 && (
                       <p style={{ fontSize: '12px', color: '#999', fontStyle: 'italic', margin: '0 0 10px 0'}}>
                         No specializations added yet.
                       </p>
                    )}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button 
                    type="button" 
                    onClick={() => setShowForm(false)} 
                    disabled={isCreating}
                    style={{ flex: 1, background: 'white', color: '#000', padding: '12px 24px', border: '2px solid #000', borderRadius: '6px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase', transition: 'all 0.2s' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isCreating}
                    style={{ flex: 1, background: isCreating ? '#fcd34d' : '#fbbf24', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '700', cursor: isCreating ? 'not-allowed' : 'pointer', textTransform: 'uppercase', transition: 'all 0.2s' }}
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