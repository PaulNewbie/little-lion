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

import './css/DailyDigest.css';

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
    <div className="digest-layout">
      <Sidebar {...getParentConfig()} forceActive="/parent/digest" />

      <div className="digest-main-wrapper">
        <main className="digest-main">
          {/* Header */}
          <div className="digest-header">
            <h1 className="digest-title">Daily Digest</h1>
            <p className="digest-subtitle">
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
            <div className="digest-child-name">
              <div className="digest-child-avatar">
                {selectedChildInfo.photoUrl ? (
                  <img
                    src={selectedChildInfo.photoUrl}
                    alt={selectedChildInfo.firstName}
                  />
                ) : (
                  selectedChildInfo.firstName?.charAt(0)?.toUpperCase() || '?'
                )}
              </div>
              <span className="digest-child-name-text">
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
            <div className="digest-loading">
              <div className="digest-loading-spinner"></div>
              <p>Loading activities...</p>
            </div>
          )}

          {/* Error State */}
          {showError && (
            <div className="digest-error">
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
