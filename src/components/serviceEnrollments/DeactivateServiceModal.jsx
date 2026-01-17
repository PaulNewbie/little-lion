// src/components/serviceEnrollments/DeactivateServiceModal.jsx
// Modal for deactivating a service enrollment

import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import './ServiceEnrollments.css';

/**
 * DeactivateServiceModal - Modal for deactivating a service with reason
 *
 * @param {boolean} isOpen - Whether the modal is open
 * @param {function} onClose - Callback to close the modal
 * @param {function} onSubmit - Callback with (reason)
 * @param {string} serviceName - Name of the service being deactivated
 * @param {array} deactivationReasons - Array of reason options
 * @param {boolean} isSubmitting - Whether submission is in progress
 */
const DeactivateServiceModal = ({
  isOpen,
  onClose,
  onSubmit,
  serviceName,
  deactivationReasons = [],
  isSubmitting = false,
}) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedReason('');
      setCustomReason('');
      setConfirmText('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!selectedReason) {
      setError('Please select a reason for deactivation');
      return;
    }

    if (selectedReason === 'other' && !customReason.trim()) {
      setError('Please specify a reason');
      return;
    }

    if (confirmText.toLowerCase() !== 'disable') {
      setError('Please type "disable" to confirm');
      return;
    }

    const finalReason = selectedReason === 'other' ? customReason : selectedReason;

    const reasonLabel = selectedReason === 'other'
      ? customReason
      : deactivationReasons.find(r => r.value === selectedReason)?.label || selectedReason;

    const result = await onSubmit(reasonLabel);
    if (!result.success) {
      setError(result.error || 'Failed to deactivate service');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Disable Service"
      size="medium"
    >
      <form onSubmit={handleSubmit} className="se-modal-form">
        {/* Warning */}
        <div className="se-modal-form__warning">
          <span className="se-modal-form__warning-icon">⚠️</span>
          <div>
            <p className="se-modal-form__warning-title">
              You are about to disable this service
            </p>
            <p className="se-modal-form__warning-text">
              The student will no longer receive <strong>{serviceName}</strong>.
              All historical data will be preserved for records.
            </p>
          </div>
        </div>

        {/* Deactivation Reason */}
        <div className="se-modal-form__section">
          <label className="se-modal-form__label" htmlFor="deactivationReason">
            Reason for Deactivation *
          </label>
          <select
            id="deactivationReason"
            className="se-modal-form__select"
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            disabled={isSubmitting}
          >
            <option value="">Select reason</option>
            {deactivationReasons.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </select>
        </div>

        {/* Custom Reason (if "Other" selected) */}
        {selectedReason === 'other' && (
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

        {/* Confirmation */}
        <div className="se-modal-form__section">
          <label className="se-modal-form__label" htmlFor="confirmText">
            Type "disable" to confirm *
          </label>
          <input
            id="confirmText"
            type="text"
            className="se-modal-form__input"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder='Type "disable"'
            disabled={isSubmitting}
            autoComplete="off"
          />
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
            className="se-modal-form__btn se-modal-form__btn--danger"
            disabled={isSubmitting || confirmText.toLowerCase() !== 'disable'}
          >
            {isSubmitting ? 'Disabling...' : 'Disable Service'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default DeactivateServiceModal;
