import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import inquiryService from '../../services/inquiryService';
import childService from '../../services/childService';
import ParentSidebar from '../../components/sidebar/ParentSidebar';
import './ParentConcerns.css';

const ParentConcerns = () => {
  const { currentUser } = useAuth();
  
  // Data State
  const [concerns, setConcerns] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedConcern, setSelectedConcern] = useState(null);
  
  // UI State
  const [view, setView] = useState('list'); // 'list' | 'new' | 'detail'
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'detail'
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyText, setReplyText] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    childId: '',
    subject: '',
    message: ''
  });

  const getParentReplyCount = (concern) => concern?.messages?.filter(m => m.type === 'parent').length || 0;

  // Initial Data Fetch
  useEffect(() => {
    const loadData = async () => {
      if (currentUser?.uid) {
        try {
          const [concernData, childData] = await Promise.all([
            inquiryService.getInquiriesByParent(currentUser.uid),
            childService.getChildrenByParentId(currentUser.uid)
          ]);
          setConcerns(concernData);
          setChildren(childData);
        } catch (error) {
          console.error("Failed to load concerns:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    loadData();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.childId || !formData.message.trim()) return;
    setSending(true);
    try {
      const child = children.find(c => c.id === formData.childId);
      const newConcern = {
        parentId: currentUser.uid,
        parentName: `${currentUser.firstName} ${currentUser.lastName}`,
        childId: child.id,
        childName: `${child.firstName} ${child.lastName}`,
        subject: formData.subject || 'General Concern',
        message: formData.message,
      };
      await inquiryService.createInquiry(newConcern);
      const updatedConcerns = await inquiryService.getInquiriesByParent(currentUser.uid);
      setConcerns(updatedConcerns);
      setView('list');
      setMobileView('list');
      setFormData({ childId: '', subject: '', message: '' });
    } catch (error) {
      console.error(error);
      alert("Error creating concern");
    } finally {
      setSending(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText || getParentReplyCount(selectedConcern) >= 3) return;
    setSending(true);
    try {
      await inquiryService.addMessageToThread(
        selectedConcern.id,
        replyText,
        { id: currentUser.uid, name: `${currentUser.firstName} ${currentUser.lastName}` },
        'parent'
      );
      const updatedConcerns = await inquiryService.getInquiriesByParent(currentUser.uid);
      setConcerns(updatedConcerns);
      setSelectedConcern(updatedConcerns.find(c => c.id === selectedConcern.id));
      setReplyText('');
    } catch (error) {
      alert("Error sending reply");
    } finally {
      setSending(false);
    }
  };

  const handleSelectConcern = (concern) => {
    setSelectedConcern(concern);
    setView('detail');
    setMobileView('detail');
  };

  const handleBackToList = () => {
    setMobileView('list');
    setView('list');
  };

  const handleNewConcern = () => {
    setView('new');
    setMobileView('detail');
  };

  const handleCancelNew = () => {
    setView('list');
    setMobileView('list');
    setFormData({ childId: '', subject: '', message: '' });
  };

  const getStatusClass = (status) => {
    if (status === 'waiting_for_parent') return 'waiting';
    if (status === 'waiting_for_staff') return 'pending';
    return '';
  };

  const getStatusBadgeClass = (status) => {
    return status.replace(/_/g, '_');
  };

  if (loading) return <div className="pc-loading">Loading Concerns...</div>;

  return (
    <div className="pc-page-wrapper">
      <ParentSidebar />
      
      <main className="pc-content-container">
        {/* COLUMN 1: CONCERNS LIST */}
        <section className={`pc-list-column ${mobileView === 'detail' ? 'hidden' : ''}`}>
          <header className="pc-column-header">
            <div>
              <h2 className="pc-header-title">Concerns</h2>
              <span className="pc-sub-text">{concerns.length} Items</span>
            </div>
            <button 
              onClick={handleNewConcern} 
              className="pc-compose-btn" 
              title="New Concern"
              aria-label="Compose new concern"
            >
              +
            </button>
          </header>

          <div className="pc-scroll-area">
            {concerns.length === 0 ? (
              <div className="pc-empty-state">
                <div className="pc-empty-icon">📭</div>
                <p>No concerns yet</p>
                <button onClick={handleNewConcern} className="pc-secondary-btn">
                  Raise a Concern
                </button>
              </div>
            ) : (
              concerns.map(concern => (
                <div 
                  key={concern.id} 
                  onClick={() => handleSelectConcern(concern)}
                  className={`pc-concern-card ${selectedConcern?.id === concern.id ? 'active' : ''} status-${getStatusClass(concern.status)}`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSelectConcern(concern)}
                >
                  <div className="pc-card-header">
                    <span className="pc-card-subject">{concern.subject}</span>
                    <span className="pc-card-date">
                      {new Date(concern.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="pc-card-child">Child: {concern.childName}</div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* COLUMN 2: DETAIL/NEW VIEW */}
        <section className={`pc-detail-column ${mobileView === 'detail' || view !== 'list' ? 'visible' : ''}`}>
          {/* Mobile Back Button */}
          <button className="pc-back-btn" onClick={handleBackToList}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </button>

          {view === 'new' ? (
            /* COMPOSE NEW CONCERN */
            <div className="pc-view-container">
              <div className="pc-view-header">
                <h3>Raise a Concern</h3>
                <p>Send a concern regarding your child to the administration.</p>
              </div>
              <form onSubmit={handleSubmit} className="pc-form">
                <div className="pc-form-group">
                  <label className="pc-label">Select Child *</label>
                  <select 
                    required 
                    className="pc-select"
                    value={formData.childId} 
                    onChange={e => setFormData({...formData, childId: e.target.value})}
                  >
                    <option value="">-- Select Child --</option>
                    {children.map(c => (
                      <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                    ))}
                  </select>
                </div>

                <div className="pc-form-group">
                  <label className="pc-label">Subject (Optional)</label>
                  <input 
                    type="text"
                    placeholder="Brief summary..." 
                    className="pc-input"
                    value={formData.subject} 
                    onChange={e => setFormData({...formData, subject: e.target.value})} 
                  />
                </div>

                <div className="pc-form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label className="pc-label">Concern Details *</label>
                  <textarea 
                    required 
                    className="pc-textarea"
                    placeholder="Describe your concern..."
                    value={formData.message} 
                    onChange={e => setFormData({...formData, message: e.target.value})} 
                  />
                </div>

                <div className="pc-form-actions">
                  <button type="submit" disabled={sending} className="pc-send-btn">
                    {sending ? 'Submitting...' : 'Submit Concern'}
                  </button>
                  <button type="button" onClick={handleCancelNew} className="pc-cancel-btn">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : selectedConcern ? (
            /* CONVERSATION VIEW */
            <div className="pc-view-container">
              <div className="pc-message-header">
                <div className="pc-header-top">
                  <h2>{selectedConcern.subject}</h2>
                  <span className={`pc-status-badge ${getStatusBadgeClass(selectedConcern.status)}`}>
                    {selectedConcern.status.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
                <div className="pc-header-meta">
                  <span><strong>Child:</strong> {selectedConcern.childName}</span>
                  <span><strong>Status:</strong> {selectedConcern.status === 'waiting_for_parent' ? '⏳ Awaiting Your Response' : '📝 Pending Review'}</span>
                  <span><strong>Created:</strong> {new Date(selectedConcern.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="pc-chat-window">
                {selectedConcern.messages?.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`pc-bubble ${msg.senderId === currentUser.uid ? 'pc-bubble-sent' : 'pc-bubble-received'}`}
                  >
                    <div className="pc-bubble-meta">
                      <strong>{msg.senderId === currentUser.uid ? 'You' : msg.senderName}</strong>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <p className="pc-bubble-text">{msg.text}</p>
                  </div>
                ))}
              </div>

              {selectedConcern.status !== 'closed' && getParentReplyCount(selectedConcern) < 3 ? (
                <div className="pc-reply-section">
                  <textarea 
                    value={replyText} 
                    onChange={(e) => setReplyText(e.target.value)} 
                    placeholder="Type your response..."
                    className="pc-reply-input"
                  />
                  <div className="pc-reply-footer">
                    <small className="pc-reply-count">
                      Responses: {getParentReplyCount(selectedConcern)} / 3
                    </small>
                    <button 
                      onClick={handleSendReply} 
                      disabled={sending || !replyText} 
                      className="pc-send-btn"
                    >
                      {sending ? 'Sending...' : 'Send Response'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pc-limit-notice">
                  {selectedConcern.status === 'closed' 
                    ? "🔒 This concern has been closed." 
                    : "⚠️ Response limit reached."}
                </div>
              )}
            </div>
          ) : (
            /* EMPTY STATE - No concern selected */
            <div className="pc-empty-state">
              <div className="pc-empty-icon">📋</div>
              <p>Select a concern to view details</p>
              <button onClick={handleNewConcern} className="pc-secondary-btn">
                Raise a New Concern
              </button>
            </div>
          )}
        </section>

        {/* Mobile Floating Action Button */}
        <button 
          className="pc-mobile-fab" 
          onClick={handleNewConcern}
          aria-label="Compose new concern"
        >
          +
        </button>
      </main>
    </div>
  );
};

export default ParentConcerns;
