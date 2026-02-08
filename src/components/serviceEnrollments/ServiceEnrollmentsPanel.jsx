// src/components/serviceEnrollments/ServiceEnrollmentsPanel.jsx
// Container panel for displaying and managing all service enrollments

import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ServiceCard from './ServiceCard';
import ChangeStaffModal from './ChangeStaffModal';
import DeactivateServiceModal from './DeactivateServiceModal';
import ReactivateServiceModal from './ReactivateServiceModal';
import { useServiceEnrollments } from '../../hooks/useServiceEnrollments';
import userService from '../../services/userService';
import Loading from '../common/Loading';
import { ROUTES } from '../../routes/routeConfig';
import { QUERY_KEYS, QUERY_OPTIONS } from '../../config/queryClient';
import './ServiceEnrollments.css';

/**
 * ServiceEnrollmentsPanel - Full panel for managing student service enrollments
 *
 * @param {string} childId - The student's document ID
 * @param {function} onServiceClick - Callback when a service is clicked (for activity view)
 * @param {string} selectedService - Currently selected service name
 * @param {boolean} isReadOnly - If true, hides all action buttons (for parent view)
 * @param {function} onAddService - Callback for "Add Service" button
 * @param {string} viewerRole - Role of the current viewer (admin, super_admin, teacher, therapist, parent)
 * @param {string} viewerId - UID of the current viewer (for staff filtering)
 */
const ServiceEnrollmentsPanel = ({
  childId,
  onServiceClick,
  selectedService,
  isReadOnly = false,
  onAddService,
  viewerRole = null,
  viewerId = null,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hook for service enrollment data and actions
  const {
    activeEnrollments,
    inactiveEnrollments,
    isLoading,
    isMutating,
    error,
    changeStaff,
    deactivateService,
    reactivateService,
    refreshData,
    STAFF_REMOVAL_REASONS,
    SERVICE_DEACTIVATION_REASONS,
  } = useServiceEnrollments(childId);

  // Modal state
  const [changeStaffModal, setChangeStaffModal] = useState({
    isOpen: false,
    enrollmentId: null,
    currentStaff: null,
    serviceName: null,
    serviceType: null,
  });

  const [deactivateModal, setDeactivateModal] = useState({
    isOpen: false,
    enrollmentId: null,
    serviceName: null,
  });

  const [reactivateModal, setReactivateModal] = useState({
    isOpen: false,
    enrollmentId: null,
    serviceName: null,
    serviceType: null,
  });

  // Show/hide inactive services
  const [showInactive, setShowInactive] = useState(false);

  // Refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Staff photos - cached to avoid redundant Firestore reads on every student click
  const queryClient = useQueryClient();

  const staffIds = useMemo(() => {
    if (!activeEnrollments || activeEnrollments.length === 0) return [];
    return [...new Set(
      activeEnrollments
        .filter(e => e.currentStaff?.staffId)
        .map(e => e.currentStaff.staffId)
    )].sort();
  }, [activeEnrollments]);

  const { data: staffPhotos = {} } = useQuery({
    queryKey: ['staffPhotos', ...staffIds],
    queryFn: async () => {
      // Check existing teacher/therapist caches first to avoid redundant reads
      const cachedTeachers = queryClient.getQueryData(QUERY_KEYS.users('teacher')) || [];
      const cachedTherapists = queryClient.getQueryData(QUERY_KEYS.users('therapist')) || [];
      const allCached = [...cachedTeachers, ...cachedTherapists];

      const photosMap = {};
      const uncachedIds = [];

      for (const id of staffIds) {
        const found = allCached.find(s => s.uid === id || s.id === id);
        if (found?.profilePhoto) {
          photosMap[id] = found.profilePhoto;
        } else if (!found) {
          uncachedIds.push(id);
        }
      }

      // Only fetch staff not already in cache
      if (uncachedIds.length > 0) {
        const fetched = await userService.getStaffByIds(uncachedIds);
        fetched.forEach(staff => {
          if (staff.profilePhoto) {
            photosMap[staff.uid] = staff.profilePhoto;
          }
        });
      }

      return photosMap;
    },
    enabled: staffIds.length > 0,
    ...QUERY_OPTIONS.semiStatic, // 30-min stale, 12-hour cache
  });

  // Handlers
  const handleChangeStaff = (enrollmentId, currentStaff) => {
    const enrollment = activeEnrollments.find(e => e.enrollmentId === enrollmentId);
    setChangeStaffModal({
      isOpen: true,
      enrollmentId,
      currentStaff,
      serviceName: enrollment?.serviceName,
      serviceType: enrollment?.serviceType,
    });
  };

  const handleDeactivate = (enrollmentId) => {
    const enrollment = activeEnrollments.find(e => e.enrollmentId === enrollmentId);
    setDeactivateModal({
      isOpen: true,
      enrollmentId,
      serviceName: enrollment?.serviceName,
    });
  };

  const handleReactivate = (enrollmentId) => {
    const enrollment = inactiveEnrollments.find(e => e.enrollmentId === enrollmentId);
    setReactivateModal({
      isOpen: true,
      enrollmentId,
      serviceName: enrollment?.serviceName,
      serviceType: enrollment?.serviceType,
    });
  };

  const handleChangeStaffSubmit = async (newStaff, reason) => {
    const result = await changeStaff(changeStaffModal.enrollmentId, newStaff, reason);
    if (result.success) {
      setChangeStaffModal({ isOpen: false, enrollmentId: null, currentStaff: null, serviceName: null, serviceType: null });
    }
    return result;
  };

  const handleDeactivateSubmit = async (reason) => {
    const result = await deactivateService(deactivateModal.enrollmentId, reason);
    if (result.success) {
      setDeactivateModal({ isOpen: false, enrollmentId: null, serviceName: null });
    }
    return result;
  };

  const handleReactivateSubmit = async (newStaff) => {
    const result = await reactivateService(reactivateModal.enrollmentId, newStaff);
    if (result.success) {
      setReactivateModal({ isOpen: false, enrollmentId: null, serviceName: null, serviceType: null });
    }
    return result;
  };

  // Handler for clicking staff avatar in the summary section
  const handleStaffClick = (staff) => {
    if (!staff) return;

    // Construct the state to pass
    const navigationState = { 
      selectedStaffId: staff.staffId,
      returnTo: location.pathname, // e.g. /admin/StudentProfile
      returnState: { studentId: childId } // Pass childId so StudentProfile loads correct student
    };

    if (staff.staffRole === 'teacher') {
      navigate(ROUTES.ADMIN.MANAGE_TEACHERS, { state: navigationState });
    } else if (staff.staffRole === 'therapist') {
      navigate(ROUTES.ADMIN.MANAGE_THERAPISTS, { state: navigationState });
    }
  };

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refreshData();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshData, isRefreshing]);

  if (isLoading) {
    return <Loading variant="compact" message="Loading services" showBrand={false} />;
  }

  if (error) {
    return (
      <div className="se-panel__error">
        <p>Error loading services: {error}</p>
      </div>
    );
  }

  // ============ PRIVACY FILTER: Staff can only see their own services ============
  const filterEnrollmentsByRole = (enrollments) => {
    // Admins and parents see everything
    if (!viewerRole || viewerRole === 'admin' || viewerRole === 'super_admin' || viewerRole === 'parent') {
      return enrollments;
    }

    // Staff (teacher/therapist) only see services where they are the assigned staff
    if ((viewerRole === 'teacher' || viewerRole === 'therapist') && viewerId) {
      return enrollments.filter(enrollment => {
        // Check if current viewer is the assigned staff for this service
        const isAssignedStaff = enrollment.currentStaff?.staffId === viewerId;
        return isAssignedStaff;
      });
    }

    return enrollments;
  };

  const filteredActiveEnrollments = filterEnrollmentsByRole(activeEnrollments);
  const filteredInactiveEnrollments = filterEnrollmentsByRole(inactiveEnrollments);

  const hasActiveServices = filteredActiveEnrollments.length > 0;
  const hasInactiveServices = filteredInactiveEnrollments.length > 0;

  // Group active enrollments by service type
  const therapyServices = filteredActiveEnrollments.filter(e => e.serviceType === 'Therapy');
  const groupServices = filteredActiveEnrollments.filter(e => e.serviceType === 'Class');

  return (
    <div className="se-panel">
      {/* Active Services Section */}
      <div className="se-panel__section">
        <div className="se-panel__header">
          <h2 className="se-panel__title">
            Active Services
            <span className="se-panel__count">{filteredActiveEnrollments.length}</span>
          </h2>
          <div className="se-panel__header-actions">
            <span className="se-panel__refresh-hint">Not seeing updates? Click refresh</span>
            <button
              className="se-panel__refresh-btn"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh services"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={isRefreshing ? 'se-panel__refresh-spin' : ''}
              >
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>
            {!isReadOnly && onAddService && (
              <button
                className="se-panel__add-btn"
                onClick={onAddService}
                disabled={isMutating}
              >
                + Add Service
              </button>
            )}
          </div>
        </div>

        {hasActiveServices ? (
          <div className="se-panel__services-container">
            {/* Therapy Services */}
            {therapyServices.length > 0 && (
              <div className="se-panel__service-group">
                <h3 className="se-panel__group-label">Therapy Services</h3>
                <div className="se-panel__grid">
                  {therapyServices.map((enrollment) => (
                    <ServiceCard
                      key={enrollment.enrollmentId}
                      enrollment={enrollment}
                      onChangeStaff={handleChangeStaff}
                      onDeactivate={handleDeactivate}
                      onServiceClick={onServiceClick}
                      isSelected={selectedService === enrollment.serviceName}
                      isReadOnly={isReadOnly}
                      staffPhotos={staffPhotos}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Divider between groups */}
            {therapyServices.length > 0 && groupServices.length > 0 && (
              <div className="se-panel__divider" />
            )}

            {/* Group Classes */}
            {groupServices.length > 0 && (
              <div className="se-panel__service-group">
                <h3 className="se-panel__group-label">Group Classes</h3>
                <div className="se-panel__grid">
                  {groupServices.map((enrollment) => (
                    <ServiceCard
                      key={enrollment.enrollmentId}
                      enrollment={enrollment}
                      onChangeStaff={handleChangeStaff}
                      onDeactivate={handleDeactivate}
                      onServiceClick={onServiceClick}
                      isSelected={selectedService === enrollment.serviceName}
                      isReadOnly={isReadOnly}
                      staffPhotos={staffPhotos}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="se-panel__empty">
            <p>No active services enrolled</p>
            {!isReadOnly && onAddService && (
              <button
                className="se-panel__empty-btn"
                onClick={onAddService}
              >
                Add First Service
              </button>
            )}
          </div>
        )}
      </div>

      {/* Inactive Services Section */}
      {hasInactiveServices && (
        <div className="se-panel__section se-panel__section--inactive">
          <button
            className="se-panel__inactive-toggle"
            onClick={() => setShowInactive(!showInactive)}
          >
            <span>
              Inactive Services
              <span className="se-panel__count se-panel__count--muted">
                {filteredInactiveEnrollments.length}
              </span>
            </span>
            <span className="se-panel__toggle-arrow">
              {showInactive ? '▲' : '▼'}
            </span>
          </button>

          {showInactive && (
            <div className="se-panel__grid se-panel__grid--inactive">
              {filteredInactiveEnrollments.map((enrollment) => (
                <ServiceCard
                  key={enrollment.enrollmentId}
                  enrollment={enrollment}
                  onReactivate={handleReactivate}
                  isReadOnly={isReadOnly}
                  isInactive={true}
                  staffPhotos={staffPhotos}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Staff Summary (Quick View) - Only show for admins who see all services */}
      {/* Note: Parents see the dedicated CurrentTeamSection with full credentials instead */}
      {hasActiveServices && (!viewerRole || viewerRole === 'admin' || viewerRole === 'super_admin') && (
        <div className="se-panel__summary">
          <h3 className="se-panel__summary-title">Current Team</h3>
          <div className="se-panel__avatars">
            {/* Deduplicate staff by staffId */}
            {(() => {
              const uniqueStaff = [];
              const seenIds = new Set();

              filteredActiveEnrollments
                .filter(e => e.currentStaff)
                .forEach((enrollment) => {
                  const staffId = enrollment.currentStaff.staffId;
                  if (!seenIds.has(staffId)) {
                    seenIds.add(staffId);
                    uniqueStaff.push(enrollment.currentStaff);
                  }
                });

              return uniqueStaff.map((staff) => {
                const nameParts = staff.staffName?.split(' ') || ['?'];
                const initials = nameParts.length >= 2
                  ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`
                  : nameParts[0][0] || '?';
                const photoUrl = staffPhotos[staff.staffId];

                return (
                  <div
                    key={staff.staffId}
                    className="se-panel__avatar-item"
                    title={`${staff.staffName} (Click to view profile)`}
                    onClick={() => handleStaffClick(staff)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={`se-panel__avatar-banner ${staff.staffRole === 'therapist' ? 'se-panel__avatar-banner--therapist' : 'se-panel__avatar-banner--teacher'}`} />
                    <div className="se-panel__avatar-content">
                      <div className={`se-panel__avatar ${staff.staffRole === 'therapist' ? 'se-panel__avatar--therapist' : 'se-panel__avatar--teacher'}`}>
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={staff.staffName}
                            className="se-panel__avatar-img"
                          />
                        ) : (
                          <span className="se-panel__avatar-initials">{initials.toUpperCase()}</span>
                        )}
                      </div>
                      <span className="se-panel__avatar-name">
                        {staff.staffName}
                      </span>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Modals */}
      <ChangeStaffModal
        isOpen={changeStaffModal.isOpen}
        onClose={() => setChangeStaffModal({ isOpen: false, enrollmentId: null, currentStaff: null, serviceName: null, serviceType: null })}
        onSubmit={handleChangeStaffSubmit}
        currentStaff={changeStaffModal.currentStaff}
        serviceName={changeStaffModal.serviceName}
        serviceType={changeStaffModal.serviceType}
        removalReasons={STAFF_REMOVAL_REASONS}
        isSubmitting={isMutating}
      />

      <DeactivateServiceModal
        isOpen={deactivateModal.isOpen}
        onClose={() => setDeactivateModal({ isOpen: false, enrollmentId: null, serviceName: null })}
        onSubmit={handleDeactivateSubmit}
        serviceName={deactivateModal.serviceName}
        deactivationReasons={SERVICE_DEACTIVATION_REASONS}
        isSubmitting={isMutating}
      />

      <ReactivateServiceModal
        isOpen={reactivateModal.isOpen}
        onClose={() => setReactivateModal({ isOpen: false, enrollmentId: null, serviceName: null, serviceType: null })}
        onSubmit={handleReactivateSubmit}
        serviceName={reactivateModal.serviceName}
        serviceType={reactivateModal.serviceType}
        isSubmitting={isMutating}
      />
    </div>
  );
};

export default ServiceEnrollmentsPanel;