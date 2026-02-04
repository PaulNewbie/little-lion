// src/components/activities/ActivityCards.jsx
// Shared activity card components for parent views

import React, { useState } from 'react';
import {
  Smile, Focus, Zap, Moon, Frown, HandMetal,
  Stethoscope, Target, ClipboardList, Dumbbell,
  TrendingDown, StickyNote, Home, AlertTriangle, Palette
} from 'lucide-react';
import ImageLightbox from '../common/ImageLightbox';

/**
 * Mood icon mapping - returns Lucide icon for mood/reaction
 */
const moodIconMap = {
  'Happy': { icon: Smile, color: '#92400e' },
  'Focused': { icon: Focus, color: '#92400e' },
  'Active': { icon: Zap, color: '#92400e' },
  'Tired': { icon: Moon, color: '#92400e' },
  'Upset': { icon: Frown, color: '#92400e' },
  'Social': { icon: HandMetal, color: '#92400e' }
};

export const getMoodIcon = (mood, size = 16) => {
  const entry = moodIconMap[mood];
  if (!entry) return null;
  const IconComponent = entry.icon;
  return <IconComponent size={size} color={entry.color} />;
};

// Legacy alias for backward compat - returns icon instead of emoji
export const getEmojiForMood = (mood) => getMoodIcon(mood, 16);

/**
 * Shared styles for activity cards
 */
export const cardStyles = {
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    overflow: 'hidden',
    border: '1px solid #f1f5f9'
  },
  cardHeader: {
    padding: '15px 20px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cardBody: { padding: '20px' },
  badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' },
  date: { color: '#64748b', fontSize: '13px', fontWeight: '500' },
  author: { fontSize: '13px', color: '#64748b', fontWeight: '500' },
  title: { margin: '0 0 5px 0', fontSize: '18px', color: '#0f172a', fontWeight: '700' },
  subTitle: { margin: '0 0 15px 0', fontSize: '14px', color: '#64748b', fontWeight: '500' },
  text: { lineHeight: '1.6', color: '#334155', fontSize: '15px', margin: 0 },
  section: { marginBottom: '15px' },
  photoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '10px',
    marginTop: '15px'
  },
  mainPhoto: {
    width: '100%',
    height: '150px',
    objectFit: 'cover',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    border: '1px solid #e2e8f0'
  }
};

/**
 * TherapyCard - Displays detailed therapy session information
 */
export const TherapyCard = ({ activity }) => {
  const dateStr = new Date(activity.date).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
  });

  return (
    <div style={{ ...cardStyles.card, borderLeft: '5px solid #4a90e2' }}>
      {/* Header */}
      <div style={cardStyles.cardHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ ...cardStyles.badge, backgroundColor: '#e3f2fd', color: '#0d47a1', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Stethoscope size={14} /> {activity.serviceName || 'Therapy Session'}
          </span>
          <span style={cardStyles.date}>{dateStr}</span>
        </div>
        <div style={cardStyles.author}>
          Th: {activity.childName ? activity.childName.split(' ')[0] : ''}
        </div>
      </div>

      <div style={cardStyles.cardBody}>
        {/* Mood / Reaction */}
        {activity.studentReaction && activity.studentReaction.length > 0 && (
          <div style={{ marginBottom: '15px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {activity.studentReaction.map((mood, i) => (
              <span key={i} style={{
                backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
                padding: '4px 8px', borderRadius: '12px', fontSize: '13px', color: '#475569'
              }}>
                {getEmojiForMood(mood)} {mood}
              </span>
            ))}
          </div>
        )}

        {/* Activity Purpose */}
        {activity.activityPurpose && (
          <div style={cardStyles.section}>
            <strong style={{ color: '#1e293b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Target size={14} /> Purpose of Session:</strong>
            <p style={cardStyles.text}>{activity.activityPurpose}</p>
          </div>
        )}

        {/* Specific Activities Performed (If OT/ST) */}
        {activity.data?.activities && activity.data.activities.length > 0 && (
          <div style={{ ...cardStyles.section, backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
            <strong style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px', color: '#334155' }}><ClipboardList size={14} /> Activities Performed:</strong>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {activity.data.activities.map((act, i) => (
                <li key={i} style={{ marginBottom: '4px', fontSize: '14px', color: '#475569' }}>
                  <span style={{ fontWeight: '600' }}>{act.name}</span>
                  {act.performance && (
                    <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '6px', fontStyle: 'italic' }}>
                       ({act.performance})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Observations Grid */}
        <div style={{ display: 'grid', gap: '15px', marginTop: '15px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>

          {/* Strengths */}
          {activity.strengths && (
            <div style={{ padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              <strong style={{ color: '#166534', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Dumbbell size={14} /> Strengths</strong>
              <p style={{ ...cardStyles.text, marginTop: '5px', fontSize: '14px' }}>{activity.strengths}</p>
            </div>
          )}

          {/* Weaknesses / Improvements */}
          {activity.weaknesses && (
            <div style={{ padding: '12px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
              <strong style={{ color: '#991b1b', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><TrendingDown size={14} /> Areas for Improvement</strong>
              <p style={{ ...cardStyles.text, marginTop: '5px', fontSize: '14px' }}>{activity.weaknesses}</p>
            </div>
          )}
        </div>

        {/* General Notes */}
        {activity.sessionNotes && (
          <div style={{ marginTop: '15px' }}>
            <strong style={{ color: '#1e293b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><StickyNote size={14} /> Session Notes:</strong>
            <p style={cardStyles.text}>{activity.sessionNotes}</p>
          </div>
        )}

        {/* Home Activities / Recommendations */}
        {(activity.homeActivities || activity.recommendations) && (
          <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px dashed #e2e8f0' }}>
            <strong style={{ color: '#7c3aed', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Home size={14} /> Home Plan & Recommendations:</strong>
            {activity.homeActivities && <p style={cardStyles.text}>{activity.homeActivities}</p>}
            {activity.recommendations && <p style={{...cardStyles.text, fontStyle: 'italic', color: '#64748b'}}>{activity.recommendations}</p>}
          </div>
        )}

        {/* Concerns (Optional Display) */}
        {activity.concerns && (
          <div style={{ marginTop: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#f59e0b', display: 'inline-flex', alignItems: 'center', gap: '3px' }}><AlertTriangle size={12} /> NOTE: </span>
            <span style={{ fontSize: '13px', color: '#64748b' }}>{activity.concerns}</span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * GroupCard - Displays group activity information with photos
 */
export const GroupCard = ({ activity }) => {
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const dateStr = new Date(activity.date).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
  });

  return (
    <div style={{ ...cardStyles.card, borderLeft: '5px solid #2ecc71' }}>
      <div style={cardStyles.cardHeader}>
        <div>
          <span style={{ ...cardStyles.badge, backgroundColor: '#e8f5e9', color: '#1b5e20', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Palette size={14} /> Group Class
          </span>
          <span style={cardStyles.date}>{dateStr}</span>
        </div>
        <div style={cardStyles.author}>
          Tr: {activity.teacherName || 'Teacher'}
        </div>
      </div>

      <div style={cardStyles.cardBody}>
        <h3 style={cardStyles.title}>{activity.title}</h3>
        <h4 style={cardStyles.subTitle}>{activity.className || 'Class Activity'}</h4>

        <p style={cardStyles.text}>{activity.description}</p>

        {/* Group photos are the main feature */}
        {activity.photoUrls && activity.photoUrls.length > 0 && (
          <div style={cardStyles.photoGrid}>
            {activity.photoUrls.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt="Activity"
                style={cardStyles.mainPhoto}
                onClick={() => setLightboxIndex(idx)}
              />
            ))}
          </div>
        )}
      </div>

      {lightboxIndex !== null && (
        <ImageLightbox
          images={activity.photoUrls}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
};

export default { TherapyCard, GroupCard, getEmojiForMood, getMoodIcon, cardStyles };
