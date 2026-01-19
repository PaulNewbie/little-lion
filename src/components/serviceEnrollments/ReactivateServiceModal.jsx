// src/components/serviceEnrollments/ReactivateServiceModal.jsx
// Modal for reactivating an inactive service enrollment

import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useStaffForEnrollment } from '../../hooks/useServiceEnrollments';
import './ServiceEnrollments.css';

/**
 * ReactivateServiceModal - Modal for re-enabling an inactive service
 *
 * @param {boolean} isOpen - Whether the modal is open
 * @param {function} onClose - Callback to close the modal
 * @param {function} onSubmit - Callback with (newStaff)
 * @param {string} serviceName - Name of the service being reactivated
 * @param {string} serviceType - 'Therapy' or 'Class'
 * @param {boolean} isSubmitting - Whether submission is in progress
 */
const ReactivateServiceModal = ({
  isOpen,
  onClose,
  onSubmit,
  serviceName,
  serviceType,
  isSubmitting = false,
}) => {
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [error, setError] = useState(null);

  // Fetch available staff for this service type
  const { data: availableStaff = [], isLoading: loadingStaff } = useStaffForEnrollment(
    serviceType,
    serviceName
  );

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedStaffId('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!selectedStaffId) {
      setError('Please select a staff member');
      return;
    }

    const selectedStaffMember = availableStaff.find(
      (s) => (s.uid || s.id) === selectedStaffId
    );

    if (!selectedStaffMember) {
      setError('Selected staff member not found');
      return;
    }

    const newStaff = {
      staffId: selectedStaffMember.uid || selectedStaffMember.id,
      staffName: `${selectedStaffMember.firstName} ${selectedStaffMember.lastName}`,
      staffRole: serviceType === 'Therapy' ? 'therapist' : 'teacher',
    };

    const result = await onSubmit(newStaff);
    if (!result.success) {
      setError(result.error || 'Failed to reactivate service');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Re-enable Service"
      size="medium"
    >
      <form onSubmit={handleSubmit} className="se-modal-form">
        {/* Info */}
        <div className="se-modal-form__info se-modal-form__info--success">
          <span className="se-modal-form__info-icon">✓</span>
          <div>
            <p className="se-modal-form__info-title">
              Re-enabling {serviceName}
            </p>
            <p className="se-modal-form__info-text">
              Please assign a staff member to resume this service.
            </p>
          </div>
        </div>

        {/* Service Badge */}
        <div className="se-modal-form__section">
          <span className="se-modal-form__service-badge se-modal-form__service-badge--large">
            {serviceType === 'Therapy' ? '🧠' : '👥'} {serviceName}
          </span>
        </div>

        {/* Staff Selection */}
        <div className="se-modal-form__section">
          <label className="se-modal-form__label" htmlFor="newStaff">
            Assign Staff Member *
          </label>
          <select
            id="newStaff"
            className="se-modal-form__select"
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            disabled={loadingStaff || isSubmitting}
          >
            <option value="">
              {loadingStaff ? 'Loading staff...' : 'Select staff member'}
            </option>
            {availableStaff.map((staff) => (
              <option key={staff.uid || staff.id} value={staff.uid || staff.id}>
                {staff.firstName} {staff.lastName}
                {staff.specializations?.length > 0 &&
                  ` (${staff.specializations.slice(0, 2).join(', ')})`
                }
              </option>
            ))}
          </select>
          {availableStaff.length === 0 && !loadingStaff && (
            <p className="se-modal-form__hint">
              No staff members available for this service type.
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="se-modal-form__error">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="se-modal-form__actions">
          <button
            type="button"
            className="se-modal-form__btn se-modal-form__btn--cancel"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="se-modal-form__btn se-modal-form__btn--success"
            disabled={isSubmitting || loadingStaff || availableStaff.length === 0}
          >
            {isSubmitting ? 'Enabling...' : 'Re-enable Service'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ReactivateServiceModal;
