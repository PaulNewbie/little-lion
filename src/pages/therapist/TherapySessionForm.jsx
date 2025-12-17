import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { saveSessionActivity } from '../../services/activityService';
import Loading from '../../components/common/Loading';

const TherapySessionForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { child, service } = location.state || {};

  // Define which services are "Two Step" (OT and Speech)
  const isTwoStepService = ['Occupational Therapy', 'Speech Therapy', 'Occupational Service', 'Speech Service'].includes(service?.name);

  // If TwoStep Service -> Start at Step 1.
  // If Other Service  -> Start at Step 2 (Observation), skipping Step 1 entirely.
  const [step, setStep] = useState(isTwoStepService ? 1 : 2);
  const [loading, setLoading] = useState(false);

  // --- Step 1 Data (Only for TwoStep Services) ---
  const [notes, setNotes] = useState(''); 
  const [suggestions, setSuggestions] = useState(''); 
  const [reaction, setReaction] = useState([]);
  const [activities, setActivities] = useState([]);
  const [currentActivity, setCurrentActivity] = useState('');

  // --- Step 2 Data (Observation - For Everyone) ---
  const [activityPurpose, setActivityPurpose] = useState('');
  const [strengths, setStrengths] = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [homeActivities, setHomeActivities] = useState('');
  const [concerns, setConcerns] = useState('');

  // --- Handlers ---
  const handleAddActivity = () => {
    if (!currentActivity.trim()) return;
    setActivities([...activities, { name: currentActivity, performance: '' }]);
    setCurrentActivity('');
  };

  const handleRemoveActivity = (index) => {
    setActivities(activities.filter((_, i) => i !== index));
  };

  const toggleReaction = (mood) => {
    if (reaction.includes(mood)) {
      setReaction(reaction.filter(r => r !== mood));
    } else {
      setReaction([...reaction, mood]);
    }
  };

  const handleNext = (e) => {
    e.preventDefault();
    setStep(2);
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    // If we are on Step 2 AND it's a TwoStep service, go back to Step 1.
    if (step === 2 && isTwoStepService) {
      setStep(1);
    } else {
      // Otherwise (if we are on Step 1, OR if we are on Step 2 of a SingleStep service), leave page.
      navigate(-1);
    }
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const sessionData = {
      childId: child.id,
      childName: `${child.firstName} ${child.lastName}`,
      serviceId: service.id,
      serviceName: service.name,
      date: new Date().toISOString(),
      
      // 'activity' type for OT/ST, 'observation' for others
      type: isTwoStepService ? 'activity' : 'observation',
      
      // Data Packet
      data: isTwoStepService ? { activities } : {},
      studentReaction: reaction,
      sessionNotes: notes,
      recommendations: suggestions,
      
      // Step 2 Data
      activityPurpose,
      strengths,
      weaknesses,
      homeActivities,
      concerns
    };

    try {
      await saveSessionActivity(sessionData);
      alert('Session saved successfully!');
      navigate('/therapist/dashboard');
    } catch (error) {
      console.error("Error saving session", error);
      alert('Failed to save session.');
    } finally {
      setLoading(false);
    }
  };

  // --- Components ---
  const ReactionButton = ({ label, emoji }) => {
    const isSelected = reaction.includes(label);
    return (
      <button
        type="button"
        onClick={() => toggleReaction(label)}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '1rem', borderRadius: '0.75rem', border: '2px solid',
          borderColor: isSelected ? '#6d28d9' : '#e2e8f0', backgroundColor: isSelected ? '#f5f3ff' : 'white',
          cursor: 'pointer', transition: 'all 0.2s', minWidth: '90px'
        }}
      >
        <span style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{emoji}</span>
        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: isSelected ? '#6d28d9' : '#64748b' }}>{label}</span>
      </button>
    );
  };

  if (!child || !service) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No session details provided.</div>;
  }

  if (loading) return <Loading />;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Header */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '1.5rem 2rem' }}>
        <button 
          onClick={handleBack}
          style={{
            background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.875rem',
            fontWeight: '600', marginBottom: '1rem', padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}
        >
          {/* Back button text changes based on context */}
          ← {step === 2 && isTwoStepService ? 'Back to Details' : 'Back to Dashboard'}
        </button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              {/* Title changes based on step */}
              {step === 1 ? 'New Session' : (isTwoStepService ? 'Observation Report' : 'Session Observation')}
            </h1>
            <p style={{ color: '#64748b', margin: 0 }}>
              <span style={{ fontWeight: '600', color: '#3b82f6' }}>{child.firstName} {child.lastName}</span>
              {' • '}
              <span style={{ fontWeight: '600', color: '#6d28d9' }}>{service.name}</span>
            </p>
          </div>
          
          {/* Step Indicator - ONLY for OT/ST Services */}
          {isTwoStepService && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{ 
                width: '2rem', height: '2rem', borderRadius: '50%', 
                backgroundColor: step === 1 ? '#6d28d9' : '#10b981', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700'
              }}>1</div>
              <div style={{ width: '3rem', height: '2px', backgroundColor: step === 2 ? '#10b981' : '#e2e8f0' }}></div>
              <div style={{ 
                width: '2rem', height: '2rem', borderRadius: '50%', 
                backgroundColor: step === 2 ? '#6d28d9' : '#e2e8f0', color: step === 2 ? 'white' : '#94a3b8',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700'
              }}>2</div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
        <form onSubmit={step === 1 ? handleNext : handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* ================= STEP 1 (OT & Speech Only) ================= */}
          {step === 1 && (
            <>
              {/* Activity List */}
              <div style={sectionStyle}>
                <div style={{ marginBottom: '1rem' }}>
                  <h2 style={headerStyle}>📋 Activities</h2>
                  <p style={subHeaderStyle}>What did you work on today?</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input
                    type="text" value={currentActivity} onChange={(e) => setCurrentActivity(e.target.value)}
                    placeholder="e.g., Vocabulary drills" style={inputStyle}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddActivity())}
                  />
                  <button type="button" onClick={handleAddActivity} style={addButtonStyle}>Add</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {activities.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: '1rem' }}>No activities added yet</p>}
                  {activities.map((act, index) => (
                    <div key={index} style={activityItemStyle}>
                      <span style={{ fontWeight: '600', color: '#64748b' }}>{index + 1}.</span>
                      <span style={{ flex: 1, color: '#1e293b' }}>{act.name}</span>
                      <select 
                        value={act.performance}
                        onChange={(e) => { const newActs = [...activities]; newActs[index].performance = e.target.value; setActivities(newActs); }}
                        style={selectStyle}
                      >
                        <option value="">Performance...</option>
                        <option value="Independent">Independent</option>
                        <option value="With Assistance">With Assistance</option>
                        <option value="Refused">Refused</option>
                      </select>
                      <button type="button" onClick={() => handleRemoveActivity(index)} style={removeButtonStyle}>✕</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reaction */}
              <div style={sectionStyle}>
                <h2 style={headerStyle}>😊 Student's Mood</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
                  <ReactionButton label="Happy" emoji="😊" />
                  <ReactionButton label="Focused" emoji="🧐" />
                  <ReactionButton label="Active" emoji="⚡" />
                  <ReactionButton label="Tired" emoji="🥱" />
                  <ReactionButton label="Upset" emoji="😢" />
                  <ReactionButton label="Social" emoji="👋" />
                </div>
              </div>

              {/* Notes */}
              <div style={sectionStyle}>
                <label style={labelStyle}>📝 Session Notes</label>
                <textarea rows="6" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="General notes..." style={textAreaStyle} />
              </div>

              {/* Suggestions */}
              <div style={sectionStyle}>
                <label style={labelStyle}>💡 Recommendations</label>
                <textarea rows="4" value={suggestions} onChange={(e) => setSuggestions(e.target.value)} placeholder="General recommendations..." style={textAreaStyle} />
              </div>
            </>
          )}

          {/* ================= STEP 2 (Observation - For Everyone) ================= */}
          {step === 2 && (
            <>
              {/* Activities Given & Purpose */}
              <div style={sectionStyle}>
                <label style={labelStyle}>🎯 Activities Given & Purpose</label>
                <p style={{...subHeaderStyle, marginBottom: '1rem'}}>Describe the activities and their therapeutic purpose</p>
                <textarea required rows="4" value={activityPurpose} onChange={(e) => setActivityPurpose(e.target.value)} placeholder="E.g., Puzzle building to improve fine motor skills..." style={textAreaStyle} />
              </div>

              {/* Teacher's Observation */}
              <div style={sectionStyle}>
                <h2 style={headerStyle}>👁️ Teacher's Observation</h2>
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <label style={{...labelStyle, fontSize: '1rem', color: '#166534'}}>💪 Strengths</label>
                    <textarea required rows="3" value={strengths} onChange={(e) => setStrengths(e.target.value)} placeholder="What did the child do well today?" style={{...textAreaStyle, borderColor: '#bbf7d0'}} />
                  </div>
                  <div>
                    <label style={{...labelStyle, fontSize: '1rem', color: '#991b1b'}}>🔻 Weaknesses / Areas for Improvement</label>
                    <textarea required rows="3" value={weaknesses} onChange={(e) => setWeaknesses(e.target.value)} placeholder="What did the child struggle with?" style={{...textAreaStyle, borderColor: '#fecaca'}} />
                  </div>
                </div>
              </div>

              {/* Home Activities */}
              <div style={sectionStyle}>
                <label style={labelStyle}>🏠 Activities to do / Continue at Home</label>
                <textarea rows="4" value={homeActivities} onChange={(e) => setHomeActivities(e.target.value)} placeholder="Specific instructions for parents..." style={textAreaStyle} />
              </div>

              {/* Other Concerns */}
              <div style={sectionStyle}>
                <label style={labelStyle}>⚠️ Other Concerns</label>
                <textarea rows="3" value={concerns} onChange={(e) => setConcerns(e.target.value)} placeholder="Any behavioral issues or other concerns..." style={textAreaStyle} />
              </div>
            </>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            {step === 1 ? (
               <button type="submit" style={{...submitButtonStyle, background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'}}>Next Step →</button>
            ) : (
              <button type="submit" disabled={loading} style={submitButtonStyle}>
                {loading ? '⏳ Saving Session...' : '✓ Complete Session'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Styles ---
const sectionStyle = { backgroundColor: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' };
const headerStyle = { fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.5rem 0' };
const subHeaderStyle = { fontSize: '0.875rem', color: '#64748b', margin: 0 };
const labelStyle = { display: 'block', fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem' };
const inputStyle = { flex: 1, padding: '0.875rem 1rem', border: '2px solid #e2e8f0', borderRadius: '0.75rem', fontSize: '0.9375rem', outline: 'none' };
const textAreaStyle = { width: '100%', padding: '1rem', border: '2px solid #e2e8f0', borderRadius: '0.75rem', fontSize: '0.9375rem', lineHeight: '1.6', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' };
const addButtonStyle = { padding: '0.875rem 1.5rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: '600', cursor: 'pointer' };
const activityItemStyle = { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #f1f5f9' };
const selectStyle = { padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.8125rem', backgroundColor: 'white', color: '#475569', cursor: 'pointer', outline: 'none' };
const removeButtonStyle = { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.25rem', padding: '0.25rem' };
const submitButtonStyle = { width: '100%', padding: '1.25rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '0.75rem', fontSize: '1.125rem', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' };

export default TherapySessionForm;