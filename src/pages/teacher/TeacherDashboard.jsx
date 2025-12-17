import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import childService from '../../services/childService'; 
import { saveSessionActivity } from '../../services/activityService'; // Reuse the secure save function
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';

const TeacherDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  // Data State
  const [myClasses, setMyClasses] = useState([]); // Derived from students
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // UI State
  const [selectedClass, setSelectedClass] = useState(null); // If null, show class list. If set, show student roster.
  
  // Observation Modal State
  const [showObsModal, setShowObsModal] = useState(false);
  const [obsStudent, setObsStudent] = useState(null);
  const [obsFormData, setObsFormData] = useState({
    title: '',
    mood: [],
    strengths: '',
    weaknesses: '',
    homeActivities: '',
    concerns: ''
  });
  const [submittingObs, setSubmittingObs] = useState(false);

  // 1. FETCH & PROCESS DATA
  useEffect(() => {
    const fetchMyStudents = async () => {
      if (!currentUser?.uid) return;

      try {
        setLoading(true);
        // Fetch all students assigned to this teacher
        const myStudents = await childService.getChildrenByTeacherId(currentUser.uid);

        // Derive "Classes" from the student data
        // We group students by the 'serviceName' of the groupClasses they are enrolled in with THIS teacher.
        const classesMap = {};

        myStudents.forEach(student => {
          if (student.groupClasses) {
            student.groupClasses.forEach(svc => {
              if (svc.teacherId === currentUser.uid) {
                if (!classesMap[svc.serviceName]) {
                  classesMap[svc.serviceName] = {
                    name: svc.serviceName,
                    serviceId: svc.serviceId, // Assuming ID is consistent
                    students: []
                  };
                }
                classesMap[svc.serviceName].students.push(student);
              }
            });
          }
        });

        setMyClasses(Object.values(classesMap));

      } catch (err) {
        setError('Failed to load assigned students.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyStudents();
  }, [currentUser]);

  // 2. HANDLERS

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const handlePostGroupActivity = () => {
    // Navigate to upload page, passing the current class info to pre-fill the form
    navigate('/teacher/play-group-upload', { 
      state: { 
        preSelectedClassName: selectedClass.name,
        preSelectedStudents: selectedClass.students 
      } 
    });
  };

  const openObservationModal = (student) => {
    setObsStudent(student);
    setObsFormData({
      title: `${selectedClass.name} Observation`,
      mood: [],
      strengths: '',
      weaknesses: '',
      homeActivities: '',
      concerns: ''
    });
    setShowObsModal(true);
  };

  const handleObsSubmit = async (e) => {
    e.preventDefault();
    setSubmittingObs(true);
    try {
      // We use the SAME secure collection as therapists
      const sessionData = {
        childId: obsStudent.id,
        childName: `${obsStudent.firstName} ${obsStudent.lastName}`,
        serviceId: selectedClass.serviceId || 'teacher-group-id', // Fallback if ID missing
        serviceName: selectedClass.name, // e.g. "Art Class"
        date: new Date().toISOString(),
        
        // Critical Tags for Filtering
        type: 'observation',       // Uses the "Observation" card layout
        category: 'educational',   // Distinguishes from 'clinical'
        authorRole: 'teacher',
        authorId: currentUser.uid,
        authorName: `${currentUser.firstName} ${currentUser.lastName}`,
        visibleToParents: true,

        // The Data
        title: obsFormData.title,
        studentReaction: obsFormData.mood,
        strengths: obsFormData.strengths,
        weaknesses: obsFormData.weaknesses,
        homeActivities: obsFormData.homeActivities,
        concerns: obsFormData.concerns,
        
        // Empty fields for compatibility
        data: {}, 
        sessionNotes: obsFormData.concerns // Map concerns to notes for summary views if needed
      };

      await saveSessionActivity(sessionData);
      
      alert(`Observation saved for ${obsStudent.firstName}!`);
      setShowObsModal(false);
    } catch (err) {
      console.error("Error saving observation", err);
      alert("Failed to save observation.");
    } finally {
      setSubmittingObs(false);
    }
  };

  const toggleMood = (mood) => {
    setObsFormData(prev => {
      const newMoods = prev.mood.includes(mood) 
        ? prev.mood.filter(m => m !== mood)
        : [...prev.mood, mood];
      return { ...prev, mood: newMoods };
    });
  };

  // 3. RENDER

  if (loading) return <Loading />;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* --- HEADER --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, color: '#1e293b' }}>Teacher Dashboard 🍎</h1>
          <p style={{ margin: '5px 0 0', color: '#64748b' }}>
            {currentUser?.firstName} {currentUser?.lastName}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate('/staff/inquiries')} style={styles.secondaryBtn}>
            📬 Inbox
          </button>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Sign Out
          </button>
        </div>
      </div>

      <ErrorMessage message={error} />

      {/* --- VIEW 1: CLASS SELECTION (Home) --- */}
      {!selectedClass && (
        <>
          <h2 style={{ color: '#334155', marginBottom: '20px' }}>My Classes</h2>
          {myClasses.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>🏫</div>
              <p>You haven't been assigned to any classes yet.</p>
            </div>
          ) : (
            <div style={styles.grid}>
              {myClasses.map((cls, idx) => (
                <div key={idx} style={styles.classCard} onClick={() => setSelectedClass(cls)}>
                  <div style={styles.classIcon}>🎨</div>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', color: '#1e293b' }}>{cls.name}</h3>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                      {cls.students.length} Student{cls.students.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div style={styles.arrow}>→</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* --- VIEW 2: CLASSROOM MANAGER --- */}
      {selectedClass && (
        <div style={styles.fadeIn}>
          <button onClick={() => setSelectedClass(null)} style={styles.backBtn}>← Back to Classes</button>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
            <h2 style={{ margin: 0, fontSize: '28px', color: '#0f172a' }}>
              {selectedClass.name}
            </h2>
            
            <button onClick={handlePostGroupActivity} style={styles.primaryBtn}>
              📸 Post Group Activity
            </button>
          </div>

          <h3 style={{ color: '#475569', marginBottom: '15px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
            Student Roster ({selectedClass.students.length})
          </h3>

          <div style={styles.grid}>
            {selectedClass.students.map(student => (
              <div key={student.id} style={styles.studentCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                  <div style={styles.avatar}>
                    {student.photoUrl ? <img src={student.photoUrl} alt="" style={styles.avatarImg} /> : '👤'}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, color: '#1e293b' }}>{student.firstName}</h4>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{student.lastName}</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => openObservationModal(student)}
                  style={styles.actionBtn}
                >
                  📝 Write Observation
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- MODAL: OBSERVATION FORM --- */}
      {showObsModal && obsStudent && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>Observation: {obsStudent.firstName}</h3>
              <button onClick={() => setShowObsModal(false)} style={styles.closeBtn}>✕</button>
            </div>

            <form onSubmit={handleObsSubmit} style={{ padding: '20px' }}>
              
              {/* Topic */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Title / Topic</label>
                <input 
                  required
                  style={styles.input}
                  value={obsFormData.title}
                  onChange={(e) => setObsFormData({...obsFormData, title: e.target.value})}
                  placeholder="e.g. Social Sharing, Motor Skills"
                />
              </div>

              {/* Mood */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Child's Mood</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['Happy', 'Focused', 'Active', 'Tired', 'Upset', 'Social'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleMood(m)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '15px',
                        border: '1px solid',
                        borderColor: obsFormData.mood.includes(m) ? '#2563eb' : '#cbd5e1',
                        backgroundColor: obsFormData.mood.includes(m) ? '#eff6ff' : 'white',
                        color: obsFormData.mood.includes(m) ? '#2563eb' : '#64748b',
                        cursor: 'pointer', fontSize: '13px'
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={styles.formGroup}>
                  <label style={{...styles.label, color: '#166534'}}>💪 Strengths</label>
                  <textarea 
                    rows="3" style={styles.textarea}
                    placeholder="What went well?"
                    value={obsFormData.strengths}
                    onChange={(e) => setObsFormData({...obsFormData, strengths: e.target.value})}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={{...styles.label, color: '#991b1b'}}>🔻 Needs Help</label>
                  <textarea 
                    rows="3" style={styles.textarea}
                    placeholder="Areas to improve?"
                    value={obsFormData.weaknesses}
                    onChange={(e) => setObsFormData({...obsFormData, weaknesses: e.target.value})}
                  />
                </div>
              </div>

              {/* Home Plan */}
              <div style={styles.formGroup}>
                <label style={styles.label}>🏠 Home Activities</label>
                <textarea 
                  rows="2" style={styles.textarea}
                  placeholder="Suggestions for parents..."
                  value={obsFormData.homeActivities}
                  onChange={(e) => setObsFormData({...obsFormData, homeActivities: e.target.value})}
                />
              </div>

              {/* Concerns */}
              <div style={styles.formGroup}>
                <label style={styles.label}>⚠️ Other Concerns (Private)</label>
                <textarea 
                  rows="2" style={styles.textarea}
                  placeholder="Behavioral notes or concerns..."
                  value={obsFormData.concerns}
                  onChange={(e) => setObsFormData({...obsFormData, concerns: e.target.value})}
                />
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowObsModal(false)} style={styles.cancelBtn}>Cancel</button>
                <button type="submit" disabled={submittingObs} style={styles.saveBtn}>
                  {submittingObs ? 'Saving...' : 'Save Observation'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

// --- STYLES ---
const styles = {
  // Buttons
  primaryBtn: { padding: '10px 20px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' },
  secondaryBtn: { padding: '8px 16px', backgroundColor: '#f1c40f', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' },
  logoutBtn: { padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  backBtn: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '20px', fontSize: '15px', fontWeight: '600' },
  actionBtn: { width: '100%', padding: '10px', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', transition: 'all 0.2s' },
  
  // Layouts
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  emptyState: { textAlign: 'center', padding: '50px', backgroundColor: '#f8fafc', borderRadius: '12px', color: '#94a3b8', border: '2px dashed #e2e8f0' },
  fadeIn: { animation: 'fadeIn 0.3s ease-in-out' },

  // Cards
  classCard: { backgroundColor: 'white', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'transform 0.2s' },
  classIcon: { width: '50px', height: '50px', backgroundColor: '#ecfdf5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' },
  arrow: { marginLeft: 'auto', color: '#cbd5e1', fontSize: '20px' },

  studentCard: { backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' },
  avatar: { width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },

  // Modal
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modalContent: { backgroundColor: 'white', borderRadius: '12px', width: '90%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden' },
  modalHeader: { padding: '15px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' },
  closeBtn: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' },
  
  // Form
  formGroup: { marginBottom: '15px' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' },
  input: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' },
  
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #e2e8f0' },
  saveBtn: { padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' },
  cancelBtn: { padding: '10px 20px', backgroundColor: 'transparent', color: '#64748b', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }
};

export default TeacherDashboard;