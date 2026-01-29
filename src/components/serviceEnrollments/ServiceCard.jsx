// src/components/serviceEnrollments/ServiceCard.jsx
// Expandable card displaying a service enrollment with current staff and history

import React, { useState } from 'react';
import StaffCard from './StaffCard';
import StaffHistoryAccordion from './StaffHistoryAccordion';
import { SERVICE_ENROLLMENT_STATUS } from '../../utils/constants';
import './ServiceEnrollments.css';

/**
 * ServiceCard - Displays a single service enrollment with staff info and history
 *
 * @param {object} enrollment - The service enrollment object
 * @param {function} onChangeStaff - Callback when "Change Staff" is clicked
 * @param {function} onDeactivate - Callback when "Disable Service" is clicked
 * @param {function} onReactivate - Callback when "Re-enable" is clicked
 * @param {function} onServiceClick - Callback when service is clicked (for activity view)
 * @param {boolean} isSelected - Whether this service is currently selected
 * @param {boolean} isReadOnly - If true, hides action buttons (for parent view)
 * @param {boolean} isInactive - If true, renders in inactive/muted style
 * @param {object} staffPhotos - Map of staffId to profile photo URL
 */
const ServiceCard = ({
  enrollment,
  onChangeStaff,
  onDeactivate,
  onReactivate,
  onServiceClick,
  isSelected = false,
  isReadOnly = false,
  isInactive = false,
  staffPhotos = {},
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHistoryAccordion, setShowHistoryAccordion] = useState(false);

  if (!enrollment) return null;

  const {
    enrollmentId,
    serviceName,
    serviceType,
    status,
    currentStaff,
    staffHistory = [],
    enrolledAt,
    statusChangedAt,
    statusChangeReason,
    frequency,
    lastActivityDate,
  } = enrollment;

  const isActive = status === SERVICE_ENROLLMENT_STATUS.ACTIVE;
  const hasHistory = staffHistory.length > 0;

  // Service type icons as SVG
  const TherapyIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  );

  const ClassIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );

  const serviceIcon = serviceType === 'Therapy' ? <TherapyIcon /> : <ClassIcon />;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleCardClick = () => {
    if (onServiceClick && isActive) {
      onServiceClick(serviceName);
    }
  };

  const handleExpandToggle = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className={`se-card ${isActive ? 'se-card--active' : 'se-card--inactive'} ${
        isSelected ? 'se-card--selected' : ''
      } ${isExpanded ? 'se-card--expanded' : ''}`}
    >
      {/* Card Header */}
      <div
        className="se-card__header"
        onClick={handleCardClick}
        style={{ cursor: isActive && onServiceClick ? 'pointer' : 'default' }}
      >
        <div className="se-card__header-left">
          <span className="se-card__icon">{serviceIcon}</span>
          <div className="se-card__title-group">
            <h3 className="se-card__title">{serviceName}</h3>
            {frequency && <span className="se-card__frequency">{frequency}</span>}
          </div>
        </div>

        <div className="se-card__header-right">
          <span className={`se-card__status-badge ${isActive ? 'active' : 'inactive'}`}>
            <span className="se-card__status-dot" />
            {isActive ? 'Active' : 'Inactive'}
          </span>

          <button
            className="se-card__expand-btn"
            onClick={handleExpandToggle}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="se-card__body">
          {/* Current Staff Section (Active Services Only) */}
          {isActive && currentStaff && (
            <div className="se-card__section">
              <div className="se-card__section-header">
                <span className="se-card__section-label">Current Staff</span>
                {!isReadOnly && (
                  <button
                    className="se-card__action-btn se-card__action-btn--secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChangeStaff?.(enrollmentId, currentStaff);
                    }}
                  >
                    Change Staff
                  </button>
                )}
              </div>
              <StaffCard
                staff={currentStaff}
                isCurrent={true}
                serviceName={serviceName}
                photoUrl={staffPhotos[currentStaff?.staffId]}
              />
            </div>
          )}

          {/* Inactive Service Info */}
          {!isActive && (
            <div className="se-card__inactive-info">
              <div className="se-card__inactive-row">
                <span className="se-card__label">Disabled:</span>
                <span>{formatDate(statusChangedAt)}</span>
              </div>
              {statusChangeReason && (
                <div className="se-card__inactive-row">
                  <span className="se-card__label">Reason:</span>
                  <span>{statusChangeReason}</span>
                </div>
              )}
              {staffHistory.length > 0 && (
                <div className="se-card__inactive-row">
                  <span className="se-card__label">Last Staff:</span>
                  <span>
                    {staffHistory[0]?.staffName} ({staffHistory[0]?.durationDays || 0} days)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Staff History Accordion */}
          {hasHistory && (
            <div className="se-card__section">
              <button
                className="se-card__history-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowHistoryAccordion(!showHistoryAccordion);
                }}
              >
                <span>Past Staff ({staffHistory.length})</span>
                <span className="se-card__history-arrow">
                  {showHistoryAccordion ? '▲' : '▼'}
                </span>
              </button>

              {showHistoryAccordion && (
                <StaffHistoryAccordion history={staffHistory} />
              )}
            </div>
          )}

          {/* Enrollment Meta */}
          <div className="se-card__meta">
            <span className="se-card__meta-item">
              Enrolled: {formatDate(enrolledAt)}
            </span>
            {lastActivityDate && (
              <span className="se-card__meta-item">
                Last Activity: {formatDate(lastActivityDate)}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          {!isReadOnly && (
            <div className="se-card__actions">
              {isActive ? (
                <button
                  className="se-card__action-btn se-card__action-btn--danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeactivate?.(enrollmentId);
                  }}
                >
                  Disable Service
                </button>
              ) : (
                <button
                  className="se-card__action-btn se-card__action-btn--primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReactivate?.(enrollmentId);
                  }}
                >
                  Re-enable Service
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Collapsed Preview (shows staff name when not expanded) */}
      {!isExpanded && isActive && currentStaff && (
        <div className="se-card__preview">
          <span className="se-card__preview-staff">
            {currentStaff.staffName}
          </span>
          {hasHistory && (
            <span className="se-card__preview-history">
              +{staffHistory.length} past
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ServiceCard;
