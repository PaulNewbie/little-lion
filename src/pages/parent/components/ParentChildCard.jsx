// src/pages/parent/components/ParentChildCard.jsx
import React from 'react';
import './ParentChildCard.css';

const ParentChildCard = ({ student, onSelect }) => {
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
      <div className="parent-card-image-box">
        {student.photoUrl ? (
          <img
            src={student.photoUrl}
            className="parent-card-photo"
            alt={`${student.firstName} ${student.lastName}`}
          />
        ) : (
          <div className="parent-card-photo-placeholder">
            {student.firstName?.[0]?.toUpperCase() || '?'}
          </div>
        )}
      </div>
      <div className="parent-card-body">
        <h3 className="parent-card-name">
          {student.firstName} {student.lastName}
        </h3>
      </div>
    </div>
  );
};

export default ParentChildCard;
