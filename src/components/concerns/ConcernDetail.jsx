import React from 'react';
import PropTypes from 'prop-types';
import './ConcernDetail.css';

/**
 * Displays the detail view of a selected concern with message thread
 */
const ConcernDetail = ({ 
  concern,
  messages, 
  currentUserId,
  replyText,
  onReplyChange,
  onSendReply,
  isSending,
  onBack,
  onNewConcern,
  updateStatus,  
  userRole 
}) => {
  if (!concern) {
    return <DetailEmptyState onNewConcern={onNewConcern} userRole={userRole} />;
  }


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
    <div className="pc-view-container">
      <ConcernHeader 
        concern={concern} 
        statusClass={getStatusClass(concern.status)}
        updateStatus={updateStatus} 
        userRole={userRole} 
      />
      
      <ChatWindow 
        messages={messages} 
        currentUserId={currentUserId} 
      />

      {(concern.status === 'solved') ? (
          <LimitNotice status={concern.status}/>
        ) : (
        <ReplySection
          replyText={replyText}
          onReplyChange={onReplyChange}
          onSendReply={onSendReply}
          isSending={isSending}
        /> 
      )}
      
    </div>
  );
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

/**
 * Header section showing concern metadata
 */
const ConcernHeader = ({ concern, statusClass, updateStatus, userRole }) => {
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const canMarkSolved = isAdmin && concern.status !== 'solved';

  const handleMarkSolved = () => {
    const confirmed = window.confirm(
      'Are you sure you want to mark this concern as solved?\n\nThis will close the conversation and the parent will no longer be able to reply.'
    );
    if (confirmed) {
      updateStatus(concern.id, 'solved');
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'ongoing': return 'Ongoing';
      case 'waiting_for_parent': return 'Waiting for Parent';
      case 'solved': return 'Solved';
      default: return status;
    }
  };

  return (
    <div className="pc-message-header">
      <div className="pc-header-top">
        <h2>{concern.subject || 'No Subject'}</h2>
        <div className="pc-header-actions">
          <span className={`pc-card-status ${statusClass}`}>
            {getStatusLabel(concern.status)}
          </span>
          {canMarkSolved && (
            <button
              className="pc-solve-btn"
              onClick={handleMarkSolved}
              title="Mark this concern as solved"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Mark Solved
            </button>
          )}
        </div>
      </div>
      <div className="pc-header-meta">
        <span><strong>Created by: </strong> {concern.createdByUserName}</span>
      </div>
      <div className="pc-header-meta">
        <span><strong>Child:</strong> {concern.childName}</span>
        <span><strong>Created at:</strong> {formatDateTime(concern.createdAt)}</span>
      </div>
    </div>
  );
};

/**
 * Chat window showing message thread
 */
const ChatWindow = ({ messages = [], currentUserId }) => (
  <div className="pc-chat-window">
    {messages.length === 0 ? (
      <p className="pc-no-messages">No messages yet.</p>
    ) : (
      messages.map((msg) => (
        <MessageBubble 
          key={msg.id} // use firestore doc id
          message={msg}
          isSent={msg.senderId === currentUserId}
        />
      ))
    )}
  </div>
);


/**
 * Individual message bubble
 */
const MessageBubble = ({ message, isSent }) => (
  <div className={`pc-bubble ${isSent ? 'pc-bubble-sent' : 'pc-bubble-received'}`}>
    <div className="pc-bubble-meta">
      <strong>{isSent ? 'You' : message.senderName}</strong>
      <span>
        {formatDateTime(message.createdAt)}
      </span>
    </div>
    <p className="pc-bubble-text">{message.text}</p>
  </div>
);

/**
 * Reply input section
 */
const ReplySection = ({
  replyText,
  onReplyChange,
  onSendReply,
  isSending,
}) => (
  <div className="pc-reply-section">
    <textarea
      value={replyText}
      onChange={(e) => onReplyChange(e.target.value)}
      placeholder="Type your response..."
      className="pc-reply-input"
      rows={1}
    />
    <div className="pc-reply-footer">
      <button
        onClick={onSendReply}
        disabled={isSending || !replyText}
        className="pc-send-btn"
        aria-label="Send reply"
      >
        {isSending ? (
          <span className="pc-send-spinner" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        )}
      </button>
    </div>
  </div>
);

/**
 * Lock icon SVG
 */
const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
  </svg>
);

/**
 * Notice when reply limit reached or concern closed
 */
const LimitNotice = ({ status }) => (
  <div className="pc-limit-notice">
    {status === 'solved' && (
      <>
        <LockIcon />
        <span>This concern has been solved.</span>
      </>
    )}
  </div>
);

/**
 * Inbox icon for empty state
 */
const InboxIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline>
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
  </svg>
);

/**
 * Clipboard icon for empty state
 */
const ClipboardIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
  </svg>
);

/**
 * Empty state when no concern selected
 */
const DetailEmptyState = ({ onNewConcern, userRole }) => {
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';

  return (
    <div className="pc-empty-state">
      <div className="pc-empty-icon">
        {isAdmin ? <InboxIcon /> : <ClipboardIcon />}
      </div>
      <p>Select a concern to view details</p>
      {!isAdmin && (
        <button onClick={onNewConcern} className="pc-secondary-btn">
          Raise a New Concern
        </button>
      )}
    </div>
  );
};

/**
 * Back button for mobile view
 */
export const BackButton = ({ onClick }) => (
  <button className="pc-back-btn" onClick={onClick} aria-label="Back to concerns list">
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
    Back to Concerns
  </button>
);



// PropTypes
ConcernDetail.propTypes = {
  concern: PropTypes.shape({
    id: PropTypes.string.isRequired,
    subject: PropTypes.string.isRequired,
    childName: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    messages: PropTypes.array
  }),
  currentUserId: PropTypes.string.isRequired,
  replyText: PropTypes.string.isRequired,
  onReplyChange: PropTypes.func.isRequired,
  onSendReply: PropTypes.func.isRequired,
  isSending: PropTypes.bool,
  onBack: PropTypes.func.isRequired,
  onNewConcern: PropTypes.func.isRequired
};

ConcernHeader.propTypes = {
  concern: PropTypes.object.isRequired
};

ChatWindow.propTypes = {
  messages: PropTypes.array,
  currentUserId: PropTypes.string.isRequired
};

MessageBubble.propTypes = {
  message: PropTypes.shape({
    senderId: PropTypes.string,
    senderName: PropTypes.string,
    text: PropTypes.string.isRequired,
    timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
  }).isRequired,
  isSent: PropTypes.bool
};

ReplySection.propTypes = {
  replyText: PropTypes.string.isRequired,
  onReplyChange: PropTypes.func.isRequired,
  onSendReply: PropTypes.func.isRequired,
  isSending: PropTypes.bool,
};

LimitNotice.propTypes = {
  status: PropTypes.string.isRequired
};

DetailEmptyState.propTypes = {
  onNewConcern: PropTypes.func.isRequired
};

BackButton.propTypes = {
  onClick: PropTypes.func.isRequired
};

export default ConcernDetail;