import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import childService from '../../services/childService'; 
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';

const TherapistDashboard = () => {
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
        // FETCH ONLY STUDENTS ASSIGNED TO THIS THERAPIST
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

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getMyServiceForStudent = (student) => {
    // Find the specific service this therapist provides to this student
    const service = student.therapyServices?.find(s => s.therapistId === currentUser.uid);
    return service ? service.serviceName : 'Therapy';
  };

  if (loading) return <Loading />;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '20px'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#2c3e50' }}>Therapist Dashboard 🩺</h1>
          <p style={{ margin: '5px 0 0', color: '#666' }}>
            {currentUser?.firstName} {currentUser?.lastName} • {currentUser?.specializations?.join(', ')}
          </p>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>

      <ErrorMessage message={error} />

      {/* Students Grid */}
      <h2 style={{ color: '#444', marginBottom: '20px' }}>My Caseload ({students.length})</h2>

      {students.length === 0 ? (
        <div style={styles.emptyState}>
          No students are currently assigned to you for therapy.
        </div>
      ) : (
        <div style={styles.grid}>
          {students.map(student => (
            <div key={student.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.avatar}>
                  {student.photoUrl ? (
                    <img src={student.photoUrl} alt={student.firstName} style={styles.avatarImg} />
                  ) : (
                    <span>📷</span>
                  )}
                </div>
                <div>
                  <h3 style={{ margin: 0, color: '#333' }}>{student.firstName} {student.lastName}</h3>
                  <span style={styles.serviceBadge}>{getMyServiceForStudent(student)}</span>
                </div>
              </div>

              <div style={styles.cardBody}>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>
                  <strong>DOB:</strong> {student.dateOfBirth} <br/>
                  <strong>Medical:</strong> {student.medicalInfo || 'None'}
                </div>

                <div style={styles.btnGroup}>
                  {/* PRIMARY ACTION: Add Session Note */}
                  <button 
                    onClick={() => navigate(`/therapist/session/${student.id}`, { state: { student } })}
                    style={styles.primaryBtn}
                  >
                    + Add Session Note
                  </button>
                  
                  <button style={styles.secondaryBtn}>
                    View History
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

const styles = {
  logoutBtn: { padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  card: { backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden', border: '1px solid #eaeaea' },
  cardHeader: { padding: '20px', display: 'flex', gap: '15px', alignItems: 'center', borderBottom: '1px solid #f0f0f0', backgroundColor: '#f8f9fa' },
  avatar: { width: '60px', height: '60px', backgroundColor: '#ddd', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontSize: '24px' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  serviceBadge: { display: 'inline-block', backgroundColor: '#e3f2fd', color: '#0d47a1', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', marginTop: '5px' },
  cardBody: { padding: '20px' },
  btnGroup: { display: 'grid', gap: '10px' },
  primaryBtn: { padding: '10px', backgroundColor: '#4a90e2', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' },
  secondaryBtn: { padding: '10px', backgroundColor: 'white', color: '#666', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' },
  emptyState: { textAlign: 'center', padding: '40px', color: '#666', backgroundColor: '#f9f9f9', borderRadius: '8px' }
};

export default TherapistDashboard;