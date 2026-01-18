// src/components/serviceEnrollments/ServiceEnrollmentsPanel.jsx
// Container panel for displaying and managing all service enrollments

import React, { useState } from 'react';
import ServiceCard from './ServiceCard';
import ChangeStaffModal from './ChangeStaffModal';
import DeactivateServiceModal from './DeactivateServiceModal';
import ReactivateServiceModal from './ReactivateServiceModal';
import { useServiceEnrollments } from '../../hooks/useServiceEnrollments';
import Loading from '../common/Loading';
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
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Staff Summary (Quick View) - Only show for admins/parents who see all services */}
      {hasActiveServices && (!viewerRole || viewerRole === 'admin' || viewerRole === 'super_admin' || viewerRole === 'parent') && (
        <div className="se-panel__summary">
          <h3 className="se-panel__summary-title">Current Team</h3>
          <div className="se-panel__avatars">
            {filteredActiveEnrollments
              .filter(e => e.currentStaff)
              .map((enrollment) => (
                <div
                  key={enrollment.enrollmentId}
                  className="se-panel__avatar-item"
                  title={`${enrollment.currentStaff.staffName} - ${enrollment.serviceName}`}
                >
                  <div className="se-panel__avatar">
                    {enrollment.currentStaff.staffRole === 'therapist' ? '👨‍⚕️' : '👩‍🏫'}
                  </div>
                  <span className="se-panel__avatar-name">
                    {enrollment.currentStaff.staffName.split(' ')[0]}
                  </span>
                </div>
              ))}
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
