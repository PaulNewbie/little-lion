import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import childService from '../../services/childService';
import Loading from '../../components/common/Loading';

const TherapistDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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

  const getServiceAssignment = (student) => {
    return student.therapyServices?.find(s => s.therapistId === currentUser.uid);
  };

  const handleStartSession = (student) => {
    const serviceAssignment = getServiceAssignment(student);
    if (!serviceAssignment) {
      alert("Error: You are not assigned to a specific service for this student.");
      return;
    }
    navigate('/therapist/session-form', { 
      state: { 
        child: student, 
        service: {
          id: serviceAssignment.serviceId,
          name: serviceAssignment.serviceName
        }
      } 
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) return <Loading />;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Navigation */}
      <div style={{ 
        backgroundColor: 'white', 
        borderBottom: '1px solid #e2e8f0',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.75rem' }}>🦁</span>
          <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b' }}>Little Lion</span>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <button 
            onClick={() => navigate('/staff/inquiries')}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#64748b',
              cursor: 'pointer',
              fontSize: '1.5rem',
              padding: '0.5rem',
              transition: 'color 0.2s'
            }}
            onMouseOver={e => e.target.style.color = '#3b82f6'}
            onMouseOut={e => e.target.style.color = '#64748b'}
          >
            📬
          </button>
          <button 
            onClick={handleLogout}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#ef4444',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              transition: 'background 0.2s'
            }}
            onMouseOver={e => e.target.style.backgroundColor = '#fee2e2'}
            onMouseOut={e => e.target.style.backgroundColor = 'transparent'}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        
        {/* Welcome Section */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ 
            fontSize: '2.25rem', 
            fontWeight: '700', 
            color: '#0f172a',
            margin: '0 0 0.5rem 0',
            lineHeight: '1.2'
          }}>
            {getGreeting()}, {currentUser?.firstName}! 👋
          </h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '1rem' }}>
            Ready to make a difference today
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem'
          }}>
            {error}
          </div>
        )}

        {/* Stats + Search Bar Row */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          
          {/* Caseload Card */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ 
                fontSize: '0.75rem', 
                fontWeight: '600', 
                color: '#64748b', 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em',
                marginBottom: '0.5rem'
              }}>
                My Caseload
              </div>
              <div style={{ fontSize: '3rem', fontWeight: '700', color: '#0f172a', lineHeight: '1' }}>
                {students.length}
              </div>
            </div>
            <div style={{ 
              fontSize: '3rem',
              opacity: 0.2
            }}>
              👨‍⚕️
            </div>
          </div>

          {/* Search Bar */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center'
          }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '1.25rem'
              }}>🔍</span>
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
                  transition: 'all 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.backgroundColor = 'white';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'transparent';
                  e.target.style.backgroundColor = '#f8fafc';
                }}
              />
            </div>
          </div>
        </div>

        {/* Students Grid */}
        {filteredStudents.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            backgroundColor: 'white',
            borderRadius: '1rem',
            border: '2px dashed #e2e8f0'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🦁</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b', margin: '0 0 0.5rem 0' }}>
              No students found
            </h3>
            <p style={{ color: '#64748b', margin: 0 }}>
              {searchTerm ? `No matches for "${searchTerm}"` : "You haven't been assigned any students yet."}
            </p>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                style={{
                  marginTop: '1rem',
                  color: '#3b82f6',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                  textDecoration: 'underline'
                }}
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: '1.5rem' 
          }}>
            {filteredStudents.map(student => {
              const myService = getServiceAssignment(student);
              
              return (
                <div 
                  key={student.id} 
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '1rem',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s',
                    border: '1px solid #f1f5f9'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                  }}
                >
                  {/* Header */}
                  <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.75rem',
                        overflow: 'hidden',
                        flexShrink: 0
                      }}>
                        {student.photoUrl ? (
                          <img src={student.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : '👤'}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h3 style={{ 
                          fontSize: '1.125rem', 
                          fontWeight: '700', 
                          color: '#0f172a',
                          margin: '0 0 0.25rem 0',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {student.firstName} {student.lastName}
                        </h3>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                          DOB: {student.dateOfBirth}
                        </p>
                      </div>
                    </div>
                    
                    {myService && (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.375rem 0.75rem',
                        backgroundColor: '#ede9fe',
                        color: '#6d28d9',
                        borderRadius: '1rem',
                        fontSize: '0.8125rem',
                        fontWeight: '600'
                      }}>
                        <span>🩺</span>
                        {myService.serviceName}
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div style={{ padding: '1.5rem' }}>
                    <div style={{
                      backgroundColor: '#f8fafc',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ 
                        fontSize: '0.6875rem', 
                        fontWeight: '600', 
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '0.5rem'
                      }}>
                        Medical Notes
                      </div>
                      <p style={{ 
                        fontSize: '0.875rem', 
                        color: '#475569', 
                        margin: 0,
                        lineHeight: '1.5',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {student.medicalInfo || <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>No notes available.</span>}
                      </p>
                    </div>

                    <button 
                      onClick={() => handleStartSession(student)}
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.75rem',
                        fontSize: '0.9375rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px rgba(102, 126, 234, 0.25)',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                      onMouseOver={e => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 8px 12px rgba(102, 126, 234, 0.35)';
                      }}
                      onMouseOut={e => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 6px rgba(102, 126, 234, 0.25)';
                      }}
                    >
                      <span>📝</span>
                      Start Session
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TherapistDashboard;