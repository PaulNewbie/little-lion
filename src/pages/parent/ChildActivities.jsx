import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import activityService from '../../services/activityService';
// import childService from '../../services/childService'; 
import Loading from '../../components/common/Loading';

const ChildActivities = () => {
  const { childId } = useParams();
  const navigate = useNavigate();
  
  const [activities, setActivities] = useState([]);
  // const [childInfo, setChildInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Get Child Info (for the header)
        // Note: You might need to implement getChildById in childService if not exists, 
        // but for now we can fetch all or just rely on the ID if you prefer. 
        // Let's assume we just want the activities for now.
        
        // 2. Get Activities (Privacy Filtered by Backend Service)
        const data = await activityService.getActivitiesByChild(childId);
        setActivities(data);
      } catch (err) {
        console.error("Failed to load activities", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [childId]);

  if (loading) return <Loading />;

  // --- STYLES ---
  const styles = {
    container: { padding: '20px', maxWidth: '800px', margin: '0 auto' },
    header: { marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '10px' },
    backBtn: { background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: '16px', marginBottom: '10px' },
    activityCard: { 
      backgroundColor: 'white', 
      borderRadius: '10px', 
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
      marginBottom: '30px',
      overflow: 'hidden',
      border: '1px solid #eee'
    },
    cardHeader: { 
      padding: '15px 20px', 
      backgroundColor: '#f8f9fa', 
      borderBottom: '1px solid #eee',
      display: 'flex', 
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    dateBadge: { 
      backgroundColor: '#e3f2fd', 
      color: '#0d47a1', 
      padding: '4px 10px', 
      borderRadius: '20px', 
      fontSize: '12px', 
      fontWeight: 'bold' 
    },
    cardBody: { padding: '20px' },
    photoGrid: { 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
      gap: '10px',
      marginTop: '15px'
    },
    photo: { 
      width: '100%', 
      height: '100px', 
      objectFit: 'cover', 
      borderRadius: '4px',
      cursor: 'pointer' 
    }
  };

  return (
    <div style={styles.container}>
      <button style={styles.backBtn} onClick={() => navigate('/parent/dashboard')}>
        ← Back to Dashboard
      </button>

      <div style={styles.header}>
        <h1>Activity Journal</h1>
        <p style={{ color: '#666' }}>Recent updates and photos</p>
      </div>

      {activities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#888', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
          No activities recorded yet.
        </div>
      ) : (
        <div>
          {activities.map(activity => (
            <div key={activity.id} style={styles.activityCard}>
              {/* Card Header: Date & Type */}
              <div style={styles.cardHeader}>
                <div>
                  <span style={styles.dateBadge}>{activity.date}</span>
                  <span style={{ marginLeft: '10px', fontWeight: 'bold', color: '#555' }}>
                    {activity.title}
                  </span>
                </div>
                <small style={{ color: '#999' }}>{activity.type === 'play_group' ? '👥 Group Activity' : '👤 1:1 Session'}</small>
              </div>

              {/* Card Body: Description & Photos */}
              <div style={styles.cardBody}>
                <p style={{ margin: '0 0 15px 0', color: '#333', lineHeight: '1.5' }}>
                  {activity.description}
                </p>
                
                {/* Photo Gallery */}
                {activity.photoUrls && activity.photoUrls.length > 0 && (
                  <div>
                    <strong style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Photos</strong>
                    <div style={styles.photoGrid}>
                      {activity.photoUrls.map((url, idx) => (
                        <img 
                          key={idx} 
                          src={url} 
                          alt="Activity" 
                          style={styles.photo} 
                          onClick={() => window.open(url, '_blank')} // Simple lightbox equivalent
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer: Teacher Name */}
                <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #f0f0f0', fontSize: '12px', color: '#888' }}>
                  Posted by: {activity.teacherName || 'Teacher'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChildActivities;