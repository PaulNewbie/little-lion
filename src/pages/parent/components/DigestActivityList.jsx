// src/pages/parent/components/DigestActivityList.jsx
// Collapsible activity list for Daily Digest

import React, { useState } from 'react';
import { ClipboardList, Stethoscope, Palette } from 'lucide-react';
import { TherapyCard, GroupCard, getEmojiForMood } from '../../../components/activities/ActivityCards';
import '../css/DigestComponents.css';

// Chevron icon
const ChevronDown = ({ rotated }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={`digest-expand-icon${rotated ? ' digest-expand-icon--rotated' : ''}`}
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
        className={`digest-activity-row${isExpanded ? ' digest-activity-row--expanded' : ''}`}
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
      >
        {/* Type Icon */}
        <div className={`digest-type-icon ${isTherapy ? 'digest-type-icon--therapy' : 'digest-type-icon--group'}`}>
          {isTherapy ? <Stethoscope size={20} color="#1e40af" /> : <Palette size={20} color="#166534" />}
        </div>

        {/* Activity Info */}
        <div className="digest-activity-info">
          <div className="digest-activity-title">{summary}</div>
          <div className="digest-activity-meta">
            {time && <span>{time}</span>}
            {mood && (
              <span className="digest-mood-badge">
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
        <div className="digest-expanded-content">
          <div className="digest-card-wrapper">
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
    <div className="digest-activity-list">
      {/* Header */}
      <div className="digest-activity-list-header">
        <div className="digest-activity-list-title">
          <ClipboardList size={18} />
          Activities ({activities.length})
        </div>
        <button
          className="digest-toggle-btn"
          onClick={toggleAll}
        >
          {allExpanded ? 'Collapse All' : 'Expand All'}
        </button>
      </div>

      {/* Activity List */}
      <div className="digest-activity-items">
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
