import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import childService from '../../services/childService';
import Loading from '../../components/common/Loading';

// Therapist Sidebar Component - Matching the uploaded design
const TherapistSidebar = ({ currentUser, onLogout, onNavigate }) => {
  return (
    <div style={{
      width: '360px',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      top: 0,
      height: '100vh',
      padding: '2rem 1.5rem'
    }}>
      {/* User Profile Section */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '3rem'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          border: '4px solid #FDB913',
          background: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.5rem'
        }}>
          👨‍⚕️
        </div>
        <div>
          <div style={{ 
            fontSize: '0.875rem', 
            color: '#888', 
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '0.25rem'
          }}>
            THERAPIST
          </div>
          <div style={{ 
            fontSize: '1.5rem', 
            fontWeight: '700', 
            color: '#1565C0'
          }}>
            {currentUser?.firstName || 'Therapist'}
          </div>
        </div>
      </div>

      {/* MAIN Section */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{
          fontSize: '0.75rem',
          fontWeight: '700',
          color: '#999',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '1rem'
        }}>
          MAIN
        </div>

        <button
          onClick={() => onNavigate('/therapist/dashboard')}
          style={{
            width: '100%',
            padding: '1rem 1.5rem',
            backgroundColor: '#FDB913',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            fontSize: '1rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            marginBottom: '0.75rem',
            boxShadow: '0 4px 12px rgba(253, 185, 19, 0.3)',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(253, 185, 19, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(253, 185, 19, 0.3)';
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
          <span>MY STUDENTS</span>
        </button>

        <button
          onClick={() => onNavigate('/therapist/profile')}
          style={{
            width: '100%',
            padding: '1rem 1.5rem',
            backgroundColor: 'white',
            border: 'none',
            borderRadius: '12px',
            color: '#1565C0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            fontSize: '1rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            marginBottom: '0.75rem',
            position: 'relative',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#f0f0f0';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#1565C0">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
          <span>MY PROFILE</span>
          {currentUser?.profileCompleted === false && (
            <span style={{
              width: '10px',
              height: '10px',
              backgroundColor: '#EF5350',
              borderRadius: '50%',
              position: 'absolute',
              right: '1.5rem'
            }}></span>
          )}
        </button>

        <button
          onClick={() => onNavigate('/staff/inquiries')}
          style={{
            width: '100%',
            padding: '1rem 1.5rem',
            backgroundColor: 'white',
            border: 'none',
            borderRadius: '12px',
            color: '#1565C0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            fontSize: '1rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#f0f0f0';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#1565C0">
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
          </svg>
          <span>INQUIRIES</span>
        </button>
      </div>

      {/* Spacer to push logout to bottom */}
      <div style={{ flex: 1 }}></div>

      {/* Logout Button */}
      <button
        onClick={onLogout}
        style={{
          width: '100%',
          padding: '1rem',
          backgroundColor: '#EF5350',
          border: 'none',
          borderRadius: '12px',
          color: 'white',
          cursor: 'pointer',
          fontSize: '1rem',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          transition: 'all 0.2s',
          boxShadow: '0 4px 12px rgba(239, 83, 80, 0.3)'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#E53935';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 83, 80, 0.4)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = '#EF5350';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 83, 80, 0.3)';
        }}
      >
        LOG OUT
      </button>
    </div>
  );
};

const TherapistDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Service Selection Modal State
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedStudentForModal, setSelectedStudentForModal] = useState(null);
  const [availableServices, setAvailableServices] = useState([]);

  // ✅ Profile Completion Check
  useEffect(() => {
    if (currentUser && currentUser.profileCompleted === false) {
      const timer = setTimeout(() => {
        const shouldComplete = window.confirm(
          "📋 Complete your professional profile to help parents know you better.\n\nWould you like to do it now?"
        );
        if (shouldComplete) {
          navigate('/therapist/profile');
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    const fetchMyStudents = async () => {
      if (!currentUser?.uid) return;
      try {
        setLoading(true);
        const myStudents = await childService.getChildrenByTherapistId(currentUser.uid);
        setStudents(myStudents);
      } catch (err) {
        setError('Failed to load assigned students.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyStudents();
  }, [currentUser]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => 
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getMyServices = (student) => {
    const allServices = student.enrolledServices || [
      ...(student.therapyServices || []),
      ...(student.services || []) 
    ];

    return allServices.filter(s => 
      (s.staffId === currentUser.uid) || (s.therapistId === currentUser.uid)
    );
  };

  const handleStartSessionClick = (student) => {
    const myServices = getMyServices(student);

    if (myServices.length === 0) {
      alert("Error: You are not assigned to any services for this student.");
      return;
    }

    if (myServices.length === 1) {
      goToSessionForm(student, myServices[0]);
    } else {
      setSelectedStudentForModal(student);
      setAvailableServices(myServices);
      setShowServiceModal(true);
    }
  };

  const goToSessionForm = (student, serviceAssignment) => {
    navigate('/therapist/session-form', { 
      state: { 
        child: student, 
        service: {
          id: serviceAssignment.serviceId,
          name: serviceAssignment.serviceName
        }
      } 
    });
    setShowServiceModal(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) return <Loading />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Sidebar */}
      <TherapistSidebar 
        currentUser={currentUser}
        onLogout={handleLogout}
        onNavigate={navigate}
      />

      {/* Main Content */}
      <div style={{ flex: 1, padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Welcome */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.5rem 0' }}>
            {getGreeting()}, {currentUser?.firstName}! 👋
          </h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '1rem' }}>Ready to make a difference today</p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        {/* ✅ Profile Completion Banner */}
        {currentUser?.profileCompleted === false && (
          <div style={{
            backgroundColor: '#fef3c7',
            border: '2px solid #fbbf24',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 6px rgba(251, 191, 36, 0.1)'
          }}>
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#92400e', fontSize: '1.125rem', fontWeight: '700' }}>
                📋 Complete Your Profile
              </h3>
              <p style={{ margin: 0, color: '#78350f', fontSize: '0.9375rem' }}>
                Help parents know you better by adding your credentials, bio, and certifications.
              </p>
            </div>
            <button
              onClick={() => navigate('/therapist/profile')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#fbbf24',
                color: '#78350f',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontSize: '0.9375rem'
              }}
            >
              Complete Now →
            </button>
          </div>
        )}

        {/* Stats & Search */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                My Caseload
              </div>
              <div style={{ fontSize: '3rem', fontWeight: '700', color: '#0f172a', lineHeight: '1' }}>
                {students.length}
              </div>
            </div>
            <div style={{ fontSize: '3rem', opacity: 0.2 }}>👨‍⚕️</div>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.25rem' }}>🔍</span>
              <input 
                type="text" 
                placeholder="Search students..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%', 
                  paddingLeft: '3rem', 
                  paddingRight: '1rem', 
                  paddingTop: '0.75rem', 
                  paddingBottom: '0.75rem',
                  backgroundColor: '#f8fafc', 
                  border: '2px solid transparent', 
                  borderRadius: '0.75rem', 
                  fontSize: '1rem', 
                  outline: 'none', 
                  boxSizing: 'border-box'
                }}
                onFocus={e => e.target.style.backgroundColor = 'white'}
                onBlur={e => e.target.style.backgroundColor = '#f8fafc'}
              />
            </div>
          </div>
        </div>

        {/* Students List */}
        {filteredStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'white', borderRadius: '1rem', border: '2px dashed #e2e8f0' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b' }}>No students found</h3>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {filteredStudents.map(student => {
              const myServices = getMyServices(student);
              return (
                <div key={student.id} style={{ backgroundColor: 'white', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9' }}>
                  <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', color: 'white' }}>
                        {student.photoUrl ? <img src={student.photoUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : '👤'}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                          {student.firstName} {student.lastName}
                        </h3>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                          DOB: {student.dateOfBirth}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {myServices.map((svc, idx) => (
                        <div key={idx} style={{ padding: '0.375rem 0.75rem', backgroundColor: '#ede9fe', color: '#6d28d9', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '600' }}>
                          {svc.serviceName}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ padding: '1.5rem' }}>
                    <button 
                      onClick={() => handleStartSessionClick(student)}
                      style={{
                        width: '100%', 
                        padding: '0.875rem', 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '0.75rem', 
                        fontSize: '0.9375rem', 
                        fontWeight: '700', 
                        cursor: 'pointer'
                      }}
                    >
                      📝 Start Session
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Service Selection Modal */}
      {showServiceModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '2rem', width: '90%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', marginTop: 0 }}>Select Service</h3>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              Which session are you starting for <strong>{selectedStudentForModal?.firstName}</strong>?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {availableServices.map((service) => (
                <button
                  key={service.serviceId}
                  onClick={() => goToSessionForm(selectedStudentForModal, service)}
                  style={{
                    padding: '1rem', 
                    border: '2px solid #e2e8f0', 
                    borderRadius: '0.75rem', 
                    backgroundColor: 'white', 
                    color: '#0f172a', 
                    fontWeight: '600', 
                    cursor: 'pointer', 
                    textAlign: 'left', 
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={e => { 
                    e.target.style.borderColor = '#6d28d9'; 
                    e.target.style.backgroundColor = '#f5f3ff'; 
                  }}
                  onMouseOut={e => { 
                    e.target.style.borderColor = '#e2e8f0'; 
                    e.target.style.backgroundColor = 'white'; 
                  }}
                >
                  {service.serviceName}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowServiceModal(false)} 
              style={{ 
                marginTop: '1.5rem', 
                width: '100%', 
                padding: '0.75rem', 
                backgroundColor: 'transparent', 
                border: 'none', 
                color: '#64748b', 
                cursor: 'pointer', 
                fontWeight: '600' 
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TherapistDashboard;