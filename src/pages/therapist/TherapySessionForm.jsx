import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { saveSessionActivity } from '../../services/activityService';
import { useAuth } from '../../hooks/useAuth';
import Loading from '../../components/common/Loading';
import TherapistSidebar from '../../components/sidebar/TherapistSidebar';
import QuickSelectTags from '../../components/common/form-elements/QuickSelectTags';
import VoiceInput from '../../components/common/form-elements/VoiceInput';

// --- DATA: SMART LISTS & CHIPS ---

// 1. Activity Chips (For OT/ST)
const OT_ACTIVITIES = [
  "Fine Motor Puzzles", "Handwriting Practice", "Sensory Bin", "Scissor Skills", 
  "Peg Board", "Lacing Beads", "Buttoning/Zipping", "Zone of Regulation",
  "Obstacle Course", "Clay/Playdough", "Theraputty", "Balance Beam"
];
const ST_ACTIVITIES = [
  "Articulation Drills", "Vocabulary Building", "Wh- Questions", "Social Stories",
  "Following Directions", "Flashcards", "Oral Motor Exercises", "Sequencing Cards",
  "Reading Comprehension", "Conversation Skills", "Pronoun Practice", "Prepositions"
];

// 2. Clinical Note Phrases (For OT/ST)
const NOTE_PHRASES = [
  "Arrived on time", "Transitioned well", "Separated easily", 
  "Required minimal prompting", "Hand-over-hand assistance needed", 
  "Sustained attention", "Frequent redirection needed", "Parent observed"
];
const REC_PHRASES = [
  "Continue home program", "Daily practice (10 mins)", "Monitor sensory needs", 
  "Use visual schedule", "Model words at home", "Review goals next session"
];

// 3. Observation Tags (For Other Services)
const COMMON_STRENGTHS = [
  "Good Focus", "Followed Instructions", "Social Interaction", 
  "Eye Contact", "Completed Tasks", "Gentle Hands", "Energetic", "Happy"
];
const COMMON_WEAKNESSES = [
  "Distracted", "Refused Task", "Crying", "Aggressive", 
  "Sensory Overload", "Difficulty Transitioning", "Needs Prompts"
];

// 4. Moods (Universal)
const MOODS = ["Happy 😊", "Focused 🧐", "Active ⚡", "Tired 🥱", "Upset 😢", "Social 👋", "Anxious 😰"];

const TherapySessionForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { child, service } = location.state || {};
  
  // --- LOGIC: DETERMINE FORM TYPE ---
  // OT & ST -> "Session Log" (Activities focused)
  // Everything else -> "Observation Report" (Behavior focused)
  const isSpeech = service?.name?.toLowerCase().includes('speech');
  const isOT = service?.name?.toLowerCase().includes('occupational');
  const isSessionLog = isSpeech || isOT || ['Occupational Therapy', 'Speech Therapy', 'Occupational Service', 'Speech Service'].includes(service?.name);

  const [loading, setLoading] = useState(false);

  // --- STATE: SESSION LOG (OT/ST) ---
  const [reaction, setReaction] = useState([]);
  const [activities, setActivities] = useState([]); // List of strings or objects
  const [currentActivity, setCurrentActivity] = useState('');
  const [notes, setNotes] = useState('');
  const [suggestions, setSuggestions] = useState('');

  // --- STATE: OBSERVATION REPORT (Others) ---
  const [activityPurpose, setActivityPurpose] = useState('');
  const [selectedStrengths, setSelectedStrengths] = useState([]);
  const [strengthNotes, setStrengthNotes] = useState('');
  const [selectedWeaknesses, setSelectedWeaknesses] = useState([]);
  const [weaknessNotes, setWeaknessNotes] = useState('');
  const [homeActivities, setHomeActivities] = useState('');
  const [concerns, setConcerns] = useState('');

  // --- HANDLERS ---

  // Helper: Add text to textarea
  const appendText = (current, newText, setter) => {
    const trimmed = current.trim();
    setter(trimmed ? `${trimmed}. ${newText}. ` : `${newText}. `);
  };

  // Activity Handlers
  const addActivity = (name) => {
    if (!name.trim()) return;
    if (activities.some(a => a.name === name)) return;
    setActivities([...activities, { name: name, performance: '' }]); // 'performance' kept empty for DB compatibility
    setCurrentActivity('');
  };

  const removeActivity = (index) => {
    setActivities(activities.filter((_, i) => i !== index));
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSessionLog && activities.length === 0 && !window.confirm("No activities listed. Save anyway?")) return;
    
    setLoading(true);

    // Format Tags + Notes for Observation View
    const finalStrengths = [...selectedStrengths, strengthNotes].filter(Boolean).join('. ');
    const finalWeaknesses = [...selectedWeaknesses, weaknessNotes].filter(Boolean).join('. ');

    const sessionData = {
      // Core Data
      childId: child.id,
      childName: `${child.firstName} ${child.lastName}`,
      serviceId: service.id,
      serviceName: service.name,
      date: new Date().toISOString(),
      
      // Type Flag
      type: isSessionLog ? 'activity' : 'observation',

      // 1. SESSION LOG DATA (OT/ST)
      data: isSessionLog ? { activities } : {}, // The activity list
      studentReaction: isSessionLog ? reaction : [],
      sessionNotes: notes,
      recommendations: suggestions,

      // 2. OBSERVATION DATA (Others)
      // Note: We map "reaction" to mood for both forms if needed, but usually Observation form uses Strengths/Weaknesses
      activityPurpose: activityPurpose,
      strengths: finalStrengths,
      weaknesses: finalWeaknesses,
      homeActivities: homeActivities,
      concerns: concerns
    };

    try {
      await saveSessionActivity(sessionData);
      alert('Saved successfully!');
      navigate('/therapist/dashboard');
    } catch (error) {
      console.error("Error saving", error);
      alert('Failed to save.');
    } finally {
      setLoading(false);
    }
  };

  if (!child || !service) return <div style={{padding:'2rem'}}>No session details provided.</div>;
  if (loading) return <Loading />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <TherapistSidebar />
      <div style={{ padding: '20px', width: '100%', backgroundColor: '#f8f9fa' }}>
        <div className="therapy-session-form">
        {/* --- HEADER --- */}
        <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '1.5rem 2rem', borderRadius: '1rem', marginBottom: '1.5rem' }}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end'}}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', margin: '0.5rem 0' }}>
              {isSessionLog ? 'New Session Log' : 'Observation Report'}
            </h1>
            <p style={{color: '#64748b', margin: 0}}>
              Student: <span style={{fontWeight: '600', color: '#3b82f6'}}>{child.firstName} {child.lastName}</span>
              {' • '}
              <span style={{fontWeight: '600', color: '#6d28d9'}}>{service.name}</span>
            </p>
          </div>
          <div style={{padding:'0.5rem 1rem', borderRadius:'2rem', backgroundColor: isSessionLog ? '#eff6ff' : '#f0fdf4', color: isSessionLog ? '#2563eb' : '#16a34a', fontWeight:'bold', fontSize:'0.85rem'}}>
            {isSessionLog ? 'Clinical Session' : 'Class Observation'}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* =========================================================
              FORM TYPE 1: OT / ST (Session Log)
             ========================================================= */}
          {isSessionLog && (
            <>
              {/* 1. MOOD */}
              <div style={styles.card}>
                <QuickSelectTags 
                  label="😊 Student's Mood" 
                  options={MOODS} 
                  selected={reaction} 
                  onChange={setReaction} 
                  color="purple" 
                />
              </div>

              {/* 2. ACTIVITIES (Smart Chips + Simple List) */}
              <div style={styles.card}>
                 <div style={{marginBottom:'1rem'}}>
                    <label style={styles.label}>📋 Activities Done</label>
                    <p style={styles.hint}>Tap to add or type your own.</p>
                 </div>

                 {/* Chips */}
                 <div style={styles.chipContainer}>
                    {(isSpeech ? ST_ACTIVITIES : OT_ACTIVITIES).map(act => (
                       <button 
                          key={act} 
                          type="button" 
                          onClick={() => addActivity(act)} 
                          style={styles.chipBtn(activities.some(a => a.name === act))}
                       >
                          + {act}
                       </button>
                    ))}
                 </div>

                 {/* Manual Input */}
                 <div style={styles.inputRow}>
                    <input 
                      type="text" 
                      value={currentActivity} 
                      onChange={(e) => setCurrentActivity(e.target.value)} 
                      placeholder="Type custom activity..." 
                      style={styles.input} 
                    />
                    <button type="button" onClick={() => addActivity(currentActivity)} style={styles.addBtn}>Add</button>
                </div>

                {/* Selected List (No Dropdowns) */}
                <div style={{marginTop:'1rem', display:'flex', flexDirection:'column', gap:'0.5rem'}}>
                  {activities.map((act, index) => (
                    <div key={index} style={styles.activityItem}>
                      <div style={styles.badge}>{index + 1}</div>
                      <span style={{flex:1, fontWeight:'600', color:'#334155'}}>{act.name}</span>
                      <button type="button" onClick={() => removeActivity(index)} style={styles.removeBtn}>✕</button>
                    </div>
                  ))}
                  {activities.length === 0 && <p style={styles.emptyText}>No activities added.</p>}
                </div>
              </div>

              {/* 3. CLINICAL NOTES (Phrases + Voice) */}
              <div style={styles.card}>
                <div style={styles.headerRow}>
                  <label style={styles.label}>📝 Clinical Notes</label>
                  <VoiceInput onTranscript={(text) => appendText(notes, text, setNotes)} />
                </div>
                <div style={styles.chipContainer}>
                  {NOTE_PHRASES.map(phrase => (
                    <button key={phrase} type="button" onClick={() => appendText(notes, phrase, setNotes)} style={styles.phraseBtn}>{phrase}</button>
                  ))}
                </div>
                <textarea rows="5" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Session observations..." style={styles.textarea} />
              </div>

              {/* 4. RECOMMENDATIONS */}
              <div style={styles.card}>
                <div style={styles.headerRow}>
                  <label style={styles.label}>💡 Recommendations / Plan</label>
                  <VoiceInput onTranscript={(text) => appendText(suggestions, text, setSuggestions)} />
                </div>
                <div style={styles.chipContainer}>
                  {REC_PHRASES.map(phrase => (
                    <button key={phrase} type="button" onClick={() => appendText(suggestions, phrase, setSuggestions)} style={styles.phraseBtn}>{phrase}</button>
                  ))}
                </div>
                <textarea rows="3" value={suggestions} onChange={(e) => setSuggestions(e.target.value)} placeholder="Next steps..." style={styles.textarea} />
              </div>
            </>
          )}

          {/* =========================================================
              FORM TYPE 2: OTHERS (Observation Report)
             ========================================================= */}
          {!isSessionLog && (
            <>
              {/* 1. ACTIVITY PURPOSE */}
              <div style={styles.card}>
                <div style={styles.headerRow}>
                  <label style={styles.label}>🎯 Activity Purpose</label>
                  <VoiceInput onTranscript={(text) => appendText(activityPurpose, text, setActivityPurpose)} />
                </div>
                <p style={styles.hint}>What was the goal of today's session?</p>
                <textarea rows="2" value={activityPurpose} onChange={(e) => setActivityPurpose(e.target.value)} style={styles.textarea} />
              </div>

              {/* 2. STRENGTHS (Tags + Voice) */}
              <div style={styles.card}>
                <QuickSelectTags 
                  label="💪 Strengths (Observed)" 
                  options={COMMON_STRENGTHS} 
                  selected={selectedStrengths} 
                  onChange={setSelectedStrengths} 
                  color="green" 
                />
                <div style={styles.headerRow}>
                   <span style={styles.miniLabel}>Specific Details</span>
                   <VoiceInput onTranscript={(text) => appendText(strengthNotes, text, setStrengthNotes)} />
                </div>
                <textarea rows="2" value={strengthNotes} onChange={(e) => setStrengthNotes(e.target.value)} placeholder="Details..." style={styles.textarea} />
              </div>

              {/* 3. WEAKNESSES (Tags + Voice) */}
              <div style={styles.card}>
                <QuickSelectTags 
                  label="🔻 Areas for Improvement" 
                  options={COMMON_WEAKNESSES} 
                  selected={selectedWeaknesses} 
                  onChange={setSelectedWeaknesses} 
                  color="red" 
                />
                 <div style={styles.headerRow}>
                   <span style={styles.miniLabel}>Specific Details</span>
                   <VoiceInput onTranscript={(text) => appendText(weaknessNotes, text, setWeaknessNotes)} />
                </div>
                <textarea rows="2" value={weaknessNotes} onChange={(e) => setWeaknessNotes(e.target.value)} placeholder="Details..." style={styles.textarea} />
              </div>

              {/* 4. HOME & CONCERNS */}
              <div style={styles.card}>
                <label style={styles.label}>🏠 Home Instructions</label>
                <textarea rows="3" value={homeActivities} onChange={(e) => setHomeActivities(e.target.value)} style={styles.textarea} placeholder="For parents..." />
                
                <div style={{marginTop:'1.5rem'}}>
                   <label style={styles.label}>⚠️ Other Concerns</label>
                   <textarea rows="2" value={concerns} onChange={(e) => setConcerns(e.target.value)} style={styles.textarea} placeholder="Behavioral notes..." />
                </div>
              </div>
            </>
          )}

          {/* --- SUBMIT BUTTON --- */}
          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? 'Saving Record...' : '✅ Complete Session'}
          </button>

        </form>
        </div>
      </div>
      </div>
    </div>
  );
};

// --- STYLES ---
const styles = {
  card: { backgroundColor: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border:'1px solid #e2e8f0' },
  label: { fontSize: '1.1rem', fontWeight: '700', color: '#1e293b' },
  miniLabel: { fontSize: '0.85rem', fontWeight: '600', color: '#64748b' },
  hint: { fontSize: '0.9rem', color: '#64748b', margin: '0 0 0.5rem 0' },
  emptyText: { color: '#94a3b8', fontStyle: 'italic', textAlign:'center', marginTop:'0.5rem' },
  
  // Inputs
  textarea: { width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontFamily:'inherit', boxSizing: 'border-box', marginTop:'0.5rem' },
  input: { flex: 1, padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize:'1rem' },
  
  // Containers
  headerRow: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' },
  chipContainer: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' },
  inputRow: { display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', borderTop: '1px dashed #e2e8f0', paddingTop: '1rem' },

  // Buttons & Badges
  backBtn: { background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:'0.9rem', fontWeight:'600', marginBottom:'0.5rem' },
  submitBtn: { width: '100%', padding: '1rem', backgroundColor: '#10b981', color: 'white', fontSize: '1.1rem', fontWeight: 'bold', border: 'none', borderRadius: '0.75rem', cursor: 'pointer', marginTop:'1rem', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)' },
  addBtn: { padding: '0 1.5rem', backgroundColor: '#6366f1', color:'white', borderRadius:'0.5rem', border:'none', fontWeight:'600', cursor:'pointer' },
  removeBtn: { color:'#ef4444', border:'none', background:'none', cursor:'pointer', fontSize:'1.1rem', padding: '0 0.5rem' },
  
  badge: { width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e2e8f0', color: '#64748b', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  
  // List Items
  activityItem: { display:'flex', alignItems:'center', gap:'12px', padding:'10px 12px', backgroundColor:'#f8fafc', borderRadius:'0.5rem', border:'1px solid #e2e8f0' },
  
  // Dynamic Styles
  chipBtn: (isSelected) => ({
    padding: '0.4rem 0.8rem', borderRadius: '20px', border: '1px solid #cbd5e1',
    backgroundColor: 'white', color: '#475569', cursor: 'pointer', fontSize: '0.85rem',
    opacity: isSelected ? 0.5 : 1, textDecoration: isSelected ? 'line-through' : 'none',
    transition: 'all 0.2s'
  }),
  phraseBtn: {
    padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid #bfdbfe',
    backgroundColor: '#eff6ff', color: '#1d4ed8', cursor: 'pointer', fontSize: '0.75rem', fontWeight:'500'
  }
};

export default TherapySessionForm;