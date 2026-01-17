// src/hooks/useServiceEnrollments.js
// Hook for managing student service enrollments with staff history tracking

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import childService from '../services/childService';
import { QUERY_KEYS, QUERY_OPTIONS, invalidateRelatedCaches } from '../config/queryClient';
import {
  SERVICE_ENROLLMENT_STATUS,
  STAFF_REMOVAL_REASONS,
  SERVICE_DEACTIVATION_REASONS
} from '../utils/constants';

// =============================================================================
// QUERY KEYS for Service Enrollments
// =============================================================================

const ENROLLMENT_KEYS = {
  enrollments: (childId) => ['serviceEnrollments', childId],
  staffHistory: (childId) => ['staffHistory', childId],
  activeEnrollments: (childId) => ['serviceEnrollments', childId, 'active'],
  inactiveEnrollments: (childId) => ['serviceEnrollments', childId, 'inactive'],
};

// =============================================================================
// MAIN HOOK: useServiceEnrollments
// =============================================================================

/**
 * Hook for managing service enrollments for a specific child
 * @param {string} childId - The child's document ID
 */
export function useServiceEnrollments(childId) {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [error, setError] = useState(null);

  // ─────────────────────────────────────────────────────────────────────────
  // QUERIES
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Fetch all service enrollments for the child
   */
  const enrollmentsQuery = useQuery({
    queryKey: ENROLLMENT_KEYS.enrollments(childId),
    queryFn: () => childService.getServiceEnrollments(childId),
    enabled: !!childId,
    ...QUERY_OPTIONS.dynamic,
  });

  /**
   * Fetch complete staff history across all services
   */
  const staffHistoryQuery = useQuery({
    queryKey: ENROLLMENT_KEYS.staffHistory(childId),
    queryFn: () => childService.getStaffHistory(childId),
    enabled: !!childId,
    ...QUERY_OPTIONS.dynamic,
  });

  // ─────────────────────────────────────────────────────────────────────────
  // DERIVED DATA
  // ─────────────────────────────────────────────────────────────────────────

  const enrollments = enrollmentsQuery.data || [];

  /**
   * Active service enrollments
   */
  const activeEnrollments = useMemo(() => {
    return enrollments.filter(e => e.status === SERVICE_ENROLLMENT_STATUS.ACTIVE);
  }, [enrollments]);

  /**
   * Inactive service enrollments
   */
  const inactiveEnrollments = useMemo(() => {
    return enrollments.filter(e => e.status === SERVICE_ENROLLMENT_STATUS.INACTIVE);
  }, [enrollments]);

  /**
   * Staff history data
   */
  const staffHistory = staffHistoryQuery.data || [];

  /**
   * Current staff (from active enrollments)
   */
  const currentStaff = useMemo(() => {
    return staffHistory.filter(s => s.isCurrent);
  }, [staffHistory]);

  /**
   * Past staff (historical records)
   */
  const pastStaff = useMemo(() => {
    return staffHistory.filter(s => !s.isCurrent);
  }, [staffHistory]);

  // ─────────────────────────────────────────────────────────────────────────
  // CACHE INVALIDATION HELPER
  // ─────────────────────────────────────────────────────────────────────────

  const invalidateEnrollmentCaches = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ENROLLMENT_KEYS.enrollments(childId) }),
      queryClient.invalidateQueries({ queryKey: ENROLLMENT_KEYS.staffHistory(childId) }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.student(childId) }),
      // Also invalidate the students list since assignedStaffIds changes
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.students() }),
    ]);
  }, [queryClient, childId]);

  // ─────────────────────────────────────────────────────────────────────────
  // MUTATIONS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Add a new service enrollment
   */
  const addEnrollmentMutation = useMutation({
    mutationFn: async (enrollmentData) => {
      const assignedBy = currentUser?.uid;
      if (!assignedBy) throw new Error('User not authenticated');
      return childService.addServiceEnrollment(childId, enrollmentData, assignedBy);
    },
    onSuccess: async () => {
      await invalidateEnrollmentCaches();
      setError(null);
    },
    onError: (err) => {
      setError(err.message);
      console.error('Failed to add service enrollment:', err);
    },
  });

  /**
   * Change staff for an enrollment
   */
  const changeStaffMutation = useMutation({
    mutationFn: async ({ enrollmentId, newStaff, removalReason }) => {
      const changedBy = currentUser?.uid;
      if (!changedBy) throw new Error('User not authenticated');
      return childService.changeServiceStaff(
        childId,
        enrollmentId,
        newStaff,
        removalReason,
        changedBy
      );
    },
    onSuccess: async () => {
      await invalidateEnrollmentCaches();
      setError(null);
    },
    onError: (err) => {
      setError(err.message);
      console.error('Failed to change staff:', err);
    },
  });

  /**
   * Deactivate a service enrollment
   */
  const deactivateMutation = useMutation({
    mutationFn: async ({ enrollmentId, reason }) => {
      const deactivatedBy = currentUser?.uid;
      if (!deactivatedBy) throw new Error('User not authenticated');
      return childService.deactivateServiceEnrollment(
        childId,
        enrollmentId,
        reason,
        deactivatedBy
      );
    },
    onSuccess: async () => {
      await invalidateEnrollmentCaches();
      setError(null);
    },
    onError: (err) => {
      setError(err.message);
      console.error('Failed to deactivate service:', err);
    },
  });

  /**
   * Reactivate a service enrollment
   */
  const reactivateMutation = useMutation({
    mutationFn: async ({ enrollmentId, newStaff }) => {
      const reactivatedBy = currentUser?.uid;
      if (!reactivatedBy) throw new Error('User not authenticated');
      return childService.reactivateServiceEnrollment(
        childId,
        enrollmentId,
        newStaff,
        reactivatedBy
      );
    },
    onSuccess: async () => {
      await invalidateEnrollmentCaches();
      setError(null);
    },
    onError: (err) => {
      setError(err.message);
      console.error('Failed to reactivate service:', err);
    },
  });

  /**
   * Update enrollment metadata (frequency, notes)
   */
  const updateMetadataMutation = useMutation({
    mutationFn: async ({ enrollmentId, updates }) => {
      return childService.updateEnrollmentMetadata(childId, enrollmentId, updates);
    },
    onSuccess: async () => {
      await invalidateEnrollmentCaches();
      setError(null);
    },
    onError: (err) => {
      setError(err.message);
      console.error('Failed to update enrollment metadata:', err);
    },
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ACTION HANDLERS (convenience wrappers)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Add a service enrollment
   * @param {object} data - { serviceId, serviceName, serviceType, staff: {staffId, staffName, staffRole}, frequency?, notes? }
   */
  const addEnrollment = useCallback(async (data) => {
    try {
      const result = await addEnrollmentMutation.mutateAsync(data);
      return { success: true, enrollment: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [addEnrollmentMutation]);

  /**
   * Change staff for an enrollment
   * @param {string} enrollmentId - The enrollment ID
   * @param {object} newStaff - { staffId, staffName, staffRole }
   * @param {string} removalReason - Reason for removing previous staff
   */
  const changeStaff = useCallback(async (enrollmentId, newStaff, removalReason) => {
    try {
      const result = await changeStaffMutation.mutateAsync({
        enrollmentId,
        newStaff,
        removalReason
      });
      return { success: true, enrollment: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [changeStaffMutation]);

  /**
   * Deactivate a service
   * @param {string} enrollmentId - The enrollment ID
   * @param {string} reason - Reason for deactivation
   */
  const deactivateService = useCallback(async (enrollmentId, reason) => {
    try {
      const result = await deactivateMutation.mutateAsync({ enrollmentId, reason });
      return { success: true, enrollment: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [deactivateMutation]);

  /**
   * Reactivate a service
   * @param {string} enrollmentId - The enrollment ID
   * @param {object} newStaff - { staffId, staffName, staffRole }
   */
  const reactivateService = useCallback(async (enrollmentId, newStaff) => {
    try {
      const result = await reactivateMutation.mutateAsync({ enrollmentId, newStaff });
      return { success: true, enrollment: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [reactivateMutation]);

  /**
   * Update enrollment metadata
   * @param {string} enrollmentId - The enrollment ID
   * @param {object} updates - { frequency?, notes?, lastActivityDate? }
   */
  const updateMetadata = useCallback(async (enrollmentId, updates) => {
    try {
      const result = await updateMetadataMutation.mutateAsync({ enrollmentId, updates });
      return { success: true, enrollment: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [updateMetadataMutation]);

  // ─────────────────────────────────────────────────────────────────────────
  // HELPER FUNCTIONS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get an enrollment by ID
   */
  const getEnrollmentById = useCallback((enrollmentId) => {
    return enrollments.find(e => e.enrollmentId === enrollmentId);
  }, [enrollments]);

  /**
   * Get enrollment by service ID
   */
  const getEnrollmentByServiceId = useCallback((serviceId) => {
    return enrollments.find(e => e.serviceId === serviceId);
  }, [enrollments]);

  /**
   * Check if a service is already enrolled (active or inactive)
   */
  const isServiceEnrolled = useCallback((serviceId) => {
    return enrollments.some(e => e.serviceId === serviceId);
  }, [enrollments]);

  /**
   * Check if a service is active
   */
  const isServiceActive = useCallback((serviceId) => {
    return activeEnrollments.some(e => e.serviceId === serviceId);
  }, [activeEnrollments]);

  /**
   * Get staff history for a specific enrollment
   */
  const getStaffHistoryForEnrollment = useCallback((enrollmentId) => {
    return staffHistory.filter(s => s.enrollmentId === enrollmentId);
  }, [staffHistory]);

  /**
   * Refresh all enrollment data
   */
  const refreshData = useCallback(async () => {
    await invalidateEnrollmentCaches();
  }, [invalidateEnrollmentCaches]);

  // ─────────────────────────────────────────────────────────────────────────
  // LOADING STATE
  // ─────────────────────────────────────────────────────────────────────────

  const isLoading = enrollmentsQuery.isLoading || staffHistoryQuery.isLoading;
  const isMutating =
    addEnrollmentMutation.isPending ||
    changeStaffMutation.isPending ||
    deactivateMutation.isPending ||
    reactivateMutation.isPending ||
    updateMetadataMutation.isPending;

  // ─────────────────────────────────────────────────────────────────────────
  // RETURN
  // ─────────────────────────────────────────────────────────────────────────

  return {
    // Data
    enrollments,
    activeEnrollments,
    inactiveEnrollments,
    staffHistory,
    currentStaff,
    pastStaff,

    // Loading states
    isLoading,
    isMutating,
    error,

    // Actions
    addEnrollment,
    changeStaff,
    deactivateService,
    reactivateService,
    updateMetadata,
    refreshData,

    // Helpers
    getEnrollmentById,
    getEnrollmentByServiceId,
    isServiceEnrolled,
    isServiceActive,
    getStaffHistoryForEnrollment,

    // Constants (for UI dropdowns)
    STAFF_REMOVAL_REASONS,
    SERVICE_DEACTIVATION_REASONS,
    SERVICE_ENROLLMENT_STATUS,

    // Raw query/mutation access (for advanced use)
    queries: {
      enrollments: enrollmentsQuery,
      staffHistory: staffHistoryQuery,
    },
    mutations: {
      addEnrollment: addEnrollmentMutation,
      changeStaff: changeStaffMutation,
      deactivate: deactivateMutation,
      reactivate: reactivateMutation,
      updateMetadata: updateMetadataMutation,
    },
  };
}

// =============================================================================
// MIGRATION HOOK: useServiceEnrollmentMigration
// =============================================================================

/**
 * Hook for migrating children from legacy service arrays to new serviceEnrollments format
 * Use this in an admin migration page
 */
export function useServiceEnrollmentMigration() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Migrate a single child
   */
  const migrateSingleMutation = useMutation({
    mutationFn: async (childId) => {
      const migratedBy = currentUser?.uid;
      if (!migratedBy) throw new Error('User not authenticated');
      return childService.migrateToServiceEnrollments(childId, migratedBy);
    },
    onSuccess: (result, childId) => {
      // Invalidate the specific child's cache
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.student(childId) });
      queryClient.invalidateQueries({ queryKey: ENROLLMENT_KEYS.enrollments(childId) });
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  /**
   * Batch migrate all children
   */
  const batchMigrateMutation = useMutation({
    mutationFn: async (options = {}) => {
      const migratedBy = currentUser?.uid;
      if (!migratedBy) throw new Error('User not authenticated');
      return childService.batchMigrateToServiceEnrollments(migratedBy, options);
    },
    onSuccess: (results) => {
      setMigrationStatus(results);
      // Invalidate all student caches
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.students() });
      queryClient.invalidateQueries({ queryKey: ['serviceEnrollments'] });
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  /**
   * Migrate a single child
   * @param {string} childId - The child's document ID
   */
  const migrateChild = useCallback(async (childId) => {
    try {
      const result = await migrateSingleMutation.mutateAsync(childId);
      return { success: true, ...result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [migrateSingleMutation]);

  /**
   * Batch migrate all children
   * @param {object} options - { batchSize?: number }
   */
  const migrateAll = useCallback(async (options = {}) => {
    try {
      setMigrationStatus({ status: 'running' });
      const result = await batchMigrateMutation.mutateAsync(options);
      return { success: true, ...result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [batchMigrateMutation]);

  return {
    migrateChild,
    migrateAll,
    migrationStatus,
    error,
    isRunning: migrateSingleMutation.isPending || batchMigrateMutation.isPending,
  };
}

// =============================================================================
// UTILITY HOOK: useStaffForEnrollment
// =============================================================================

/**
 * Hook to get available staff for assigning to a service enrollment
 * Filters staff based on their specializations matching the service
 */
export function useStaffForEnrollment(serviceType, serviceName) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['staffForEnrollment', serviceType, serviceName],
    queryFn: async () => {
      // Import userService dynamically to avoid circular deps
      const userService = (await import('../services/userService')).default;

      // Get staff based on service type
      const role = serviceType === 'Therapy' ? 'therapist' : 'teacher';
      const staff = await userService.getUsersByRole(role);

      // Filter by specialization if serviceName is provided
      if (serviceName) {
        return staff.filter(s =>
          !s.specializations ||
          s.specializations.length === 0 ||
          s.specializations.includes(serviceName)
        );
      }

      return staff;
    },
    enabled: !!serviceType,
    ...QUERY_OPTIONS.semiStatic,
  });
}

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default useServiceEnrollments;
