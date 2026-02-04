import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { Loader, Baby, UserCheck, Pin, MessageSquare } from 'lucide-react';
import childService from '../../services/childService';
import inquiryService from '../../services/inquiryService';
import BackButton from '../../components/common/BackButton';
import Sidebar from '../../components/sidebar/Sidebar';
import { getParentConfig } from '../../components/sidebar/sidebarConfigs';
import ParentProfileUploader from './components/ParentProfileUploader';
import GeneralFooter from '../../components/footer/generalfooter';

import './css/NewInquiry.css';

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
          console.log('Fetched Children:', data);
          setChildren(data);
        } catch (error) {
          console.error('Error fetching children:', error);
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
        console.warn('Child not found');
        return;
      }

      const options = [];

      if (child.enrolledServices && Array.isArray(child.enrolledServices)) {
        child.enrolledServices.forEach(service => {
          const staffId = service.staffId || service.therapistId || service.teacherId;
          const staffName = service.staffName || service.therapistName || service.teacherName;
          const staffRole = service.staffRole || (service.type === 'Therapy' ? 'therapist' : 'teacher');

          if (staffId && staffName) {
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

      setStaffOptions(options);
      setSelectedStaffId('');
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
      navigate('/parent/concerns');
    } catch (error) {
      console.error('Error sending inquiry:', error);
      toast.error('Failed to send inquiry. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="inquiry-loading-container">
        <div className="inquiry-spinner"><Loader size={32} className="inquiry-spin-icon" /></div>
        <p>Loading your children...</p>
      </div>
    );
  }

  return (
    <div className="inquiry-layout">
      <Sidebar {...getParentConfig()} forceActive="/parent/concerns" renderExtraProfile={() => <ParentProfileUploader />} />

      <div className="inquiry-main-wrapper">
        <div className="inquiry-container">
          {/* Header */}
          <div className="inquiry-header">
            <BackButton to="/parent/concerns" />
            <h1 className="inquiry-title">New Inquiry</h1>
            <p className="inquiry-subtitle">Send a message to your child's teacher or therapist</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="inquiry-form">

            {/* Child Selection */}
            <div className="inquiry-form-group">
              <label className="inquiry-label">
                <span className="inquiry-label-icon"><Baby size={18} color="#0052A1" /></span>
                About Child *
              </label>
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="inquiry-select"
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
                <p className="inquiry-help-text">No children found in your account.</p>
              )}
            </div>

            {/* Staff Selection */}
            <div className="inquiry-form-group">
              <label className="inquiry-label">
                <span className="inquiry-label-icon"><UserCheck size={18} color="#0052A1" /></span>
                Send To (Teacher/Therapist) *
              </label>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="inquiry-select"
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
                <p className="inquiry-help-text">No staff assigned to this child yet.</p>
              )}
            </div>

            {/* Subject */}
            <div className="inquiry-form-group">
              <label className="inquiry-label">
                <span className="inquiry-label-icon"><Pin size={18} color="#0052A1" /></span>
                Subject (Optional)
              </label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g., Question about homework"
                className="inquiry-input"
              />
            </div>

            {/* Message */}
            <div className="inquiry-form-group">
              <label className="inquiry-label">
                <span className="inquiry-label-icon"><MessageSquare size={18} color="#0052A1" /></span>
                Your Message *
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Type your question or concern here..."
                className="inquiry-textarea"
                required
                rows="6"
              />
            </div>

            {/* Actions */}
            <div className="inquiry-actions">
              <button
                type="button"
                onClick={() => navigate('/parent/concerns')}
                className="inquiry-cancel-btn"
                disabled={sending}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending}
                className="inquiry-submit-btn"
              >
                {sending ? 'Sending...' : 'Send Inquiry'}
              </button>
            </div>
          </form>
        </div>

        <GeneralFooter pageLabel="New Inquiry" />
      </div>
    </div>
  );
};

export default NewInquiry;
