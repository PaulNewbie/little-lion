import React, { useState } from 'react';
import useManageTherapists from '../../hooks/useManageTherapists';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from '../../components/sidebar/Sidebar';
import { getAdminConfig } from '../../components/sidebar/sidebarConfigs';
import TherapistCard from '../shared/TherapistCard';
import ActivationModal from '../../components/admin/ActivationModal';
import Loading from '../../components/common/Loading';
// 1. IMPORT THE CACHED HOOK (Saves money!)
import { useChildrenByStaff } from '../../hooks/useCachedData';

// 2. CSS IMPORTS (Crucial for the "Circle" and "Scroll")
import "./css/OneOnOne.css";      // Provides 'ooo-photo-area' (The Color Circle!)
import "./css/ManageTeacher.css"; // Provides the main layout & search styles
import "./css/managetherapist.css"; 

const ManageTherapists = () => {
  const { currentUser } = useAuth();
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
  } = useManageTherapists();

  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTherapistId, setSelectedTherapistId] = useState(null);

  // Activation Modal State
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [newUserData, setNewUserData] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // 3. USE CACHED DATA (No duplicate reads)
  const { 
    data: assignedStudents = [], 
    isLoading: loadingStudents 
  } = useChildrenByStaff(selectedTherapistId);

  if (loading) return <Loading role="admin" message="Loading therapists" />;

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
      alert('Failed to create therapist: ' + result.error);
    }
  };

  const selectedTherapist = selectedTherapistId 
    ? therapists.find(t => t.uid === selectedTherapistId) 
    : null;
  // --- Specialization Handlers ---

  // Update a specific row's selection
  const handleSpecChange = (index, value) => {
    const updatedSpecs = [...newTherapist.specializations];
    updatedSpecs[index] = value;
    
    // Assuming you have access to set state, or you can create a custom update
    // If setNewTherapist is not available, you might need to update your hook
    // For now, this mimics a state update:
    newTherapist.specializations = updatedSpecs; 
    // forceUpdate or standard setState would go here. 
    // Ideally: setNewTherapist({ ...newTherapist, specializations: updatedSpecs });
  };

  // Add a new empty dropdown row
  const addSpecRow = () => {
    const updatedSpecs = [...newTherapist.specializations, ""];
    // Ideally: setNewTherapist({ ...newTherapist, specializations: updatedSpecs });
    // For direct mutation (if hook manages object ref):
    newTherapist.specializations = updatedSpecs;
  };

  // Remove a row
  const removeSpecRow = (index) => {
    const updatedSpecs = newTherapist.specializations.filter((_, i) => i !== index);
    // Ideally: setNewTherapist({ ...newTherapist, specializations: updatedSpecs });
    newTherapist.specializations = updatedSpecs;
  };

  return (
    <div className="ooo-container">
      <Sidebar {...getAdminConfig(isSuperAdmin)} />

      <div className="ooo-main">  
        {/* ================= HEADER ================= */}
        <div className="ooo-header">
          <div className="mt-header-wrapper">
            
            <div className="mt-header-left">
              {selectedTherapistId && (
                <span
                  className="mt-back-btn"
                  onClick={() => setSelectedTherapistId(null)}
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
    
                {/* FIXED: Passing the object 'therapist' instead of 'therapistId' */}
                <TherapistCard
                therapist={selectedTherapist}  
                serviceName="Therapist Profile"
              />

              {/* --- ENROLLED PATIENTS SECTION --- */}
              <div style={{ marginTop: '30px' }}>
                <h3 className="mt-section-title">
                  Assigned Patients ({assignedStudents.length})
                </h3>
                
                {loadingStudents ? (
                   <p style={{ color: '#666', fontStyle: 'italic' }}>Loading patients...</p>
                ) : assignedStudents.length === 0 ? (
                   <div className="mt-empty-state">
                     <p>No patients currently assigned to this therapist.</p>
                   </div>
                ) : (
                  // FIX: Using 'ooo-grid' + 'ooo-card' + 'ooo-photo-area'
                  // This combination gives you the exact UI and the CIRCLE PICTURE
                  <div className="ooo-grid">
                    {assignedStudents.map(student => (
                      <div key={student.id} className="ooo-card" style={{ cursor: 'default' }}>
                        
                        {/* THIS CLASS 'ooo-photo-area' MAKES THE COLORED CIRCLE! */}
                        <div className="ooo-photo-area">
                          {student.photoUrl ? <img src={student.photoUrl} alt="" /> : <span>📷</span>}
                        </div>
                        
                        <div className="ooo-card-info">
                          <p className="ooo-name">{student.firstName} {student.lastName}</p>
                          {/* Blue text for service name */}
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
                          alert("This therapist has not completed their profile yet.");
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
                              // NOTE: You need to update your state here. 
                              // Example: setNewTherapist({ ...newTherapist, specializations: updatedSpecs })
                              // If using the hook directly, ensure it triggers a re-render.
                              Object.assign(newTherapist, { specializations: updatedSpecs }); // Temporary mutation if setter missing
                              setNewUserData({ ...newUserData }); // Force re-render hack if needed, or preferably use proper setState
                            }}
                          >
                            <option value="" disabled>
                              Select Specialization
                            </option>
                            {services
                              .filter((service) => {
                                // Logic: Show option if it is the CURRENT value for this row
                                // OR if it is NOT used in any other row.
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
                            // NOTE: Update state here
                            // setNewTherapist({ ...newTherapist, specializations: updatedSpecs })
                            Object.assign(newTherapist, { specializations: updatedSpecs }); 
                            setNewUserData({ ...newUserData }); // Force update trigger
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

                    {/* Add Button - Only shows if there are available services left to pick */}
                    {services && newTherapist.specializations.length < services.length && (
                      <button
                        type="button"
                        onClick={() => {
                           const updatedSpecs = [...newTherapist.specializations, ""];
                           // NOTE: Update state here
                           // setNewTherapist({ ...newTherapist, specializations: updatedSpecs })
                           Object.assign(newTherapist, { specializations: updatedSpecs });
                           setNewUserData({ ...newUserData }); // Force update trigger
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
                    
                    {/* Fallback if no specs are added yet */}
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
      </div>
    </div>
  );
};

export default ManageTherapists;