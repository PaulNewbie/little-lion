// import React, { useState, useEffect } from 'react';
// import { useAuth } from '../../hooks/useAuth';
// import inquiryService from '../../services/inquiryService';
// import childService from '../../services/childService';
// import ParentSidebar from '../../components/sidebar/ParentSidebar';
// import './ParentInquiries.css';

// const ParentInquiryCenter = () => {
//   const { currentUser } = useAuth();
  
//   // Data State
//   const [inquiries, setInquiries] = useState([]);
//   const [children, setChildren] = useState([]);
//   const [selectedInquiry, setSelectedInquiry] = useState(null);
  
//   // UI State
//   const [view, setView] = useState('list'); // 'list' | 'new' | 'detail'
//   const [mobileView, setMobileView] = useState('list'); // 'list' | 'detail'
//   const [loading, setLoading] = useState(true);
//   const [sending, setSending] = useState(false);
//   const [replyText, setReplyText] = useState('');

//   // Form State
//   const [formData, setFormData] = useState({
//     childId: '',
//     staffId: '',
//     subject: '',
//     message: ''
//   });
//   const [staffOptions, setStaffOptions] = useState([]);

//   const getParentReplyCount = (inq) => inq?.messages?.filter(m => m.type === 'parent').length || 0;

//   // Initial Data Fetch
//   useEffect(() => {
//     const loadData = async () => {
//       if (currentUser?.uid) {
//         try {
//           const [inqData, childData] = await Promise.all([
//             inquiryService.getInquiriesByParent(currentUser.uid),
//             childService.getChildrenByParentId(currentUser.uid)
//           ]);
//           setInquiries(inqData);
//           setChildren(childData);
//         } catch (error) {
//           console.error("Failed to load center:", error);
//         } finally {
//           setLoading(false);
//         }
//       }
//     };
//     loadData();
//   }, [currentUser]);

//   // Handle Staff Options
//   useEffect(() => {
//     if (formData.childId) {
//       const child = children.find(c => c.id === formData.childId);
//       if (!child) return;

//       const options = [];
//       if (child.enrolledServices && Array.isArray(child.enrolledServices)) {
//         child.enrolledServices.forEach(service => {
//           const staffId = service.staffId || service.therapistId || service.teacherId;
//           const staffName = service.staffName || service.therapistName || service.teacherName;
//           const staffRole = service.staffRole || (service.type === 'Therapy' ? 'therapist' : 'teacher');

//           if (staffId && staffName) {
//             const exists = options.some(opt => opt.id === staffId);
//             if (!exists) {
//               options.push({ id: staffId, name: `${staffName} (${service.serviceName})`, role: staffRole });
//             }
//           }
//         });
//       }
//       setStaffOptions(options);
//     } else {
//       setStaffOptions([]);
//     }
//   }, [formData.childId, children]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!formData.childId || !formData.staffId || !formData.message) return;
//     setSending(true);
//     try {
//       const child = children.find(c => c.id === formData.childId);
//       const staff = staffOptions.find(s => s.id === formData.staffId);
//       const newInq = {
//         parentId: currentUser.uid,
//         parentName: `${currentUser.firstName} ${currentUser.lastName}`,
//         studentId: child.id,
//         studentName: `${child.firstName} ${child.lastName}`,
//         targetId: staff.id,
//         targetName: staff.name,
//         targetRole: staff.role,
//         subject: formData.subject || 'General Inquiry',
//         message: formData.message,
//       };
//       await inquiryService.createInquiry(newInq);
//       const updatedInqs = await inquiryService.getInquiriesByParent(currentUser.uid);
//       setInquiries(updatedInqs);
//       setView('list');
//       setMobileView('list');
//       setFormData({ childId: '', staffId: '', subject: '', message: '' });
//     } catch (error) {
//       console.error(error);
//     } finally {
//       setSending(false);
//     }
//   };

//   const handleSendReply = async () => {
//     if (!replyText || getParentReplyCount(selectedInquiry) >= 3) return;
//     setSending(true);
//     try {
//       await inquiryService.addMessageToThread(
//         selectedInquiry.id,
//         replyText,
//         { id: currentUser.uid, name: `${currentUser.firstName} ${currentUser.lastName}` },
//         'parent'
//       );
//       const updatedInqs = await inquiryService.getInquiriesByParent(currentUser.uid);
//       setInquiries(updatedInqs);
//       setSelectedInquiry(updatedInqs.find(i => i.id === selectedInquiry.id));
//       setReplyText('');
//     } catch (error) {
//       alert("Error sending reply");
//     } finally {
//       setSending(false);
//     }
//   };

//   const handleSelectInquiry = (inq) => {
//     setSelectedInquiry(inq);
//     setView('detail');
//     setMobileView('detail');
//   };

//   const handleBackToList = () => {
//     setMobileView('list');
//     setView('list');
//   };

//   const handleNewInquiry = () => {
//     setView('new');
//     setMobileView('detail');
//   };

//   const handleCancelNew = () => {
//     setView('list');
//     setMobileView('list');
//     setFormData({ childId: '', staffId: '', subject: '', message: '' });
//   };

//   const getStatusClass = (status) => {
//     if (status === 'waiting_for_parent') return 'waiting';
//     if (status === 'waiting_for_staff') return 'pending';
//     return '';
//   };

//   const getStatusBadgeClass = (status) => {
//     return status.replace(/_/g, '_');
//   };

//   if (loading) return <div className="pi-loading">Loading Inquiry Center...</div>;

//   return (
//     <div className="pi-page-wrapper">
//       <ParentSidebar />
      
//       <main className="pi-content-container">
//         {/* COLUMN 1: INQUIRY LIST */}
//         <section className={`pi-list-column ${mobileView === 'detail' ? 'hidden' : ''}`}>
//           <header className="pi-column-header">
//             <div>
//               <h2 className="pi-header-title">Messages</h2>
//               <span className="pi-sub-text">{inquiries.length} Threads</span>
//             </div>
//             <button 
//               onClick={handleNewInquiry} 
//               className="pi-compose-btn" 
//               title="New Inquiry"
//               aria-label="Compose new inquiry"
//             >
//               +
//             </button>
//           </header>

//           <div className="pi-scroll-area">
//             {inquiries.length === 0 ? (
//               <div className="pi-empty-state">
//                 <div className="pi-empty-icon">📭</div>
//                 <p>No messages yet</p>
//                 <button onClick={handleNewInquiry} className="pi-secondary-btn">
//                   Start a Conversation
//                 </button>
//               </div>
//             ) : (
//               inquiries.map(inq => (
//                 <div 
//                   key={inq.id} 
//                   onClick={() => handleSelectInquiry(inq)}
//                   className={`pi-inq-card ${selectedInquiry?.id === inq.id ? 'active' : ''} status-${getStatusClass(inq.status)}`}
//                   role="button"
//                   tabIndex={0}
//                   onKeyDown={(e) => e.key === 'Enter' && handleSelectInquiry(inq)}
//                 >
//                   <div className="pi-card-header">
//                     <span className="pi-card-subject">{inq.subject}</span>
//                     <span className="pi-card-date">
//                       {new Date(inq.lastUpdated || inq.createdAt).toLocaleDateString()}
//                     </span>
//                   </div>
//                   <div className="pi-card-meta">{inq.targetName.split('(')[0]}</div>
//                   <div className="pi-card-student">Student: {inq.studentName}</div>
//                 </div>
//               ))
//             )}
//           </div>
//         </section>

//         {/* COLUMN 2: DETAIL/NEW VIEW */}
//         <section className={`pi-detail-column ${mobileView === 'detail' || view !== 'list' ? 'visible' : ''}`}>
//           {/* Mobile Back Button */}
//           <button className="pi-back-btn" onClick={handleBackToList}>
//             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//               <path d="M19 12H5M12 19l-7-7 7-7"/>
//             </svg>
//             Back to Messages
//           </button>

//           {view === 'new' ? (
//             /* COMPOSE NEW INQUIRY */
//             <div className="pi-view-container">
//               <div className="pi-view-header">
//                 <h3>Compose New Inquiry</h3>
//                 <p>Send a message to your child's teacher or therapist.</p>
//               </div>
//               <form onSubmit={handleSubmit} className="pi-form">
//                 <div className="pi-form-row">
//                   <div className="pi-form-group">
//                     <label className="pi-label">Select Child</label>
//                     <select 
//                       required 
//                       className="pi-select"
//                       value={formData.childId} 
//                       onChange={e => setFormData({...formData, childId: e.target.value, staffId: ''})}
//                     >
//                       <option value="">-- Select --</option>
//                       {children.map(c => (
//                         <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
//                       ))}
//                     </select>
//                   </div>
//                   <div className="pi-form-group">
//                     <label className="pi-label">Recipient</label>
//                     <select 
//                       required 
//                       disabled={!formData.childId} 
//                       className="pi-select"
//                       value={formData.staffId} 
//                       onChange={e => setFormData({...formData, staffId: e.target.value})}
//                     >
//                       <option value="">{formData.childId ? '-- Select Staff --' : 'Select a child first'}</option>
//                       {staffOptions.map(s => (
//                         <option key={s.id} value={s.id}>{s.name}</option>
//                       ))}
//                     </select>
//                   </div>
//                 </div>

//                 <div className="pi-form-group">
//                   <label className="pi-label">Subject</label>
//                   <input 
//                     type="text"
//                     placeholder="Brief summary..." 
//                     className="pi-input"
//                     value={formData.subject} 
//                     onChange={e => setFormData({...formData, subject: e.target.value})} 
//                   />
//                 </div>

//                 <div className="pi-form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
//                   <label className="pi-label">Message</label>
//                   <textarea 
//                     required 
//                     className="pi-textarea"
//                     placeholder="Write your message here..."
//                     value={formData.message} 
//                     onChange={e => setFormData({...formData, message: e.target.value})} 
//                   />
//                 </div>

//                 <div className="pi-form-actions">
//                   <button type="submit" disabled={sending} className="pi-send-btn">
//                     {sending ? 'Sending...' : 'Send Message'}
//                   </button>
//                   <button type="button" onClick={handleCancelNew} className="pi-cancel-btn">
//                     Cancel
//                   </button>
//                 </div>
//               </form>
//             </div>
//           ) : selectedInquiry ? (
//             /* CONVERSATION VIEW */
//             <div className="pi-view-container">
//               <div className="pi-message-header">
//                 <div className="pi-header-top">
//                   <h2>{selectedInquiry.subject}</h2>
//                   <span className={`pi-status-badge ${getStatusBadgeClass(selectedInquiry.status)}`}>
//                     {selectedInquiry.status.replace(/_/g, ' ')}
//                   </span>
//                 </div>
//                 <div className="pi-header-meta">
//                   <span><strong>From:</strong> You</span>
//                   <span><strong>To:</strong> {selectedInquiry.targetName}</span>
//                   <span><strong>Student:</strong> {selectedInquiry.studentName}</span>
//                 </div>
//               </div>

//               <div className="pi-chat-window">
//                 {selectedInquiry.messages?.map((msg, index) => (
//                   <div 
//                     key={index} 
//                     className={`pi-bubble ${msg.senderId === currentUser.uid ? 'pi-bubble-sent' : 'pi-bubble-received'}`}
//                   >
//                     <div className="pi-bubble-meta">
//                       <strong>{msg.senderId === currentUser.uid ? 'You' : msg.senderName}</strong>
//                       <span>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
//                     </div>
//                     <p className="pi-bubble-text">{msg.text}</p>
//                   </div>
//                 ))}
//               </div>

//               {selectedInquiry.status !== 'closed' && getParentReplyCount(selectedInquiry) < 3 ? (
//                 <div className="pi-reply-section">
//                   <textarea 
//                     value={replyText} 
//                     onChange={(e) => setReplyText(e.target.value)} 
//                     placeholder="Type your reply..."
//                     className="pi-reply-input"
//                   />
//                   <div className="pi-reply-footer">
//                     <small className="pi-reply-count">
//                       Replies: {getParentReplyCount(selectedInquiry)} / 3
//                     </small>
//                     <button 
//                       onClick={handleSendReply} 
//                       disabled={sending || !replyText} 
//                       className="pi-send-btn"
//                     >
//                       {sending ? 'Sending...' : 'Send Reply'}
//                     </button>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="pi-limit-notice">
//                   {selectedInquiry.status === 'closed' 
//                     ? "🔒 This conversation has been closed." 
//                     : "⚠️ Message limit reached for this thread."}
//                 </div>
//               )}
//             </div>
//           ) : (
//             /* EMPTY STATE - No inquiry selected */
//             <div className="pi-empty-state">
//               <div className="pi-empty-icon">✉️</div>
//               <p>Select a message to view the conversation</p>
//               <button onClick={handleNewInquiry} className="pi-secondary-btn">
//                 Start New Inquiry
//               </button>
//             </div>
//           )}
//         </section>

//         {/* Mobile Floating Action Button */}
//         <button 
//           className="pi-mobile-fab" 
//           onClick={handleNewInquiry}
//           aria-label="Compose new message"
//         >
//           +
//         </button>
//       </main>
//     </div>
//   );
// };

// export default ParentInquiryCenter;