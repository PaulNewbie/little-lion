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
  currentUserId,
  updateStatus,
  statusFilter,
  onFilterStatusChange,
  parentFilter,
  onFilterParentChange,
  uniqueParents = []
}) => {
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';

  // Get selected parent name for display
  const selectedParent = uniqueParents.find(p => p.id === parentFilter);
  const hasActiveFilters = statusFilter !== 'all' || parentFilter !== 'all';

  const clearAllFilters = () => {
    onFilterStatusChange('all');
    if (onFilterParentChange) onFilterParentChange('all');
  };

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
            {/* Parent filter - Admin only */}
            {isAdmin && uniqueParents.length > 0 && (
              <select
                className="pc-filter-dropdown pc-parent-filter"
                value={parentFilter}
                onChange={(e) => onFilterParentChange(e.target.value)}
                title="Filter by parent"
              >
                <option value="all">All Parents</option>
                {uniqueParents.map(parent => (
                  <option key={parent.id} value={parent.id}>
                    {parent.name} ({parent.count})
                  </option>
                ))}
              </select>
            )}

            {/* Status filter */}
            <select
              className="pc-filter-dropdown"
              value={statusFilter}
              onChange={(e) => onFilterStatusChange(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="ongoing">Ongoing</option>
              <option value="waiting_for_parent">Waiting</option>
              <option value="solved">Solved</option>
            </select>

            {/* Compose button - Parents only */}
            {!isAdmin && (
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

      {/* Active Filters Display */}
      {isAdmin && hasActiveFilters && (
        <div className="pc-active-filters">
          <span className="pc-filters-label">Filters:</span>
          {parentFilter !== 'all' && selectedParent && (
            <span className="pc-filter-chip">
              <span className="pc-chip-avatar">{selectedParent.name[0]}</span>
              {selectedParent.name}
              <button
                className="pc-chip-clear"
                onClick={() => onFilterParentChange('all')}
                aria-label="Clear parent filter"
              >
                ×
              </button>
            </span>
          )}
          {statusFilter !== 'all' && (
            <span className="pc-filter-chip pc-status-chip">
              {statusFilter.replace(/_/g, ' ')}
              <button
                className="pc-chip-clear"
                onClick={() => onFilterStatusChange('all')}
                aria-label="Clear status filter"
              >
                ×
              </button>
            </span>
          )}
          <button className="pc-clear-all" onClick={clearAllFilters}>
            Clear all
          </button>
        </div>
      )}

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
              onStatusChange={updateStatus}
              userRole={userRole}
              currentUserId={currentUserId}
            />
          ))
        )}
      </div>

      {!isAdmin && (
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
const ConcernCard = ({ concern, isActive, statusClass, onSelect, onStatusChange, userRole, currentUserId }) => {
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

  // Check if concern has unread messages
  const checkUnread = () => {
    if (!currentUserId || !concern.lastUpdated) return false;

    const lastReadAt = concern.lastReadBy?.[currentUserId];
    if (!lastReadAt) return true; // Never read = unread

    const lastReadTime = lastReadAt?.toMillis?.() || lastReadAt || 0;
    const lastUpdatedTime = concern.lastUpdated?.toMillis?.() || concern.lastUpdated || 0;

    return lastUpdatedTime > lastReadTime;
  };

  // Use lastUpdated if available, otherwise createdAt
  const displayTime = concern.lastUpdated || concern.createdAt;
  const isUpdated = concern.lastUpdated && concern.lastUpdated !== concern.createdAt;
  const isUnread = checkUnread();

  return (
    <div
      onClick={onSelect}
      className={`pc-concern-card ${isActive ? 'active' : ''} ${isUnread ? 'unread' : ''}`}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="pc-card-header">
        <span className="pc-card-subject">
          {isUnread && <span className="pc-unread-dot" aria-label="Unread" />}
          {concern.subject || 'No Subject'}
        </span>
        <span className={`pc-card-status ${statusClass}`}>
          {concern.status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Message Preview */}
      {concern.lastMessage?.text && (
        <div className="pc-card-preview">
          <span className="pc-preview-sender">{concern.lastMessage.senderName}:</span>
          <span className="pc-preview-text">{concern.lastMessage.text}</span>
        </div>
      )}

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
  isHidden: PropTypes.bool,
  userRole: PropTypes.string,
  currentUserId: PropTypes.string,
  updateStatus: PropTypes.func,
  statusFilter: PropTypes.string,
  onFilterStatusChange: PropTypes.func,
  parentFilter: PropTypes.string,
  onFilterParentChange: PropTypes.func,
  uniqueParents: PropTypes.array
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