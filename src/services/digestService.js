// src/services/digestService.js
// Service for Daily Digest functionality

import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Format date to YYYY-MM-DD string for comparison
 */
const formatDateKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Parse date string to Date object (handles both ISO and YYYY-MM-DD formats)
 */
const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Get all activities for a specific child on a specific date
 * @param {string} childId - Child document ID
 * @param {Date} date - The date to fetch activities for
 * @returns {Object} Digest data with activities grouped by type
 */
export const getDailyDigest = async (childId, date) => {
  if (!childId || !date) {
    return { activities: [], therapySessions: [], groupActivities: [], photos: [], stats: {} };
  }

  const targetDateKey = formatDateKey(date);

  try {
    // A. Query General Activities (Group & Class Events)
    const activitiesRef = collection(db, 'activities');
    const q1 = query(activitiesRef, where('studentId', '==', childId));
    const q2 = query(activitiesRef, where('participatingStudentIds', 'array-contains', childId));

    // B. Query Clinical Therapy Sessions
    const sessionsRef = collection(db, 'therapy_sessions');
    const q3 = query(sessionsRef, where('childId', '==', childId));

    // Execute all queries in parallel
    const [snap1, snap2, snap3] = await Promise.all([
      getDocs(q1),
      getDocs(q2),
      getDocs(q3)
    ]);

    const allActivities = [];
    const seenIds = new Set();

    // Helper to add unique results
    const addResult = (doc, sourceCollection) => {
      if (!seenIds.has(doc.id)) {
        seenIds.add(doc.id);
        const data = doc.data();
        const activityDate = parseDate(data.date);

        if (activityDate && formatDateKey(activityDate) === targetDateKey) {
          allActivities.push({
            id: doc.id,
            ...data,
            type: sourceCollection === 'therapy_sessions' ? 'therapy_session' : data.type,
            _collection: sourceCollection
          });
        }
      }
    };

    // Process all snapshots
    snap1.forEach(doc => addResult(doc, 'activities'));
    snap2.forEach(doc => addResult(doc, 'activities'));
    snap3.forEach(doc => addResult(doc, 'therapy_sessions'));

    // Sort by time (if available) or keep as-is
    allActivities.sort((a, b) => {
      const timeA = a.time || '00:00';
      const timeB = b.time || '00:00';
      return timeA.localeCompare(timeB);
    });

    // Separate by type and apply privacy filter
    const therapySessions = allActivities.filter(a =>
      (a.type === 'therapy_session' || a._collection === 'therapy_sessions') &&
      a.visibleToParents !== false
    );

    const groupActivities = allActivities.filter(a =>
      a.type === 'group_activity' || a._collection === 'activities' && a.type !== 'therapy_session'
    );

    // Collect all photos
    const photos = [];
    groupActivities.forEach(activity => {
      if (activity.photoUrls && activity.photoUrls.length > 0) {
        activity.photoUrls.forEach((url, index) => {
          photos.push({
            url,
            activityId: activity.id,
            title: activity.title || 'Activity Photo',
            index
          });
        });
      }
    });

    // Calculate mood stats
    const moodCounts = {};
    therapySessions.forEach(session => {
      if (session.studentReaction && Array.isArray(session.studentReaction)) {
        session.studentReaction.forEach(mood => {
          moodCounts[mood] = (moodCounts[mood] || 0) + 1;
        });
      }
    });

    // Find dominant mood
    let dominantMood = null;
    let maxCount = 0;
    Object.entries(moodCounts).forEach(([mood, count]) => {
      if (count > maxCount) {
        dominantMood = mood;
        maxCount = count;
      }
    });

    // Combine visible activities (privacy filtered)
    const visibleActivities = [...therapySessions, ...groupActivities];

    return {
      date: targetDateKey,
      activities: visibleActivities,
      therapySessions,
      groupActivities,
      photos,
      stats: {
        totalActivities: visibleActivities.length,
        therapyCount: therapySessions.length,
        groupCount: groupActivities.length,
        photoCount: photos.length,
        dominantMood,
        moodCounts
      }
    };

  } catch (error) {
    console.error('Error fetching daily digest:', error);
    throw new Error('Failed to fetch daily digest: ' + error.message);
  }
};

/**
 * Get the most recent activity date for a child
 * @param {string} childId - Child document ID
 * @returns {Date|null} Most recent activity date or null
 */
export const getLastActivityDate = async (childId) => {
  if (!childId) return null;

  try {
    // Query both collections for the most recent activity
    const activitiesRef = collection(db, 'activities');
    const sessionsRef = collection(db, 'therapy_sessions');

    // Note: We query without composite indexes by fetching and sorting client-side
    const [activitySnap, sessionSnap] = await Promise.all([
      getDocs(query(activitiesRef, where('participatingStudentIds', 'array-contains', childId))),
      getDocs(query(sessionsRef, where('childId', '==', childId)))
    ]);

    let latestDate = null;

    // Check activities
    activitySnap.forEach(doc => {
      const data = doc.data();
      const actDate = parseDate(data.date);
      if (actDate && (!latestDate || actDate > latestDate)) {
        latestDate = actDate;
      }
    });

    // Check therapy sessions (only visible ones)
    sessionSnap.forEach(doc => {
      const data = doc.data();
      if (data.visibleToParents !== false) {
        const actDate = parseDate(data.date);
        if (actDate && (!latestDate || actDate > latestDate)) {
          latestDate = actDate;
        }
      }
    });

    return latestDate;

  } catch (error) {
    console.error('Error fetching last activity date:', error);
    return null;
  }
};

/**
 * Check if a date has any activities
 * @param {string} childId - Child document ID
 * @param {Date} date - The date to check
 * @returns {boolean} True if activities exist
 */
export const hasActivitiesOnDate = async (childId, date) => {
  const digest = await getDailyDigest(childId, date);
  return digest.activities.length > 0;
};

export default {
  getDailyDigest,
  getLastActivityDate,
  hasActivitiesOnDate
};
