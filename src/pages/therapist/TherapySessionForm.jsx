import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { saveSessionActivity } from '../../services/activityService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import Loading from '../../components/common/Loading';
import Sidebar from '../../components/sidebar/Sidebar';
import { getTherapistConfig } from '../../components/sidebar/sidebarConfigs';
import QuickSelectTags from '../../components/common/form-elements/QuickSelectTags';
import VoiceInput from '../../components/common/form-elements/VoiceInput';
import BackButton from '../../components/common/BackButton';
import './css/TherapySessionForm.css';

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
  const toast = useToast();
  const { child, service } = location.state || {};

  // --- LOGIC: DETERMINE FORM TYPE ---
  const isSpeech = service?.name?.toLowerCase().includes('speech');
  const isOT = service?.name?.toLowerCase().includes('occupational');
  const isSessionLog = isSpeech || isOT || ['Occupational Therapy', 'Speech Therapy', 'Occupational Service', 'Speech Service'].includes(service?.name);

  const [loading, setLoading] = useState(false);

  // --- MODAL STATE ---
  const [showModal, setShowModal] = useState(true); // Start with modal open
  const [modalStep, setModalStep] = useState(0);

  // --- STATE: SESSION LOG (OT/ST) ---
  const [reaction, setReaction] = useState([]);
  const [activities, setActivities] = useState([]);
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

  // --- MODAL STEPS CONFIGURATION ---
  const sessionLogSteps = [
    { id: 'mood', title: "Student's Mood", description: 'How was the student feeling?' },
    { id: 'activities', title: 'Activities Done', description: 'What activities were performed?' },
    { id: 'notes', title: 'Clinical Notes', description: 'Session observations' },
    { id: 'recommendations', title: 'Recommendations', description: 'Next steps and plans' }
  ];

  const observationSteps = [
    { id: 'purpose', title: 'Activity Purpose', description: 'Goal of the session' },
    { id: 'strengths', title: 'Strengths', description: 'Observed positive behaviors' },
    { id: 'improvements', title: 'Areas for Improvement', description: 'Areas needing attention' },
    { id: 'home', title: 'Home & Concerns', description: 'Instructions and notes' }
  ];

  const modalSteps = isSessionLog ? sessionLogSteps : observationSteps;

  // --- MODAL NAVIGATION ---
  const goToModalStep = (stepIndex) => {
    if (stepIndex >= 0 && stepIndex < modalSteps.length) {
      setModalStep(stepIndex);
    }
  };

  const nextModalStep = () => {
    if (modalStep < modalSteps.length - 1) {
      setModalStep(modalStep + 1);
    }
  };

  const prevModalStep = () => {
    if (modalStep > 0) {
      setModalStep(modalStep - 1);
    }
  };

  const closeModal = () => {
    navigate(-1);
  };

  // --- HANDLERS ---

  const appendText = (current, newText, setter) => {
    const trimmed = current.trim();
    setter(trimmed ? `${trimmed}. ${newText}. ` : `${newText}. `);
  };

  const addActivity = (name) => {
    if (!name.trim()) return;
    if (activities.some(a => a.name === name)) return;
    setActivities([...activities, { name: name, performance: '' }]);
    setCurrentActivity('');
  };

  const removeActivity = (index) => {
    setActivities(activities.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSessionLog && activities.length === 0 && !window.confirm("No activities listed. Save anyway?")) return;

    setLoading(true);

    const finalStrengths = [...selectedStrengths, strengthNotes].filter(Boolean).join('. ');
    const finalWeaknesses = [...selectedWeaknesses, weaknessNotes].filter(Boolean).join('. ');

    const sessionData = {
      childId: child.id,
      childName: `${child.firstName} ${child.lastName}`,
      serviceId: service.id,
      serviceName: service.name,
      date: new Date().toISOString(),
      type: isSessionLog ? 'activity' : 'observation',
      data: isSessionLog ? { activities } : {},
      studentReaction: isSessionLog ? reaction : [],
      sessionNotes: notes,
      recommendations: suggestions,
      activityPurpose: activityPurpose,
      strengths: finalStrengths,
      weaknesses: finalWeaknesses,
      homeActivities: homeActivities,
      concerns: concerns
    };

    try {
      await saveSessionActivity(sessionData);
      toast.success('Session saved successfully!');
      navigate('/therapist/dashboard');
    } catch (error) {
      console.error("Error saving", error);
      toast.error('Failed to save session.');
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER STEP CONTENT ---
  const renderModalStepContent = () => {
    if (isSessionLog) {
      switch (modalStep) {
        case 0: // Mood
          return (
            <QuickSelectTags
              label="How was the student feeling today?"
              options={MOODS}
              selected={reaction}
              onChange={setReaction}
              color="purple"
            />
          );
        case 1: // Activities
          return (
            <>
              <p className="tsf-hint">Tap to add or type your own activity.</p>
              <div className="tsf-chip-container">
                {(isSpeech ? ST_ACTIVITIES : OT_ACTIVITIES).map(act => (
                  <button
                    key={act}
                    type="button"
                    onClick={() => addActivity(act)}
                    className={`tsf-chip-btn ${activities.some(a => a.name === act) ? 'tsf-chip-btn--selected' : ''}`}
                  >
                    + {act}
                  </button>
                ))}
              </div>
              <div className="tsf-input-row">
                <input
                  type="text"
                  value={currentActivity}
                  onChange={(e) => setCurrentActivity(e.target.value)}
                  placeholder="Type custom activity..."
                  className="tsf-input"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addActivity(currentActivity))}
                />
                <button type="button" onClick={() => addActivity(currentActivity)} className="tsf-add-btn">
                  Add
                </button>
              </div>
              <div className="tsf-activity-list">
                {activities.map((act, index) => (
                  <div key={index} className="tsf-activity-item">
                    <div className="tsf-activity-badge">{index + 1}</div>
                    <span className="tsf-activity-name">{act.name}</span>
                    <button type="button" onClick={() => removeActivity(index)} className="tsf-remove-btn">✕</button>
                  </div>
                ))}
                {activities.length === 0 && <p className="tsf-empty-text">No activities added yet.</p>}
              </div>
            </>
          );
        case 2: // Clinical Notes
          return (
            <>
              <div className="tsf-card-header">
                <span className="tsf-mini-label">Quick phrases</span>
                <VoiceInput onTranscript={(text) => appendText(notes, text, setNotes)} />
              </div>
              <div className="tsf-chip-container">
                {NOTE_PHRASES.map(phrase => (
                  <button key={phrase} type="button" onClick={() => appendText(notes, phrase, setNotes)} className="tsf-phrase-btn">
                    {phrase}
                  </button>
                ))}
              </div>
              <textarea
                rows="6"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Session observations and student responses..."
                className="tsf-textarea"
              />
            </>
          );
        case 3: // Recommendations
          return (
            <>
              <div className="tsf-card-header">
                <span className="tsf-mini-label">Quick phrases</span>
                <VoiceInput onTranscript={(text) => appendText(suggestions, text, setSuggestions)} />
              </div>
              <div className="tsf-chip-container">
                {REC_PHRASES.map(phrase => (
                  <button key={phrase} type="button" onClick={() => appendText(suggestions, phrase, setSuggestions)} className="tsf-phrase-btn">
                    {phrase}
                  </button>
                ))}
              </div>
              <textarea
                rows="5"
                value={suggestions}
                onChange={(e) => setSuggestions(e.target.value)}
                placeholder="Next steps and home recommendations..."
                className="tsf-textarea"
              />
            </>
          );
        default:
          return null;
      }
    } else {
      // Observation Report
      switch (modalStep) {
        case 0: // Activity Purpose
          return (
            <>
              <div className="tsf-card-header">
                <span className="tsf-mini-label">Voice input available</span>
                <VoiceInput onTranscript={(text) => appendText(activityPurpose, text, setActivityPurpose)} />
              </div>
              <p className="tsf-hint">What was the goal of today's session?</p>
              <textarea
                rows="4"
                value={activityPurpose}
                onChange={(e) => setActivityPurpose(e.target.value)}
                placeholder="Describe the purpose of today's activity..."
                className="tsf-textarea"
              />
            </>
          );
        case 1: // Strengths
          return (
            <>
              <QuickSelectTags
                label="Select observed strengths"
                options={COMMON_STRENGTHS}
                selected={selectedStrengths}
                onChange={setSelectedStrengths}
                color="green"
              />
              <div className="tsf-section-divider">
                <div className="tsf-card-header">
                  <span className="tsf-mini-label">Additional details</span>
                  <VoiceInput onTranscript={(text) => appendText(strengthNotes, text, setStrengthNotes)} />
                </div>
                <textarea
                  rows="3"
                  value={strengthNotes}
                  onChange={(e) => setStrengthNotes(e.target.value)}
                  placeholder="Additional details about observed strengths..."
                  className="tsf-textarea"
                />
              </div>
            </>
          );
        case 2: // Areas for Improvement
          return (
            <>
              <QuickSelectTags
                label="Select areas needing attention"
                options={COMMON_WEAKNESSES}
                selected={selectedWeaknesses}
                onChange={setSelectedWeaknesses}
                color="red"
              />
              <div className="tsf-section-divider">
                <div className="tsf-card-header">
                  <span className="tsf-mini-label">Additional details</span>
                  <VoiceInput onTranscript={(text) => appendText(weaknessNotes, text, setWeaknessNotes)} />
                </div>
                <textarea
                  rows="3"
                  value={weaknessNotes}
                  onChange={(e) => setWeaknessNotes(e.target.value)}
                  placeholder="Additional details about areas needing improvement..."
                  className="tsf-textarea"
                />
              </div>
            </>
          );
        case 3: // Home & Concerns
          return (
            <>
              <label className="tsf-label">
                <span className="tsf-label-icon">🏠</span>
                Home Instructions
              </label>
              <textarea
                rows="3"
                value={homeActivities}
                onChange={(e) => setHomeActivities(e.target.value)}
                className="tsf-textarea"
                placeholder="Activities or exercises for parents to do at home..."
              />
              <div className="tsf-section-divider">
                <label className="tsf-label">
                  <span className="tsf-label-icon">⚠️</span>
                  Other Concerns
                </label>
                <textarea
                  rows="3"
                  value={concerns}
                  onChange={(e) => setConcerns(e.target.value)}
                  className="tsf-textarea"
                  placeholder="Any behavioral notes or concerns to flag..."
                />
              </div>
            </>
          );
        default:
          return null;
      }
    }
  };

  if (!child || !service) return <div style={{padding:'2rem'}}>No session details provided.</div>;

  return (
    <div className="sidebar-page">
      <Sidebar {...getTherapistConfig()} />
      {loading ? (
        <Loading role="therapist" message="Loading session" variant="content" />
      ) : (
      <div className="sidebar-page__content">
        <div className="tsf-page">

          {/* Page Header */}
          <div className="tsf-header">
            <BackButton />
            <div className="tsf-header-main">
              <div className="tsf-header-text">
                <h1 className="tsf-title">
                  {isSessionLog ? 'NEW SESSION LOG' : 'OBSERVATION REPORT'}
                </h1>
                <p className="tsf-subtitle">
                  Student: <span className="tsf-subtitle-highlight">{child.firstName} {child.lastName}</span>
                  {' • '}
                  <span className="tsf-subtitle-service">{service.name}</span>
                </p>
              </div>
              <span className={`tsf-type-badge ${isSessionLog ? 'tsf-type-badge--session' : 'tsf-type-badge--observation'}`}>
                {isSessionLog ? 'Clinical Session' : 'Class Observation'}
              </span>
            </div>
          </div>

          {/* Multi-Step Modal */}
          {showModal && (
            <div className="tsf-modal-overlay" onClick={closeModal}>
              <div className="tsf-modal-container" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="tsf-modal-header">
                  <div className="tsf-modal-header-content">
                    <h2 className="tsf-modal-title">
                      {isSessionLog ? 'Session Log' : 'Observation Report'}
                    </h2>
                    <p className="tsf-modal-subtitle">
                      {child.firstName} {child.lastName} • {service.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="tsf-modal-close"
                    onClick={closeModal}
                    aria-label="Close modal"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>

                {/* Modal Step Indicator */}
                <div className="tsf-modal-steps">
                  {modalSteps.map((step, index) => (
                    <button
                      key={step.id}
                      type="button"
                      className={`tsf-modal-step ${index === modalStep ? 'tsf-modal-step--active' : ''} ${index < modalStep ? 'tsf-modal-step--completed' : ''}`}
                      onClick={() => goToModalStep(index)}
                    >
                      <span className="tsf-modal-step-number">
                        {index < modalStep ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        ) : (
                          index + 1
                        )}
                      </span>
                      <span className="tsf-modal-step-title">{step.title}</span>
                    </button>
                  ))}
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSubmit}>
                  <div className="tsf-modal-body">
                    <div className="tsf-modal-step-header">
                      <h3>{modalSteps[modalStep].title}</h3>
                      <p>{modalSteps[modalStep].description}</p>
                    </div>
                    <div className="tsf-modal-step-content">
                      {renderModalStepContent()}
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="tsf-modal-footer">
                    <div className="tsf-modal-footer-left">
                      {modalStep > 0 && (
                        <button
                          type="button"
                          className="tsf-btn tsf-btn--secondary"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            prevModalStep();
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                          </svg>
                          Previous
                        </button>
                      )}
                    </div>

                    <div className="tsf-modal-footer-center">
                      <span className="tsf-modal-step-counter">
                        Step {modalStep + 1} of {modalSteps.length}
                      </span>
                    </div>

                    <div className="tsf-modal-footer-right">
                      {modalStep < modalSteps.length - 1 ? (
                        <button
                          type="button"
                          className="tsf-btn tsf-btn--primary"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            nextModalStep();
                          }}
                        >
                          Next
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                          </svg>
                        </button>
                      ) : (
                        <button
                          type="submit"
                          className="tsf-btn tsf-btn--save"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <span className="tsf-btn-spinner"></span>
                              Saving...
                            </>
                          ) : (
                            <>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                <polyline points="22 4 12 14.01 9 11.01"/>
                              </svg>
                              Complete Session
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};

export default TherapySessionForm;
