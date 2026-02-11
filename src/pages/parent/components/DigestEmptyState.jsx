// src/pages/parent/components/DigestEmptyState.jsx
// Empty state component for Daily Digest when no activities exist

import React from 'react';
import { Inbox, CornerDownLeft } from 'lucide-react';
import '../css/DigestComponents.css';

/**
 * Format date for display
 */
const formatDate = (date) => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * DigestEmptyState - Empty state for Daily Digest
 * @param {Date} date - The selected date
 * @param {Date|null} lastActivityDate - Most recent activity date
 * @param {boolean} isLoadingLastDate - Loading state for last activity date
 * @param {function} onJumpToLastActivity - Callback to jump to last activity
 */
const DigestEmptyState = ({
  date,
  lastActivityDate,
  isLoadingLastDate,
  onJumpToLastActivity
}) => {
  const dateStr = formatDate(date);
  const hasLastActivity = lastActivityDate && !isLoadingLastDate;

  const handleJump = () => {
    if (lastActivityDate && onJumpToLastActivity) {
      onJumpToLastActivity(lastActivityDate);
    }
  };

  return (
    <div className="digest-empty-state">
      <div className="digest-empty-icon">
        <Inbox size={56} color="#94a3b8" />
      </div>
      <div className="digest-empty-title">No Activities Recorded</div>
      <div className="digest-empty-subtitle">
        There are no activities logged for <strong>{dateStr}</strong>. Try navigating to a different date.
      </div>

      {isLoadingLastDate ? (
        <div className="digest-loading-text">Looking for recent activities...</div>
      ) : hasLastActivity ? (
        <button
          className="digest-jump-button"
          onClick={handleJump}
        >
          <CornerDownLeft size={16} />
          Jump to Last Activity
          <span className="digest-jump-date">
            ({lastActivityDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
          </span>
        </button>
      ) : (
        <div className="digest-loading-text">
          No recent activities found for this child.
        </div>
      )}
    </div>
  );
};

export default DigestEmptyState;
