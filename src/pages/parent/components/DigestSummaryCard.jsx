// src/pages/parent/components/DigestSummaryCard.jsx
// Quick-glance summary card for Daily Digest

import React from 'react';
import { BarChart3, Smile, Stethoscope, Palette, Camera } from 'lucide-react';
import { getEmojiForMood } from '../../../components/activities/ActivityCards';
import '../css/DigestComponents.css';

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
    <div className="digest-summary-card">
      <div className="digest-summary-header">
        <BarChart3 size={18} /> Day at a Glance
      </div>

      <div className="digest-summary-grid">
        {/* Mood */}
        <div className="digest-stat-item digest-stat-item--mood">
          <span className="digest-stat-icon">
            {dominantMood ? getEmojiForMood(dominantMood) : <Smile size={28} color="#92400e" />}
          </span>
          {dominantMood ? (
            <span className="digest-mood-label">{dominantMood}</span>
          ) : (
            <span className="digest-empty-mood">No mood data</span>
          )}
          <span className="digest-stat-label">Primary Mood</span>
        </div>

        {/* Therapy Sessions */}
        <div className="digest-stat-item digest-stat-item--therapy">
          <span className="digest-stat-icon">
            <Stethoscope size={28} color="#1e40af" />
          </span>
          <span className="digest-stat-value">{therapyCount}</span>
          <span className="digest-stat-label">Therapy Sessions</span>
        </div>

        {/* Group Activities */}
        <div className="digest-stat-item digest-stat-item--group">
          <span className="digest-stat-icon">
            <Palette size={28} color="#166534" />
          </span>
          <span className="digest-stat-value">{groupCount}</span>
          <span className="digest-stat-label">Group Activities</span>
        </div>

        {/* Photos */}
        {photoCount > 0 && (
          <div className="digest-stat-item digest-stat-item--photo">
            <span className="digest-stat-icon">
              <Camera size={28} color="#7c3aed" />
            </span>
            <span className="digest-stat-value">{photoCount}</span>
            <span className="digest-stat-label">Photos</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DigestSummaryCard;
