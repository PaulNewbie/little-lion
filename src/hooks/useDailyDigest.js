// src/hooks/useDailyDigest.js
// React Query hook for Daily Digest data

import { useQuery } from '@tanstack/react-query';
import { getDailyDigest, getLastActivityDate } from '../services/digestService';

/**
 * Format date to consistent string key for query caching
 */
const formatDateKey = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Hook to fetch daily digest data for a child on a specific date
 * @param {string} childId - Child document ID
 * @param {Date} date - The date to fetch
 * @returns {Object} React Query result with digest data
 */
export function useDailyDigest(childId, date) {
  const dateKey = formatDateKey(date);

  return useQuery({
    queryKey: ['dailyDigest', childId, dateKey],
    queryFn: () => getDailyDigest(childId, date),
    enabled: !!childId && !!date,
    staleTime: 1000 * 60 * 2,  // 2 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 30, // Auto-refresh every 30 seconds
  });
}

/**
 * Hook to fetch the last activity date for a child
 * @param {string} childId - Child document ID
 * @returns {Object} React Query result with last activity date
 */
export function useLastActivityDate(childId) {
  return useQuery({
    queryKey: ['lastActivityDate', childId],
    queryFn: () => getLastActivityDate(childId),
    enabled: !!childId,
    staleTime: 1000 * 60 * 5,  // 5 minutes
    cacheTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: true,
  });
}

export default useDailyDigest;
