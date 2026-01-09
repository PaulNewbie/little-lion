import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import inquiryService from '../../services/inquiryService';
import childService from '../../services/childService';
import ParentSidebar from '../../components/sidebar/ParentSidebar';

const ParentInquiryCenter = () => {
  const { currentUser } = useAuth();
  
  // Data State
  const [inquiries, setInquiries] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  
  // UI State
  const [view, setView] = useState('list'); 
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyText, setReplyText] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    childId: '',
    staffId: '',
    subject: '',
    message: ''
  });
  const [staffOptions, setStaffOptions] = useState([]);

  const getParentReplyCount = (inq) => inq?.messages?.filter(m => m.type === 'parent').length || 0;

  // Initial Data Fetch
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

  // Handle Staff Options
  useEffect(() => {
    if (formData.childId) {
      const child = children.find(c => c.id === formData.childId);
      if (!child) return;

      const options = [];
      if (child.enrolledServices && Array.isArray(child.enrolledServices)) {
        child.enrolledServices.forEach(service => {
          const staffId = service.staffId || service.therapistId || service.teacherId;
          const staffName = service.staffName || service.therapistName || service.teacherName;
          const staffRole = service.staffRole || (service.type === 'Therapy' ? 'therapist' : 'teacher');

          if (staffId && staffName) {
            const exists = options.some(opt => opt.id === staffId);
            if (!exists) {
              options.push({ id: staffId, name: `${staffName} (${service.serviceName})`, role: staffRole });
            }
          }
        });
      }
      setStaffOptions(options);
    } else {
      setStaffOptions([]);
    }
  }, [formData.childId, children]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.childId || !formData.staffId || !formData.message) return;
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
        subject: formData.subject || 'General Inquiry',
        message: formData.message,
      };
      await inquiryService.createInquiry(newInq);
      const updatedInqs = await inquiryService.getInquiriesByParent(currentUser.uid);
      setInquiries(updatedInqs);
      setView('list');
      setFormData({ childId: '', staffId: '', subject: '', message: '' });
    } catch (error) {
      console.error(error);
    } finally {
      setSending(false);
    }
  };

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

  if (loading) return <div style={styles.loading}>Loading Inquiry Center...</div>;

  return (
    <div style={styles.pageWrapper}>
      <ParentSidebar />
      
      <main style={styles.contentContainer}>
        {/* COLUMN 1: INQUIRY LIST */}
        <section style={styles.listColumn}>
          <header style={styles.columnHeader}>
            <div>
              <h2 style={styles.headerTitle}>Messages</h2>
              <span style={styles.subText}>{inquiries.length} Threads</span>
            </div>
            <button onClick={() => setView('new')} style={styles.composeBtn} title="New Inquiry">+</button>
          </header>

          <div style={styles.scrollArea}>
            {inquiries.map(inq => (
              <div 
                key={inq.id} 
                onClick={() => { setSelectedInquiry(inq); setView('list'); }}
                style={styles.inqCard(selectedInquiry?.id === inq.id, inq.status)}
              >
                <div style={styles.cardHeader}>
                  <span style={styles.cardSubject}>{inq.subject}</span>
                  <span style={styles.cardDate}>{new Date(inq.lastUpdated || inq.createdAt).toLocaleDateString()}</span>
                </div>
                <div style={styles.cardMeta}>{inq.targetName.split('(')[0]}</div>
                <div style={styles.cardStudent}>Student: {inq.studentName}</div>
              </div>
            ))}
          </div>
        </section>

        {/* COLUMN 2: ACTIVE CONTENT */}
        <section style={styles.detailColumn}>
          {view === 'new' ? (
            <div style={styles.viewContainer}>
              <div style={styles.viewHeader}>
                <h3>Compose New Inquiry</h3>
                <p>Send a message to your child's teacher or therapist.</p>
              </div>
              <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Select Child</label>
                    <select 
                      required style={styles.input} 
                      value={formData.childId} 
                      onChange={e => setFormData({...formData, childId: e.target.value, staffId: ''})}
                    >
                      <option value="">-- Select --</option>
                      {children.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Recipient</label>
                    <select 
                      required disabled={!formData.childId} style={styles.input} 
                      value={formData.staffId} 
                      onChange={e => setFormData({...formData, staffId: e.target.value})}
                    >
                      <option value="">{formData.childId ? '-- Select Staff --' : 'Select a child first'}</option>
                      {staffOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Subject</label>
                  <input 
                    placeholder="Brief summary..." style={styles.input} 
                    value={formData.subject} 
                    onChange={e => setFormData({...formData, subject: e.target.value})} 
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Message</label>
                  <textarea 
                    required style={{...styles.input, height: '200px', resize: 'none'}} 
                    value={formData.message} 
                    onChange={e => setFormData({...formData, message: e.target.value})} 
                  />
                </div>

                <div style={styles.formActions}>
                  <button type="submit" disabled={sending} style={styles.sendBtn}>
                    {sending ? 'Sending...' : 'Send Message'}
                  </button>
                  <button type="button" onClick={() => setView('list')} style={styles.cancelBtn}>Cancel</button>
                </div>
              </form>
            </div>
          ) : selectedInquiry ? (
            <div style={styles.viewContainer}>
              <div style={styles.messageHeader}>
                <div style={styles.headerTop}>
                  <h2 style={{margin: 0}}>{selectedInquiry.subject}</h2>
                  <span style={styles.statusBadge(selectedInquiry.status)}>
                    {selectedInquiry.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div style={styles.headerMeta}>
                  <span><strong>From:</strong> You</span>
                  <span><strong>To:</strong> {selectedInquiry.targetName}</span>
                  <span><strong>Student:</strong> {selectedInquiry.studentName}</span>
                </div>
              </div>

              <div style={styles.chatWindow}>
                {selectedInquiry.messages?.map((msg, index) => (
                  <div key={index} style={msg.senderId === currentUser.uid ? styles.bubbleUserSent : styles.bubbleReceived}>
                    <div style={styles.bubbleMeta}>
                      <strong>{msg.senderId === currentUser.uid ? 'You' : msg.senderName}</strong>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <p style={styles.bubbleText}>{msg.text}</p>
                  </div>
                ))}
              </div>

              {selectedInquiry.status !== 'closed' && getParentReplyCount(selectedInquiry) < 3 ? (
                <div style={styles.replySection}>
                  <textarea 
                    value={replyText} 
                    onChange={(e) => setReplyText(e.target.value)} 
                    placeholder="Type your reply..."
                    style={styles.replyInput}
                  />
                  <div style={styles.replyFooter}>
                    <small style={{color: '#64748b'}}>Replies: {getParentReplyCount(selectedInquiry)} / 3</small>
                    <button onClick={handleSendReply} disabled={sending || !replyText} style={styles.sendBtn}>
                      {sending ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={styles.limitNotice}>
                  {selectedInquiry.status === 'closed' ? "🔒 This conversation has been closed." : "⚠️ Message limit reached for this thread."}
                </div>
              )}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>✉️</div>
              <p>Select a message to view the conversation</p>
              <button onClick={() => setView('new')} style={styles.secondaryBtn}>Start New Inquiry</button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

const styles = {
  pageWrapper: { display: 'flex', height: '100vh', backgroundColor: '#f1f5f9', overflow: 'hidden' },
  contentContainer: { flex: 1, display: 'flex', margin: '16px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', overflow: 'hidden' },
  
  // List Column
  listColumn: { width: '350px', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', backgroundColor: '#fff' },
  columnHeader: { padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: '#1e293b' },
  subText: { fontSize: '0.75rem', color: '#64748b' },
  composeBtn: { width: '32px', height: '32px', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px' },
  scrollArea: { flex: 1, overflowY: 'auto' },
  
  // Inquiry Card
  inqCard: (active, status) => ({
    padding: '16px 20px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
    backgroundColor: active ? '#eff6ff' : 'transparent',
    borderLeft: active ? '4px solid #3b82f6' : '4px solid transparent',
    transition: 'all 0.2s'
  }),
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '4px' },
  cardSubject: { fontWeight: '600', fontSize: '0.9rem', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  cardDate: { fontSize: '0.7rem', color: '#94a3b8' },
  cardMeta: { fontSize: '0.8rem', color: '#64748b' },
  cardStudent: { fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' },

  // Detail Column
  detailColumn: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#fff' },
  viewContainer: { display: 'flex', flexDirection: 'column', height: '100%', padding: '0 30px' },
  viewHeader: { padding: '30px 0', borderBottom: '1px solid #e2e8f0' },
  
  // Chat Elements
  messageHeader: { padding: '24px 0', borderBottom: '1px solid #e2e8f0' },
  headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  headerMeta: { display: 'flex', gap: '20px', fontSize: '0.85rem', color: '#64748b' },
  chatWindow: { flex: 1, overflowY: 'auto', padding: '24px 0', display: 'flex', flexDirection: 'column', gap: '16px' },
  bubbleUserSent: { alignSelf: 'flex-end', backgroundColor: '#3b82f6', color: 'white', padding: '12px 16px', borderRadius: '12px 12px 0 12px', maxWidth: '70%' },
  bubbleReceived: { alignSelf: 'flex-start', backgroundColor: '#f1f5f9', color: '#1e293b', padding: '12px 16px', borderRadius: '0 12px 12px 12px', maxWidth: '70%', border: '1px solid #e2e8f0' },
  bubbleMeta: { display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '0.7rem', marginBottom: '4px', opacity: 0.8 },
  bubbleText: { margin: 0, fontSize: '0.95rem', lineHeight: 1.5 },

  // Reply Section
  replySection: { padding: '20px 0 30px 0', borderTop: '1px solid #e2e8f0' },
  replyInput: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', minHeight: '80px', marginBottom: '12px', fontFamily: 'inherit' },
  replyFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },

  // Form
  form: { marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '0.85rem', fontWeight: '600', color: '#475569' },
  input: { padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' },
  formActions: { display: 'flex', gap: '12px', marginTop: '10px' },

  // Utilities
  loading: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  emptyState: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' },
  emptyIcon: { fontSize: '48px', marginBottom: '16px' },
  sendBtn: { padding: '10px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' },
  cancelBtn: { padding: '10px 20px', backgroundColor: '#94a3b8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  secondaryBtn: { marginTop: '16px', padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid #3b82f6', color: '#3b82f6', borderRadius: '6px', cursor: 'pointer' },
  statusBadge: (status) => ({
    fontSize: '0.7rem', fontWeight: 'bold', padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase',
    backgroundColor: status === 'closed' ? '#f1f5f9' : status === 'waiting_for_parent' ? '#dcfce7' : '#fef9c3',
    color: status === 'closed' ? '#64748b' : status === 'waiting_for_parent' ? '#166534' : '#854d0e'
  }),
  limitNotice: { padding: '16px', backgroundColor: '#fff7ed', color: '#9a3412', borderRadius: '8px', textAlign: 'center', fontSize: '0.9rem', marginBottom: '30px' }
};

export default ParentInquiryCenter;
