// src/pages/parent/components/ParentChildCard.jsx
/**
 * Enhanced Parent Child Card Component
 * A warm, engaging card design specifically for parents viewing their children
 * Features: Better visual hierarchy, quick stats, smooth animations
 */

import React from 'react';
import './ParentChildCard.css';

const ParentChildCard = ({ student, onSelect }) => {
  // Calculate age from birthday
  const calculateAge = (birthday) => {
    if (!birthday) return null;
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Count active services
  const getActiveServicesCount = () => {
    const enrollments = student.serviceEnrollments || [];
    return enrollments.filter(e => e.status === 'active').length;
  };

  const age = calculateAge(student.birthday);
  const servicesCount = getActiveServicesCount();

  return (
    <div
      className="parent-child-card"
      onClick={() => onSelect(student)}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(student);
        }
      }}
      aria-label={`View ${student.firstName} ${student.lastName}'s profile`}
    >
      {/* Photo Section with Gradient Overlay */}
      <div className="parent-card-photo-wrapper">
        {student.photoUrl ? (
          <img
            src={student.photoUrl}
            alt={`${student.firstName} ${student.lastName}`}
            className="parent-card-photo"
          />
        ) : (
          <div className="parent-card-photo-placeholder">
            <span className="parent-card-initial">
              {student.firstName?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
        )}
        {/* Subtle gradient overlay for text readability */}
        <div className="parent-card-overlay" />
      </div>

      {/* Info Section */}
      <div className="parent-card-content">
        {/* Name */}
        <h3 className="parent-card-name">
          {student.firstName} {student.lastName}
        </h3>

        {/* Nickname (if available) */}
        {student.nickname && (
          <p className="parent-card-nickname">
            "{student.nickname}"
          </p>
        )}

        {/* Quick Stats Row */}
        <div className="parent-card-stats">
          {age !== null && (
            <div className="parent-stat-item">
              <svg className="parent-stat-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2m0 10c2.7 0 5.8 1.29 6 2H6c.23-.72 3.31-2 6-2m0-12C9.79 4 8 5.79 8 8s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 10c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              <span>{age} {age === 1 ? 'year' : 'years'} old</span>
            </div>
          )}

          {servicesCount > 0 && (
            <div className="parent-stat-item">
              <svg className="parent-stat-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm0 4c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 12H6v-1.4c0-2 4-3.1 6-3.1s6 1.1 6 3.1V19z"/>
              </svg>
              <span>{servicesCount} {servicesCount === 1 ? 'service' : 'services'}</span>
            </div>
          )}
        </div>

        {/* View Profile CTA */}
        <div className="parent-card-cta">
          <span>View Profile</span>
          <svg className="parent-card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      </div>

      {/* Decorative corner accent */}
      <div className="parent-card-accent" />
    </div>
  );
};

export default ParentChildCard;
