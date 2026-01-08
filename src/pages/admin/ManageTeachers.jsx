// src/pages/admin/ManageTeachers.jsx

import React, { useState } from 'react';
import useManageTeachers from '../../hooks/useManageTeachers';
import AdminSidebar from "../../components/sidebar/AdminSidebar";
import TherapistCard from '../shared/TherapistCard';
import ActivationModal from '../../components/admin/ActivationModal';
import "./css/OneOnOne.css";

const ManageTeachers = () => {
  const { 
    teachers, 
    loading, 
    error, 
    createTeacher, 
    newTeacher, 
    handleInputChange, 
    toggleSpecialization, 
    services 
  } = useManageTeachers();
  
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for Profile View Modal
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);

  // NEW: Activation Modal State
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [newUserData, setNewUserData] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  if (loading) return <div className="pg-loading">Loading teachers...</div>;

  // Filter teachers based on search query
  const filteredTeachers = teachers.filter(teacher =>
    `${teacher.firstName} ${teacher.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // UPDATED: Handle form submit with activation modal
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
      <AdminSidebar />
      <div className="ooo-main">
        
        {/* Header with Search - ORIGINAL */}
        <div className="ooo-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '20px' }}>
            <div className="header-title">
              <h1>TEACHER PROFILES</h1>
              <p className="header-subtitle">Add and Manage Teacher Accounts</p>
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
                placeholder="Search teacher name..."
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
            background: '#fee', border: '1px solid #fcc', color: '#c00', 
            padding: '12px 16px', borderRadius: '8px', marginBottom: '20px',
            marginLeft: '24px', marginRight: '24px'
          }}>
            ⚠️ Error: {error}
          </div>
        )}

        {/* Content - ORIGINAL UI PRESERVED */}
        <div className="ooo-content-area">
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', color: '#374151', letterSpacing: '0.5px', margin: '0 0 16px 0' }}>
              Teacher Accounts
            </h2>
          </div>

          {filteredTeachers.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: '#666', background: 'white', borderRadius: '8px', border: '1px solid #eee' }}>
              <p style={{ fontSize: '14px' }}>
                {searchQuery ? 'No teachers found matching your search.' : 'No teachers yet.'}
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '16px',
              marginBottom: '40px'
            }}>
              {filteredTeachers.map(teacher => (
                <div
                  key={teacher.uid}
                  style={{
                    background: 'white', border: '1px solid #ddd', borderRadius: '8px',
                    padding: '16px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    position: 'relative', display: 'flex', flexDirection: 'column', 
                    justifyContent: 'space-between', minHeight: '260px'
                  }}
                >
                  <div>
                    {/* Status Badge */}
                    <div style={{
                      position: 'absolute', top: '10px', right: '10px', width: '12px', height: '12px',
                      borderRadius: '50%', border: '2px solid white',
                      backgroundColor: teacher.profileCompleted ? '#22c55e' : '#f59e0b',
                    }} title={teacher.profileCompleted ? "Profile Complete" : "Profile Incomplete"} />

                    {/* Avatar */}
                    <div style={{
                      background: '#e5e7eb', borderRadius: '50%', width: '80px', height: '80px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 12px', fontSize: '36px', overflow: 'hidden'
                    }}>
                      {teacher.profilePhoto ? <img src={teacher.profilePhoto} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : '👤'}
                    </div>

                    <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '8px 0 4px', color: '#1f2937' }}>
                      {teacher.firstName} {teacher.lastName}
                    </h3>
                    
                    {/* Status Text */}
                    <div style={{ 
                      fontSize: '11px', fontWeight: '600', display: 'inline-block', padding: '2px 8px', borderRadius: '10px',
                      color: teacher.profileCompleted ? '#166534' : '#92400e', 
                      backgroundColor: teacher.profileCompleted ? '#dcfce7' : '#fef3c7'
                    }}>
                      {teacher.profileCompleted ? '✅ Profile Active' : '⚠️ Setup Pending'}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center', marginTop: '12px' }}>
                      {teacher.specializations?.slice(0, 2).map((spec, idx) => (
                        <span key={idx} style={{ padding: '2px 8px', background: '#f3f4f6', color: '#4b5563', fontSize: '11px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* View Profile Button */}
                  <button
                    onClick={() => {
                      if (teacher.profileCompleted) setSelectedTeacherId(teacher.uid);
                      else alert("This teacher has not completed their profile yet.");
                    }}
                    style={{
                      marginTop: '16px', padding: '8px', width: '100%', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                      border: teacher.profileCompleted ? '1px solid #3b82f6' : '1px dashed #d1d5db',
                      background: teacher.profileCompleted ? '#eff6ff' : '#f9fafb',
                      color: teacher.profileCompleted ? '#2563eb' : '#9ca3af',
                      cursor: teacher.profileCompleted ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {teacher.profileCompleted ? 'View Full Profile' : 'Incomplete Profile'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FAB Button - ORIGINAL */}
        <button
          onClick={() => setShowForm(true)}
          style={{
            position: 'fixed', bottom: '32px', right: '32px', background: '#fbbf24', color: 'white',
            border: 'none', borderRadius: '50px', padding: '16px 24px', fontSize: '14px', fontWeight: '600',
            cursor: 'pointer', boxShadow: '0 4px 12px rgba(251, 191, 36, 0.4)', zIndex: 40
          }}
        >
          + ADD TEACHER
        </button>

        {/* Profile View Modal - ORIGINAL */}
        {selectedTeacherId && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
            onClick={() => setSelectedTeacherId(null)}
          >
            <div onClick={e => e.stopPropagation()} style={{ position: 'relative', width: '100%', maxWidth: '450px' }}>
              <button 
                onClick={() => setSelectedTeacherId(null)}
                style={{ position: 'absolute', top: '-12px', right: '-12px', background: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', zIndex: 10 }}
              >✕</button>
              <TherapistCard therapistId={selectedTeacherId} serviceName="Teacher Information Profile" />
            </div>
          </div>
        )}

        {/* Modal for Creating New Teacher Account - UPDATED: No password! */}
        {showForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '20px' }} onClick={() => setShowForm(false)}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '500px', width: '100%', border: '4px solid #3b82f6' }} onClick={(e) => e.stopPropagation()}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '32px', textAlign: 'center' }}>ADD TEACHER</h2>
              
              <form onSubmit={handleCreateTeacher}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
                  <input 
                    name="lastName" 
                    placeholder="Surname *" 
                    value={newTeacher.lastName} 
                    onChange={handleInputChange} 
                    required 
                    style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} 
                  />
                  <input 
                    name="firstName" 
                    placeholder="First Name *" 
                    value={newTeacher.firstName} 
                    onChange={handleInputChange} 
                    required 
                    style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} 
                  />
                </div>
                
                <input 
                  name="email" 
                  type="email" 
                  placeholder="Email Address *" 
                  value={newTeacher.email} 
                  onChange={handleInputChange} 
                  required 
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', marginBottom: '16px', boxSizing: 'border-box' }} 
                />

                {/* Info box explaining activation - REPLACES password field */}
                <div style={{
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '6px',
                  padding: '12px',
                  marginBottom: '16px',
                  fontSize: '13px',
                  color: '#0369a1'
                }}>
                  <strong>ℹ️ How it works:</strong>
                  <p style={{ margin: '4px 0 0 0' }}>
                    After creating the account, a QR code will appear. 
                    The teacher can scan it to set up their password and complete their profile.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    type="button" 
                    onClick={() => setShowForm(false)} 
                    disabled={isCreating}
                    style={{ flex: 1, padding: '12px', border: '1px solid #000', borderRadius: '6px', fontWeight: '700', background: 'white', cursor: 'pointer' }}
                  >
                    CANCEL
                  </button>
                  <button 
                    type="submit" 
                    disabled={isCreating}
                    style={{ flex: 1, padding: '12px', background: isCreating ? '#fcd34d' : '#fbbf24', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: isCreating ? 'not-allowed' : 'pointer' }}
                  >
                    {isCreating ? 'CREATING...' : 'CREATE ACCOUNT'}
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

export default ManageTeachers;