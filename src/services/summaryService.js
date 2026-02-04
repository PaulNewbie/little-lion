// src/services/summaryService.js
// Monthly/Weekly Summary Report Service - No AI, Template-Based

import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { trackRead } from '../utils/readCounter';

class SummaryService {

  /**
   * Generate monthly summary for a child
   * @param {string} childId - Child's document ID
   * @param {number} month - Month (0-11)
   * @param {number} year - Year (e.g., 2024)
   */
  async generateMonthlySummary(childId, month, year) {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);

    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();

    try {
      // Fetch all data in parallel
      const [
        therapySessions,
        groupActivities,
        childData
      ] = await Promise.all([
        this.getTherapySessionsInRange(childId, startISO, endISO),
        this.getGroupActivitiesInRange(childId, startISO, endISO),
        this.getChildData(childId)
      ]);

      // Calculate statistics
      const totalTherapySessions = therapySessions.length;
      const totalGroupActivities = groupActivities.length;
      const totalActivities = totalTherapySessions + totalGroupActivities;

      // Group therapy sessions by service type
      const therapyByService = this.groupByField(therapySessions, 'serviceName');

      // Group activities by type
      const activityBreakdown = {
        therapy: totalTherapySessions,
        group: totalGroupActivities
      };

      // Extract progress notes and highlights
      const progressNotes = this.extractProgressNotes(therapySessions);
      const highlights = this.extractHighlights(therapySessions, groupActivities);

      // Aggregate student reactions/moods
      const moodData = this.aggregateMoods(therapySessions);

      // Extract activity photos
      const activityPhotos = this.extractActivityPhotos(groupActivities);

      // Generate template-based recommendations
      const recommendations = this.generateRecommendations({
        totalTherapySessions,
        totalGroupActivities,
        therapyByService,
        childData,
        moodData
      });

      // Calculate attendance (if scheduled data exists)
      const attendanceRate = this.calculateAttendanceRate(therapySessions, groupActivities);

      // Build summary object
      const summary = {
        childId,
        childName: `${childData?.firstName || ''} ${childData?.lastName || ''}`.trim(),
        childPhoto: childData?.photoUrl || null,
        period: {
          month,
          year,
          monthName: this.getMonthName(month),
          startDate: startISO,
          endDate: endISO
        },
        stats: {
          totalActivities,
          totalTherapySessions,
          totalGroupActivities,
          attendanceRate
        },
        activityBreakdown,
        therapyByService,
        moodData,
        activityPhotos,
        progressNotes: progressNotes.slice(0, 5), // Top 5 notes
        highlights,
        recommendations,
        generatedAt: new Date().toISOString()
      };

      return summary;

    } catch (error) {
      console.error('Error generating monthly summary:', error);
      throw error;
    }
  }

  /**
   * Get therapy sessions within date range
   */
  async getTherapySessionsInRange(childId, startDate, endDate) {
    try {
      const q = query(
        collection(db, 'therapy_sessions'),
        where('childId', '==', childId),
        limit(100)
      );

      const snapshot = await getDocs(q);
      trackRead('therapy_sessions', snapshot.docs.length);

      // Filter by date client-side (avoids composite index)
      const sessions = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(session => {
          const sessionDate = session.date || session.createdAt;
          return sessionDate >= startDate && sessionDate <= endDate;
        })
        .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

      return sessions;
    } catch (error) {
      console.error('Error fetching therapy sessions:', error);
      return [];
    }
  }

  /**
   * Get group activities within date range
   */
  async getGroupActivitiesInRange(childId, startDate, endDate) {
    try {
      // Check both studentId and participatingStudentIds
      const q1 = query(
        collection(db, 'activities'),
        where('studentId', '==', childId),
        limit(100)
      );
      const q2 = query(
        collection(db, 'activities'),
        where('participatingStudentIds', 'array-contains', childId),
        limit(100)
      );

      // Use allSettled so a permission error on one query doesn't block the other
      const [res1, res2] = await Promise.allSettled([getDocs(q1), getDocs(q2)]);
      const snap1 = res1.status === 'fulfilled' ? res1.value : { docs: [], forEach: () => {} };
      const snap2 = res2.status === 'fulfilled' ? res2.value : { docs: [], forEach: () => {} };
      trackRead('activities', snap1.docs.length + snap2.docs.length);

      const seenIds = new Set();
      const activities = [];

      const addActivity = (doc) => {
        if (!seenIds.has(doc.id)) {
          seenIds.add(doc.id);
          const data = doc.data();
          const activityDate = data.date || data.createdAt;
          if (activityDate >= startDate && activityDate <= endDate) {
            activities.push({ id: doc.id, ...data });
          }
        }
      };

      snap1.forEach(addActivity);
      snap2.forEach(addActivity);

      return activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
      console.error('Error fetching group activities:', error);
      return [];
    }
  }

  /**
   * Get child data
   */
  async getChildData(childId) {
    try {
      const docRef = doc(db, 'children', childId);
      const docSnap = await getDoc(docRef);
      trackRead('children', 1);
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (error) {
      console.error('Error fetching child data:', error);
      return null;
    }
  }

  /**
   * Group items by a field
   */
  groupByField(items, field) {
    return items.reduce((acc, item) => {
      const key = item[field] || 'Other';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Extract progress notes from therapy sessions
   */
  extractProgressNotes(sessions) {
    return sessions
      .filter(s => s.notes || s.progressNotes || s.observations)
      .map(s => ({
        date: s.date || s.createdAt,
        serviceName: s.serviceName || 'Therapy',
        therapistName: s.therapistName || 'Therapist',
        note: s.notes || s.progressNotes || s.observations,
        type: s.sessionType || 'session'
      }))
      .slice(0, 10);
  }

  /**
   * Extract highlights (positive keywords)
   */
  extractHighlights(therapySessions, groupActivities) {
    const highlights = [];
    const positiveKeywords = [
      'improvement', 'improved', 'progress', 'achieved', 'milestone',
      'excellent', 'great', 'good', 'better', 'success', 'successful',
      'engaged', 'participated', 'responsive', 'cooperative'
    ];

    // Check therapy session notes for positive keywords
    therapySessions.forEach(session => {
      const text = (session.notes || session.progressNotes || '').toLowerCase();
      positiveKeywords.forEach(keyword => {
        if (text.includes(keyword) && highlights.length < 5) {
          highlights.push({
            type: 'therapy',
            keyword,
            serviceName: session.serviceName,
            date: session.date
          });
        }
      });
    });

    // Add activity participation highlights
    if (groupActivities.length > 0) {
      highlights.push({
        type: 'participation',
        text: `Participated in ${groupActivities.length} group activities`,
        date: groupActivities[0]?.date
      });
    }

    return highlights.slice(0, 5);
  }

  /**
   * Extract photos from group activities
   * Returns photos with metadata for display in summary
   */
  extractActivityPhotos(groupActivities) {
    const photos = [];

    groupActivities.forEach(activity => {
      // Check for photoUrls (array of URLs)
      if (activity.photoUrls && Array.isArray(activity.photoUrls)) {
        activity.photoUrls.forEach((url, index) => {
          if (url && photos.length < 12) { // Limit to 12 photos
            photos.push({
              url,
              date: activity.date || activity.createdAt,
              title: activity.title || 'Group Activity',
              className: activity.className || '',
              teacherName: activity.teacherName || '',
              activityId: activity.id,
              index
            });
          }
        });
      }

      // Also check for single photoUrl field
      if (activity.photoUrl && photos.length < 12) {
        photos.push({
          url: activity.photoUrl,
          date: activity.date || activity.createdAt,
          title: activity.title || 'Group Activity',
          className: activity.className || '',
          teacherName: activity.teacherName || '',
          activityId: activity.id,
          index: 0
        });
      }
    });

    // Sort by date (most recent first) and return
    return photos
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 12); // Max 12 photos for summary
  }

  /**
   * Aggregate student moods/reactions from therapy sessions
   */
  aggregateMoods(therapySessions) {
    const moodCounts = {};
    const moodTimeline = [];

    // Define mood categories with icon names (rendered by MonthlySummary)
    const moodCategories = {
      'Happy': { icon: 'Smile', category: 'positive' },
      'Focused': { icon: 'Focus', category: 'positive' },
      'Active': { icon: 'Zap', category: 'positive' },
      'Social': { icon: 'HandMetal', category: 'positive' },
      'Tired': { icon: 'Moon', category: 'neutral' },
      'Upset': { icon: 'Frown', category: 'concern' },
      'Anxious': { icon: 'ShieldAlert', category: 'concern' }
    };

    therapySessions.forEach(session => {
      // Handle both array and string formats of studentReaction
      let reactions = session.studentReaction || [];
      if (typeof reactions === 'string') {
        reactions = [reactions];
      }

      reactions.forEach(reaction => {
        // Extract mood name (remove emoji if present)
        const moodName = reaction.split(' ')[0];
        moodCounts[moodName] = (moodCounts[moodName] || 0) + 1;
      });

      // Build timeline data
      if (reactions.length > 0) {
        moodTimeline.push({
          date: session.date || session.createdAt,
          moods: reactions,
          serviceName: session.serviceName
        });
      }
    });

    // Calculate mood statistics
    const totalReactions = Object.values(moodCounts).reduce((a, b) => a + b, 0);
    const moodStats = Object.entries(moodCounts)
      .map(([mood, count]) => ({
        mood,
        count,
        percentage: totalReactions > 0 ? Math.round((count / totalReactions) * 100) : 0,
        icon: moodCategories[mood]?.icon || '',
        category: moodCategories[mood]?.category || 'neutral'
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate positive vs concern ratio
    const positiveCount = moodStats
      .filter(m => m.category === 'positive')
      .reduce((sum, m) => sum + m.count, 0);
    const concernCount = moodStats
      .filter(m => m.category === 'concern')
      .reduce((sum, m) => sum + m.count, 0);

    // Determine overall mood trend
    let overallTrend = 'neutral';
    if (totalReactions > 0) {
      if (positiveCount > concernCount * 2) {
        overallTrend = 'positive';
      } else if (concernCount > positiveCount) {
        overallTrend = 'needs_attention';
      }
    }

    // Get dominant mood
    const dominantMood = moodStats.length > 0 ? moodStats[0] : null;

    return {
      moodStats,
      totalReactions,
      positiveCount,
      concernCount,
      overallTrend,
      dominantMood,
      timeline: moodTimeline.slice(0, 10) // Last 10 sessions with reactions
    };
  }

  /**
   * Generate template-based recommendations (NO AI)
   */
  generateRecommendations({ totalTherapySessions, totalGroupActivities, therapyByService, childData, moodData }) {
    const recommendations = [];

    // Attendance-based recommendations
    if (totalTherapySessions === 0) {
      recommendations.push({
        type: 'therapy',
        priority: 'high',
        icon: 'CalendarX',
        title: 'No Therapy Sessions',
        text: 'No therapy sessions were recorded this month. Regular therapy sessions are important for continued progress.'
      });
    } else if (totalTherapySessions < 4) {
      recommendations.push({
        type: 'therapy',
        priority: 'medium',
        icon: 'BarChart3',
        title: 'Low Session Count',
        text: `Only ${totalTherapySessions} therapy session(s) this month. Consider scheduling more sessions for optimal progress.`
      });
    } else if (totalTherapySessions >= 8) {
      recommendations.push({
        type: 'therapy',
        priority: 'positive',
        icon: 'Star',
        title: 'Great Attendance',
        text: `Excellent! ${totalTherapySessions} therapy sessions completed this month. Keep up the great work!`
      });
    }

    // Group activity recommendations
    if (totalGroupActivities === 0) {
      recommendations.push({
        type: 'social',
        priority: 'medium',
        icon: 'Users',
        title: 'No Group Activities',
        text: 'Consider enrolling in group classes for social skill development and peer interaction.'
      });
    } else if (totalGroupActivities >= 4) {
      recommendations.push({
        type: 'social',
        priority: 'positive',
        icon: 'PartyPopper',
        title: 'Active Participation',
        text: `Great social engagement with ${totalGroupActivities} group activities this month!`
      });
    }

    // Service variety recommendations
    const serviceCount = Object.keys(therapyByService).length;
    if (serviceCount === 1 && totalTherapySessions > 0) {
      recommendations.push({
        type: 'variety',
        priority: 'low',
        icon: 'Lightbulb',
        title: 'Service Variety',
        text: 'Consider exploring additional therapy services for comprehensive development.'
      });
    }

    // Mood-based recommendations
    if (moodData && moodData.totalReactions > 0) {
      if (moodData.overallTrend === 'positive') {
        recommendations.push({
          type: 'mood',
          priority: 'positive',
          icon: 'Smile',
          title: 'Positive Mood Trend',
          text: `${moodData.dominantMood?.mood || 'Happy'} was the most common reaction this month. Your child shows great emotional engagement!`
        });
      } else if (moodData.overallTrend === 'needs_attention') {
        recommendations.push({
          type: 'mood',
          priority: 'medium',
          icon: 'MessageCircle',
          title: 'Mood Check-In',
          text: 'Some sessions showed signs of anxiety or distress. Consider discussing with therapists about strategies to help your child feel more comfortable.'
        });
      }

      // Add note about emotional growth if mixed reactions
      if (moodData.moodStats.length >= 3) {
        recommendations.push({
          type: 'mood',
          priority: 'info',
          icon: 'Rainbow',
          title: 'Emotional Range',
          text: 'Your child shows a healthy range of emotions across sessions, which is a positive sign of emotional development.'
        });
      }
    }

    // Always add an encouraging note if activities exist
    if (totalTherapySessions + totalGroupActivities > 0) {
      recommendations.push({
        type: 'encouragement',
        priority: 'positive',
        icon: 'Dumbbell',
        title: 'Keep Going',
        text: 'Every session contributes to growth. Thank you for your commitment to your child\'s development!'
      });
    }

    return recommendations;
  }

  /**
   * Calculate attendance rate
   */
  calculateAttendanceRate(therapySessions, groupActivities) {
    // Simple calculation based on sessions per week
    const totalSessions = therapySessions.length + groupActivities.length;
    // Assume 8 sessions per month is 100%
    const targetSessions = 8;
    const rate = Math.min(100, Math.round((totalSessions / targetSessions) * 100));
    return rate;
  }

  /**
   * Get month name
   */
  getMonthName(month) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month];
  }

  /**
   * Save summary to Firestore (for caching/history)
   */
  async saveSummary(summary) {
    try {
      const summaryId = `${summary.childId}_${summary.period.year}_${summary.period.month}`;
      const docRef = doc(db, 'summaries', summaryId);

      await setDoc(docRef, {
        ...summary,
        savedAt: serverTimestamp()
      });

      return summaryId;
    } catch (error) {
      console.error('Error saving summary:', error);
      throw error;
    }
  }

  /**
   * Get saved summary (if exists)
   */
  async getSavedSummary(childId, month, year) {
    try {
      const summaryId = `${childId}_${year}_${month}`;
      const docRef = doc(db, 'summaries', summaryId);
      const docSnap = await getDoc(docRef);
      trackRead('summaries', 1);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error fetching saved summary:', error);
      return null;
    }
  }

  /**
   * Create notification for parent about new summary
   */
  async notifyParentOfSummary(parentId, childId, childName, month, year) {
    try {
      await addDoc(collection(db, 'notifications'), {
        type: 'monthly_summary',
        parentId,
        childId,
        title: 'Monthly Report Ready',
        message: `${childName}'s ${this.getMonthName(month)} ${year} summary is now available.`,
        read: false,
        createdAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error creating notification:', error);
      return false;
    }
  }
}

const summaryService = new SummaryService();
export default summaryService;
