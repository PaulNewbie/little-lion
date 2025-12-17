import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import activityService from '../../services/activityService';
import Loading from '../../components/common/Loading';

const ChildActivities = () => {
  const { childId } = useParams();
  const navigate = useNavigate();
  
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await activityService.getActivitiesByChild(childId);
        
        // PRIVACY FILTER: 
        // 1. Group Activities: The backend query already filtered by 'participatingStudentIds'.
        // 2. Therapy Sessions: We must check the 'visibleToParents' flag.
        const visibleActivities = data.filter(activity => {
          if (activity.type === 'therapy_session') {
            return activity.visibleToParents !== false; // Show unless explicitly set to false
          }
          return true; // Group activities are always visible if fetched
        });

        setActivities(visibleActivities);
      } catch (err) {
        console.error("Failed to load activities", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [childId]);

  if (loading) return <Loading />;

  // --- COMPONENT: THERAPY CARD (Updated for Detailed Clinical Data) ---
  const TherapyCard = ({ activity }) => {
    // Helper to format date nicely
    const dateStr = new Date(activity.date).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric'
    });

    return (
      <div style={{ ...styles.card, borderLeft: '5px solid #4a90e2' }}>
        {/* Header */}
        <div style={styles.cardHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ ...styles.badge, backgroundColor: '#e3f2fd', color: '#0d47a1' }}>
              🩺 {activity.serviceName || 'Therapy Session'}
            </span>
            <span style={styles.date}>{dateStr}</span>
          </div>
          <div style={styles.author}>
            Th: {activity.childName ? activity.childName.split(' ')[0] : ''} {/* Use therapist name if available in future updates */}
          </div>
        </div>
        
        <div style={styles.cardBody}>
          {/* Mood / Reaction */}
          {activity.studentReaction && activity.studentReaction.length > 0 && (
            <div style={{ marginBottom: '15px', display: 'flex', gap: '8px' }}>
              {activity.studentReaction.map((mood, i) => (
                <span key={i} style={{ 
                  backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', 
                  padding: '4px 8px', borderRadius: '12px', fontSize: '13px', color: '#475569' 
                }}>
                  {getEmojiForMood(mood)} {mood}
                </span>
              ))}
            </div>
          )}

          {/* Activity Purpose */}
          {activity.activityPurpose && (
            <div style={styles.section}>
              <strong style={{ color: '#1e293b' }}>🎯 Purpose of Session:</strong>
              <p style={styles.text}>{activity.activityPurpose}</p>
            </div>
          )}

          {/* Specific Activities Performed (If OT/ST) */}
          {activity.data?.activities && activity.data.activities.length > 0 && (
            <div style={{ ...styles.section, backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              <strong style={{ display: 'block', marginBottom: '8px', color: '#334155' }}>📋 Activities Performed:</strong>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {activity.data.activities.map((act, i) => (
                  <li key={i} style={{ marginBottom: '4px', fontSize: '14px', color: '#475569' }}>
                    <span style={{ fontWeight: '600' }}>{act.name}</span>
                    {act.performance && (
                      <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '6px', fontStyle: 'italic' }}>
                         ({act.performance})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Observations Grid */}
          <div style={{ display: 'grid', gap: '15px', marginTop: '15px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            
            {/* Strengths */}
            {activity.strengths && (
              <div style={{ padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <strong style={{ color: '#166534', fontSize: '14px' }}>💪 Strengths</strong>
                <p style={{ ...styles.text, marginTop: '5px', fontSize: '14px' }}>{activity.strengths}</p>
              </div>
            )}

            {/* Weaknesses / Improvements */}
            {activity.weaknesses && (
              <div style={{ padding: '12px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                <strong style={{ color: '#991b1b', fontSize: '14px' }}>🔻 Areas for Improvement</strong>
                <p style={{ ...styles.text, marginTop: '5px', fontSize: '14px' }}>{activity.weaknesses}</p>
              </div>
            )}
          </div>

          {/* General Notes */}
          {activity.sessionNotes && (
            <div style={{ marginTop: '15px' }}>
              <strong style={{ color: '#1e293b' }}>📝 Session Notes:</strong>
              <p style={styles.text}>{activity.sessionNotes}</p>
            </div>
          )}

          {/* Home Activities / Recommendations */}
          {(activity.homeActivities || activity.recommendations) && (
            <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px dashed #e2e8f0' }}>
              <strong style={{ color: '#7c3aed' }}>🏠 Home Plan & Recommendations:</strong>
              {activity.homeActivities && <p style={styles.text}>{activity.homeActivities}</p>}
              {activity.recommendations && <p style={{...styles.text, fontStyle: 'italic', color: '#64748b'}}>{activity.recommendations}</p>}
            </div>
          )}

          {/* Concerns (Optional Display) */}
          {activity.concerns && (
            <div style={{ marginTop: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#f59e0b' }}>⚠️ NOTE: </span>
              <span style={{ fontSize: '13px', color: '#64748b' }}>{activity.concerns}</span>
            </div>
          )}

        </div>
      </div>
    );
  };

  // --- COMPONENT: GROUP ACTIVITY CARD ---
  const GroupCard = ({ activity }) => {
    const dateStr = new Date(activity.date).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric'
    });

    return (
      <div style={{ ...styles.card, borderLeft: '5px solid #2ecc71' }}>
        <div style={styles.cardHeader}>
          <div>
            <span style={{ ...styles.badge, backgroundColor: '#e8f5e9', color: '#1b5e20' }}>
              🎨 Group Class
            </span>
            <span style={styles.date}>{dateStr}</span>
          </div>
          <div style={styles.author}>
            Tr: {activity.teacherName || 'Teacher'}
          </div>
        </div>

        <div style={styles.cardBody}>
          <h3 style={styles.title}>{activity.title}</h3>
          <h4 style={styles.subTitle}>{activity.className || 'Class Activity'}</h4>

          <p style={styles.text}>{activity.description}</p>

          {/* Group photos are the main feature */}
          {activity.photoUrls && activity.photoUrls.length > 0 && (
            <div style={styles.photoGrid}>
              {activity.photoUrls.map((url, idx) => (
                <img 
                  key={idx} 
                  src={url} 
                  alt="Activity" 
                  style={styles.mainPhoto} 
                  onClick={() => window.open(url, '_blank')}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const getEmojiForMood = (mood) => {
    const map = {
      'Happy': '😊', 'Focused': '🧐', 'Active': '⚡',
      'Tired': '🥱', 'Upset': '😢', 'Social': '👋'
    };
    return map[mood] || '•';
  };

  return (
    <div style={styles.container}>
      <button style={styles.backBtn} onClick={() => navigate('/parent/dashboard')}>
        ← Back to Dashboard
      </button>

      <div style={styles.pageHeader}>
        <h1>Activity Journal</h1>
        <p style={{ color: '#666', marginTop: '5px' }}>
          Your child's progress updates and class activities.
        </p>
      </div>

      {activities.length === 0 ? (
        <div style={styles.empty}>
          No activities recorded yet.
        </div>
      ) : (
        <div style={styles.feed}>
          {activities.map(activity => (
            <React.Fragment key={activity.id}>
              {/* Check _collection OR type to decide card style */}
              {(activity.type === 'therapy_session' || activity._collection === 'therapy_sessions') ? (
                <TherapyCard activity={activity} />
              ) : (
                <GroupCard activity={activity} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' },
  backBtn: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '15px', marginBottom: '20px', padding: 0, fontWeight: '600' },
  pageHeader: { marginBottom: '30px', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' },
  empty: { textAlign: 'center', padding: '50px', color: '#94a3b8', backgroundColor: '#f8fafc', borderRadius: '12px', border: '2px dashed #e2e8f0' },
  feed: { display: 'flex', flexDirection: 'column', gap: '25px' },
  
  // Card Styles
  card: { backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', overflow: 'hidden', border: '1px solid #f1f5f9' },
  cardHeader: { padding: '15px 20px', backgroundColor: '#fff', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardBody: { padding: '20px' },
  
  badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' },
  date: { color: '#64748b', fontSize: '13px', fontWeight: '500' },
  author: { fontSize: '13px', color: '#64748b', fontWeight: '500' },
  
  title: { margin: '0 0 5px 0', fontSize: '18px', color: '#0f172a', fontWeight: '700' },
  subTitle: { margin: '0 0 15px 0', fontSize: '14px', color: '#64748b', fontWeight: '500' },
  text: { lineHeight: '1.6', color: '#334155', fontSize: '15px', margin: 0 },
  section: { marginBottom: '15px' },

  // Photos
  photoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginTop: '15px' },
  mainPhoto: { width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', transition: 'opacity 0.2s', border: '1px solid #e2e8f0' }
};

export default ChildActivities;