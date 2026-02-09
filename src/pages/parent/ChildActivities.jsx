import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChildActivities } from '../../hooks/useCachedData';
import Loading from '../../components/common/Loading';
import BackButton from '../../components/common/BackButton';
import { TherapyCard, GroupCard } from '../../components/activities/ActivityCards';

const ChildActivities = () => {
  const { childId } = useParams();
  const navigate = useNavigate();

  // Use cached activities - prevents re-fetching when navigating back
  const { data: rawActivities = [], isLoading: loading } = useChildActivities(childId);

  // PRIVACY FILTER: Memoized to prevent re-computing on every render
  const activities = useMemo(() => {
    return rawActivities.filter(activity => {
      // 1. Group Activities: The backend query already filtered by 'participatingStudentIds'.
      // 2. Therapy Sessions: We must check the 'visibleToParents' flag.
      if (activity.type === 'therapy_session') {
        return activity.visibleToParents !== false; // Show unless explicitly set to false
      }
      return true; // Group activities are always visible if fetched
    });
  }, [rawActivities]);

  if (loading) return <Loading role="parent" message="Loading activities" />;

  return (
    <div style={styles.container}>
      <BackButton to="/parent/dashboard" />

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