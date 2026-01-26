import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import childService from '../../services/childService';
import inquiryService from '../../services/inquiryService';

const NewInquiry = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [selectedChildId, setSelectedChildId] = useState('');
  const [staffOptions, setStaffOptions] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  // 1. Fetch Parent's Children on Mount
  useEffect(() => {
    const init = async () => {
      if (currentUser?.uid) {
        try {
          const data = await childService.getChildrenByParentId(currentUser.uid);
          console.log('📚 Fetched Children:', data); // Debug log
          setChildren(data);
        } catch (error) {
          console.error('❌ Error fetching children:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    init();
  }, [currentUser]);

  // 2. Populate Staff Options When Child is Selected
  useEffect(() => {
    if (selectedChildId) {
      const child = children.find(c => c.id === selectedChildId);
      
      if (!child) {
        console.warn('⚠️ Child not found');
        return;
      }

      console.log('👶 Selected Child:', child);
      console.log('📋 Enrolled Services:', child.enrolledServices);

      const options = [];

      // ✅ FIX: Use the unified 'enrolledServices' array
      if (child.enrolledServices && Array.isArray(child.enrolledServices)) {
        child.enrolledServices.forEach(service => {
          // Extract staff info (handles both therapist and teacher fields)
          const staffId = service.staffId || service.therapistId || service.teacherId;
          const staffName = service.staffName || service.therapistName || service.teacherName;
          const staffRole = service.staffRole || (service.type === 'Therapy' ? 'therapist' : 'teacher');

          if (staffId && staffName) {
            // Avoid duplicates
            const exists = options.some(opt => opt.id === staffId);
            if (!exists) {
              options.push({
                id: staffId,
                name: `${staffName} (${service.serviceName})`,
                role: staffRole
              });
            }
          }
        });
      }

      console.log('👨‍⚕️ Staff Options Generated:', options);
      setStaffOptions(options);
      setSelectedStaffId(''); // Reset staff selection when child changes
    } else {
      setStaffOptions([]);
      setSelectedStaffId('');
    }
  }, [selectedChildId, children]);

  // 3. Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedChildId || !selectedStaffId || !message) {
      toast.warning('Please fill in all required fields.');
      return;
    }
    
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
        subject: subject || 'General Inquiry',
        message,
      };

      await inquiryService.createInquiry(inquiryData);
      toast.success('Inquiry sent successfully!');
      navigate('/parent/inquiries');
    } catch (error) {
      console.error('❌ Error sending inquiry:', error);
      toast.error('Failed to send inquiry. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}>⏳</div>
        <p>Loading your children...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate('/parent/inquiries')} style={styles.backBtn}>
          ← Back to Inquiries
        </button>
        <h1 style={styles.title}>✉️ New Inquiry</h1>
        <p style={styles.subtitle}>Send a message to your child's teacher or therapist</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={styles.form}>
        
        {/* Child Selection */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            <span style={styles.labelIcon}>👶</span>
            About Child *
          </label>
          <select 
            value={selectedChildId} 
            onChange={(e) => setSelectedChildId(e.target.value)}
            style={styles.select}
            required
          >
            <option value="">-- Select Your Child --</option>
            {children.map(child => (
              <option key={child.id} value={child.id}>
                {child.firstName} {child.lastName}
              </option>
            ))}
          </select>
          {children.length === 0 && (
            <p style={styles.helpText}>No children found in your account.</p>
          )}
        </div>

        {/* Staff Selection */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            <span style={styles.labelIcon}>👨‍⚕️</span>
            Send To (Teacher/Therapist) *
          </label>
          <select 
            value={selectedStaffId} 
            onChange={(e) => setSelectedStaffId(e.target.value)}
            style={styles.select}
            required
            disabled={!selectedChildId}
          >
            <option value="">
              {selectedChildId ? '-- Select Recipient --' : '-- Select a child first --'}
            </option>
            {staffOptions.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.name}
              </option>
            ))}
          </select>
          {selectedChildId && staffOptions.length === 0 && (
            <p style={styles.helpText}>⚠️ No staff assigned to this child yet.</p>
          )}
        </div>

        {/* Subject */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            <span style={styles.labelIcon}>📌</span>
            Subject (Optional)
          </label>
          <input 
            type="text"
            value={subject} 
            onChange={e => setSubject(e.target.value)} 
            placeholder="e.g., Question about homework"
            style={styles.input}
          />
        </div>

        {/* Message */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            <span style={styles.labelIcon}>💬</span>
            Your Message *
          </label>
          <textarea 
            value={message} 
            onChange={e => setMessage(e.target.value)} 
            placeholder="Type your question or concern here..."
            style={styles.textarea}
            required
            rows="6"
          />
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          <button 
            type="button" 
            onClick={() => navigate('/parent/inquiries')} 
            style={styles.cancelBtn}
            disabled={sending}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={sending} 
            style={styles.submitBtn}
          >
            {sending ? 'Sending...' : '📤 Send Inquiry'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Simplified Styles
const styles = {
  container: {
    padding: '20px',
    maxWidth: '700px',
    margin: '0 auto',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    minHeight: '100vh',
    backgroundColor: '#f8fafc'
  },
  
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: '1rem'
  },
  
  spinner: {
    fontSize: '3rem',
    animation: 'spin 2s linear infinite'
  },
  
  header: {
    marginBottom: '2rem'
  },
  
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    marginBottom: '1rem',
    padding: '0.5rem 0'
  },
  
  title: {
    fontSize: '1.875rem',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 0.5rem 0'
  },
  
  subtitle: {
    color: '#64748b',
    margin: 0,
    fontSize: '1rem'
  },
  
  form: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '1rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0'
  },
  
  formGroup: {
    marginBottom: '1.5rem'
  },
  
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#334155',
    marginBottom: '0.5rem'
  },
  
  labelIcon: {
    fontSize: '1.125rem'
  },
  
  select: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '1rem',
    border: '1.5px solid #cbd5e1',
    borderRadius: '0.5rem',
    backgroundColor: 'white',
    color: '#1e293b',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  
  input: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '1rem',
    border: '1.5px solid #cbd5e1',
    borderRadius: '0.5rem',
    boxSizing: 'border-box'
  },
  
  textarea: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '1rem',
    border: '1.5px solid #cbd5e1',
    borderRadius: '0.5rem',
    fontFamily: 'inherit',
    resize: 'vertical',
    boxSizing: 'border-box'
  },
  
  helpText: {
    fontSize: '0.8125rem',
    color: '#ef4444',
    margin: '0.5rem 0 0 0',
    fontStyle: 'italic'
  },
  
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    marginTop: '2rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid #e2e8f0'
  },
  
  cancelBtn: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    color: '#64748b',
    backgroundColor: 'white',
    border: '1.5px solid #cbd5e1',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  
  submitBtn: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#2563eb',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.2s'
  }
};

export default NewInquiry;