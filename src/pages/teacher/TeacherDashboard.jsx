import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import childService from '../../services/childService'; 
import { saveSessionActivity } from '../../services/activityService';
import userService from '../../services/userService'; //
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import QuickSelectTags from '../../components/common/form-elements/QuickSelectTags';
import VoiceInput from '../../components/common/form-elements/VoiceInput';

// --- TEACHER SMART DATA ---
const CLASS_TOPICS = ["Circle Time", "Art Class", "Music", "Math", "Reading", "Free Play", "Snack/Lunch", "Social Skills", "Nap Time"];
const MOODS = ["Happy 😊", "Focused 🧐", "Active ⚡", "Tired 🥱", "Upset 😢", "Social 👋", "Quiet 😶"];
const COMMON_STRENGTHS = ["Participated", "Shared Toys", "Followed Rules", "Helped Others", "Good Listening", "Creative", "Ate Well"];
const COMMON_NEEDS = ["Distracted", "Hit/Pushed", "Cried", "Refused to Share", "Did not Listen", "Sleepy", "Needs Practice"];

const TeacherDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  // Data State
  const [myClasses, setMyClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profileIncomplete, setProfileIncomplete] = useState(false); //

  // UI State
  const [selectedClass, setSelectedClass] = useState(null);
  
  // Observation Modal State
  const [showObsModal, setShowObsModal] = useState(false);
  const [obsStudent, setObsStudent] = useState(null);
  const [submittingObs, setSubmittingObs] = useState(false);

  // Form Data
  const [topic, setTopic] = useState('');
  const [moods, setMoods] = useState([]);
  const [selectedStrengths, setSelectedStrengths] = useState([]);
  const [strengthNote, setStrengthNote] = useState('');
  const [selectedNeeds, setSelectedNeeds] = useState([]);
  const [needNote, setNeedNote] = useState('');
  const [homeNote, setHomeNote] = useState('');
  const [concernNote, setConcernNote] = useState('');

  // 1. FETCH DATA & CHECK PROFILE
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.uid) return;
      try {
        setLoading(true);

        // ✅ Check Profile Status
        const userData = await userService.getUserById(currentUser.uid);
        if (!userData.profileCompleted) {
          setProfileIncomplete(true);
        }

        // ✅ Fetch Assigned Students
        const myStudents = await childService.getChildrenByTeacherId(currentUser.uid);

        // Group students by Class Name
        const classesMap = {};
        myStudents.forEach(student => {
          const allServices = student.enrolledServices || [...(student.groupClasses || []), ...(student.classes || [])];
          
          allServices.forEach(svc => {
             const assignedId = svc.staffId || svc.teacherId;
             if (assignedId === currentUser.uid) {
                const className = svc.serviceName || svc.className;
                if (!classesMap[className]) {
                   classesMap[className] = { name: className, serviceId: svc.serviceId, students: [] };
                }
                if (!classesMap[className].students.some(s => s.id === student.id)) {
                   classesMap[className].students.push(student);
                }
             }
          });
        });
        setMyClasses(Object.values(classesMap));
      } catch (err) {
        setError('Failed to load dashboard data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  // 2. HANDLERS
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handlePostGroupActivity = () => {
    navigate('/teacher/play-group-upload', { 
      state: { preSelectedClassName: selectedClass.name, preSelectedStudents: selectedClass.students } 
    });
  };

  const openObservationModal = (student) => {
    setObsStudent(student);
    setTopic(''); setMoods([]); setSelectedStrengths([]); setStrengthNote('');
    setSelectedNeeds([]); setNeedNote([]); setHomeNote(''); setConcernNote('');
    setShowObsModal(true);
  };

  const handleObsSubmit = async (e) => {
    e.preventDefault();
    if (!topic) { alert("Please select or type a topic."); return; }
    setSubmittingObs(true);
    
    const finalStrengths = [...selectedStrengths, strengthNote].filter(Boolean).join('. ');
    const finalWeaknesses = [...selectedNeeds, needNote].filter(Boolean).join('. ');

    try {
      const sessionData = {
        childId: obsStudent.id,
        childName: `${obsStudent.firstName} ${obsStudent.lastName}`,
        serviceId: selectedClass.serviceId || 'teacher-group-id',
        serviceName: selectedClass.name,
        date: new Date().toISOString(),
        type: 'observation',
        authorId: currentUser.uid,
        authorName: `${currentUser.firstName} ${currentUser.lastName}`,
        title: topic,
        studentReaction: moods,
        strengths: finalStrengths,
        weaknesses: finalWeaknesses,
        homeActivities: homeNote,
        sessionNotes: concernNote 
      };

      await saveSessionActivity(sessionData); //
      alert(`Observation saved for ${obsStudent.firstName}!`);
      setShowObsModal(false);
    } catch (err) {
      alert("Failed to save observation.");
    } finally {
      setSubmittingObs(false);
    }
  };

  const appendText = (current, newText, setter) => {
    const trimmed = current.trim();
    setter(trimmed ? `${trimmed}. ${newText}. ` : `${newText}. `);
  };

  if (loading) return <Loading />;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* --- PROFILE NOTIFICATION BANNER --- */}
      {profileIncomplete && (
        <div style={styles.notifBanner}>
          <div>
            <strong style={{ display: 'block', color: '#92400e' }}>⚠️ Profile Incomplete</strong>
            <p style={{ margin: 0, fontSize: '13px', color: '#b45309' }}>Please update your professional credentials (PRC ID, School, etc.) to verify your account.</p>
          </div>
          <button 
            onClick={() => navigate('/teacher/profile')}
            style={styles.notifBtn}
          >
            Setup Profile →
          </button>
        </div>
      )}

      {/* --- HEADER --- */}
      <div style={styles.header}>
        <div>
          <h1 style={{ margin: 0, color: '#1e293b' }}>Teacher Dashboard 🍎</h1>
          <p style={{ margin: '5px 0 0', color: '#64748b' }}>{currentUser?.firstName} {currentUser?.lastName}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate('/teacher/profile')} style={styles.secondaryBtn}>⚙️ Profile</button>
          <button onClick={() => navigate('/staff/inquiries')} style={styles.secondaryBtn}>📬 Inbox</button>
          <button onClick={handleLogout} style={styles.logoutBtn}>Sign Out</button>
        </div>
      </div>

      <ErrorMessage message={error} />

      {/* --- VIEW 1: CLASS SELECTION --- */}
      {!selectedClass && (
        <>
          <h2 style={{ color: '#334155', marginBottom: '20px' }}>My Classes</h2>
          {myClasses.length === 0 ? (
            <div style={styles.emptyState}><div style={{ fontSize: '40px', marginBottom: '10px' }}>🏫</div><p>No classes assigned yet.</p></div>
          ) : (
            <div style={styles.grid}>
              {myClasses.map((cls, idx) => (
                <div key={idx} style={styles.classCard} onClick={() => setSelectedClass(cls)}>
                  <div style={styles.classIcon}>🎨</div>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', color: '#1e293b' }}>{cls.name}</h3>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>{cls.students.length} Student{cls.students.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div style={styles.arrow}>→</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* --- VIEW 2: ROSTER --- */}
      {selectedClass && (
        <div style={styles.fadeIn}>
          <button onClick={() => setSelectedClass(null)} style={styles.backBtn}>← Back to Classes</button>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
            <h2 style={{ margin: 0, fontSize: '28px', color: '#0f172a' }}>{selectedClass.name}</h2>
            <button onClick={handlePostGroupActivity} style={styles.primaryBtn}>📸 Post Group Activity</button>
          </div>

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
                <button onClick={() => openObservationModal(student)} style={styles.actionBtn}>📝 Write Observation</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- OBSERVATION MODAL --- */}
      {showObsModal && obsStudent && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>Observation: {obsStudent.firstName}</h3>
              <button onClick={() => setShowObsModal(false)} style={styles.closeBtn}>✕</button>
            </div>

            <form onSubmit={handleObsSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={styles.label}>📚 Activity / Topic</label>
                <div style={{display:'flex', flexWrap:'wrap', gap:'0.5rem', marginBottom:'0.5rem'}}>
                   {CLASS_TOPICS.map(t => (
                      <button key={t} type="button" onClick={() => setTopic(t)} style={styles.chipBtn(topic === t)}>{t}</button>
                   ))}
                </div>
                <input required style={styles.input} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Or type custom topic..." />
              </div>

              <QuickSelectTags label="😊 Mood" options={MOODS} selected={moods} onChange={setMoods} color="purple" />

              <div>
                <QuickSelectTags label="⭐ Strengths" options={COMMON_STRENGTHS} selected={selectedStrengths} onChange={setSelectedStrengths} color="green" />
                <textarea rows="2" style={styles.textarea} value={strengthNote} onChange={(e) => setStrengthNote(e.target.value)} placeholder="Details..." />
              </div>

              <div>
                <div style={styles.flexBetween}>
                   <label style={styles.label}>🏠 Home Note</label>
                   <VoiceInput onTranscript={(text) => appendText(homeNote, text, setHomeNote)} />
                </div>
                <textarea rows="2" style={styles.textarea} value={homeNote} onChange={(e) => setHomeNote(e.target.value)} placeholder="Message for parents..." />
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowObsModal(false)} style={styles.cancelBtn}>Cancel</button>
                <button type="submit" disabled={submittingObs} style={styles.saveBtn}>
                  {submittingObs ? 'Saving...' : 'Save Report'}
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
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px' },
  notifBanner: { backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '12px', padding: '16px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  notifBtn: { backgroundColor: '#fbbf24', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' },
  primaryBtn: { padding: '10px 20px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  secondaryBtn: { padding: '8px 16px', backgroundColor: '#f1c40f', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' },
  logoutBtn: { padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  classCard: { backgroundColor: 'white', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', cursor: 'pointer' },
  studentCard: { backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' },
  avatar: { width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modalContent: { backgroundColor: 'white', borderRadius: '12px', width: '90%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { padding: '15px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' },
  label: { display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' },
  textarea: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' },
  input: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' },
  chipBtn: (isSelected) => ({ padding: '6px 12px', borderRadius: '20px', border: '1px solid', borderColor: isSelected ? '#3b82f6' : '#cbd5e1', backgroundColor: isSelected ? '#eff6ff' : 'white', color: isSelected ? '#2563eb' : '#64748b', cursor: 'pointer' }),
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '15px 20px', borderTop: '1px solid #e2e8f0' },
  saveBtn: { padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' },
  cancelBtn: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }
};

export default TeacherDashboard;