import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Modal component for raising a new concern
 * Handles form state internally and calls onSubmit with concern data
 */
const RaiseConcernModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  children, 
  isSubmitting 
}) => {
  const [formData, setFormData] = useState({
    childId: '',
    subject: '',
    message: ''
  });

  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.childId || !formData.message.trim()) return;
    
    await onSubmit(formData);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ childId: '', subject: '', message: '' });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="pc-modal-overlay" onClick={handleClose}>
      <div className="pc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pc-modal-header">
          <h3>Raise a Concern</h3>
          <button 
            className="pc-modal-close" 
            onClick={handleClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="pc-form">
          <div className="pc-form-group">
            <label className="pc-label">Select Child *</label>
            <select
              required
              className="pc-select"
              value={formData.childId}
              onChange={handleChange('childId')}
            >
              <option value="">-- Select Child --</option>
              {children.map(child => (
                <option key={child.id} value={child.id}>
                  {child.firstName} {child.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="pc-form-group">
            <label className="pc-label">Subject (Optional)</label>
            <input
              className="pc-input"
              placeholder="Brief summary..."
              value={formData.subject}
              onChange={handleChange('subject')}
            />
          </div>

          <div className="pc-form-group">
            <label className="pc-label">Concern Details *</label>
            <textarea
              required
              className="pc-textarea"
              placeholder="Describe your concern..."
              value={formData.message}
              onChange={handleChange('message')}
            />
          </div>

          <div className="pc-form-actions">
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="pc-send-btn"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Concern'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="pc-cancel-btn"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

RaiseConcernModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  children: PropTypes.array.isRequired,
  isSubmitting: PropTypes.bool
};

RaiseConcernModal.defaultProps = {
  isSubmitting: false
};

export default RaiseConcernModal;
