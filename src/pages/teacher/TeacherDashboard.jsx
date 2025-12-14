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
      if (!currentUser?.uid) return;

      try {
        setLoading(true);
        // FETCH ONLY STUDENTS ASSIGNED TO THIS TEACHER
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
          <h1 style={{ margin: 0, color: '#333' }}>Teacher Dashboard 🍎</h1>
          <p style={{ margin: '5px 0 0', color: '#666' }}>
            {currentUser?.firstName} {currentUser?.lastName}
          </p>
        </div>

        {/* ACTION BUTTONS */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => navigate('/teacher/play-group-upload')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2ecc71',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '15px'
            }}
          >
            <span>📸</span> Upload Group Activity
          </button>

          <button 
            onClick={() => navigate('/staff/inquiries')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f1c40f', // Yellow for visibility
              color: '#333',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '15px'
            }}
          >
            <span>📬</span> Inbox
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
      <h2 style={{ color: '#444', marginBottom: '20px' }}>My Class Roster</h2>

      {students.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
          No students are currently assigned to your classes.
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
              borderRadius: '10px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
              overflow: 'hidden',
              border: '1px solid #eee'
            }}>
              <div style={{ padding: '20px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  backgroundColor: '#f0f0f0', 
                  borderRadius: '50%', 
                  margin: '0 auto 15px',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  {student.photoUrl ? (
                    <img src={student.photoUrl} alt={student.firstName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '24px' }}>🧒</span>
                  )}
                </div>
                <h3 style={{ margin: 0, color: '#333' }}>{student.firstName} {student.lastName}</h3>
              </div>

              <div style={{ padding: '15px' }}>
                <div style={{ marginBottom: '10px', fontSize: '13px' }}>
                  <strong>Enrolled In (My Classes):</strong>
                  <ul style={{ margin: '5px 0 0 20px', padding: 0, color: '#27ae60' }}>
                    {/* UPDATED: Look at groupClasses instead of services */}
                    {student.groupClasses && student.groupClasses
                      .filter(s => s.teacherId === currentUser.uid)
                      .map((s, i) => (
                        <li key={i}>{s.serviceName}</li> // 'serviceName' holds the class name (e.g. Art Class)
                      ))
                    }
                  </ul>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', marginTop: '15px' }}>
                  <button style={{
                    padding: '8px',
                    backgroundColor: '#fff',
                    border: '1px solid #27ae60',
                    color: '#27ae60',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}>
                    View Profile
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