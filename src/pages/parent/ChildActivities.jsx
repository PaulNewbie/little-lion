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

  // --- COMPONENT: THERAPY CARD (1:1) ---
  const TherapyCard = ({ activity }) => (
    <div style={{ ...styles.card, borderLeft: '5px solid #4a90e2' }}>
      <div style={styles.cardHeader}>
        <div>
          <span style={{ ...styles.badge, backgroundColor: '#e3f2fd', color: '#0d47a1' }}>
            🩺 1:1 Therapy
          </span>
          <span style={styles.date}>{activity.date}</span>
        </div>
        <div style={styles.author}>
          Th: {activity.authorName}
        </div>
      </div>
      
      <div style={styles.cardBody}>
        <h3 style={styles.title}>{activity.title}</h3>
        <h4 style={styles.subTitle}>{activity.serviceType}</h4>
        
        <div style={styles.section}>
          <strong>📝 Progress Notes:</strong>
          <p style={styles.text}>{activity.progressNotes}</p>
        </div>

        {activity.goalsAddressed && activity.goalsAddressed.length > 0 && (
          <div style={{ ...styles.section, backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '5px' }}>
            <strong>YW Goals Addressed:</strong>
            <ul style={{ margin: '5px 0 0 20px', padding: 0 }}>
              {activity.goalsAddressed.map((goal, i) => (
                <li key={i} style={styles.text}>{goal}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Therapy photos are usually fewer, show small thumbnails */}
        {activity.photoUrls && activity.photoUrls.length > 0 && (
          <div style={{ marginTop: '15px' }}>
            <strong style={{ fontSize: '12px', color: '#666' }}>SESSION PHOTOS</strong>
            <div style={styles.miniGrid}>
              {activity.photoUrls.map((url, idx) => (
                <img 
                  key={idx} 
                  src={url} 
                  alt="Therapy" 
                  style={styles.miniPhoto} 
                  onClick={() => window.open(url, '_blank')}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // --- COMPONENT: GROUP ACTIVITY CARD ---
  const GroupCard = ({ activity }) => (
    <div style={{ ...styles.card, borderLeft: '5px solid #2ecc71' }}>
      <div style={styles.cardHeader}>
        <div>
          <span style={{ ...styles.badge, backgroundColor: '#e8f5e9', color: '#1b5e20' }}>
            🎨 Group Class
          </span>
          <span style={styles.date}>{activity.date}</span>
        </div>
        <div style={styles.author}>
          Tr: {activity.teacherName}
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
              {activity.type === 'therapy_session' ? (
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
  container: { padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Segoe UI, sans-serif' },
  backBtn: { background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '15px', marginBottom: '20px', padding: 0 },
  pageHeader: { marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '15px' },
  empty: { textAlign: 'center', padding: '50px', color: '#888', backgroundColor: '#f9f9f9', borderRadius: '8px' },
  feed: { display: 'flex', flexDirection: 'column', gap: '30px' },
  
  // Card Styles
  card: { backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden', border: '1px solid #eaeaea' },
  cardHeader: { padding: '15px 20px', backgroundColor: '#fff', borderBottom: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardBody: { padding: '20px' },
  
  badge: { padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', marginRight: '10px' },
  date: { color: '#888', fontSize: '13px' },
  author: { fontSize: '13px', color: '#666', fontStyle: 'italic' },
  
  title: { margin: '0 0 5px 0', fontSize: '18px', color: '#333' },
  subTitle: { margin: '0 0 15px 0', fontSize: '14px', color: '#888', fontWeight: '500' },
  text: { lineHeight: '1.6', color: '#444', fontSize: '15px' },
  section: { marginBottom: '15px' },

  // Photos
  miniGrid: { display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' },
  miniPhoto: { width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' },
  
  photoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginTop: '15px' },
  mainPhoto: { width: '100%', height: '150px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer', transition: 'opacity 0.2s' }
};

export default ChildActivities;