import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import childService from '../../services/childService';
import inquiryService from '../../services/inquiryService';

const NewInquiry = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [selectedChildId, setSelectedChildId] = useState('');
  const [staffOptions, setStaffOptions] = useState([]); // Therapists + Teachers for selected child
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  // 1. Fetch Parent's Children
  useEffect(() => {
    const init = async () => {
      if (currentUser?.uid) {
        try {
          const data = await childService.getChildrenByParentId(currentUser.uid);
          setChildren(data);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
    };
    init();
  }, [currentUser]);

  // 2. When Child is Selected, Populate Staff Options
  useEffect(() => {
    if (selectedChildId) {
      const child = children.find(c => c.id === selectedChildId);
      if (child) {
        // Combine 1:1 Therapists and Group Teachers into one list
        const options = [];
        
        // Add Therapists
        if (child.therapyServices) {
          child.therapyServices.forEach(s => {
            if (s.therapistId) {
              options.push({
                id: s.therapistId,
                name: `${s.therapistName} (${s.serviceName})`,
                role: 'therapist'
              });
            }
          });
        }

        // Add Teachers
        if (child.groupClasses) {
          child.groupClasses.forEach(c => {
            if (c.teacherId) {
              options.push({
                id: c.teacherId,
                name: `${c.teacherName} (${c.serviceName})`,
                role: 'teacher'
              });
            }
          });
        }

        setStaffOptions(options);
        setSelectedStaffId(''); // Reset selection
      }
    }
  }, [selectedChildId, children]);

  // 3. Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedChildId || !selectedStaffId || !message) return;
    
    setSending(true);
    try {
      const child = children.find(c => c.id === selectedChildId);
      const targetStaff = staffOptions.find(s => s.id === selectedStaffId);

      const inquiryData = {
        parentId: currentUser.uid,
        parentName: `${currentUser.firstName} ${currentUser.lastName}`,
        studentId: child.id,
        studentName: `${child.firstName} ${child.lastName}`,
        targetId: targetStaff.id,
        targetName: targetStaff.name,
        targetRole: targetStaff.role,
        subject,
        message,
      };

      await inquiryService.createInquiry(inquiryData);
      alert('Inquiry Sent!');
      navigate('/parent/inquiries'); // Redirect to list
    } catch (error) {
      alert('Error sending message');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={styles.container}>
      <button onClick={() => navigate('/parent/inquiries')} style={styles.backBtn}>← Back to Inquiries</button>
      <h1 style={{color: '#2c3e50'}}>Compose New Inquiry</h1>
      
      <form onSubmit={handleSubmit} style={styles.form}>
        
        {/* Child Select */}
        <div style={styles.group}>
          <label style={styles.label}>1. About Child:</label>
          <select 
            value={selectedChildId} 
            onChange={(e) => setSelectedChildId(e.target.value)}
            style={styles.input}
            required
          >
            <option value="">-- Select Child --</option>
            {children.map(child => (
              <option key={child.id} value={child.id}>{child.firstName}</option>
            ))}
          </select>
        </div>

        {/* Staff Select (Dependent on Child) */}
        <div style={styles.group}>
          <label style={styles.label}>2. To (Staff Member):</label>
          <select 
            value={selectedStaffId} 
            onChange={(e) => setSelectedStaffId(e.target.value)}
            style={styles.input}
            required
            disabled={!selectedChildId}
          >
            <option value="">-- Select Recipient --</option>
            {staffOptions.map((staff, index) => (
              <option key={index} value={staff.id}>{staff.name}</option>
            ))}
          </select>
        </div>

        <div style={styles.group}>
          <label style={styles.label}>Subject:</label>
          <input 
            value={subject} 
            onChange={e => setSubject(e.target.value)} 
            placeholder="e.g. Question about homework"
            style={styles.input}
            required
          />
        </div>

        <div style={styles.group}>
          <label style={styles.label}>Message:</label>
          <textarea 
            value={message} 
            onChange={e => setMessage(e.target.value)} 
            placeholder="Write your question here..."
            style={{...styles.input, height: '120px'}}
            required
          />
        </div>

        <button type="submit" disabled={sending} style={styles.submitBtn}>
          {sending ? 'Sending...' : 'Send Inquiry'}
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: { padding: '20px', maxWidth: '600px', margin: '0 auto' },
  backBtn: { background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', marginBottom: '20px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  group: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontWeight: 'bold', color: '#444' },
  input: { padding: '10px', borderRadius: '5px', border: '1px solid #ccc' },
  submitBtn: { padding: '12px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }
};

export default NewInquiry;