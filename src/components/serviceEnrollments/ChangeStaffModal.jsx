// src/components/serviceEnrollments/ChangeStaffModal.jsx
// Modal for changing the staff assigned to a service enrollment

import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useStaffForEnrollment } from '../../hooks/useServiceEnrollments';
import './ServiceEnrollments.css';

/**
 * ChangeStaffModal - Modal for selecting a new staff member
 *
 * @param {boolean} isOpen - Whether the modal is open
 * @param {function} onClose - Callback to close the modal
 * @param {function} onSubmit - Callback with (newStaff, reason)
 * @param {object} currentStaff - Current staff member info
 * @param {string} serviceName - Name of the service
 * @param {string} serviceType - 'Therapy' or 'Class'
 * @param {array} removalReasons - Array of reason options
 * @param {boolean} isSubmitting - Whether submission is in progress
 */
const ChangeStaffModal = ({
  isOpen,
  onClose,
  onSubmit,
  currentStaff,
  serviceName,
  serviceType,
  removalReasons = [],
  isSubmitting = false,
}) => {
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [removalReason, setRemovalReason] = useState('');
  const [customReason, setCustomReason] = useState('');
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
      setRemovalReason('');
      setCustomReason('');
      setError(null);
    }
  }, [isOpen]);

  // Filter out current staff from available options
  const filteredStaff = availableStaff.filter(
    (staff) => (staff.uid || staff.id) !== currentStaff?.staffId
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!selectedStaffId) {
      setError('Please select a staff member');
      return;
    }

    if (!removalReason) {
      setError('Please select a reason for the change');
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

    const finalReason = removalReason === 'other' ? customReason : removalReason;

    const result = await onSubmit(newStaff, finalReason);
    if (!result.success) {
      setError(result.error || 'Failed to change staff');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Change Staff Assignment"
      size="medium"
    >
      <form onSubmit={handleSubmit} className="se-modal-form">
        {/* Current Staff Info */}
        <div className="se-modal-form__section">
          <label className="se-modal-form__label">Current Staff</label>
          <div className="se-modal-form__current-staff">
            <span className="se-modal-form__staff-icon">
              {currentStaff?.staffRole === 'therapist' ? '👨‍⚕️' : '👩‍🏫'}
            </span>
            <span className="se-modal-form__staff-name">
              {currentStaff?.staffName || 'Unknown'}
            </span>
          </div>
        </div>

        {/* Service Info */}
        <div className="se-modal-form__info">
          <span className="se-modal-form__service-badge">
            {serviceType === 'Therapy' ? '🧠' : '👥'} {serviceName}
          </span>
        </div>

        {/* New Staff Selection */}
        <div className="se-modal-form__section">
          <label className="se-modal-form__label" htmlFor="newStaff">
            New Staff Member *
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
            {filteredStaff.map((staff) => (
              <option key={staff.uid || staff.id} value={staff.uid || staff.id}>
                {staff.firstName} {staff.lastName}
                {staff.specializations?.length > 0 &&
                  ` (${staff.specializations.slice(0, 2).join(', ')})`
                }
              </option>
            ))}
          </select>
          {filteredStaff.length === 0 && !loadingStaff && (
            <p className="se-modal-form__hint">
              No other staff members available for this service type.
            </p>
          )}
        </div>

        {/* Removal Reason */}
        <div className="se-modal-form__section">
          <label className="se-modal-form__label" htmlFor="removalReason">
            Reason for Change *
          </label>
          <select
            id="removalReason"
            className="se-modal-form__select"
            value={removalReason}
            onChange={(e) => setRemovalReason(e.target.value)}
            disabled={isSubmitting}
          >
            <option value="">Select reason</option>
            {removalReasons.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </select>
        </div>

        {/* Custom Reason (if "Other" selected) */}
        {removalReason === 'other' && (
          <div className="se-modal-form__section">
            <label className="se-modal-form__label" htmlFor="customReason">
              Please specify *
            </label>
            <input
              id="customReason"
              type="text"
              className="se-modal-form__input"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Enter reason..."
              disabled={isSubmitting}
            />
          </div>
        )}

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
            className="se-modal-form__btn se-modal-form__btn--primary"
            disabled={isSubmitting || loadingStaff || filteredStaff.length === 0}
          >
            {isSubmitting ? 'Saving...' : 'Change Staff'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ChangeStaffModal;
