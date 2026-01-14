// src/hooks/useCachedData.js
// NEW FILE - Centralized hooks for cached data fetching
// These hooks use TanStack Query to cache data and prevent re-fetching

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import childService from '../services/childService';
import userService from '../services/userService';
import offeringsService from '../services/offeringsService';
import { QUERY_KEYS, QUERY_OPTIONS } from '../config/queryClient';

// =============================================================================
// CACHE CONFIGURATION - Data won't refetch for these durations
// =============================================================================

const CACHE_CONFIG = {
  static: {
    staleTime: 1000 * 60 * 60,      // 1 hour
    cacheTime: 1000 * 60 * 60 * 24, // 24 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  },
  standard: {
    staleTime: 1000 * 60 * 30,      // 30 minutes - won't refetch for 30 mins!
    cacheTime: 1000 * 60 * 60 * 12, // 12 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,          // KEY: Don't refetch when navigating back
  },
  dynamic: {
    staleTime: 1000 * 60 * 5,       // 5 minutes
    cacheTime: 1000 * 60 * 60,      // 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  },
};

// =============================================================================
// HELPER: CACHE SEEDING
// =============================================================================
// This function takes a list of students and puts them into the individual cache.
// This is the magic that makes clicking a profile "Free" (0 reads).
const seedStudentCache = (queryClient, students) => {
  if (!students || !Array.isArray(students)) return;
  
  students.forEach(student => {
    if (student && student.id) {
      // We use QUERY_KEYS.student(id) to match what useRoleBasedData uses
      queryClient.setQueryData(QUERY_KEYS.student(student.id), student);
    }
  });
  console.log(`🌱 Seeded ${students.length} students into individual cache`);
};

// =============================================================================
// USER HOOKS
// =============================================================================

/**
 * Get all parents - CACHED
 */
export function useParents() {
  return useQuery({
    queryKey: QUERY_KEYS.users('parent'),
    queryFn: () => userService.getUsersByRole('parent'),
    ...QUERY_OPTIONS.semiStatic,
  });
}

/**
 * Get all teachers - CACHED
 */
export function useTeachers() {
  return useQuery({
    queryKey: QUERY_KEYS.users('teacher'),
    queryFn: () => userService.getUsersByRole('teacher'),
    ...QUERY_OPTIONS.semiStatic,
  });
}

/**
 * Get all therapists - CACHED
 */
export function useTherapists() {
  return useQuery({
    queryKey: QUERY_KEYS.users('therapist'),
    queryFn: () => userService.getUsersByRole('therapist'),
    ...QUERY_OPTIONS.semiStatic,
  });
}

/**
 * Get all admins - CACHED
 */
export function useAdmins() {
  return useQuery({
    queryKey: QUERY_KEYS.users('admin'),
    queryFn: () => userService.getUsersByRole('admin'),
    ...QUERY_OPTIONS.semiStatic,
  });
}

/**
 * Get all staff (teachers + therapists) - CACHED
 */
export function useAllStaff() {
  return useQuery({
    queryKey: QUERY_KEYS.staff(),
    queryFn: () => userService.getAllStaff(),
    ...QUERY_OPTIONS.semiStatic,
  });
}

/**
 * Get single user by ID - CACHED
 */
export function useUser(userId) {
  return useQuery({
    queryKey: QUERY_KEYS.user(userId),
    queryFn: () => userService.getUserById(userId),
    enabled: !!userId,
    ...QUERY_OPTIONS.semiStatic,
  });
}

// =============================================================================
// CHILDREN/STUDENTS HOOKS
// =============================================================================

/**
 * Get all children - CACHED (use sparingly!)
 */
export function useAllChildren() {
  return useQuery({
    queryKey: ['children', 'all'],
    queryFn: () => childService.getAllChildren(),
    ...CACHE_CONFIG.standard,
  });
}

/**
 * Get children by parent ID - CACHED & OPTIMIZED
 * Checks if data exists in the main 'students' list first to avoid re-reading.
 */
export function useChildrenByParent(parentId) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: QUERY_KEYS.studentsByParent(parentId),
    queryFn: async () => {
      const children = await childService.getChildrenByParentId(parentId);
      seedStudentCache(queryClient, children);
      return children;
    },
    enabled: !!parentId,
    ...QUERY_OPTIONS.semiStatic,
  });
}

/**
 * Get children by staff ID - CACHED
 */
export function useChildrenByStaff(staffId) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: QUERY_KEYS.studentsByStaff(staffId),
    queryFn: async () => {
      // 1. Fetch ONLY this staff's students (Cheap!)
      const children = await childService.getChildrenByStaffId(staffId);
      
      // 2. Seed the cache so Profile View is free
      seedStudentCache(queryClient, children);
      
      return children;
    },
    enabled: !!staffId,
    ...QUERY_OPTIONS.semiStatic,
  });
}

/**
 * Get children by service name - CACHED
 */
export function useChildrenByService(serviceName) {
  return useQuery({
    queryKey: ['children', 'byService', serviceName],
    queryFn: () => childService.getChildrenByService(serviceName),
    enabled: !!serviceName,
    ...CACHE_CONFIG.standard,
  });
}

/**
 * Get single child by ID - CACHED
 */
export function useChild(childId) {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: QUERY_KEYS.student(childId), // Matches the seed key!
    queryFn: async () => {
      // 1. Check if we already have it in memory (from a list fetch)
      const existing = queryClient.getQueryData(QUERY_KEYS.student(childId));
      if (existing) {
        console.log("♻️ Found student in cache! (0 Reads)");
        return existing;
      }
      
      // 2. Only fetch from DB if truly missing
      console.log("⚠️ Student not in cache, fetching...");
      return childService.getChildById(childId);
    },
    enabled: !!childId,
    ...QUERY_OPTIONS.semiStatic,
  });
}

// =============================================================================
// SERVICES/OFFERINGS HOOKS
// =============================================================================

/**
 * Get all services - CACHED (static, rarely changes)
 */
export function useAllServices() {
  return useQuery({
    queryKey: QUERY_KEYS.services('all'),
    queryFn: () => offeringsService.getAllServices(),
    ...QUERY_OPTIONS.static,
  });
}

/**
 * Get services by type - CACHED
 */
export function useServicesByType(type) {
  return useQuery({
    queryKey: QUERY_KEYS.services(type),
    queryFn: () => offeringsService.getServicesByType(type),
    enabled: !!type,
    ...QUERY_OPTIONS.static,
  });
}

// =============================================================================
// CACHE INVALIDATION - Call these after create/update/delete operations
// =============================================================================

export function useCacheInvalidation() {
  const queryClient = useQueryClient();
  return {
    invalidateParents: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users('parent') }),
    invalidateStaff: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.staff() }),
    invalidateAdmins: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users('admin') }),
    
    invalidateChildren: () => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: ['students'] });
      // We don't necessarily want to wipe every individual student cache immediately
      // unless we know data changed significantly.
    },
    
    invalidateChildrenByParent: (parentId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.studentsByParent(parentId) });
    },

    invalidateServices: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.services() }),
    invalidateAll: () => queryClient.invalidateQueries(),
  };
}

// =============================================================================
// DASHBOARD DATA HOOKS (convenience hooks)
// =============================================================================

/**
 * For Therapist Dashboard
 */
export function useTherapistDashboardData() {
  const { currentUser } = useAuth();
  const studentsQuery = useChildrenByStaff(currentUser?.uid);
  return {
    students: studentsQuery.data || [],
    isLoading: studentsQuery.isLoading,
    error: studentsQuery.error,
    refetch: studentsQuery.refetch,
  };
}

export function useTeacherDashboardData() {
  const { currentUser } = useAuth();
  const studentsQuery = useChildrenByStaff(currentUser?.uid);
  return {
    students: studentsQuery.data || [],
    isLoading: studentsQuery.isLoading,
    error: studentsQuery.error,
    refetch: studentsQuery.refetch,
  };
}

export function useParentDashboardData() {
  const { currentUser } = useAuth();
  const childrenQuery = useChildrenByParent(currentUser?.uid);
  return {
    children: childrenQuery.data || [],
    isLoading: childrenQuery.isLoading,
    error: childrenQuery.error,
    refetch: childrenQuery.refetch,
  };
}

export default {
  useParents,
  useTeachers,
  useTherapists,
  useAdmins,
  useAllStaff,
  useUser,
  useChildrenByParent,
  useChildrenByStaff,
  useChild,
  useAllServices,
  useServicesByType,
  useCacheInvalidation,
  useTherapistDashboardData,
  useTeacherDashboardData,
  useParentDashboardData,
};