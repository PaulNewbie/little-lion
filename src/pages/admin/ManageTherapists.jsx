import React, { useState } from 'react';
import useManageTherapists from '../../hooks/useManageTherapists';
import AdminSidebar from "../../components/sidebar/AdminSidebar";
import TherapistCard from '../shared/TherapistCard';
import ActivationModal from '../../components/admin/ActivationModal';
import "./css/managetherapist.css";

const ManageTherapists = () => {
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

  // NEW: Activation Modal State
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [newUserData, setNewUserData] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  if (loading) return <div className="pg-loading">Loading therapists...</div>;

  const filteredTherapists = therapists.filter(t =>
    `${t.firstName} ${t.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // NEW: Handle form submit with activation modal
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

  return (
    <div className="ooo-container">
      <AdminSidebar />

      <div className="ooo-main">
        {/* ================= HEADER ================= */}
        <div className="ooo-header">
          <div className="header-row">
            <div className="header-left">
              {/* Back Button – ONLY shows on Therapist Info */}
              {selectedTherapistId && (
                <span
                  className="back-btn"
                  onClick={() => setSelectedTherapistId(null)}
                >
                  ‹
                </span>
              )}

              {/* Header text with conditional right shift */}
              <div
                className={`header-text ${selectedTherapistId ? 'detail-view-title' : ''}`}
              >
                <h1>
                  {selectedTherapistId
                    ? "THERAPIST PROFILE"
                    : "THERAPIST PROFILES"}
                </h1>

                {!selectedTherapistId && (
                  <p className="header-subtitle">
                    Add and Manage Therapist Accounts
                  </p>
                )}
              </div>
            </div>

            {/* Search – ONLY shows on list view */}
            {!selectedTherapistId && (
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search therapist name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        {error && <div className="error-box">⚠️ Error: {error}</div>}

        {/* ================= CONTENT ================= */}
        <div className="tera-content-area">
          {/* ========== DETAIL VIEW ========== */}
          {selectedTherapistId ? (
            <TherapistCard
              therapistId={selectedTherapistId}
              serviceName="Therapist Profile"
            />
          ) : (
            <>
              {/* ========== LIST VIEW ========== */}
              <h2 className="section-title">Therapist Accounts</h2>

              {filteredTherapists.length === 0 ? (
                <div className="empty-box">
                  <p>
                    {searchQuery
                      ? 'No therapists found matching your search.'
                      : 'No therapists yet. Click the button below to create one.'}
                  </p>
                </div>
              ) : (
                <div className="therapist-grid">
                  {filteredTherapists.map(t => (
                    <div
                      key={t.uid}
                      className={`therapist-card ${
                        !t.profileCompleted ? 'disabled-card' : ''
                      }`}
                      onClick={() => {
                        if (t.profileCompleted) {
                          setSelectedTherapistId(t.uid);
                        } else {
                          alert(
                            "This therapist has not completed their profile yet."
                          );
                        }
                      }}
                    >
                      {/* Avatar */}
                      <div className="avatar">
                        {t.profilePhoto ? (
                          <img src={t.profilePhoto} alt="" />
                        ) : (
                          '👤'
                        )}
                      </div>

                      <h3>{t.firstName} {t.lastName}</h3>

                      <span
                        className={`status-badge ${
                          t.profileCompleted ? 'complete' : 'incomplete'
                        }`}
                      >
                        {t.profileCompleted
                          ? '✅ Profile Active'
                          : '⚠️ Setup Pending'}
                      </span>

                      <div className="specializations">
                        {t.specializations?.length ? (
                          t.specializations.slice(0, 2).map((s, i) => (
                            <span key={i} className="spec-chip">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="no-spec">
                            No specializations
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* ================= FAB ================= */}
        <button className="fab" onClick={() => setShowForm(true)}>
          <span>+</span> THERAPIST
        </button>

        {/* ================= ADD THERAPIST FORM MODAL - UPDATED ================= */}
        {showForm && (
          <div
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '20px'
            }}
            onClick={() => setShowForm(false)}
          >
            <div
              style={{
                background: 'white', borderRadius: '16px', padding: '32px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)', maxWidth: '500px', width: '100%',
                maxHeight: '90vh', overflowY: 'auto', border: '4px solid #3b82f6'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 32px 0', textAlign: 'center' }}>
                ADD THERAPIST
              </h2>

              <form onSubmit={handleCreateTherapist}>
                {/* Personal Info Section */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#666', letterSpacing: '0.5px', marginBottom: '16px' }}>
                    Personal Information
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '12px' }}>Surname *</label>
                      <input name="lastName" placeholder="Surname" value={newTherapist.lastName} onChange={handleInputChange} required style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '12px' }}>First Name *</label>
                      <input name="firstName" placeholder="First name" value={newTherapist.firstName} onChange={handleInputChange} required style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '12px' }}>Middle Name</label>
                      <input name="middleName" placeholder="Middle name" value={newTherapist.middleName || ''} onChange={handleInputChange} style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                </div>

                {/* Account Info Section */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#666', letterSpacing: '0.5px', marginBottom: '16px' }}>
                    Account Information
                  </h3>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', color: '#000' }}>Email</label>
                    <div style={{ display: 'flex', alignItems: 'center', border: '2px solid #ddd', borderRadius: '24px', padding: '0 16px', background: 'white' }}>
                      <span style={{ fontSize: '20px', marginRight: '12px' }}>✉️</span>
                      <input name="email" type="email" placeholder="@gmail.com" value={newTherapist.email} onChange={handleInputChange} required style={{ flex: 1, padding: '12px 0', border: 'none', outline: 'none', fontSize: '14px', background: 'transparent' }} />
                    </div>
                  </div>

                  {/* Info box explaining activation - REPLACES password field */}
                  <div style={{
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '13px',
                    color: '#0369a1'
                  }}>
                    <strong>ℹ️ How it works:</strong>
                    <p style={{ margin: '4px 0 0 0' }}>
                      After creating the account, a QR code will appear. 
                      The therapist can scan it to set up their password and complete their profile.
                    </p>
                  </div>
                </div>

                {/* Specialization Section */}
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#666', letterSpacing: '0.5px', marginBottom: '16px' }}>Specialization</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                    {services && services.length > 0 ? (
                      services.map(s => (
                        <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={newTherapist.specializations.includes(s.name)} onChange={() => toggleSpecialization(s.name)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                          <span style={{ fontSize: '13px', fontWeight: '600' }}>{s.name.toUpperCase()}</span>
                        </label>
                      ))
                    ) : (
                      <p style={{ fontSize: '13px', color: '#666' }}>No specializations available</p>
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

        {/* NEW: Activation Modal */}
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