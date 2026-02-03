// src/pages/parent/components/DigestEmptyState.jsx
// Empty state component for Daily Digest when no activities exist

import React from 'react';

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    padding: '60px 20px',
    textAlign: 'center',
  },
  icon: {
    fontSize: '64px',
    marginBottom: '16px',
    opacity: 0.8,
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '24px',
    maxWidth: '300px',
    margin: '0 auto 24px',
    lineHeight: '1.5',
  },
  jumpButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: '#0052A1',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  jumpButtonDisabled: {
    backgroundColor: '#94a3b8',
    cursor: 'not-allowed',
  },
  loadingText: {
    fontSize: '13px',
    color: '#94a3b8',
    marginTop: '12px',
  },
};

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
    <div style={styles.container}>
      <div style={styles.icon}>📭</div>
      <div style={styles.title}>No Activities Recorded</div>
      <div style={styles.subtitle}>
        There are no activities logged for <strong>{dateStr}</strong>. Try navigating to a different date.
      </div>

      {isLoadingLastDate ? (
        <div style={styles.loadingText}>Looking for recent activities...</div>
      ) : hasLastActivity ? (
        <button
          style={styles.jumpButton}
          onClick={handleJump}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#003d7a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#0052A1';
          }}
        >
          <span>↩</span>
          Jump to Last Activity
          <span style={{ fontSize: '12px', opacity: 0.8 }}>
            ({lastActivityDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
          </span>
        </button>
      ) : (
        <div style={styles.loadingText}>
          No recent activities found for this child.
        </div>
      )}
    </div>
  );
};

export default DigestEmptyState;
