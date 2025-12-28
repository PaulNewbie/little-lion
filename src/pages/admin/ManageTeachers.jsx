import React, { useState } from 'react';
import useManageTeachers from '../../hooks/useManageTeachers';
import AdminSidebar from "../../components/sidebar/AdminSidebar";
import "./css/OneOnOne.css";

const ManageTeachers = () => {
const { teachers, loading, error, createTeacher, newTeacher, handleInputChange, toggleSpecialization, services } = useManageTeachers();
  
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (loading) return <div className="pg-loading">Loading teachers...</div>;

  // Filter teachers based on search query
  const filteredTeachers = teachers.filter(teacher =>
    `${teacher.firstName} ${teacher.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="ooo-container">
      <AdminSidebar />
      <div className="ooo-main">
        
        {/* Header with Search */}
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
              Teacher Accounts
            </h2>
          </div>

          {/* Teacher Cards Grid */}
          {filteredTeachers.length === 0 ? (
            <div style={{ 
              padding: '48px 24px', 
              textAlign: 'center', 
              color: '#666',
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #eee'
            }}>
              <p style={{ fontSize: '14px', marginBottom: '8px' }}>
                {searchQuery ? 'No teachers found matching your search.' : 'No teachers yet. Click the button below to create one.'}
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '16px',
              marginBottom: '40px'
            }}>
              {filteredTeachers.map(teacher => (
                <div
                  key={teacher.uid}
                  style={{
                    background: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    background: '#e5e7eb',
                    borderRadius: '8px',
                    width: '80px',
                    height: '80px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                    fontSize: '36px'
                  }}>
                    👤
                  </div>

                  {/* Teacher Name */}
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    margin: '8px 0',
                    color: '#1f2937'
                  }}>
                    {teacher.lastName}, {teacher.firstName}
                  </h3>

                  {/* Specializations */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px',
                    justifyContent: 'center',
                    marginTop: '8px'
                  }}>
                    {teacher.specializations && teacher.specializations.length > 0 ? (
                      teacher.specializations.slice(0, 2).map((spec, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: '2px 8px',
                            background: '#dbeafe',
                            color: '#1e40af',
                            fontSize: '11px',
                            borderRadius: '12px',
                            fontWeight: '500'
                          }}
                        >
                          {spec}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '11px', color: '#999' }}>No specializations</span>
                    )}
                    {teacher.specializations && teacher.specializations.length > 2 && (
                      <span style={{
                        padding: '2px 6px',
                        fontSize: '11px',
                        color: '#666'
                      }}>
                        +{teacher.specializations.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FAB Button */}
        <button
          onClick={() => setShowForm(true)}
          style={{
            position: 'fixed',
            bottom: '32px',
            right: '32px',
            background: '#fbbf24',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            padding: '16px 24px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(251, 191, 36, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s',
            zIndex: 40
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(251, 191, 36, 0.5)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(251, 191, 36, 0.4)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <span style={{ fontSize: '18px' }}>+</span> ADD TEACHER
        </button>

        {/* Modal Overlay */}
        {showForm && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
              padding: '20px'
            }}
            onClick={() => setShowForm(false)}
          >
            {/* Modal Card */}
            <div
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '32px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
                maxWidth: '500px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                border: '4px solid #3b82f6'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 32px 0', textAlign: 'center' }}>
                ADD TEACHER
              </h2>

              <form onSubmit={(e) => { createTeacher(e); setShowForm(false); }}>
                {/* Personal Info Section */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#666', letterSpacing: '0.5px', marginBottom: '16px' }}>
                    Personal Information
                  </h3>

                  {/* First Row - Last Name & First Name & Middle Name */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '12px' }}>
                        Surname *
                      </label>
                      <input
                        name="lastName"
                        placeholder="Surname"
                        value={newTeacher.lastName}
                        onChange={handleInputChange}
                        required
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          fontSize: '13px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '12px' }}>
                        First Name *
                      </label>
                      <input
                        name="firstName"
                        placeholder="First name"
                        value={newTeacher.firstName}
                        onChange={handleInputChange}
                        required
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          fontSize: '13px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '12px' }}>
                        Middle Name
                      </label>
                      <input
                        name="middleName"
                        placeholder="Middle name"
                        value={newTeacher.middleName || ''}
                        onChange={handleInputChange}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          fontSize: '13px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Account Info Section */}
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#666', letterSpacing: '0.5px', marginBottom: '16px' }}>
                    Account Information
                  </h3>

                  {/* Email Field */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', color: '#000' }}>
                      Email
                    </label>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      border: '2px solid #ddd',
                      borderRadius: '24px',
                      padding: '0 16px',
                      background: 'white'
                    }}>
                      <span style={{ fontSize: '20px', marginRight: '12px' }}>✉️</span>
                      <input
                        name="email"
                        type="email"
                        placeholder="@gmail.com"
                        value={newTeacher.email}
                        onChange={handleInputChange}
                        required
                        style={{
                          flex: 1,
                          padding: '12px 0',
                          border: 'none',
                          outline: 'none',
                          fontSize: '14px',
                          background: 'transparent'
                        }}
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', color: '#000' }}>
                      Password
                    </label>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      border: '2px solid #ddd',
                      borderRadius: '24px',
                      padding: '0 16px',
                      background: 'white'
                    }}>
                      <span style={{ fontSize: '20px', marginRight: '12px' }}>🔒</span>
                      <input
                        name="password"
                        value={newTeacher.password}
                        readOnly
                        style={{
                          flex: 1,
                          padding: '12px 0',
                          border: 'none',
                          outline: 'none',
                          fontSize: '14px',
                          background: 'transparent',
                          color: '#666'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Specialization Section */}
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#666', letterSpacing: '0.5px', marginBottom: '16px' }}>
                    Specialization
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: '12px'
                  }}>
                    {services && services.length > 0 ? (
                      services.map(s => (
                        <label
                          key={s.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={newTeacher.specializations.includes(s.name)}
                            onChange={() => toggleSpecialization(s.name)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '13px', fontWeight: '600' }}>
                            {s.name.toUpperCase()}
                          </span>
                        </label>
                      ))
                    ) : (
                      <p style={{ fontSize: '13px', color: '#666' }}>No specializations available</p>
                    )}
                  </div>
                </div>

                {/* Hidden Phone Field */}
                <div style={{ display: 'none' }}>
                  <input
                    name="phone"
                    value={newTeacher.phone}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    style={{
                      flex: 1,
                      background: 'white',
                      color: '#000',
                      padding: '12px 24px',
                      border: '2px solid #000',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f5f5f5';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      background: '#fbbf24',
                      color: 'white',
                      padding: '12px 24px',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f59e0b';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#fbbf24';
                    }}
                  >
                    Add Teacher
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageTeachers;