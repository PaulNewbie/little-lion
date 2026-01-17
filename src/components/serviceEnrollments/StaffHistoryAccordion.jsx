// src/components/serviceEnrollments/StaffHistoryAccordion.jsx
// Collapsible list of past staff members for a service enrollment

import React from 'react';
import './ServiceEnrollments.css';

/**
 * StaffHistoryAccordion - Displays historical staff records
 *
 * @param {array} history - Array of staff history records
 */
const StaffHistoryAccordion = ({ history = [] }) => {
  if (!history || history.length === 0) {
    return (
      <div className="staff-history__empty">
        No staff history available
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDuration = (days) => {
    if (!days || days < 1) return 'Less than a day';
    if (days === 1) return '1 day';
    if (days < 30) return `${days} days`;
    if (days < 365) {
      const months = Math.floor(days / 30);
      return months === 1 ? '1 month' : `${months} months`;
    }
    const years = Math.floor(days / 365);
    const remainingMonths = Math.floor((days % 365) / 30);
    if (remainingMonths === 0) {
      return years === 1 ? '1 year' : `${years} years`;
    }
    return `${years}y ${remainingMonths}m`;
  };

  const getReasonLabel = (reason) => {
    const reasonMap = {
      'staff_transferred': 'Staff Transferred',
      'scheduling_conflict': 'Scheduling Conflict',
      'staff_resigned': 'Staff Resigned',
      'parent_request': 'Parent Request',
      'admin_decision': 'Administrative Decision',
      'service_deactivated': 'Service Deactivated',
      'other': 'Other',
    };
    return reasonMap[reason] || reason || 'Not specified';
  };

  return (
    <div className="staff-history">
      {history.map((record, index) => (
        <div key={record.historyId || index} className="staff-history__item">
          <div className="staff-history__row">
            <div className="staff-history__main">
              <span className="staff-history__name">{record.staffName}</span>
              <span className="staff-history__role">
                {record.staffRole === 'therapist' ? 'Therapist' : 'Teacher'}
              </span>
            </div>
            <div className="staff-history__duration">
              {formatDuration(record.durationDays)}
            </div>
          </div>

          <div className="staff-history__dates">
            <span>{formatDate(record.assignedAt)}</span>
            <span className="staff-history__arrow">→</span>
            <span>{formatDate(record.removedAt)}</span>
          </div>

          {record.removalReason && (
            <div className="staff-history__reason">
              <span className="staff-history__reason-label">Reason:</span>
              <span className="staff-history__reason-value">
                {getReasonLabel(record.removalReason)}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default StaffHistoryAccordion;
