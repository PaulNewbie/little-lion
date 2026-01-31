import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './RaiseConcernModal.css';

/**
 * SVG Icons for subject suggestions
 */
const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const HeartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
);

const MessageCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
  </svg>
);

const TrendingUpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
);

const TargetIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <circle cx="12" cy="12" r="6"></circle>
    <circle cx="12" cy="12" r="2"></circle>
  </svg>
);

const HelpCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

/**
 * Predefined subject suggestions for common concern types
 */
const SUBJECT_SUGGESTIONS = [
  { id: 'schedule', label: 'Schedule Question', icon: CalendarIcon },
  { id: 'health', label: 'Health Update', icon: HeartIcon },
  { id: 'behavior', label: 'Behavior Concern', icon: MessageCircleIcon },
  { id: 'progress', label: 'Progress Inquiry', icon: TrendingUpIcon },
  { id: 'therapy', label: 'Therapy Session', icon: TargetIcon },
  { id: 'general', label: 'General Question', icon: HelpCircleIcon },
];

/**
 * Modal component for raising a new concern with improved UX
 */
const RaiseConcernModal = ({
  isOpen,
  onClose,
  onSubmit,
  studentChildren = [],
  isSubmitting,
  preselectedChildId = null
}) => {
  // Ensure children is always an array and deduplicated
  const childrenList = Array.isArray(studentChildren)
    ? [...new Map(studentChildren.map(child => [child.id, child])).values()]
    : [];
  const [formData, setFormData] = useState({
    childId: '',
    subject: '',
    message: ''
  });
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);

  // Auto-select child when modal opens or children load
  useEffect(() => {
    if (!isOpen) return;

    if (childrenList.length > 0) {
      // Set child ID if not already set or if current selection is invalid
      const currentChildExists = childrenList.some(c => c.id === formData.childId);
      if (!formData.childId || !currentChildExists) {
        const defaultChildId = preselectedChildId || childrenList[0]?.id || '';
        setFormData(prev => ({ ...prev, childId: defaultChildId }));
      }
    }
  }, [isOpen, childrenList, preselectedChildId, formData.childId]);

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
  const selectedChild = childrenList.find(c => c.id === formData.childId);
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

        {/* Child Selector - Always visible */}
        <div className="rcm-child-badge">
          {childrenList.length === 0 ? (
            <div className="rcm-child-info">
              <span className="rcm-child-label">Loading children...</span>
            </div>
          ) : childrenList.length === 1 ? (
            <>
              <div className="rcm-child-avatar">
                {childrenList[0]?.firstName?.[0] || 'C'}
              </div>
              <div className="rcm-child-info">
                <span className="rcm-child-label">Regarding</span>
                <span className="rcm-child-name">
                  {childrenList[0]?.firstName} {childrenList[0]?.lastName}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="rcm-child-avatar">
                {selectedChild?.firstName?.[0] || 'C'}
              </div>
              <div className="rcm-child-info">
                <span className="rcm-child-label">Regarding</span>
                <select
                  className="rcm-child-select"
                  value={formData.childId}
                  onChange={handleChange('childId')}
                  aria-label="Select child"
                >
                  {childrenList.map(child => (
                    <option key={child.id} value={child.id}>
                      {child.firstName} {child.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="rcm-form">
          {/* Subject Suggestions */}
          <div className="rcm-form-section">
            <label className="rcm-label">
              What's this about?
              <span className="rcm-optional">Optional</span>
            </label>
            <div className="rcm-suggestions">
              {SUBJECT_SUGGESTIONS.map(suggestion => {
                const IconComponent = suggestion.icon;
                return (
                  <button
                    key={suggestion.id}
                    type="button"
                    className={`rcm-suggestion-chip ${selectedSuggestion === suggestion.id ? 'active' : ''}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <span className="rcm-chip-icon"><IconComponent /></span>
                    <span className="rcm-chip-label">{suggestion.label}</span>
                  </button>
                );
              })}
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
  studentChildren: PropTypes.array,
  isSubmitting: PropTypes.bool,
  preselectedChildId: PropTypes.string
};

RaiseConcernModal.defaultProps = {
  isSubmitting: false,
  preselectedChildId: null
};

export default RaiseConcernModal;