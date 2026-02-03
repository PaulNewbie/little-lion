// src/pages/parent/components/DigestActivityList.jsx
// Collapsible activity list for Daily Digest

import React, { useState } from 'react';
import { TherapyCard, GroupCard, getEmojiForMood } from '../../../components/activities/ActivityCards';

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #f1f5f9',
    backgroundColor: '#fafafa',
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
  },
  toggleBtn: {
    padding: '6px 12px',
    fontSize: '13px',
    color: '#0052A1',
    backgroundColor: '#eff6ff',
    border: '1px solid #dbeafe',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  list: {
    padding: '12px',
  },
  activityRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    marginBottom: '8px',
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '1px solid transparent',
  },
  activityRowExpanded: {
    backgroundColor: '#eff6ff',
    borderColor: '#dbeafe',
  },
  typeIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    flexShrink: 0,
  },
  therapyIcon: {
    backgroundColor: '#dbeafe',
  },
  groupIcon: {
    backgroundColor: '#dcfce7',
  },
  activityInfo: {
    flex: 1,
    minWidth: 0,
  },
  activityTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  activityMeta: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '2px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  moodBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    backgroundColor: '#fef3c7',
    color: '#92400e',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  expandIcon: {
    color: '#94a3b8',
    transition: 'transform 0.2s ease',
    flexShrink: 0,
  },
  expandIconRotated: {
    transform: 'rotate(180deg)',
  },
  expandedContent: {
    padding: '0 12px 16px 12px',
  },
  cardWrapper: {
    marginTop: '8px',
  },
};

// Chevron icon
const ChevronDown = ({ rotated }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    style={{
      ...styles.expandIcon,
      ...(rotated ? styles.expandIconRotated : {}),
    }}
  >
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

/**
 * Get summary text for an activity
 */
const getActivitySummary = (activity) => {
  if (activity.type === 'therapy_session' || activity._collection === 'therapy_sessions') {
    return activity.serviceName || 'Therapy Session';
  }
  return activity.title || activity.className || 'Group Activity';
};

/**
 * Get time display for an activity
 */
const getActivityTime = (activity) => {
  if (activity.time) return activity.time;
  // Try to parse from date if it includes time
  const date = new Date(activity.date);
  if (date.getHours() !== 0 || date.getMinutes() !== 0) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  return null;
};

/**
 * Single activity row component
 */
const ActivityRow = ({ activity, isExpanded, onToggle }) => {
  const isTherapy = activity.type === 'therapy_session' || activity._collection === 'therapy_sessions';
  const summary = getActivitySummary(activity);
  const time = getActivityTime(activity);
  const mood = activity.studentReaction?.[0];

  return (
    <div>
      <div
        style={{
          ...styles.activityRow,
          ...(isExpanded ? styles.activityRowExpanded : {}),
        }}
        onClick={onToggle}
        onMouseEnter={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.backgroundColor = '#f1f5f9';
          }
        }}
        onMouseLeave={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.backgroundColor = '#f8fafc';
          }
        }}
      >
        {/* Type Icon */}
        <div style={{
          ...styles.typeIcon,
          ...(isTherapy ? styles.therapyIcon : styles.groupIcon),
        }}>
          {isTherapy ? '🩺' : '🎨'}
        </div>

        {/* Activity Info */}
        <div style={styles.activityInfo}>
          <div style={styles.activityTitle}>{summary}</div>
          <div style={styles.activityMeta}>
            {time && <span>{time}</span>}
            {mood && (
              <span style={styles.moodBadge}>
                {getEmojiForMood(mood)} {mood}
              </span>
            )}
          </div>
        </div>

        {/* Expand Icon */}
        <ChevronDown rotated={isExpanded} />
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div style={styles.expandedContent}>
          <div style={styles.cardWrapper}>
            {isTherapy ? (
              <TherapyCard activity={activity} />
            ) : (
              <GroupCard activity={activity} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * DigestActivityList - Collapsible activity list
 * @param {Array} activities - List of activities
 */
const DigestActivityList = ({ activities }) => {
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [allExpanded, setAllExpanded] = useState(false);

  if (!activities || activities.length === 0) {
    return null;
  }

  const toggleActivity = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedIds(new Set());
      setAllExpanded(false);
    } else {
      setExpandedIds(new Set(activities.map(a => a.id)));
      setAllExpanded(true);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTitle}>
          <span>📋</span>
          Activities ({activities.length})
        </div>
        <button
          style={styles.toggleBtn}
          onClick={toggleAll}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#dbeafe';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#eff6ff';
          }}
        >
          {allExpanded ? 'Collapse All' : 'Expand All'}
        </button>
      </div>

      {/* Activity List */}
      <div style={styles.list}>
        {activities.map(activity => (
          <ActivityRow
            key={activity.id}
            activity={activity}
            isExpanded={expandedIds.has(activity.id)}
            onToggle={() => toggleActivity(activity.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default DigestActivityList;
