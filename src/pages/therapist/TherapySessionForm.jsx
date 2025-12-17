import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { saveSessionActivity } from '../../services/activityService';
import Loading from '../../components/common/Loading';

const TherapySessionForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { child, service } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [reaction, setReaction] = useState([]);
  const [activities, setActivities] = useState([]);
  const [currentActivity, setCurrentActivity] = useState('');

  const isActivityBased = ['Occupational Therapy', 'Speech Therapy', 'Occupational Service', 'Speech Service'].includes(service?.name);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const sessionData = {
      childId: child.id,
      childName: `${child.firstName} ${child.lastName}`,
      serviceId: service.id,
      serviceName: service.name,
      date: new Date().toISOString(),
      type: isActivityBased ? 'activity' : 'observation',
      data: isActivityBased ? { activities } : {},
      studentReaction: reaction,
      sessionNotes: notes,
      recommendations: suggestions,
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

  const ReactionButton = ({ label, emoji }) => {
    const isSelected = reaction.includes(label);
    return (
      <button
        type="button"
        onClick={() => toggleReaction(label)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          borderRadius: '0.75rem',
          border: '2px solid',
          borderColor: isSelected ? '#6d28d9' : '#e2e8f0',
          backgroundColor: isSelected ? '#f5f3ff' : 'white',
          cursor: 'pointer',
          transition: 'all 0.2s',
          minWidth: '90px'
        }}
        onMouseOver={e => {
          if (!isSelected) e.currentTarget.style.borderColor = '#cbd5e1';
        }}
        onMouseOut={e => {
          if (!isSelected) e.currentTarget.style.borderColor = '#e2e8f0';
        }}
      >
        <span style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{emoji}</span>
        <span style={{ 
          fontSize: '0.75rem', 
          fontWeight: '600',
          color: isSelected ? '#6d28d9' : '#64748b'
        }}>{label}</span>
      </button>
    );
  };

  if (!child || !service) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
        No session details provided.
      </div>
    );
  }

  if (loading) return <Loading />;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '1.5rem 2rem'
      }}>
        <button 
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '600',
            marginBottom: '1rem',
            padding: '0.5rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          onMouseOver={e => e.target.style.color = '#3b82f6'}
          onMouseOut={e => e.target.style.color = '#64748b'}
        >
          ← Back
        </button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              New Session
            </h1>
            <p style={{ color: '#64748b', margin: 0 }}>
              <span style={{ fontWeight: '600', color: '#3b82f6' }}>{child.firstName} {child.lastName}</span>
              {' • '}
              <span style={{ fontWeight: '600', color: '#6d28d9' }}>{service.name}</span>
            </p>
          </div>
          <div style={{
            backgroundColor: '#f8fafc',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            color: '#64748b',
            fontWeight: '500'
          }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Form */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Activity List (Conditional) */}
          {isActivityBased && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                  📋 Activities
                </h2>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
                  What did you work on today?
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input
                  type="text"
                  value={currentActivity}
                  onChange={(e) => setCurrentActivity(e.target.value)}
                  placeholder="e.g., Vocabulary drills, Pincer grasp exercises"
                  style={{
                    flex: 1,
                    padding: '0.875rem 1rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '0.75rem',
                    fontSize: '0.9375rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = '#6d28d9'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddActivity())}
                />
                <button
                  type="button"
                  onClick={handleAddActivity}
                  style={{
                    padding: '0.875rem 1.5rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.9375rem',
                    transition: 'transform 0.2s'
                  }}
                  onMouseOver={e => e.target.style.transform = 'translateY(-2px)'}
                  onMouseOut={e => e.target.style.transform = 'translateY(0)'}
                >
                  Add
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {activities.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: '1.5rem 0', fontSize: '0.875rem' }}>
                    No activities added yet
                  </p>
                )}
                
                {activities.map((act, index) => (
                  <div 
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem',
                      backgroundColor: '#f8fafc',
                      borderRadius: '0.75rem',
                      border: '1px solid #f1f5f9'
                    }}
                  >
                    <span style={{ fontWeight: '600', color: '#64748b', fontSize: '0.875rem' }}>
                      {index + 1}.
                    </span>
                    <span style={{ flex: 1, color: '#1e293b', fontSize: '0.9375rem' }}>
                      {act.name}
                    </span>
                    <select 
                      value={act.performance}
                      onChange={(e) => {
                        const newActs = [...activities];
                        newActs[index].performance = e.target.value;
                        setActivities(newActs);
                      }}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '0.5rem',
                        fontSize: '0.8125rem',
                        backgroundColor: 'white',
                        color: '#475569',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="">Performance...</option>
                      <option value="Independent">Independent</option>
                      <option value="With Assistance">With Assistance</option>
                      <option value="Refused">Refused</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemoveActivity(index)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '1.25rem',
                        padding: '0.25rem',
                        transition: 'color 0.2s'
                      }}
                      onMouseOver={e => e.target.style.color = '#dc2626'}
                      onMouseOut={e => e.target.style.color = '#ef4444'}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Student Reaction */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              😊 Student's Mood
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
              Select all that apply
            </p>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
              gap: '0.75rem'
            }}>
              <ReactionButton label="Happy" emoji="😊" />
              <ReactionButton label="Focused" emoji="🧐" />
              <ReactionButton label="Active" emoji="⚡" />
              <ReactionButton label="Tired" emoji="🥱" />
              <ReactionButton label="Upset" emoji="😢" />
              <ReactionButton label="Social" emoji="👋" />
            </div>
          </div>

          {/* Session Notes */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <label style={{
              display: 'block',
              fontSize: '1.25rem',
              fontWeight: '700',
              color: '#0f172a',
              marginBottom: '0.5rem'
            }}>
              📝 Session Notes
            </label>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
              Detailed observations about today's session
            </p>
            <textarea
              required
              rows="6"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What happened during the session? Progress, challenges, observations..."
              style={{
                width: '100%',
                padding: '1rem',
                border: '2px solid #e2e8f0',
                borderRadius: '0.75rem',
                fontSize: '0.9375rem',
                lineHeight: '1.6',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={e => e.target.style.borderColor = '#6d28d9'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* Suggestions */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <label style={{
              display: 'block',
              fontSize: '1.25rem',
              fontWeight: '700',
              color: '#0f172a',
              marginBottom: '0.5rem'
            }}>
              💡 Recommendations
            </label>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
              Homework, activities, or follow-up suggestions
            </p>
            <textarea
              required
              rows="4"
              value={suggestions}
              onChange={(e) => setSuggestions(e.target.value)}
              placeholder="What can parents or teachers work on at home or in class?"
              style={{
                width: '100%',
                padding: '1rem',
                border: '2px solid #e2e8f0',
                borderRadius: '0.75rem',
                fontSize: '0.9375rem',
                lineHeight: '1.6',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={e => e.target.style.borderColor = '#6d28d9'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '1.25rem',
              background: loading ? '#94a3b8' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              fontSize: '1.125rem',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 6px rgba(16, 185, 129, 0.25)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem'
            }}
            onMouseOver={e => {
              if (!loading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 12px rgba(16, 185, 129, 0.35)';
              }
            }}
            onMouseOut={e => {
              if (!loading) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 6px rgba(16, 185, 129, 0.25)';
              }
            }}
          >
            {loading ? (
              <>⏳ Saving Session...</>
            ) : (
              <>✓ Complete Session</>
            )}
          </button>

        </form>
      </div>
    </div>
  );
};

export default TherapySessionForm;