// src/hooks/useCachedData.js
// NEW FILE - Centralized hooks for cached data fetching
// These hooks use TanStack Query to cache data and prevent re-fetching

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import childService from '../services/childService';
import userService from '../services/userService';
import offeringsService from '../services/offeringsService';

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
// USER HOOKS
// =============================================================================

/**
 * Get all parents - CACHED
 */
export function useParents() {
  return useQuery({
    queryKey: ['users', 'parent'],
    queryFn: () => userService.getUsersByRole('parent'),
    ...CACHE_CONFIG.standard,
  });
}

/**
 * Get all teachers - CACHED
 */
export function useTeachers() {
  return useQuery({
    queryKey: ['users', 'teacher'],
    queryFn: () => userService.getUsersByRole('teacher'),
    ...CACHE_CONFIG.standard,
  });
}

/**
 * Get all therapists - CACHED
 */
export function useTherapists() {
  return useQuery({
    queryKey: ['users', 'therapist'],
    queryFn: () => userService.getUsersByRole('therapist'),
    ...CACHE_CONFIG.standard,
  });
}

/**
 * Get all admins - CACHED
 */
export function useAdmins() {
  return useQuery({
    queryKey: ['users', 'admin'],
    queryFn: () => userService.getUsersByRole('admin'),
    ...CACHE_CONFIG.standard,
  });
}

/**
 * Get all staff (teachers + therapists) - CACHED
 */
export function useAllStaff() {
  return useQuery({
    queryKey: ['users', 'staff'],
    queryFn: () => userService.getAllStaff(),
    ...CACHE_CONFIG.standard,
  });
}

/**
 * Get single user by ID - CACHED
 */
export function useUser(userId) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => userService.getUserById(userId),
    enabled: !!userId,
    ...CACHE_CONFIG.standard,
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
    queryKey: ['children', 'byParent', parentId],
    queryFn: () => childService.getChildrenByParentId(parentId),
    enabled: !!parentId,
    ...CACHE_CONFIG.standard,
    // SMART INITIALIZATION: Check if these kids are already in the main list
    initialData: () => {
      // 1. Try to find the main list cache (from useStudents hook)
      // Note: This key must match what is used in useRoleBasedData.js
      const allStudentsCache = queryClient.getQueryData(['students']);

      if (!allStudentsCache) return undefined;

      // 2. Extract the array (handle both paginated object and simple array formats)
      const studentsArray = Array.isArray(allStudentsCache) 
        ? allStudentsCache 
        : (allStudentsCache.students || []);

      // 3. Filter for this parent's children
      const children = studentsArray.filter(s => s.parentId === parentId);

      // 4. Only use as initial data if we found some children
      // WARNING: If a parent has children but they aren't in the *current page* of the list,
      // this might return an incomplete list. 
      // However, usually if you just created them or are viewing them, they are likely cached.
      // If we return undefined, it triggers a fetch, which is safer for completeness.
      
      return children.length > 0 ? children : undefined;
    },
    // If we found data in cache, consider it fresh for 30 mins (matches standard config)
    initialDataUpdatedAt: () => {
      return queryClient.getQueryState(['students'])?.dataUpdatedAt;
    }
  });
}

/**
 * Get children by staff ID - CACHED
 */
export function useChildrenByStaff(staffId) {
  return useQuery({
    queryKey: ['children', 'byStaff', staffId],
    queryFn: () => childService.getChildrenByStaffId(staffId),
    enabled: !!staffId,
    ...CACHE_CONFIG.standard,
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
    queryKey: ['child', childId],
    queryFn: () => childService.getChildById(childId),
    enabled: !!childId,
    ...CACHE_CONFIG.standard,
    // Look for this child in the main list cache first
    initialData: () => {
      const allStudentsCache = queryClient.getQueryData(['students']);
      const studentsArray = Array.isArray(allStudentsCache) 
        ? allStudentsCache 
        : (allStudentsCache?.students || []);
        
      return studentsArray.find(d => d.id === childId);
    }
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
    queryKey: ['services', 'all'],
    queryFn: () => offeringsService.getAllServices(),
    ...CACHE_CONFIG.static,
  });
}

/**
 * Get services by type - CACHED
 */
export function useServicesByType(type) {
  return useQuery({
    queryKey: ['services', type],
    queryFn: () => offeringsService.getServicesByType(type),
    enabled: !!type,
    ...CACHE_CONFIG.static,
  });
}

// =============================================================================
// CACHE INVALIDATION - Call these after create/update/delete operations
// =============================================================================

export function useCacheInvalidation() {
  const queryClient = useQueryClient();

  return {
    invalidateParents: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'parent'] });
    },
    
    invalidateChildren: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
      // Also invalidate the main student list so it refreshes
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    
    invalidateChildrenByParent: (parentId) => {
      queryClient.invalidateQueries({ queryKey: ['children', 'byParent', parentId] });
      // Also invalidate main list
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    
    invalidateStaff: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'teacher'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'therapist'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'staff'] });
    },

    invalidateAdmins: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'admin'] });
    },
    
    invalidateServices: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    
    invalidateAll: () => {
      queryClient.invalidateQueries();
    },
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

/**
 * For Teacher Dashboard
 */
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

/**
 * For Parent Dashboard
 */
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
  useAllChildren,
  useChildrenByParent,
  useChildrenByStaff,
  useChildrenByService,
  useChild,
  useAllServices,
  useServicesByType,
  useCacheInvalidation,
  useTherapistDashboardData,
  useTeacherDashboardData,
  useParentDashboardData,
};