import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useChildActivities } from '../../hooks/useCachedData';
import Loading from '../../components/common/Loading';
import BackButton from '../../components/common/BackButton';
import { TherapyCard, GroupCard } from '../../components/activities/ActivityCards';
import Sidebar from '../../components/sidebar/Sidebar';
import { getParentConfig } from '../../components/sidebar/sidebarConfigs';
import GeneralFooter from '../../components/footer/generalfooter';

import './css/ChildActivities.css';

const ChildActivities = () => {
  const { childId } = useParams();

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
    <div className="activities-layout">
      <Sidebar {...getParentConfig()} forceActive="/parent/dashboard" />

      <div className="activities-main-wrapper">
        <div className="activities-container">
          <BackButton to="/parent/dashboard" />

          <div className="activities-page-header">
            <h1>Activity Journal</h1>
            <p>
              Your child's progress updates and class activities.
            </p>
          </div>

          {activities.length === 0 ? (
            <div className="activities-empty">
              No activities recorded yet.
            </div>
          ) : (
            <div className="activities-feed">
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

        <GeneralFooter pageLabel="Activity Journal" />
      </div>
    </div>
  );
};

export default ChildActivities;
