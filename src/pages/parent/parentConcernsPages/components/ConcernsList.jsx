import React from 'react';
import PropTypes from 'prop-types';
import './ConcernsList.css';

/**
 * Displays the list of concerns in the left column
 */ 
const ConcernsList = ({ 
  concerns, 
  selectedConcernId, 
  onSelectConcern, 
  onNewConcern,
  isHidden 
}) => {
  const getStatusClass = (status) => {
    if (status === 'waiting_for_parent') return 'waiting';
    if (status === 'waiting_for_staff') return 'pending';
    return '';
  };

  return (
    <section className={`pc-list-column ${isHidden ? 'hidden' : ''}`}>
      <header className="pc-column-header">
        <div>
          <h2 className="pc-header-title">Concerns</h2>
          <span className="pc-sub-text">{concerns.length} Items</span>
        </div>
        <button 
          onClick={onNewConcern} 
          className="pc-compose-btn" 
          title="New Concern"
          aria-label="Compose new concern"
        >
          +
        </button>
      </header>

      <div className="pc-scroll-area">
        {concerns.length === 0 ? (
          <EmptyState onNewConcern={onNewConcern} />
        ) : (
          concerns.map(concern => (
            <ConcernCard
              key={concern.id}
              concern={concern}
              isActive={selectedConcernId === concern.id}
              statusClass={getStatusClass(concern.status)}
              onSelect={() => onSelectConcern(concern)}
            />
          ))
        )}
      </div>
    </section>
  );
};

/**
 * Individual concern card in the list
 */
const ConcernCard = ({ concern, isActive, statusClass, onSelect }) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
    }
  };

  // Format createdAt safely
  const formatDate = (ts) => {
    if (!ts) return '';
    return ts.toDate ? ts.toDate().toLocaleDateString() : new Date(ts).toLocaleDateString();
  };

  return (
    <div
      onClick={onSelect}
      className={`pc-concern-card ${isActive ? 'active' : ''}`}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="pc-card-header">
        <span className="pc-card-subject">{concern.subject}</span>
        <span className={`pc-card-status ${statusClass}`}>
          {concern.status.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="pc-card-meta">
        <span className='pc-card-createdBy'>Created by: {concern.createdByUserName || "N/A"}</span>
        <span className="pc-card-child">Child: {concern.childName}</span>
        <span>{formatDate(concern.createdAt)}</span>
      </div>
    </div>
  );
};


/**
 * Empty state when no concerns exist
 */
const EmptyState = ({ onNewConcern }) => (
  <div className="pc-empty-state">
    <div className="pc-empty-icon">📭</div>
    <p>No concerns yet</p>
    <button onClick={onNewConcern} className="pc-secondary-btn">
      Raise a Concern
    </button>
  </div>
);

ConcernsList.propTypes = {
  concerns: PropTypes.array.isRequired,
  selectedConcernId: PropTypes.string,
  onSelectConcern: PropTypes.func.isRequired,
  onNewConcern: PropTypes.func.isRequired,
  isHidden: PropTypes.bool
};

ConcernCard.propTypes = {
  concern: PropTypes.shape({
    id: PropTypes.string.isRequired,
    subject: PropTypes.string.isRequired,
    childName: PropTypes.string.isRequired,
    createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    status: PropTypes.string.isRequired
  }).isRequired,
  isActive: PropTypes.bool,
  statusClass: PropTypes.string,
  onSelect: PropTypes.func.isRequired
};

EmptyState.propTypes = {
  onNewConcern: PropTypes.func.isRequired
};

export default ConcernsList;
