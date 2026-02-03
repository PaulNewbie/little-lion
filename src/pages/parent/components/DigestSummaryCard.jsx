// src/pages/parent/components/DigestSummaryCard.jsx
// Quick-glance summary card for Daily Digest

import React from 'react';
import { getEmojiForMood } from '../../../components/activities/ActivityCards';

const styles = {
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    padding: '20px',
    marginBottom: '20px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '12px',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px 12px',
    borderRadius: '10px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    transition: 'transform 0.2s ease',
  },
  moodItem: {
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
  },
  therapyItem: {
    backgroundColor: '#dbeafe',
    borderColor: '#bfdbfe',
  },
  groupItem: {
    backgroundColor: '#dcfce7',
    borderColor: '#bbf7d0',
  },
  photoItem: {
    backgroundColor: '#f3e8ff',
    borderColor: '#e9d5ff',
  },
  statIcon: {
    fontSize: '28px',
    marginBottom: '8px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '12px',
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
  },
  moodLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#92400e',
    marginTop: '4px',
  },
  emptyMood: {
    fontSize: '12px',
    color: '#94a3b8',
    fontStyle: 'italic',
  },
};

/**
 * DigestSummaryCard - Quick-glance summary for Daily Digest
 * @param {Object} stats - Statistics object from digest
 */
const DigestSummaryCard = ({ stats }) => {
  if (!stats) return null;

  const {
    therapyCount = 0,
    groupCount = 0,
    photoCount = 0,
    dominantMood,
    totalActivities = 0
  } = stats;

  // Don't render if no activities
  if (totalActivities === 0) return null;

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span>📊</span> Day at a Glance
      </div>

      <div style={styles.grid}>
        {/* Mood */}
        <div style={{ ...styles.statItem, ...styles.moodItem }}>
          <span style={styles.statIcon}>
            {dominantMood ? getEmojiForMood(dominantMood) : '😊'}
          </span>
          {dominantMood ? (
            <span style={styles.moodLabel}>{dominantMood}</span>
          ) : (
            <span style={styles.emptyMood}>No mood data</span>
          )}
          <span style={styles.statLabel}>Primary Mood</span>
        </div>

        {/* Therapy Sessions */}
        <div style={{ ...styles.statItem, ...styles.therapyItem }}>
          <span style={styles.statIcon}>🩺</span>
          <span style={styles.statValue}>{therapyCount}</span>
          <span style={styles.statLabel}>Therapy Sessions</span>
        </div>

        {/* Group Activities */}
        <div style={{ ...styles.statItem, ...styles.groupItem }}>
          <span style={styles.statIcon}>🎨</span>
          <span style={styles.statValue}>{groupCount}</span>
          <span style={styles.statLabel}>Group Activities</span>
        </div>

        {/* Photos */}
        {photoCount > 0 && (
          <div style={{ ...styles.statItem, ...styles.photoItem }}>
            <span style={styles.statIcon}>📸</span>
            <span style={styles.statValue}>{photoCount}</span>
            <span style={styles.statLabel}>Photos</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DigestSummaryCard;
