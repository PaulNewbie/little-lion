// src/components/serviceEnrollments/StaffCard.jsx
// Displays staff member info within a service enrollment

import React from 'react';
import './ServiceEnrollments.css';

/**
 * StaffCard - Displays a staff member's info
 *
 * @param {object} staff - Staff member data
 * @param {string} staff.staffId - Staff user ID
 * @param {string} staff.staffName - Full name
 * @param {string} staff.staffRole - 'teacher' or 'therapist'
 * @param {string} staff.assignedAt - ISO date string
 * @param {string} staff.assignedBy - User ID who made assignment
 * @param {boolean} isCurrent - Whether this is the current staff (vs historical)
 * @param {string} serviceName - Name of the service (for context)
 * @param {string} photoUrl - Optional profile photo URL
 */
const StaffCard = ({
  staff,
  isCurrent = true,
  serviceName,
  photoUrl,
}) => {
  if (!staff) return null;

  const {
    staffName,
    staffRole,
    assignedAt,
  } = staff;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'therapist':
        return 'Therapist';
      case 'teacher':
        return 'Teacher';
      default:
        return role || 'Staff';
    }
  };

  const getRoleIcon = (role) => {
    return role === 'therapist' ? '👨‍⚕️' : '👩‍🏫';
  };

  return (
    <div className={`staff-card ${isCurrent ? 'staff-card--current' : 'staff-card--past'}`}>
      <div className="staff-card__avatar">
        {photoUrl ? (
          <img src={photoUrl} alt={staffName} className="staff-card__photo" />
        ) : (
          <span className="staff-card__avatar-icon">{getRoleIcon(staffRole)}</span>
        )}
      </div>

      <div className="staff-card__info">
        <h4 className="staff-card__name">{staffName}</h4>
        <div className="staff-card__meta">
          <span className="staff-card__role">
            {getRoleLabel(staffRole)}
          </span>
          <span className="staff-card__separator">•</span>
          <span className="staff-card__date">
            {isCurrent ? 'Since' : 'Assigned'} {formatDate(assignedAt)}
          </span>
        </div>
      </div>

      {isCurrent && (
        <div className="staff-card__badge">
          <span className="staff-card__status-dot staff-card__status-dot--active" />
          Active
        </div>
      )}
    </div>
  );
};

export default StaffCard;
