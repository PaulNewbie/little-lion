import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import inquiryService from '../../services/inquiryService';

const StaffInquiries = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Reply State
  const [replyText, setReplyText] = useState({}); // Map of inquiryId -> text
  const [submitting, setSubmitting] = useState(null); // ID of inquiry being submitted

  useEffect(() => {
    const fetchInquiries = async () => {
      if (currentUser?.uid) {
        try {
          // This fetches messages where targetId == currentUser.uid
          const data = await inquiryService.getInquiriesByStaff(currentUser.uid);
          setInquiries(data);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchInquiries();
  }, [currentUser]);

  const handleReplyChange = (inquiryId, text) => {
    setReplyText(prev => ({ ...prev, [inquiryId]: text }));
  };

  const handleSendReply = async (inquiryId) => {
    const message = replyText[inquiryId];
    if (!message) return;

    if (!window.confirm("Send this reply? You cannot edit it later.")) return;

    setSubmitting(inquiryId);
    try {
      const responderInfo = {
        name: `${currentUser.firstName} ${currentUser.lastName}`,
        role: currentUser.role
      };
      
      await inquiryService.replyToInquiry(inquiryId, message, responderInfo);
      
      // Refresh list locally
      setInquiries(prev => prev.map(inq => 
        inq.id === inquiryId 
          ? { ...inq, status: 'answered', reply: { message, responderName: responderInfo.name, timestamp: new Date().toISOString() } }
          : inq
      ));
      
      alert("Reply sent successfully.");
    } catch (error) {
      alert("Failed to send reply.");
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) return <div style={{padding: '20px'}}>Loading inbox...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back to Dashboard</button>
        <h1 style={{ margin: 0, color: '#2c3e50' }}>My Inbox 📬</h1>
      </div>

      {inquiries.length === 0 ? (
        <div style={styles.empty}>No inquiries found.</div>
      ) : (
        <div style={styles.list}>
          {inquiries.map(inq => (
            <div key={inq.id} style={styles.card(inq.status)}>
              
              {/* Header: Status & Sender */}
              <div style={styles.cardHeader}>
                <span style={styles.statusBadge(inq.status)}>
                  {inq.status === 'answered' ? '✓ Replied' : '⏳ Pending Action'}
                </span>
                <span style={styles.date}>
                  {new Date(inq.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Message Content */}
              <div style={styles.content}>
                <div style={{ marginBottom: '10px' }}>
                  <strong>From:</strong> {inq.parentName}<br/>
                  <strong>Student:</strong> {inq.studentName}<br/>
                  <strong>Subject:</strong> {inq.subject}
                </div>
                
                <div style={styles.messageBox}>
                  "{inq.message}"
                </div>
              </div>

              {/* Action Area */}
              <div style={styles.actionArea}>
                {inq.status === 'answered' ? (
                  <div style={styles.replyBox}>
                    <strong>Your Reply:</strong>
                    <p style={{ margin: '5px 0 0', color: '#0d47a1' }}>{inq.reply.message}</p>
                    <small style={{ color: '#666' }}>Sent: {new Date(inq.reply.timestamp).toLocaleString()}</small>
                  </div>
                ) : (
                  <div>
                    <textarea 
                      style={styles.textArea}
                      placeholder="Type your professional reply here..."
                      value={replyText[inq.id] || ''}
                      onChange={(e) => handleReplyChange(inq.id, e.target.value)}
                    />
                    <div style={{ textAlign: 'right' }}>
                      <button 
                        onClick={() => handleSendReply(inq.id)}
                        disabled={submitting === inq.id || !replyText[inq.id]}
                        style={styles.sendBtn}
                      >
                        {submitting === inq.id ? 'Sending...' : 'Send Reply'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: '20px', maxWidth: '800px', margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' },
  backBtn: { background: 'none', border: '1px solid #ccc', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer' },
  empty: { textAlign: 'center', padding: '40px', color: '#888', backgroundColor: '#f9f9f9', borderRadius: '8px' },
  list: { display: 'flex', flexDirection: 'column', gap: '20px' },
  
  card: (status) => ({
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    borderLeft: status === 'answered' ? '5px solid #2ecc71' : '5px solid #e74c3c',
    overflow: 'hidden'
  }),
  
  cardHeader: { padding: '15px 20px', backgroundColor: '#f8f9fa', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: (status) => ({
    padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
    backgroundColor: status === 'answered' ? '#e8f5e9' : '#fff3e0',
    color: status === 'answered' ? '#1b5e20' : '#d35400'
  }),
  date: { fontSize: '12px', color: '#888' },
  
  content: { padding: '20px' },
  messageBox: { backgroundColor: '#fff8e1', padding: '15px', borderRadius: '6px', border: '1px solid #ffe0b2', fontStyle: 'italic', marginTop: '10px' },
  
  actionArea: { padding: '20px', backgroundColor: '#fdfdfd', borderTop: '1px solid #eee' },
  textArea: { width: '100%', minHeight: '80px', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '10px', boxSizing: 'border-box' },
  sendBtn: { padding: '8px 20px', backgroundColor: '#4a90e2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  
  replyBox: { backgroundColor: '#e3f2fd', padding: '15px', borderRadius: '6px', border: '1px solid #bbdefb' }
};

export default StaffInquiries;