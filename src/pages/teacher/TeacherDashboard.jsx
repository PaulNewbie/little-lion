import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import childService from '../../services/childService'; 
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';

const TeacherDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMyStudents = async () => {
      // 1. Safety check
      if (!currentUser?.uid) return;

      try {
        setLoading(true);

        // 2. OPTIMIZED FETCH: 
        // This relies on the new `getChildrenByTeacherId` function in childService.
        // It only downloads children where this teacher's ID exists in the 'teacherIds' array.
        const myStudents = await childService.getChildrenByTeacherId(currentUser.uid);

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
            {currentUser?.firstName} {currentUser?.lastName}
          </p>
          <div style={{ marginTop: '8px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {currentUser?.specializations?.length > 0 ? (
              currentUser.specializations.map((spec, index) => (
                <span key={index} style={{ 
                  backgroundColor: '#e3f2fd', 
                  color: '#0d47a1', 
                  padding: '2px 8px', 
                  borderRadius: '12px', 
                  fontSize: '0.8em',
                  fontWeight: 'bold'
                }}>
                  {spec}
                </span>
              ))
            ) : (
              <span style={{ color: '#999', fontSize: '0.9em' }}>No Specialization Assigned</span>
            )}
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => navigate('/teacher/play-group-upload')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2ecc71',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <span>📸</span> Upload Play Group
          </button>

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
      </div>

      <ErrorMessage message={error} />

      {/* Content Area */}
      <h2 style={{ color: '#444', marginBottom: '20px' }}>My Assigned Students</h2>

      {students.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
          No students are currently assigned to you.
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
                  color: '#666',
                  overflow: 'hidden'
                }}>
                  {student.photoUrl ? (
                    <img src={student.photoUrl} alt={student.firstName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span>📷</span>
                  )}
                </div>
                <h3 style={{ margin: 0, color: '#333' }}>{student.firstName} {student.lastName}</h3>
              </div>

              <div style={{ padding: '15px' }}>
                <div style={{ marginBottom: '10px', fontSize: '13px' }}>
                  <strong>Enrolled In (With Me):</strong>
                  <ul style={{ margin: '5px 0 0 20px', padding: 0, color: '#007bff' }}>
                    {/* CRITICAL FIX: 
                       Only show services where this specific teacher ID matches.
                       This handles the "Teacher A offers Math but Child takes Math from Teacher B" scenario.
                    */}
                    {student.services
                      .filter(s => s.teacherId === currentUser.uid)
                      .map((s, i) => (
                        <li key={i}>{s.serviceName}</li>
                      ))
                    }
                  </ul>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
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