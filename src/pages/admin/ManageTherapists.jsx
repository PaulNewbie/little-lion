import React, { useState } from 'react';
import useManageTherapists from '../../hooks/useManageTherapists';
import AdminSidebar from "../../components/sidebar/AdminSidebar";
import TherapistCard from '../shared/TherapistCard'; // ✅ Import the card
import "./css/OneOnOne.css";

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
    // deleteTherapist // Uncomment if you need delete functionality
  } = useManageTherapists();
  
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // ✅ NEW: State for Profile View Modal
  const [selectedTherapistId, setSelectedTherapistId] = useState(null);

  if (loading) return <div className="pg-loading">Loading therapists...</div>;

  // Filter therapists based on search query
  const filteredTherapists = therapists.filter(therapist =>
    `${therapist.firstName} ${therapist.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    therapist.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="ooo-container">
      <AdminSidebar />
      <div className="ooo-main">
        
        {/* Header with Search */}
        <div className="ooo-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '20px' }}>
            <div className="header-title">
              <h1>THERAPIST PROFILES</h1>
              <p className="header-subtitle">Add and Manage Therapist Accounts</p>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'white',
              border: '1px solid #ddd',
              borderRadius: '24px',
              padding: '8px 16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              minWidth: '250px'
            }}>
              <span style={{ fontSize: '18px' }}>🔍</span>
              <input
                type="text"
                placeholder="Search therapist name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  background: 'transparent'
                }}
              />
            </div>
          </div>
        </div>

        {error && (
          <div style={{ 
            background: '#fee', 
            border: '1px solid #fcc', 
            color: '#c00', 
            padding: '12px 16px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            marginLeft: '24px',
            marginRight: '24px'
          }}>
            ⚠️ Error: {error}
          </div>
        )}

        <div className="ooo-content-area">
          {/* Section Title */}
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', color: '#374151', letterSpacing: '0.5px', margin: '0 0 16px 0' }}>
              Therapist Accounts
            </h2>
          </div>

          {/* Therapist Cards Grid */}
          {filteredTherapists.length === 0 ? (
            <div style={{ 
              padding: '48px 24px', 
              textAlign: 'center', 
              color: '#666',
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #eee'
            }}>
              <p style={{ fontSize: '14px', marginBottom: '8px' }}>
                {searchQuery ? 'No therapists found matching your search.' : 'No therapists yet. Click the button below to create one.'}
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', // Widened slightly
              gap: '16px',
              marginBottom: '40px'
            }}>
              {filteredTherapists.map(therapist => (
                <div
                  key={therapist.uid}
                  style={{
                    background: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '260px' // Ensure uniform height
                  }}
                >
                  {/* Content Container */}
                  <div>
                     {/* ✅ Profile Status Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: therapist.profileCompleted ? '#22c55e' : '#f59e0b',
                      border: '2px solid white',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      cursor: 'help'
                    }} title={therapist.profileCompleted ? "Profile Complete" : "Profile Incomplete"} />

                    {/* Avatar */}
                    <div style={{
                      background: '#e5e7eb',
                      borderRadius: '50%', // Circular avatar
                      width: '80px',
                      height: '80px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                      fontSize: '36px',
                      overflow: 'hidden',
                      border: '3px solid white',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                    }}>
                      {therapist.profilePhoto ? (
                        <img src={therapist.profilePhoto} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                      ) : (
                        '👤'
                      )}
                    </div>

                    {/* Therapist Name */}
                    <h3 style={{
                      fontSize: '15px',
                      fontWeight: '700',
                      margin: '8px 0 4px',
                      color: '#1f2937'
                    }}>
                      {therapist.firstName} {therapist.lastName}
                    </h3>
                    
                    {/* Status Text */}
                    <div style={{ fontSize: '11px', color: therapist.profileCompleted ? '#166534' : '#92400e', marginBottom: '8px', fontWeight: '600', backgroundColor: therapist.profileCompleted ? '#dcfce7' : '#fef3c7', display: 'inline-block', padding: '2px 8px', borderRadius: '10px' }}>
                      {therapist.profileCompleted ? '✅ Profile Active' : '⚠️ Setup Pending'}
                    </div>

                    {/* Specializations */}
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '4px',
                      justifyContent: 'center',
                      marginTop: '8px'
                    }}>
                      {therapist.specializations && therapist.specializations.length > 0 ? (
                        therapist.specializations.slice(0, 2).map((spec, idx) => (
                          <span
                            key={idx}
                            style={{
                              padding: '2px 8px',
                              background: '#f3f4f6',
                              color: '#4b5563',
                              fontSize: '11px',
                              borderRadius: '12px',
                              fontWeight: '500',
                              border: '1px solid #e5e7eb'
                            }}
                          >
                            {spec}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '11px', color: '#999' }}>No specializations</span>
                      )}
                    </div>
                  </div>

                  {/* ✅ View Profile Button */}
                  <button
                    onClick={() => {
                      if (therapist.profileCompleted) {
                        setSelectedTherapistId(therapist.uid);
                      } else {
                        alert("This therapist has not completed their profile yet.");
                      }
                    }}
                    style={{
                      marginTop: '16px',
                      padding: '8px',
                      width: '100%',
                      borderRadius: '6px',
                      border: therapist.profileCompleted ? '1px solid #3b82f6' : '1px dashed #d1d5db',
                      background: therapist.profileCompleted ? '#eff6ff' : '#f9fafb',
                      color: therapist.profileCompleted ? '#2563eb' : '#9ca3af',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: therapist.profileCompleted ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s'
                    }}
                  >
                    {therapist.profileCompleted ? 'View Public Profile' : 'Incomplete Profile'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FAB Button */}
        <button
          onClick={() => setShowForm(true)}
          style={{
            position: 'fixed', bottom: '32px', right: '32px', background: '#fbbf24', color: 'white',
            border: 'none', borderRadius: '50px', padding: '16px 24px', fontSize: '14px', fontWeight: '600',
            cursor: 'pointer', boxShadow: '0 4px 12px rgba(251, 191, 36, 0.4)', display: 'flex', alignItems: 'center',
            gap: '8px', transition: 'all 0.3s', zIndex: 40
          }}
        >
          <span style={{ fontSize: '18px' }}>+</span> ADD THERAPIST
        </button>

        {/* ✅ Profile View Modal */}
        {selectedTherapistId && (
          <div
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', zIndex: 60,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
            }}
            onClick={() => setSelectedTherapistId(null)}
          >
            <div onClick={e => e.stopPropagation()} style={{ position: 'relative', width: '100%', maxWidth: '450px' }}>
              <button 
                onClick={() => setSelectedTherapistId(null)}
                style={{
                  position: 'absolute', top: '-12px', right: '-12px', background: 'white', border: 'none',
                  borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)', fontSize: '16px', fontWeight: 'bold', color: '#666', zIndex: 10
                }}
              >
                ✕
              </button>
              {/* Reuse the existing card component */}
              <TherapistCard 
                therapistId={selectedTherapistId} 
                serviceName="Professional Profile Preview" 
              />
            </div>
          </div>
        )}

        {/* Add Therapist Form Modal (Existing) */}
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

              <form onSubmit={(e) => { createTherapist(e); setShowForm(false); }}>
                {/* Personal Info Section */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#666', letterSpacing: '0.5px', marginBottom: '16px' }}>
                    Personal Information
                  </h3>

                  {/* First Row - Last Name & First Name & Middle Name */}
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
                <div style={{ marginBottom: '32px' }}>
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
                  <div>
                    <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', color: '#000' }}>Password</label>
                    <div style={{ display: 'flex', alignItems: 'center', border: '2px solid #ddd', borderRadius: '24px', padding: '0 16px', background: 'white' }}>
                      <span style={{ fontSize: '20px', marginRight: '12px' }}>🔒</span>
                      <input name="password" value={newTherapist.password} readOnly style={{ flex: 1, padding: '12px 0', border: 'none', outline: 'none', fontSize: '14px', background: 'transparent', color: '#666' }} />
                    </div>
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
                  <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, background: 'white', color: '#000', padding: '12px 24px', border: '2px solid #000', borderRadius: '6px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase', transition: 'all 0.2s' }}>Cancel</button>
                  <button type="submit" style={{ flex: 1, background: '#fbbf24', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase', transition: 'all 0.2s' }}>Add Therapist</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageTherapists;