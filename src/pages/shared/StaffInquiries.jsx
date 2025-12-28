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

  // Helper to count how many messages the staff has sent in this thread
  const getStaffReplyCount = (inq) => inq?.messages?.filter(m => m.type === 'staff').length || 0;

  const handleReplyChange = (inquiryId, text) => {
    setReplyText(prev => ({ ...prev, [inquiryId]: text }));
  };

  const handleSendReply = async (inquiryId) => {
    const message = replyText[inquiryId];
    const currentInquiry = inquiries.find(inq => inq.id === inquiryId);
    
    if (!message || getStaffReplyCount(currentInquiry) >= 3) return;

    if (!window.confirm("Send this reply? You cannot edit it later.")) return;

    setSubmitting(inquiryId);
    try {
      const responderInfo = {
        id: currentUser.uid,
        name: `${currentUser.firstName} ${currentUser.lastName}`,
        role: currentUser.role
      };
      
      // Use the new addMessageToThread function
      await inquiryService.addMessageToThread(inquiryId, message, responderInfo, 'staff');
      
      // Refresh list from server to get updated thread
      const updatedData = await inquiryService.getInquiriesByStaff(currentUser.uid);
      setInquiries(updatedData);
      setReplyText(prev => ({ ...prev, [inquiryId]: '' }));
      
      alert("Reply sent successfully.");
    } catch (error) {
      alert("Failed to send reply.");
    } finally {
      setSubmitting(null);
    }
  };

//   const handleCloseInquiry = async (inquiryId) => {
//   if (!window.confirm("Are you sure you want to close this inquiry? No more messages can be sent.")) return;
  
//   try {
//     await inquiryService.closeInquiry(inquiryId, `${currentUser.firstName} ${currentUser.lastName}`);
//     // Refresh list
//     const data = await inquiryService.getInquiriesByStaff(currentUser.uid);
//     setInquiries(data);
//     alert("Inquiry closed.");
//   } catch (error) {
//     alert("Failed to close inquiry.");
//   }
// };

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
              
              <div style={styles.cardHeader}>
                <span style={styles.statusBadge(inq.status)}>
                  {inq.status === 'answered' ? '✓ Active Thread' : '⏳ Pending Action'}
                </span>
                <span style={styles.date}>
                  Last Activity: {new Date(inq.lastUpdated || inq.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div style={styles.content}>
                <div style={{ marginBottom: '10px' }}>
                  <strong>From:</strong> {inq.parentName}<br/>
                  <strong>Student:</strong> {inq.studentName}<br/>
                  <strong>Subject:</strong> {inq.subject}
                </div>
                
                {/* Threaded View */}
                <div style={styles.threadContainer}>
                  {inq.messages?.map((msg, idx) => (
                    <div 
                      key={idx} 
                      style={msg.type === 'staff' ? styles.staffBubble : styles.parentBubble}
                    >
                      <strong>{msg.senderName}</strong>
                      <p style={{ margin: '5px 0' }}>{msg.text}</p>
                      <small style={{ fontSize: '10px', opacity: 0.7 }}>
                        {new Date(msg.timestamp).toLocaleString()}
                      </small>
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.actionArea}>
                {getStaffReplyCount(inq) < 3 ? (
                  <div>
                    <textarea 
                      style={styles.textArea}
                      placeholder="Type your professional reply here..."
                      value={replyText[inq.id] || ''}
                      onChange={(e) => handleReplyChange(inq.id, e.target.value)}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#666' }}>
                        Responses used: {getStaffReplyCount(inq)} / 3
                      </span>
                      <button 
                        onClick={() => handleSendReply(inq.id)}
                        disabled={submitting === inq.id || !replyText[inq.id]}
                        style={styles.sendBtn}
                      >
                        {submitting === inq.id ? 'Sending...' : 'Send Reply'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={styles.limitNotice}>
                    Maximum response limit (3) reached for this inquiry.
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
  // ... existing styles ...
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
  threadContainer: { display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' },
  parentBubble: { alignSelf: 'flex-start', backgroundColor: '#fff8e1', padding: '12px', borderRadius: '0 12px 12px 12px', border: '1px solid #ffe0b2', maxWidth: '85%' },
  staffBubble: { alignSelf: 'flex-end', backgroundColor: '#e3f2fd', padding: '12px', borderRadius: '12px 12px 0 12px', border: '1px solid #bbdefb', maxWidth: '85%' },
  actionArea: { padding: '20px', backgroundColor: '#fdfdfd', borderTop: '1px solid #eee' },
  textArea: { width: '100%', minHeight: '80px', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '10px', boxSizing: 'border-box' },
  sendBtn: { padding: '8px 20px', backgroundColor: '#4a90e2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  limitNotice: { textAlign: 'center', color: '#d32f2f', fontWeight: 'bold', padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px' }
};

export default StaffInquiries;