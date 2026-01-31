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
  uniqueParents = [],
  locallyReadIds = new Set()
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
              isLocallyRead={locallyReadIds?.has?.(concern.id) || false}
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
const ConcernCard = ({ concern, isActive, statusClass, onSelect, onStatusChange, userRole, currentUserId, isLocallyRead }) => {
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

    // Handle pending serverTimestamp (Firestore sentinel value)
    // When a write is pending, lastReadAt might not have toMillis yet
    if (typeof lastReadAt?.toMillis !== 'function') {
      // Pending timestamp - assume it's being read now, so not unread
      return false;
    }

    const lastReadTime = lastReadAt.toMillis();
    const lastUpdatedTime = concern.lastUpdated?.toMillis?.() || 0;

    return lastUpdatedTime > lastReadTime;
  };

  // Use lastUpdated if available, otherwise createdAt
  const displayTime = concern.lastUpdated || concern.createdAt;
  const isUpdated = concern.lastUpdated && concern.lastUpdated !== concern.createdAt;
  // Don't show unread indicator if:
  // - This concern is currently selected (being read)
  // - This concern was locally marked as read (clicked on)
  const isUnread = !isActive && !isLocallyRead && checkUnread();

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
 * Checkmark icon for admin empty state
 */
const CheckCircleIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

/**
 * Mailbox icon for parent empty state
 */
const MailboxIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>
);

/**
 * Empty state when no concerns exist
 */
const EmptyState = ({ onNewConcern, userRole }) => {
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';

  return (
    <div className="pc-empty-state">
      <div className="pc-empty-icon">
        {isAdmin ? <CheckCircleIcon /> : <MailboxIcon />}
      </div>
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