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
  isHidden, 
  userRole,
  updateStatus,
  statusFilter,
  onFilterStatusChange
}) => {
  const getStatusClass = (status) => {
    switch (status) {
      case 'pending':
        return 'status-orange';
      case 'ongoing':
        return 'status-blue';
      case 'solved':
        return 'status-green';
      case 'waiting_for_parent':
        return 'status-yellow';
      default:
        return '';
    }
  };


  return (
    <section className={`pc-list-column ${isHidden ? 'hidden' : ''}`}>
      <header className="pc-column-header">
        <div>
          <h2 className="pc-header-title">Concerns</h2>
          <span className="pc-sub-text">{concerns.length} Items</span>
        </div>

        <div className="pc-header-actions">
            <select
              className="pc-filter-dropdown"
              value={statusFilter}
              onChange={(e) => onFilterStatusChange(e.target.value)}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="ongoing">Ongoing</option>
              <option value="solved">Solved</option>
            </select>
           <button 
              onClick={onNewConcern} 
              className="pc-compose-btn" 
              title="New Concern"
              aria-label="Compose new concern"
            >
              +
            </button>
        </div>
       
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
              onStatusChange={updateStatus}   // ✅ NEW
              userRole={userRole} 
            />
          ))
        )}
      </div>

      <button 
          onClick={onNewConcern} 
          className="pc-fab-compose-btn" 
          title="New Concern"
          aria-label="Compose new concern"
        >
          +
      </button>
    </section>
  );
};

/**
 * Individual concern card in the list
 */
const ConcernCard = ({ concern, isActive, statusClass, onSelect, onStatusChange, userRole }) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
    }
  };

 // Format createdAt with full month, day, year, and time
  const formatDateTime = (ts) => {
    if (!ts) return '';
    const dateObj = ts.toDate ? ts.toDate() : new Date(ts);
    const date = dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }); // e.g., January 12, 2026
    const time = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // e.g., 7:21 PM
    return `${date} | ${time}`;
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
      </div>

      <div className="pc-card-meta">
        <span className="pc-card-child">Child: {concern.childName}</span>
        <span>{formatDateTime(concern.createdAt)}</span>
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



// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// ADD FLOATING BUTTON FOR RAISE CONCERN HERE