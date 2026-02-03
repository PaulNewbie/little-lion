// src/pages/parent/DailyDigest.jsx
// Daily Digest page for parents - quick daily snapshot of child activities

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import childService from '../../services/childService';
import Sidebar from '../../components/sidebar/Sidebar';
import { getParentConfig } from '../../components/sidebar/sidebarConfigs';
import GeneralFooter from '../../components/footer/generalfooter';
import ChildSelector from '../../components/common/ChildSelector';
import { useDailyDigest, useLastActivityDate } from '../../hooks/useDailyDigest';

// Digest components
import DigestDateNav from './components/DigestDateNav';
import DigestSummaryCard from './components/DigestSummaryCard';
import DigestActivityList from './components/DigestActivityList';
import DigestPhotoStrip from './components/DigestPhotoStrip';
import DigestEmptyState from './components/DigestEmptyState';

const styles = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
  },
  mainWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    overflow: 'auto',
  },
  main: {
    flex: 1,
    padding: '24px',
    backgroundColor: '#f5f5f5',
  },
  header: {
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '4px',
    color: '#1a1a1a',
  },
  subtitle: {
    color: '#666',
    fontSize: '14px',
  },
  loading: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#64748b',
  },
  loadingSpinner: {
    display: 'inline-block',
    width: '24px',
    height: '24px',
    border: '3px solid #e2e8f0',
    borderTopColor: '#0052A1',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    marginBottom: '12px',
  },
  error: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center',
    color: '#991b1b',
  },
  childName: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: 'white',
    borderRadius: '10px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '16px',
  },
  childAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#0052A1',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '14px',
  },
  childNameText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
  },
};

// Keyframe animation for spinner
const spinnerKeyframes = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

// Storage key for persisting selected child
const SELECTED_CHILD_KEY = 'dailyDigest_selectedChild';

export default function DailyDigest() {
  const { currentUser } = useAuth();

  // Children data state
  const [children, setChildren] = useState([]);
  const [childrenLoading, setChildrenLoading] = useState(true);

  // Selection state
  const [selectedChild, setSelectedChild] = useState(() => {
    // Try to restore from localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem(SELECTED_CHILD_KEY) || '';
    }
    return '';
  });
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Fetch children on mount
  useEffect(() => {
    if (!currentUser?.uid) {
      setChildrenLoading(false);
      return;
    }

    let cancelled = false;

    const fetchChildren = async () => {
      try {
        const data = await childService.getChildrenByParentId(currentUser.uid);

        if (cancelled) return;

        // Deduplicate by ID
        const uniqueChildren = data?.length > 0
          ? [...new Map(data.map(child => [child.id, child])).values()]
          : [];

        setChildren(uniqueChildren);

        // Auto-select first child if no selection
        if (uniqueChildren.length > 0 && !selectedChild) {
          const firstChildId = uniqueChildren[0].id;
          setSelectedChild(firstChildId);
          localStorage.setItem(SELECTED_CHILD_KEY, firstChildId);
        } else if (selectedChild && !uniqueChildren.find(c => c.id === selectedChild)) {
          // If stored child no longer exists, select first
          if (uniqueChildren.length > 0) {
            const firstChildId = uniqueChildren[0].id;
            setSelectedChild(firstChildId);
            localStorage.setItem(SELECTED_CHILD_KEY, firstChildId);
          }
        }
      } catch (error) {
        console.error('Error fetching children:', error);
        if (!cancelled) setChildren([]);
      } finally {
        if (!cancelled) setChildrenLoading(false);
      }
    };

    fetchChildren();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.uid]);

  // Handle child selection
  const handleChildSelect = (childId) => {
    setSelectedChild(childId);
    localStorage.setItem(SELECTED_CHILD_KEY, childId);
  };

  // Handle date change
  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
  };

  // Fetch digest data
  const {
    data: digest,
    isLoading: digestLoading,
    error: digestError,
  } = useDailyDigest(selectedChild, selectedDate);

  // Fetch last activity date (for empty state)
  const {
    data: lastActivityDate,
    isLoading: lastDateLoading,
  } = useLastActivityDate(selectedChild);

  // Jump to last activity
  const handleJumpToLastActivity = (date) => {
    setSelectedDate(date);
  };

  // Get selected child info
  const selectedChildInfo = children.find(c => c.id === selectedChild);

  // Determine what to render
  const showLoading = childrenLoading || (digestLoading && !digest);
  const showError = digestError;
  const showEmpty = !showLoading && !showError && digest?.activities?.length === 0;
  const showContent = !showLoading && !showError && digest?.activities?.length > 0;

  return (
    <div style={styles.layout}>
      <style>{spinnerKeyframes}</style>
      <Sidebar {...getParentConfig()} forceActive="/parent/digest" />

      <div style={styles.mainWrapper}>
        <main style={styles.main}>
          {/* Header */}
          <div style={styles.header}>
            <h1 style={styles.title}>Daily Digest</h1>
            <p style={styles.subtitle}>
              Quick snapshot of your child's activities for the day
            </p>
          </div>

          {/* Child Selector (for multi-child families) */}
          <ChildSelector
            children={children}
            selectedChild={selectedChild}
            onSelect={handleChildSelect}
            isLoading={childrenLoading}
          />

          {/* Selected Child Name (single child or after selection) */}
          {selectedChildInfo && children.length === 1 && (
            <div style={styles.childName}>
              <div style={styles.childAvatar}>
                {selectedChildInfo.photoUrl ? (
                  <img
                    src={selectedChildInfo.photoUrl}
                    alt={selectedChildInfo.firstName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  />
                ) : (
                  selectedChildInfo.firstName?.charAt(0)?.toUpperCase() || '?'
                )}
              </div>
              <span style={styles.childNameText}>
                {selectedChildInfo.firstName} {selectedChildInfo.lastName}
              </span>
            </div>
          )}

          {/* Date Navigation */}
          {selectedChild && (
            <DigestDateNav
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
            />
          )}

          {/* Loading State */}
          {showLoading && (
            <div style={styles.loading}>
              <div style={styles.loadingSpinner}></div>
              <p>Loading activities...</p>
            </div>
          )}

          {/* Error State */}
          {showError && (
            <div style={styles.error}>
              <p>Failed to load activities. Please try again.</p>
            </div>
          )}

          {/* Empty State */}
          {showEmpty && (
            <DigestEmptyState
              date={selectedDate}
              lastActivityDate={lastActivityDate}
              isLoadingLastDate={lastDateLoading}
              onJumpToLastActivity={handleJumpToLastActivity}
            />
          )}

          {/* Content */}
          {showContent && (
            <>
              {/* Summary Card */}
              <DigestSummaryCard stats={digest.stats} />

              {/* Photo Strip */}
              <DigestPhotoStrip photos={digest.photos} />

              {/* Activity List */}
              <DigestActivityList activities={digest.activities} />
            </>
          )}
        </main>

        <GeneralFooter pageLabel="Daily Digest" />
      </div>
    </div>
  );
}
