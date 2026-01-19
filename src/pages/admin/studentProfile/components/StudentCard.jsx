import React from 'react';

/**
 * StudentCard - A single student card in the grid
 */
const StudentCard = ({ student, onSelect }) => {
  return (
    <div
      className="sp-card"
      onClick={() => onSelect(student)}
    >
      <div className="sp-card-image-box">
        {student.photoUrl ? (
          <img
            src={student.photoUrl}
            className="sp-photo"
            alt=""
          />
        ) : (
          <div className="sp-photo-placeholder">
            {student.firstName[0]}
          </div>
        )}
      </div>
      <div className="sp-card-body">
        <h3 className="sp-name">
          {student.firstName} {student.lastName}
        </h3>
      </div>
    </div>
  );
};

export default StudentCard;
