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
            {userRole !== 'admin' && userRole !== 'super_admin' && (
              <button
                onClick={onNewConcern}
                className="pc-compose-btn"
                title="New Concern"
                aria-label="Compose new concern"
              >
                +
              </button>
            )}
        </div>
       
      </header>

      <div className="pc-scroll-area">
        {concerns.length === 0 ? (
          <EmptyState onNewConcern={onNewConcern} userRole={userRole} />
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

      {userRole !== 'admin' && userRole !== 'super_admin' && (
        <button
          onClick={onNewConcern}
          className="pc-fab-compose-btn"
          title="New Concern"
          aria-label="Compose new concern"
        >
          +
        </button>
      )}
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

  // Format timestamp for display
  const formatDateTime = (ts) => {
    if (!ts) return '';
    const dateObj = ts.toDate ? ts.toDate() : new Date(ts);
    const date = dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    const time = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${date}, ${time}`;
  };

  // Use lastUpdated if available, otherwise createdAt
  const displayTime = concern.lastUpdated || concern.createdAt;
  const isUpdated = concern.lastUpdated && concern.lastUpdated !== concern.createdAt;

  return (
    <div
      onClick={onSelect}
      className={`pc-concern-card ${isActive ? 'active' : ''}`}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="pc-card-header">
        <span className="pc-card-subject">{concern.subject || 'No Subject'}</span>
        <span className={`pc-card-status ${statusClass}`}>
          {concern.status.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="pc-card-meta">
        <span className="pc-card-child">{concern.childName}</span>
        <span className="pc-card-time">
          {isUpdated && <span className="pc-updated-label">Updated </span>}
          {formatDateTime(displayTime)}
        </span>
      </div>
    </div>
  );
};



/**
 * Empty state when no concerns exist
 */
const EmptyState = ({ onNewConcern, userRole }) => {
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';

  return (
    <div className="pc-empty-state">
      <div className="pc-empty-icon">{isAdmin ? '✅' : '📭'}</div>
      <p>{isAdmin ? 'No concerns to review' : 'No concerns yet'}</p>
      {isAdmin ? (
        <span className="pc-empty-subtitle">All caught up!</span>
      ) : (
        <button onClick={onNewConcern} className="pc-secondary-btn">
          Raise a Concern
        </button>
      )}
    </div>
  );
};

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