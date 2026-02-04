// src/hooks/useRealtimeActivities.js
// Bridges Firestore onSnapshot with React Query cache for real-time activity updates.
// When a teacher/therapist uploads a new activity, parents see it instantly.

import { useEffect } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import activityService from '../services/activityService';
import { QUERY_KEYS } from '../config/queryClient';

/**
 * Real-time activities hook for a child.
 * Sets up Firestore onSnapshot listeners and pushes updates into React Query cache.
 * Components using useChildActivities() will automatically re-render with fresh data.
 *
 * @param {string} childId - The child document ID to listen for
 * @returns {Object} React Query result { data, isLoading, error }
 */
export function useRealtimeActivities(childId) {
  const queryClient = useQueryClient();

  // Set up the real-time Firestore subscription
  useEffect(() => {
    if (!childId) return;

    const unsubscribe = activityService.listenToChildActivities(childId, (activities) => {
      // Push real-time data directly into React Query cache
      queryClient.setQueryData(QUERY_KEYS.activities(childId), activities);
    });

    return () => unsubscribe();
  }, [childId, queryClient]);

  // Return a useQuery that reads from the cache (subscription keeps it fresh)
  return useQuery({
    queryKey: QUERY_KEYS.activities(childId),
    queryFn: () => activityService.getActivitiesByChild(childId),
    enabled: !!childId,
    staleTime: Infinity, // Subscription keeps data fresh, no need to refetch
  });
}
