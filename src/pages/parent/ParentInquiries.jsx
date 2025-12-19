import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import inquiryService from '../../services/inquiryService';
import childService from '../../services/childService';

const ParentInquiryCenter = () => {
  const { currentUser } = useAuth();
  
  // Data State
  const [inquiries, setInquiries] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  
  // UI State
  const [view, setView] = useState('list'); // 'list' (details) or 'new' (form)
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyText, setReplyText] = useState('');

  // Form State (for New Inquiry)
  const [formData, setFormData] = useState({
    childId: '',
    staffId: '',
    subject: '',
    message: ''
  });
  const [staffOptions, setStaffOptions] = useState([]);

  // Helper to count parent messages
  const getParentReplyCount = (inq) => inq?.messages?.filter(m => m.type === 'parent').length || 0;

  // 1. Initial Data Fetch
  useEffect(() => {
    const loadData = async () => {
      if (currentUser?.uid) {
        try {
          const [inqData, childData] = await Promise.all([
            inquiryService.getInquiriesByParent(currentUser.uid),
            childService.getChildrenByParentId(currentUser.uid)
          ]);
          setInquiries(inqData);
          setChildren(childData);
          if (inqData.length > 0) setSelectedInquiry(inqData[0]);
        } catch (error) {
          console.error("Failed to load center:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    loadData();
  }, [currentUser]);

  // 2. Handle Staff Options when Child is selected
  useEffect(() => {
    if (formData.childId) {
      const child = children.find(c => c.id === formData.childId);
      if (child) {
        const options = [];
        child.therapyServices?.forEach(s => {
          if (s.therapistId) options.push({ id: s.therapistId, name: `${s.therapistName} (${s.serviceName})`, role: 'therapist' });
        });
        child.groupClasses?.forEach(c => {
          if (c.teacherId) options.push({ id: c.teacherId, name: `${c.teacherName} (${c.serviceName})`, role: 'teacher' });
        });
        setStaffOptions(options);
      }
    }
  }, [formData.childId, children]);

  // 3. Submit New Inquiry
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const child = children.find(c => c.id === formData.childId);
      const staff = staffOptions.find(s => s.id === formData.staffId);

      const newInq = {
        parentId: currentUser.uid,
        parentName: `${currentUser.firstName} ${currentUser.lastName}`,
        studentId: child.id,
        studentName: `${child.firstName} ${child.lastName}`,
        targetId: staff.id,
        targetName: staff.name,
        targetRole: staff.role,
        subject: formData.subject,
        message: formData.message,
      };

      await inquiryService.createInquiry(newInq);
      const updatedInqs = await inquiryService.getInquiriesByParent(currentUser.uid);
      setInquiries(updatedInqs);
      setView('list');
      setFormData({ childId: '', staffId: '', subject: '', message: '' });
      alert("Inquiry sent!");
    } catch (error) {
      alert("Error sending message");
    } finally {
      setSending(false);
    }
  };

  // 4. Submit Reply (Threaded)
  const handleSendReply = async () => {
    if (!replyText || getParentReplyCount(selectedInquiry) >= 3) return;
    
    setSending(true);
    try {
      await inquiryService.addMessageToThread(
        selectedInquiry.id,
        replyText,
        { id: currentUser.uid, name: `${currentUser.firstName} ${currentUser.lastName}` },
        'parent'
      );
      
      const updatedInqs = await inquiryService.getInquiriesByParent(currentUser.uid);
      setInquiries(updatedInqs);
      setSelectedInquiry(updatedInqs.find(i => i.id === selectedInquiry.id));
      setReplyText('');
    } catch (error) {
      alert("Error sending reply");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div style={{padding: '40px', textAlign: 'center'}}>Loading Inquiry Center...</div>;

  return (
    <div style={styles.container}>
      {/* Sidebar: Inquiry List */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={{margin: 0, fontSize: '18px'}}>Inquiries</h2>
          <button onClick={() => setView('new')} style={styles.composeBtn}>+</button>
        </div>
        <div style={styles.listArea}>
          {inquiries.map(inq => (
            <div 
              key={inq.id} 
              onClick={() => { setSelectedInquiry(inq); setView('list'); }}
              style={styles.inqCard(selectedInquiry?.id === inq.id, inq.status)}
            >
              <div style={{fontWeight: 'bold', fontSize: '14px', marginBottom: '4px'}}>{inq.subject}</div>
              <div style={{fontSize: '12px', color: '#666'}}>{inq.targetName.split('(')[0]}</div>
              <div style={{fontSize: '10px', color: '#aaa', marginTop: '5px'}}>
                {new Date(inq.lastUpdated || inq.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        {view === 'new' ? (
          <div style={styles.formView}>
            <h3>Compose New Inquiry</h3>
            <form onSubmit={handleSubmit} style={styles.form}>
              <select required style={styles.input} value={formData.childId} onChange={e => setFormData({...formData, childId: e.target.value})}>
                <option value="">Select Child</option>
                {children.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
              </select>
              <select required disabled={!formData.childId} style={styles.input} value={formData.staffId} onChange={e => setFormData({...formData, staffId: e.target.value})}>
                <option value="">Select Recipient</option>
                {staffOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input required placeholder="Subject" style={styles.input} value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
              <textarea required placeholder="Message..." style={{...styles.input, height: '150px'}} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} />
              <div style={{display: 'flex', gap: '10px'}}>
                <button type="submit" disabled={sending} style={styles.sendBtn}>{sending ? 'Sending...' : 'Send Message'}</button>
                <button type="button" onClick={() => setView('list')} style={styles.cancelBtn}>Cancel</button>
              </div>
            </form>
          </div>
        ) : selectedInquiry ? (
          <div style={styles.detailView}>
            <div style={styles.detailHeader}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h2>{selectedInquiry.subject}</h2>
                <span style={styles.statusBadge(selectedInquiry.status)}>
                  {selectedInquiry.status === 'waiting_for_staff' && '⏳ Sent to Staff'}
                  {selectedInquiry.status === 'waiting_for_parent' && '📩 New Reply'}
                  {selectedInquiry.status === 'closed' && '🔒 Closed'}
                </span>
              </div>
              <p style={{color: '#666'}}>To: {selectedInquiry.targetName} | Student: {selectedInquiry.studentName}</p>
              {selectedInquiry.status === 'closed' && (
                <p style={{color: '#e74c3c', fontSize: '13px', fontWeight: 'bold'}}>Closed by {selectedInquiry.closedBy}</p>
              )}
            </div>

            <div style={styles.messageContent}>
              {selectedInquiry.messages?.map((msg, index) => (
                <div key={index} style={msg.senderId === currentUser.uid ? styles.bubbleUserSent : styles.bubbleReceived}>
                  <strong>{msg.senderId === currentUser.uid ? 'You' : msg.senderName}</strong>
                  <p>{msg.text}</p>
                  <small>{new Date(msg.timestamp).toLocaleString()}</small>
                </div>
              ))}
            </div>

            {selectedInquiry.status !== 'closed' && getParentReplyCount(selectedInquiry) < 3 ? (
              <div style={styles.replyBox}>
                <textarea 
                  value={replyText} 
                  onChange={(e) => setReplyText(e.target.value)} 
                  placeholder="Type a follow-up message..."
                  style={{ ...styles.input, height: '80px', marginBottom: '10px' }}
                />
                <div style={{ textAlign: 'right' }}>
                  <button onClick={handleSendReply} disabled={sending || !replyText} style={styles.sendBtn}>
                    {sending ? 'Sending...' : `Send Reply (${getParentReplyCount(selectedInquiry)}/3)`}
                  </button>
                </div>
              </div>
            ) : (
              <div style={styles.limitNotice}>
                {selectedInquiry.status === 'closed' ? "This conversation is closed." : "Maximum reply limit reached."}
              </div>
            )}
          </div>
        ) : (
          <div style={styles.emptyState}>Select an inquiry to read or click + to start a new one.</div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', height: 'calc(100vh - 100px)', backgroundColor: 'white', margin: '20px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden' },
  sidebar: { width: '320px', borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column' },
  sidebarHeader: { padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f9fa', borderBottom: '1px solid #eee' },
  composeBtn: { width: '35px', height: '35px', borderRadius: '50%', border: 'none', backgroundColor: '#007bff', color: 'white', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  listArea: { flex: 1, overflowY: 'auto' },
  inqCard: (active, status) => ({
    padding: '15px 20px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer', 
    backgroundColor: active ? '#e7f1ff' : 'transparent',
    borderLeft: active ? '4px solid #007bff' : status === 'closed' ? '4px solid #95a5a6' : status === 'waiting_for_parent' ? '4px solid #2ecc71' : '4px solid #f1c40f'
  }),
  main: { flex: 1, backgroundColor: '#fff', display: 'flex', flexDirection: 'column' },
  emptyState: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontStyle: 'italic' },
  detailView: { padding: '40px', overflowY: 'auto', display: 'flex', flexDirection: 'column' },
  detailHeader: { borderBottom: '1px solid #eee', marginBottom: '30px', paddingBottom: '20px' },
  messageContent: { display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' },
  bubbleUserSent: { alignSelf: 'flex-end', backgroundColor: '#e3f2fd', padding: '15px', borderRadius: '15px 15px 0 15px', maxWidth: '80%', border: '1px solid #bbdefb' },
  bubbleReceived: { alignSelf: 'flex-start', backgroundColor: '#f0f2f5', padding: '15px', borderRadius: '0 15px 15px 15px', maxWidth: '80%' },
  replyBox: { marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #eee' },
  limitNotice: { marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold' },
  formView: { padding: '40px' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '500px' },
  input: { width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' },
  sendBtn: { padding: '12px 24px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' },
  cancelBtn: { padding: '12px 24px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  statusBadge: (status) => ({ 
    fontSize: '10px', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '10px', fontWeight: 'bold',
    backgroundColor: status === 'closed' ? '#f5f5f5' : status === 'waiting_for_parent' ? '#e8f5e9' : '#fff3e0',
    color: status === 'closed' ? '#7f8c8d' : status === 'waiting_for_parent' ? '#2ecc71' : '#f39c12'
  })
};

export default ParentInquiryCenter;