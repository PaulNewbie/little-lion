// src/hooks/useCachedData.js
// NEW FILE - Centralized hooks for cached data fetching
// These hooks use TanStack Query to cache data and prevent re-fetching

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import childService from '../services/childService';
import userService from '../services/userService';
import offeringsService from '../services/offeringsService';
import activityService from '../services/activityService';
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
 * Get all parents - CACHED (use sparingly, prefer usePaginatedParents)
 */
export function useParents() {
  return useQuery({
    queryKey: QUERY_KEYS.users('parent'),
    queryFn: () => userService.getUsersByRole('parent'),
    ...QUERY_OPTIONS.semiStatic,
  });
}

/**
 * Get parents with server-side pagination - REDUCES FIRESTORE READS
 * Only fetches PAGE_SIZE parents at a time from Firestore
 * Uses "Load More" pattern like student profiles
 * @param {number} pageSize - Number of parents per page (default: 10)
 */
export function usePaginatedParents(pageSize = 10) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['parents', 'paginated'],
    queryFn: async () => {
      const result = await userService.getParentsPaginated({ limit: pageSize });
      return result;
    },
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
 * Get staff with permissions - REUSES CACHED DATA from useTeachers/useTherapists/useAdmins
 * Used by User Access Management page
 * @param {string|null} roleFilter - Optional role to filter by ('admin', 'teacher', 'therapist')
 */
export function useStaffWithPermissions(roleFilter = null) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['staffPermissions', roleFilter || 'all'],
    queryFn: async () => {
      // Try to reuse cached data first
      const cachedTeachers = queryClient.getQueryData(QUERY_KEYS.users('teacher'));
      const cachedTherapists = queryClient.getQueryData(QUERY_KEYS.users('therapist'));
      const cachedAdmins = queryClient.getQueryData(QUERY_KEYS.users('admin'));

      let staffToUse = [];

      // Determine which roles to include based on filter
      if (roleFilter === 'teacher') {
        staffToUse = cachedTeachers || await userService.getUsersByRole('teacher');
        if (!cachedTeachers) {
          queryClient.setQueryData(QUERY_KEYS.users('teacher'), staffToUse);
        }
      } else if (roleFilter === 'therapist') {
        staffToUse = cachedTherapists || await userService.getUsersByRole('therapist');
        if (!cachedTherapists) {
          queryClient.setQueryData(QUERY_KEYS.users('therapist'), staffToUse);
        }
      } else if (roleFilter === 'admin') {
        staffToUse = cachedAdmins || await userService.getUsersByRole('admin');
        if (!cachedAdmins) {
          queryClient.setQueryData(QUERY_KEYS.users('admin'), staffToUse);
        }
      } else {
        // No filter - combine all roles
        const teachers = cachedTeachers || await userService.getUsersByRole('teacher');
        const therapists = cachedTherapists || await userService.getUsersByRole('therapist');
        const admins = cachedAdmins || await userService.getUsersByRole('admin');

        // Seed cache if we had to fetch
        if (!cachedTeachers) queryClient.setQueryData(QUERY_KEYS.users('teacher'), teachers);
        if (!cachedTherapists) queryClient.setQueryData(QUERY_KEYS.users('therapist'), therapists);
        if (!cachedAdmins) queryClient.setQueryData(QUERY_KEYS.users('admin'), admins);

        staffToUse = [...teachers, ...therapists, ...admins];
      }

      // Map permissions
      const result = staffToUse.map(user => ({
        ...user,
        uid: user.uid || user.id,
        canEnrollStudents: user.permissions?.canEnrollStudents ?? false,
      }));

      console.log(`♻️ Staff Permissions: ${cachedTeachers || cachedTherapists || cachedAdmins ? 'Reused cached data!' : 'Fetched fresh'}`);
      return result;
    },
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
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: QUERY_KEYS.students(), // matches ['students']
    queryFn: async () => {
        const res = await childService.getAllChildren();
        // Seed cache for individual lookups
        seedStudentCache(queryClient, res);
        return res;
    },
    ...QUERY_OPTIONS.semiStatic,
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
      // 1. SMART CHECK: Do we have the full student list already?
      // (e.g. from Student Profile or Manage Teachers)
      const allStudents = queryClient.getQueryData(QUERY_KEYS.students());
      
      const studentsArray = Array.isArray(allStudents) 
        ? allStudents 
        : (allStudents?.students || []);

      if (studentsArray.length > 0) {
        // Filter in memory (Cost: 0 Reads)
        const parentChildren = studentsArray.filter(s => s.parentId === parentId);
        
        // If we found their kids in the master list, use them!
        if (parentChildren.length > 0) {
          console.log("♻️ Found Parent's Children in Master List! (0 Reads)");
          return parentChildren;
        }
      }

      // 2. If not found, fetch from DB
      console.log("⚡ Fetching Parent's Kids from DB...");
      const children = await childService.getChildrenByParentId(parentId);
      
      // 3. Seed the individual cache
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
      // 1. SMART CHECK: Do we have the full class list already?
      const allStudents = queryClient.getQueryData(QUERY_KEYS.students());
      
      // Handle different cache structures (array vs object with pagination)
      const studentsArray = Array.isArray(allStudents) 
        ? allStudents 
        : (allStudents?.students || []);

      if (studentsArray.length > 0) {
        console.log("♻️ Found Master List! Filtering in memory (0 Reads)");
        // Filter in memory
        const staffStudents = studentsArray.filter(s => 
          s.assignedStaffIds && s.assignedStaffIds.includes(staffId)
        );
        
        // If we found them in memory, return them!
        // (Optional: If we found 0, maybe the master list is stale? 
        //  Safe bet is to return the empty list or fetch if critical).
        if (staffStudents.length > 0) return staffStudents;
      }

      // 2. If no master list (or student not found), fetch from DB
      console.log("⚡ Fetching Staff Subset from DB...");
      const children = await childService.getChildrenByStaffId(staffId);
      
      // 3. Seed the individual cache
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
 * Checks multiple cache locations before fetching
 */
export function useChild(childId) {
  const queryClient = useQueryClient();

  // Helper to find student in any cache
  const findInCache = () => {
    if (!childId) return null;

    // 1. Check individual student cache
    const individual = queryClient.getQueryData(QUERY_KEYS.student(childId));
    if (individual) return individual;

    // 2. Check main students list (admin view)
    const studentsList = queryClient.getQueryData(QUERY_KEYS.students());
    if (studentsList?.students) {
      const found = studentsList.students.find(s => s.id === childId);
      if (found) return found;
    }
    if (Array.isArray(studentsList)) {
      const found = studentsList.find(s => s.id === childId);
      if (found) return found;
    }

    // 3. Check search results cache (various search terms)
    const queries = queryClient.getQueriesData({ queryKey: ['students', 'search'] });
    for (const [, data] of queries) {
      if (Array.isArray(data)) {
        const found = data.find(s => s.id === childId);
        if (found) return found;
      }
    }

    return null;
  };

  return useQuery({
    queryKey: QUERY_KEYS.student(childId),
    queryFn: async () => {
      // Double-check cache in queryFn (in case it was populated after initial check)
      const cached = findInCache();
      if (cached) {
        return cached;
      }

      // Only fetch from DB if truly missing from all caches
      return childService.getChildById(childId);
    },
    enabled: !!childId,
    // Use initialData if available in cache - prevents unnecessary fetch
    initialData: () => findInCache(),
    // Only consider stale if we don't have data
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 12, // 12 hours
    refetchOnMount: false,
    refetchOnWindowFocus: false,
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
// PARENT ACTIVITY HOOKS - CACHED
// =============================================================================

/**
 * Get activities for a specific child - CACHED
 * Used by parents to view their child's activities
 */
export function useChildActivities(childId) {
  return useQuery({
    queryKey: QUERY_KEYS.activities(childId),
    queryFn: async () => {
      console.log("⚡ Fetching child activities from DB...");
      const activities = await activityService.getActivitiesByChild(childId);
      return activities;
    },
    enabled: !!childId,
    ...QUERY_OPTIONS.dynamic, // 5 min stale time for activity data
  });
}

/**
 * Get therapy sessions for a specific child - CACHED
 * Returns sessions that are visible to parents
 */
export function useChildTherapySessions(childId) {
  return useQuery({
    queryKey: ['therapySessions', 'byChild', childId],
    queryFn: async () => {
      console.log("⚡ Fetching child therapy sessions from DB...");
      // Import dynamically to avoid circular deps
      const { collection, query, where, getDocs, orderBy } = await import('firebase/firestore');
      const { db } = await import('../config/firebase');

      const q = query(
        collection(db, 'therapy_sessions'),
        where('childId', '==', childId),
        orderBy('date', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(session => session.visibleToParents !== false);
    },
    enabled: !!childId,
    ...QUERY_OPTIONS.dynamic,
  });
}

/**
 * Combined child activities and therapy sessions - OPTIMIZED
 * Single hook for ChildActivities page
 */
export function useChildAllActivities(childId) {
  const activitiesQuery = useChildActivities(childId);
  const therapyQuery = useChildTherapySessions(childId);

  return {
    activities: activitiesQuery.data || [],
    therapySessions: therapyQuery.data || [],
    isLoading: activitiesQuery.isLoading || therapyQuery.isLoading,
    error: activitiesQuery.error || therapyQuery.error,
    refetch: () => {
      activitiesQuery.refetch();
      therapyQuery.refetch();
    },
  };
}

// =============================================================================
// CACHE INVALIDATION - Call these after create/update/delete operations
// =============================================================================

export function useCacheInvalidation() {
  const queryClient = useQueryClient();
  return {
    invalidateParents: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users('parent') });
      // Also invalidate paginated parent queries
      queryClient.invalidateQueries({ queryKey: ['parents', 'paginated'] });
      queryClient.invalidateQueries({ queryKey: ['parents', 'count'] });
    },
    invalidateStaff: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.staff() }),
    invalidateAdmins: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users('admin') }),
    
    invalidateChildren: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    
    // UPDATED: Invalidate Master List too when a parent's child is updated
    invalidateChildrenByParent: (parentId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.studentsByParent(parentId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.students() }); // <--- ADD THIS LINE
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

// Re-export service enrollment hooks for convenience
export {
  useServiceEnrollments,
  useServiceEnrollmentMigration,
  useStaffForEnrollment
} from './useServiceEnrollments';

export default {
  useParents,
  usePaginatedParents,
  useTeachers,
  useTherapists,
  useAdmins,
  useAllStaff,
  useStaffWithPermissions,
  useUser,
  useChildrenByParent,
  useChildrenByStaff,
  useChild,
  useAllServices,
  useServicesByType,
  useChildActivities,
  useChildTherapySessions,
  useChildAllActivities,
  useCacheInvalidation,
  useTherapistDashboardData,
  useTeacherDashboardData,
  useParentDashboardData,
};