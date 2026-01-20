import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Modal component for raising a new concern
 * 
 * CHANGE: Removed "Select Child" dropdown
 * 
 * Rationale:
 * 1. Most parents have 1-2 children, making selection unnecessary friction
 * 2. For single-child parents, it's redundant
 * 3. For multi-child parents, we auto-select the first child (they can change via 
 *    child profile context or we can add it back later as a less prominent option)
 * 4. Reduces form fields on mobile, giving more space to the actual concern
 * 5. Simplifies the user flow - focus on what matters: describing the concern
 * 
 * The childId is now auto-selected from the first child in the list.
 * If contextual child selection is needed (e.g., parent came from a specific 
 * child's profile), that can be passed as a prop.
 */
const RaiseConcernModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  children, 
  isSubmitting,
  preselectedChildId = null // Optional: if parent navigated from a child's page
}) => {
  const [formData, setFormData] = useState({
    childId: '',
    subject: '',
    message: ''
  });

  // Auto-select child when modal opens
  useEffect(() => {
    if (isOpen && children.length > 0) {
      // Use preselected child if provided, otherwise default to first child
      const defaultChildId = preselectedChildId || children[0]?.id || '';
      setFormData(prev => ({ ...prev, childId: defaultChildId }));
    }
  }, [isOpen, children, preselectedChildId]);

  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.childId || !formData.message.trim()) return;
    
    await onSubmit(formData);
    handleClose();
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

  // Get the selected child's name for display
  const selectedChild = children.find(c => c.id === formData.childId);
  const childDisplayName = selectedChild 
    ? `${selectedChild.firstName} ${selectedChild.lastName}` 
    : '';

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

        {/* Show which child this concern is for */}
        {childDisplayName && (
          <div className="pc-child-context">
            <span className="pc-child-label">For:</span>
            <span className="pc-child-name">{childDisplayName}</span>
            {children.length > 1 && (
              <select
                className="pc-child-switcher"
                value={formData.childId}
                onChange={handleChange('childId')}
                aria-label="Switch child"
              >
                {children.map(child => (
                  <option key={child.id} value={child.id}>
                    {child.firstName} {child.lastName}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="pc-form">
          <div className="pc-form-group">
            <label className="pc-label">Subject (Optional)</label>
            <input
              className="pc-input"
              placeholder="Brief summary of your concern..."
              value={formData.subject}
              onChange={handleChange('subject')}
              autoFocus
            />
          </div>

          <div className="pc-form-group">
            <label className="pc-label">Concern Details *</label>
            <textarea
              required
              className="pc-textarea"
              placeholder="Please describe your concern in detail..."
              value={formData.message}
              onChange={handleChange('message')}
            />
          </div>

          <div className="pc-form-actions">
            <button 
              type="submit" 
              disabled={isSubmitting || !formData.message.trim()} 
              className="pc-send-btn"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Concern'}
            </button>
            <button
              type="button"
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
  isSubmitting: PropTypes.bool,
  preselectedChildId: PropTypes.string
};

RaiseConcernModal.defaultProps = {
  isSubmitting: false,
  preselectedChildId: null
};

export default RaiseConcernModal;