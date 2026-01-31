import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './RaiseConcernModal.css';

/**
 * Predefined subject suggestions for common concern types
 */
const SUBJECT_SUGGESTIONS = [
  { id: 'schedule', label: 'Schedule Question', icon: '📅' },
  { id: 'health', label: 'Health Update', icon: '🏥' },
  { id: 'behavior', label: 'Behavior Concern', icon: '💭' },
  { id: 'progress', label: 'Progress Inquiry', icon: '📈' },
  { id: 'therapy', label: 'Therapy Session', icon: '🎯' },
  { id: 'general', label: 'General Question', icon: '❓' },
];

/**
 * Modal component for raising a new concern with improved UX
 */
const RaiseConcernModal = ({
  isOpen,
  onClose,
  onSubmit,
  children,
  isSubmitting,
  preselectedChildId = null
}) => {
  const [formData, setFormData] = useState({
    childId: '',
    subject: '',
    message: ''
  });
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);

  // Auto-select child when modal opens
  useEffect(() => {
    if (isOpen && children.length > 0) {
      const defaultChildId = preselectedChildId || children[0]?.id || '';
      setFormData(prev => ({ ...prev, childId: defaultChildId }));
    }
  }, [isOpen, children, preselectedChildId]);

  // Reset suggestion when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedSuggestion(null);
    }
  }, [isOpen]);

  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Clear suggestion if user edits subject manually
    if (field === 'subject') {
      setSelectedSuggestion(null);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    if (selectedSuggestion === suggestion.id) {
      // Deselect if clicking the same suggestion
      setSelectedSuggestion(null);
      setFormData(prev => ({ ...prev, subject: '' }));
    } else {
      setSelectedSuggestion(suggestion.id);
      setFormData(prev => ({ ...prev, subject: suggestion.label }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.childId || !formData.message.trim()) return;

    await onSubmit(formData);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ childId: '', subject: '', message: '' });
    setSelectedSuggestion(null);
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
    <div className="rcm-overlay" onClick={handleClose}>
      <div className="rcm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Enhanced Header */}
        <div className="rcm-header">
          <div className="rcm-header-content">
            <div className="rcm-header-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="rcm-title">Raise a Concern</h3>
              <p className="rcm-subtitle">We're here to help with any questions or concerns</p>
            </div>
          </div>
          <button
            className="rcm-close"
            onClick={handleClose}
            aria-label="Close modal"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Child Context Badge */}
        {childDisplayName && (
          <div className="rcm-child-badge">
            <div className="rcm-child-avatar">
              {selectedChild?.firstName?.[0] || 'C'}
            </div>
            <div className="rcm-child-info">
              <span className="rcm-child-label">Regarding</span>
              <span className="rcm-child-name">{childDisplayName}</span>
            </div>
            {children.length > 1 && (
              <select
                className="rcm-child-switcher"
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

        <form onSubmit={handleSubmit} className="rcm-form">
          {/* Subject Suggestions */}
          <div className="rcm-form-section">
            <label className="rcm-label">
              What's this about?
              <span className="rcm-optional">Optional</span>
            </label>
            <div className="rcm-suggestions">
              {SUBJECT_SUGGESTIONS.map(suggestion => (
                <button
                  key={suggestion.id}
                  type="button"
                  className={`rcm-suggestion-chip ${selectedSuggestion === suggestion.id ? 'active' : ''}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <span className="rcm-chip-icon">{suggestion.icon}</span>
                  <span className="rcm-chip-label">{suggestion.label}</span>
                </button>
              ))}
            </div>
            <input
              className="rcm-input"
              placeholder="Or type your own subject..."
              value={formData.subject}
              onChange={handleChange('subject')}
            />
          </div>

          {/* Message Section */}
          <div className="rcm-form-section">
            <label className="rcm-label">
              Tell us more
              <span className="rcm-required">*</span>
            </label>
            <textarea
              required
              className="rcm-textarea"
              placeholder="Please describe your concern in detail. Include any relevant dates, times, or specifics that would help us assist you better..."
              value={formData.message}
              onChange={handleChange('message')}
              autoFocus
            />
            <span className="rcm-hint">
              Your message will be sent to our team who will respond as soon as possible.
            </span>
          </div>

          {/* Actions */}
          <div className="rcm-actions">
            <button
              type="button"
              className="rcm-btn-cancel"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.message.trim()}
              className="rcm-btn-submit"
            >
              {isSubmitting ? (
                <>
                  <span className="rcm-spinner"></span>
                  Submitting...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                  Submit Concern
                </>
              )}
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