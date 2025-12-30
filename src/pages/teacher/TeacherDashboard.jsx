import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import childService from '../../services/childService'; 
import { saveSessionActivity } from '../../services/activityService';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
// --- NEW IMPORTS ---
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

  // UI State
  const [selectedClass, setSelectedClass] = useState(null);
  
  // Observation Modal State
  const [showObsModal, setShowObsModal] = useState(false);
  const [obsStudent, setObsStudent] = useState(null);
  const [submittingObs, setSubmittingObs] = useState(false);

  // Form Data (Now uses Arrays for tags)
  const [topic, setTopic] = useState('');
  const [moods, setMoods] = useState([]);
  const [selectedStrengths, setSelectedStrengths] = useState([]);
  const [strengthNote, setStrengthNote] = useState('');
  const [selectedNeeds, setSelectedNeeds] = useState([]);
  const [needNote, setNeedNote] = useState('');
  const [homeNote, setHomeNote] = useState('');
  const [concernNote, setConcernNote] = useState('');

  // 1. FETCH DATA
  useEffect(() => {
    const fetchMyStudents = async () => {
      if (!currentUser?.uid) return;
      try {
        setLoading(true);
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
    // Reset Form
    setTopic('');
    setMoods([]);
    setSelectedStrengths([]);
    setStrengthNote('');
    setSelectedNeeds([]);
    setNeedNote('');
    setHomeNote('');
    setConcernNote('');
    setShowObsModal(true);
  };

  const handleObsSubmit = async (e) => {
    e.preventDefault();
    if (!topic) { alert("Please select or type a topic."); return; }
    
    setSubmittingObs(true);
    
    // Combine Tags + Notes
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
        category: 'educational',
        authorRole: 'teacher',
        authorId: currentUser.uid,
        authorName: `${currentUser.firstName} ${currentUser.lastName}`,
        visibleToParents: true,

        title: topic,
        studentReaction: moods,
        strengths: finalStrengths,
        weaknesses: finalWeaknesses,
        homeActivities: homeNote,
        concerns: concernNote,
        
        data: {}, 
        sessionNotes: concernNote 
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

  // Helper to append text from Voice
  const appendText = (current, newText, setter) => {
    const trimmed = current.trim();
    setter(trimmed ? `${trimmed}. ${newText}. ` : `${newText}. `);
  };

  if (loading) return <Loading />;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* --- HEADER --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, color: '#1e293b' }}>Teacher Dashboard 🍎</h1>
          <p style={{ margin: '5px 0 0', color: '#64748b' }}>{currentUser?.firstName} {currentUser?.lastName}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
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
                <button onClick={() => openObservationModal(student)} style={styles.actionBtn}>📝 Write Observation</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- NEW MODAL: SMART OBSERVATION FORM --- */}
      {showObsModal && obsStudent && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>Observation: {obsStudent.firstName}</h3>
              <button onClick={() => setShowObsModal(false)} style={styles.closeBtn}>✕</button>
            </div>

            <form onSubmit={handleObsSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* 1. TOPIC (Smart Chips) */}
              <div>
                <label style={styles.label}>📚 Activity / Topic</label>
                <div style={{display:'flex', flexWrap:'wrap', gap:'0.5rem', marginBottom:'0.5rem'}}>
                   {CLASS_TOPICS.map(t => (
                      <button key={t} type="button" onClick={() => setTopic(t)} style={styles.chipBtn(topic === t)}>
                        {t}
                      </button>
                   ))}
                </div>
                <input 
                  required
                  style={styles.input}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Or type custom topic..."
                />
              </div>

              {/* 2. MOOD */}
              <QuickSelectTags 
                label="😊 Student's Mood" 
                options={MOODS} 
                selected={moods} 
                onChange={setMoods} 
                color="purple" 
              />

              {/* 3. STRENGTHS */}
              <div>
                <QuickSelectTags 
                  label="⭐ What went well?" 
                  options={COMMON_STRENGTHS} 
                  selected={selectedStrengths} 
                  onChange={setSelectedStrengths} 
                  color="green" 
                />
                <div style={styles.flexBetween}>
                  <span style={styles.subLabel}>Details (Optional)</span>
                  <VoiceInput onTranscript={(text) => appendText(strengthNote, text, setStrengthNote)} />
                </div>
                <textarea rows="2" style={styles.textarea} value={strengthNote} onChange={(e) => setStrengthNote(e.target.value)} placeholder="Add details..." />
              </div>

              {/* 4. NEEDS HELP */}
              <div>
                <QuickSelectTags 
                  label="🔻 Needs Improvement" 
                  options={COMMON_NEEDS} 
                  selected={selectedNeeds} 
                  onChange={setSelectedNeeds} 
                  color="red" 
                />
                <div style={styles.flexBetween}>
                  <span style={styles.subLabel}>Details (Optional)</span>
                  <VoiceInput onTranscript={(text) => appendText(needNote, text, setNeedNote)} />
                </div>
                <textarea rows="2" style={styles.textarea} value={needNote} onChange={(e) => setNeedNote(e.target.value)} placeholder="Add details..." />
              </div>

              {/* 5. NOTES */}
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
  flexBetween: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'5px' },

  // Cards
  classCard: { backgroundColor: 'white', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'transform 0.2s' },
  classIcon: { width: '50px', height: '50px', backgroundColor: '#ecfdf5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' },
  arrow: { marginLeft: 'auto', color: '#cbd5e1', fontSize: '20px' },
  studentCard: { backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' },
  avatar: { width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },

  // Modal
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modalContent: { backgroundColor: 'white', borderRadius: '12px', width: '90%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' },
  modalHeader: { padding: '15px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', position:'sticky', top:0, zIndex:10 },
  closeBtn: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' },
  
  // Form Elements
  label: { display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' },
  subLabel: { fontSize: '12px', fontWeight: '600', color: '#64748b' },
  input: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' },
  
  // Dynamic Chip
  chipBtn: (isSelected) => ({
    padding: '6px 12px', borderRadius: '20px', border: '1px solid',
    borderColor: isSelected ? '#3b82f6' : '#cbd5e1',
    backgroundColor: isSelected ? '#eff6ff' : 'white',
    color: isSelected ? '#2563eb' : '#64748b',
    cursor: 'pointer', fontSize: '13px', fontWeight: '500', transition: 'all 0.2s'
  }),

  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '15px', borderTop: '1px solid #e2e8f0' },
  saveBtn: { padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' },
  cancelBtn: { padding: '10px 20px', backgroundColor: 'transparent', color: '#64748b', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }
};

export default TeacherDashboard;