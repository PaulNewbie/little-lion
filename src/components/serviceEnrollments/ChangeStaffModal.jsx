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
 * @param {object} staffPhotos - Map of staffId to profile photo URL
 */

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return parts[0]?.[0]?.toUpperCase() || '?';
};

const StaffAvatar = ({ name, photoUrl, size = 44, role }) => (
  <div
    className={`csm-avatar ${!photoUrl ? (role === 'therapist' ? 'csm-avatar--therapist' : 'csm-avatar--teacher') : ''}`}
    style={{ width: size, height: size, minWidth: size }}
  >
    {photoUrl ? (
      <img src={photoUrl} alt={name} />
    ) : (
      <span className="csm-avatar__initials">{getInitials(name)}</span>
    )}
  </div>
);

const ChangeStaffModal = ({
  isOpen,
  onClose,
  onSubmit,
  currentStaff,
  serviceName,
  serviceType,
  removalReasons = [],
  isSubmitting = false,
  staffPhotos = {},
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

  const selectedStaffMember = availableStaff.find(
    (s) => (s.uid || s.id) === selectedStaffId
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
      <form onSubmit={handleSubmit} className="csm-form">
        {/* Service Badge */}
        <div className="csm-service-badge">
          {serviceType === 'Therapy' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          )}
          <span>{serviceName}</span>
          <span className="csm-service-badge__type">{serviceType}</span>
        </div>

        {/* Transfer Visual: Current → New */}
        <div className="csm-transfer">
          {/* Current Staff Card */}
          <div className="csm-transfer__card csm-transfer__card--current">
            <div className="csm-transfer__label">Current</div>
            <StaffAvatar
              name={currentStaff?.staffName}
              photoUrl={staffPhotos[currentStaff?.staffId]}
              size={52}
              role={currentStaff?.staffRole}
            />
            <div className="csm-transfer__name">{currentStaff?.staffName || 'Unknown'}</div>
            <div className="csm-transfer__role">
              {currentStaff?.staffRole === 'therapist' ? 'Therapist' : 'Teacher'}
            </div>
          </div>

          {/* Arrow */}
          <div className="csm-transfer__arrow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </div>

          {/* New Staff Card */}
          <div className={`csm-transfer__card csm-transfer__card--new ${selectedStaffMember ? 'csm-transfer__card--selected' : ''}`}>
            <div className="csm-transfer__label">New</div>
            {selectedStaffMember ? (
              <>
                <StaffAvatar
                  name={`${selectedStaffMember.firstName} ${selectedStaffMember.lastName}`}
                  photoUrl={selectedStaffMember.profilePhoto || staffPhotos[selectedStaffMember.uid || selectedStaffMember.id]}
                  size={52}
                  role={serviceType === 'Therapy' ? 'therapist' : 'teacher'}
                />
                <div className="csm-transfer__name">
                  {selectedStaffMember.firstName} {selectedStaffMember.lastName}
                </div>
                <div className="csm-transfer__role">
                  {serviceType === 'Therapy' ? 'Therapist' : 'Teacher'}
                </div>
              </>
            ) : (
              <>
                <div className="csm-avatar csm-avatar--empty" style={{ width: 52, height: 52, minWidth: 52 }}>
                  <span className="csm-avatar__initials">?</span>
                </div>
                <div className="csm-transfer__name csm-transfer__name--placeholder">Select below</div>
              </>
            )}
          </div>
        </div>

        {/* Staff Selection List */}
        <div className="csm-section">
          <label className="csm-section__label">Select New Staff Member</label>
          {loadingStaff ? (
            <div className="csm-staff-list__loading">Loading available staff...</div>
          ) : filteredStaff.length === 0 ? (
            <div className="csm-staff-list__empty">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              No other staff members available for this service type.
            </div>
          ) : (
            <div className="csm-staff-list">
              {filteredStaff.map((staff) => {
                const id = staff.uid || staff.id;
                const isSelected = selectedStaffId === id;
                const fullName = `${staff.firstName} ${staff.lastName}`;
                return (
                  <button
                    type="button"
                    key={id}
                    className={`csm-staff-option ${isSelected ? 'csm-staff-option--selected' : ''}`}
                    onClick={() => setSelectedStaffId(id)}
                  >
                    <StaffAvatar
                      name={fullName}
                      photoUrl={staff.profilePhoto || staffPhotos[id]}
                      size={40}
                      role={serviceType === 'Therapy' ? 'therapist' : 'teacher'}
                    />
                    <div className="csm-staff-option__info">
                      <div className="csm-staff-option__name">{fullName}</div>
                      {staff.specializations?.length > 0 && (
                        <div className="csm-staff-option__spec">
                          {staff.specializations.slice(0, 2).join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="csm-staff-option__check">
                      {isSelected && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Reason for Change */}
        <div className="csm-section">
          <label className="csm-section__label" htmlFor="removalReason">
            Reason for Change
          </label>
          <select
            id="removalReason"
            className="csm-select"
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

        {/* Custom Reason */}
        {removalReason === 'other' && (
          <div className="csm-section">
            <label className="csm-section__label" htmlFor="customReason">
              Please specify
            </label>
            <input
              id="customReason"
              type="text"
              className="csm-input"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Enter reason..."
              disabled={isSubmitting}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="csm-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="csm-actions">
          <button
            type="button"
            className="csm-btn csm-btn--cancel"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="csm-btn csm-btn--primary"
            disabled={isSubmitting || loadingStaff || filteredStaff.length === 0}
          >
            {isSubmitting ? 'Saving...' : 'Confirm Change'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ChangeStaffModal;
