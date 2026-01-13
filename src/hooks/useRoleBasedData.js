// src/hooks/useRoleBasedData.js
// STRATEGY 6: Role-Based Data Loading
// Only fetch what each user role can actually see

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { QUERY_KEYS, QUERY_OPTIONS } from '../config/queryClient';
import childService from '../services/childService';
import userService from '../services/userService';
import activityService from '../services/activityService';
import offeringsService from '../services/offeringsService';

// =============================================================================
// STUDENTS / CHILDREN HOOKS
// =============================================================================

/**
 * Smart student loading based on user role
 * This is the main hook you should use throughout the app
 */
export function useStudents(options = {}) {
  const { currentUser } = useAuth();
  const { 
    pageSize = 8, 
    enabled = true,
    forceAll = false // Only true for specific admin operations
  } = options;

  const queryKey = getStudentQueryKey(currentUser, forceAll);
  
  return useQuery({
    queryKey,
    queryFn: () => fetchStudentsByRole(currentUser, { pageSize, forceAll }),
    enabled: enabled && !!currentUser,
    ...QUERY_OPTIONS.semiStatic,
    // Override stale time for parents (their data changes less often from their perspective)
    staleTime: currentUser?.role === 'parent' 
      ? 1000 * 60 * 60 // 1 hour for parents
      : QUERY_OPTIONS.semiStatic.staleTime,
  });
}

/**
 * Generate appropriate query key based on role
 * This ensures proper cache isolation between users
 */
function getStudentQueryKey(user, forceAll) {
  if (!user) return ['students', 'anonymous'];
  
  if (forceAll && ['admin', 'super_admin'].includes(user.role)) {
    return QUERY_KEYS.students();
  }
  
  switch (user.role) {
    case 'super_admin':
    case 'admin':
      return QUERY_KEYS.students();
    case 'parent':
      return QUERY_KEYS.studentsByParent(user.uid);
    case 'teacher':
    case 'therapist':
      return QUERY_KEYS.studentsByStaff(user.uid);
    default:
      return ['students', 'unknown', user.uid];
  }
}

/**
 * Fetch students based on user role
 * This is where the actual Firestore queries happen
 */
async function fetchStudentsByRole(user, { pageSize, forceAll }) {
  if (!user) return [];
  
  switch (user.role) {
    case 'super_admin':
    case 'admin':
      // Admins get paginated list (Strategy 4)
      if (forceAll) {
        // Only for specific operations like exports
        return childService.getAllChildren();
      }
      return childService.getChildrenPaginated({ limit: pageSize });
      
    case 'parent':
      // Parents only see their own children (2-5 reads max)
      return childService.getChildrenByParentId(user.uid);
      
    case 'teacher':
    case 'therapist':
      // Staff only see assigned students
      return childService.getChildrenByStaffId(user.uid);
      
    default:
      console.warn(`Unknown role: ${user.role}`);
      return [];
  }
}

/**
 * Hook for loading more students (pagination for admins)
 * UPDATED: Now accepts pageSize dynamic argument
 */
export function useLoadMoreStudents() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  
  const loadMore = async (lastDoc, pageSize = 8) => {
    if (!['admin', 'super_admin'].includes(currentUser?.role)) {
      console.warn('Load more is only available for admins');
      return;
    }
    
    // UPDATED: Use the passed pageSize (defaults to 20 if not provided)
    const moreStudents = await childService.getChildrenPaginated({ 
      limit: pageSize, 
      startAfter: lastDoc 
    });
    
    // Append to existing cache
    queryClient.setQueryData(QUERY_KEYS.students(), (old) => ({
      ...old,
      students: [...(old?.students || []), ...moreStudents.students],
      lastDoc: moreStudents.lastDoc,
      hasMore: moreStudents.hasMore,
    }));
    
    return moreStudents;
  };
  
  return { loadMore };
}

/**
 * Hook for single student (with proper cache lookup)
 */
export function useStudent(studentId) {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: QUERY_KEYS.student(studentId),
    queryFn: async () => {
      // First, try to find in existing cache
      const cachedStudents = queryClient.getQueryData(
        getStudentQueryKey(currentUser, false)
      );
      
      if (cachedStudents) {
        const students = cachedStudents.students || cachedStudents;
        const found = students.find(s => s.id === studentId);
        if (found) return found;
      }
      
      // Not in cache, fetch individually
      return childService.getChildById(studentId);
    },
    enabled: !!studentId && !!currentUser,
    ...QUERY_OPTIONS.semiStatic,
  });
}

// =============================================================================
// STAFF HOOKS
// =============================================================================

/**
 * Load staff with role-based filtering
 */
export function useStaff(options = {}) {
  const { currentUser } = useAuth();
  const { role, enabled = true } = options; // role: 'teacher' | 'therapist' | undefined (all)

  return useQuery({
    queryKey: role ? QUERY_KEYS.users(role) : QUERY_KEYS.staff(),
    queryFn: async () => {
      if (role) {
        return userService.getUsersByRole(role);
      }
      return userService.getAllStaff();
    },
    enabled: enabled && !!currentUser,
    ...QUERY_OPTIONS.semiStatic,
  });
}

/**
 * Convenience hooks for specific staff types
 */
export function useTeachers(options = {}) {
  return useStaff({ ...options, role: 'teacher' });
}

export function useTherapists(options = {}) {
  return useStaff({ ...options, role: 'therapist' });
}

// =============================================================================
// SERVICES / OFFERINGS HOOKS
// =============================================================================

/**
 * Load services (these rarely change - use static caching)
 */
export function useServices(options = {}) {
  const { type, enabled = true } = options; // type: 'Therapy' | 'Class' | undefined (all)

  return useQuery({
    queryKey: QUERY_KEYS.services(type),
    queryFn: async () => {
      if (type) {
        return offeringsService.getServicesByType(type);
      }
      return offeringsService.getAllServices();
    },
    enabled,
    ...QUERY_OPTIONS.static, // Longest cache time - services rarely change
  });
}

/**
 * Convenience hooks for specific service types
 */
export function useTherapyServices() {
  return useServices({ type: 'Therapy' });
}

export function useClassServices() {
  return useServices({ type: 'Class' });
}

// =============================================================================
// ACTIVITIES HOOKS
// =============================================================================

/**
 * Load activities for a specific student
 */
export function useActivities(studentId, options = {}) {
  const { currentUser } = useAuth();
  const { enabled = true, limit = 50 } = options;

  return useQuery({
    queryKey: QUERY_KEYS.activities(studentId),
    queryFn: () => activityService.getActivitiesByChild(studentId, { limit }),
    enabled: enabled && !!studentId && !!currentUser,
    ...QUERY_OPTIONS.dynamic, // Activities change more frequently
  });
}

// =============================================================================
// COMBINED DATA HOOKS (for dashboards)
// =============================================================================

/**
 * Dashboard data hook - loads everything needed for a role's dashboard
 * Uses parallel queries for efficiency
 */
export function useDashboardData() {
  const { currentUser } = useAuth();
  
  const studentsQuery = useStudents();
  const servicesQuery = useServices();
  
  // Only load staff for admins
  const staffQuery = useStaff({
    enabled: ['admin', 'super_admin'].includes(currentUser?.role),
  });
  
  return {
    students: studentsQuery.data?.students || studentsQuery.data || [],
    services: servicesQuery.data || [],
    staff: staffQuery.data || [],
    isLoading: studentsQuery.isLoading || servicesQuery.isLoading || staffQuery.isLoading,
    isError: studentsQuery.isError || servicesQuery.isError || staffQuery.isError,
    errors: [studentsQuery.error, servicesQuery.error, staffQuery.error].filter(Boolean),
  };
}

/**
 * Student profile data hook - loads all data for a student detail view
 */
export function useStudentProfileData(studentId) {
  const { currentUser } = useAuth();
  
  const studentQuery = useStudent(studentId);
  const activitiesQuery = useActivities(studentId);
  
  // Load parent info if we have the student
  const parentId = studentQuery.data?.parentId;
  const parentQuery = useQuery({
    queryKey: QUERY_KEYS.user(parentId),
    queryFn: () => userService.getUserById(parentId),
    enabled: !!parentId,
    ...QUERY_OPTIONS.semiStatic,
  });
  
  // Load assessment if exists
  const assessmentId = studentQuery.data?.assessmentId;
  const assessmentQuery = useQuery({
    queryKey: QUERY_KEYS.assessment(assessmentId),
    queryFn: () => import('../services/assessmentService').then(m => 
      m.default.getAssessment(assessmentId)
    ),
    enabled: !!assessmentId,
    ...QUERY_OPTIONS.semiStatic,
  });
  
  return {
    student: studentQuery.data,
    activities: activitiesQuery.data || [],
    parent: parentQuery.data,
    assessment: assessmentQuery.data,
    isLoading: studentQuery.isLoading,
    isLoadingActivities: activitiesQuery.isLoading,
    isLoadingAssessment: assessmentQuery.isLoading,
    error: studentQuery.error || activitiesQuery.error,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  useStudents,
  useStudent,
  useLoadMoreStudents,
  useStaff,
  useTeachers,
  useTherapists,
  useServices,
  useTherapyServices,
  useClassServices,
  useActivities,
  useDashboardData,
  useStudentProfileData,
};