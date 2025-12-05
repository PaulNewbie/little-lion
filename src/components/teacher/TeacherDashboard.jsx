import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import childService from '../../services/childService';
import Loading from '../common/Loading';
import ErrorMessage from '../common/ErrorMessage';

const TeacherDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMyStudents = async () => {
      try {
        // Check if the teacher has a specialization assigned
        // Note: You need to ensure the teacher user doc has a 'specialization' field in Firestore
        const teacherService = currentUser?.specialization;

        if (teacherService) {
          const data = await childService.getChildrenByService(teacherService);
          setStudents(data);
        } else {
          // Fallback or info if no specialization is set
          console.log("No specialization assigned to this teacher account.");
        }
      } catch (err) {
        setError('Failed to load assigned students.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchMyStudents();
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  if (loading) return <Loading />;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px',
        borderBottom: '1px solid #eee',
        paddingBottom: '20px'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#333' }}>Teacher Dashboard</h1>
          <p style={{ margin: '5px 0 0', color: '#666' }}>
            {currentUser?.firstName} {currentUser?.lastName} — 
            <span style={{ 
              backgroundColor: '#e3f2fd', 
              color: '#0d47a1', 
              padding: '2px 8px', 
              borderRadius: '12px', 
              fontSize: '0.9em',
              marginLeft: '8px',
              fontWeight: 'bold'
            }}>
              {currentUser?.specialization || 'No Specialization Assigned'}
            </span>
          </p>
        </div>
        <button 
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>

      <ErrorMessage message={error} />

      {/* Content Area */}
      <h2 style={{ color: '#444', marginBottom: '20px' }}>My Assigned Students</h2>

      {!currentUser?.specialization && (
        <div style={{ padding: '20px', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '4px' }}>
          ⚠️ Your account does not have a specialization assigned. Please contact the Administrator.
        </div>
      )}

      {students.length === 0 && currentUser?.specialization ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          No students are currently enrolled in {currentUser.specialization}.
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '20px' 
        }}>
          {students.map(student => (
            <div key={student.id} style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              border: '1px solid #eee'
            }}>
              <div style={{ padding: '20px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  backgroundColor: '#ddd', 
                  borderRadius: '50%', 
                  margin: '0 auto 15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  color: '#666'
                }}>
                  {/* Photo Placeholder */}
                  {student.photoUrl ? (
                    <img src={student.photoUrl} alt={student.firstName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    student.firstName.charAt(0)
                  )}
                </div>
                <h3 style={{ margin: 0, color: '#333' }}>{student.firstName} {student.lastName}</h3>
              </div>

              <div style={{ padding: '15px' }}>
                <div style={{ marginBottom: '10px', fontSize: '14px' }}>
                  <strong>Service:</strong> <span style={{ color: '#007bff' }}>{currentUser.specialization}</span>
                </div>
                <div style={{ marginBottom: '15px', fontSize: '14px', color: '#666' }}>
                  <strong>Last Activity:</strong> {student.lastActivityDate || 'No recent activity'}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button style={{
                    padding: '8px',
                    backgroundColor: '#fff',
                    border: '1px solid #007bff',
                    color: '#007bff',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}>
                    View Details
                  </button>
                  <button style={{
                    padding: '8px',
                    backgroundColor: '#007bff',
                    border: 'none',
                    color: 'white',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}>
                    + Activity
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;