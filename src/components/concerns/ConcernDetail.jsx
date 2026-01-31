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
  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    if (newStatus === 'solved') {
      const confirmed = window.confirm(
        'Are you sure you want to mark this concern as solved?\n\nThis will close the conversation and the parent will no longer be able to reply.'
      );
      if (!confirmed) {
        e.target.value = concern.status;
        return;
      }
    }
    updateStatus(concern.id, newStatus);
  };

  return (
    <div className="pc-message-header">
      <div className="pc-header-top">
        <h2>{concern.subject || 'No Subject'}</h2>
        {(userRole === 'admin' || userRole === 'super_admin') ? (
          <select
            className={`pc-card-status ${statusClass}`}
            value={concern.status}
            onChange={handleStatusChange}
          >
            <option value="pending">Pending</option>
            <option value="ongoing">Ongoing</option>
            <option value="waiting_for_parent">Waiting for Parent</option>
            <option value="solved">Solved</option>
          </select>
        ) : (
          <span className={`pc-card-status ${statusClass}`}>
            {concern.status.replace(/_/g, ' ')}
          </span>
        )}
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
    />
    <div className="pc-reply-footer">
      <small className="pc-reply-count">
      </small>
      <button 
        onClick={onSendReply} 
        disabled={isSending || !replyText} 
        className="pc-send-btn"
      >
        {isSending ? 'Sending...' : 'Send'}
      </button>
    </div>
  </div>
);

/**
 * Notice when reply limit reached or concern closed
 */
const LimitNotice = ({ status }) => (
  <div className="pc-limit-notice">
    {status === 'solved' 
      ? "🔒 This concern has been solved." 
      : "⚠️ NONE "}
  </div>
);

/**
 * Empty state when no concern selected
 */
const DetailEmptyState = ({ onNewConcern, userRole }) => {
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';

  return (
    <div className="pc-empty-state">
      <div className="pc-empty-icon">{isAdmin ? '📬' : '📋'}</div>
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
  <button className="pc-back-btn" onClick={onClick}>
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
    Back
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