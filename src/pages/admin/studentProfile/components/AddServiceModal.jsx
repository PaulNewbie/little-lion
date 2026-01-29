// src/pages/admin/studentProfile/components/AddServiceModal.jsx
import React, { useState, useEffect } from 'react';

/**
 * AddServiceModal - Modal for adding services to a student (Admin only)
 * Supports both Therapy and Group Class enrollment
 */
const AddServiceModal = ({
  isOpen,
  onLoadServices,
  formData,
  onFormChange,
  qualifiedStaff,
  isLoadingStaff,
  isSubmitting,
  onSubmit,
  onClose,
  availableServices = [],
  loadingServices = false
}) => {
  const [serviceType, setServiceType] = useState(null);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setServiceType(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isTherapy = serviceType === 'Therapy';
  const staffLabel = isTherapy ? 'Therapist' : 'Teacher';
  const selectedServiceName = availableServices.find(s => s.id === formData.serviceId)?.name || '';
  const isFormValid = formData.serviceId && formData.staffId;

  const handleSelectType = async (type) => {
    setServiceType(type);
    onFormChange({ serviceId: '', staffId: '' });
    if (onLoadServices) {
      await onLoadServices(type);
    }
  };

  const handleBack = () => {
    setServiceType(null);
    onFormChange({ serviceId: '', staffId: '' });
  };

  return (
    <div className="asm-overlay" onClick={onClose}>
      <div className="asm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="asm-close-btn" onClick={onClose} title="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Progress Indicator */}
        <div className="asm-progress">
          <div className={`asm-progress-step ${!serviceType ? 'active' : 'completed'}`}>
            <span className="asm-step-number">1</span>
            <span className="asm-step-label">Service Type</span>
          </div>
          <div className="asm-progress-line" />
          <div className={`asm-progress-step ${serviceType ? 'active' : ''}`}>
            <span className="asm-step-number">2</span>
            <span className="asm-step-label">Details</span>
          </div>
        </div>

        {/* STEP 1: Service Type Selection */}
        {!serviceType && (
          <div className="asm-step-content">
            <div className="asm-header">
              <div className="asm-header-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
              <h2 className="asm-title">Add New Service</h2>
              <p className="asm-subtitle">Choose the type of service to enroll this student in</p>
            </div>

            <div className="asm-type-grid">
              <button
                className="asm-type-card asm-type-card--therapy"
                onClick={() => handleSelectType('Therapy')}
              >
                <div className="asm-type-icon-wrapper asm-type-icon--therapy">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2a3 3 0 0 0-3 3v4a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <path d="M12 19v3" />
                  </svg>
                </div>
                <h3 className="asm-type-title">Therapy Service</h3>
                <p className="asm-type-desc">One-on-one sessions with a licensed therapist</p>
                <div className="asm-type-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              <button
                className="asm-type-card asm-type-card--class"
                onClick={() => handleSelectType('Class')}
              >
                <div className="asm-type-icon-wrapper asm-type-icon--class">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h3 className="asm-type-title">Group Class</h3>
                <p className="asm-type-desc">Interactive group activities with a teacher</p>
                <div className="asm-type-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>

            <div className="asm-footer">
              <button className="asm-btn asm-btn--secondary" onClick={onClose}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Service & Staff Selection */}
        {serviceType && (
          <div className="asm-step-content">
            <div className="asm-header asm-header--with-back">
              <button className="asm-back-btn" onClick={handleBack}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <span className={`asm-badge ${isTherapy ? 'asm-badge--therapy' : 'asm-badge--class'}`}>
                  {isTherapy ? 'Therapy Service' : 'Group Class'}
                </span>
                <h2 className="asm-title">Select Service & Staff</h2>
              </div>
            </div>

            <div className="asm-form">
              {loadingServices ? (
                <div className="asm-loading">
                  <div className="asm-spinner" />
                  <p>Loading available services...</p>
                </div>
              ) : availableServices.length === 0 ? (
                <div className="asm-empty-state">
                  <div className="asm-empty-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4M12 16h.01" />
                    </svg>
                  </div>
                  <h3>No Services Available</h3>
                  <p>
                    No {serviceType.toLowerCase()} services found. Either no services were recorded in
                    Background History, or all matching services are already enrolled.
                  </p>
                </div>
              ) : (
                <>
                  {/* Service Selection */}
                  <div className="asm-field">
                    <label className="asm-label">
                      <span className="asm-label-text">Select Service</span>
                      <span className="asm-label-required">*</span>
                    </label>
                    <div className="asm-select-wrapper">
                      <select
                        className="asm-select"
                        onChange={(e) => onFormChange({ ...formData, serviceId: e.target.value, staffId: '' })}
                        value={formData.serviceId}
                      >
                        <option value="">Choose a {serviceType.toLowerCase()} service...</option>
                        {availableServices.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <div className="asm-select-arrow">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Staff Selection */}
                  <div className="asm-field">
                    <label className="asm-label">
                      <span className="asm-label-text">Assign {staffLabel}</span>
                      <span className="asm-label-required">*</span>
                    </label>
                    <div className="asm-select-wrapper">
                      <select
                        className={`asm-select ${!formData.serviceId ? 'asm-select--disabled' : ''}`}
                        onChange={(e) => onFormChange({ ...formData, staffId: e.target.value })}
                        value={formData.staffId}
                        disabled={!formData.serviceId || isLoadingStaff}
                      >
                        <option value="">
                          {!formData.serviceId
                            ? 'Select a service first'
                            : isLoadingStaff
                              ? `Loading ${staffLabel.toLowerCase()}s...`
                              : `Choose a ${staffLabel.toLowerCase()}...`
                          }
                        </option>
                        {qualifiedStaff.map((staff) => (
                          <option key={staff.uid || staff.id} value={staff.uid || staff.id}>
                            {staff.firstName} {staff.lastName}
                          </option>
                        ))}
                      </select>
                      <div className="asm-select-arrow">
                        {isLoadingStaff ? (
                          <div className="asm-spinner-small" />
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        )}
                      </div>
                    </div>
                    {formData.serviceId && !isLoadingStaff && qualifiedStaff.length === 0 && (
                      <p className="asm-field-warning">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          <path d="M12 9v4M12 17h.01" />
                        </svg>
                        No {staffLabel.toLowerCase()}s available for "{selectedServiceName}"
                      </p>
                    )}
                  </div>

                  {/* Selection Summary */}
                  {isFormValid && (
                    <div className="asm-summary">
                      <div className="asm-summary-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <path d="M22 4L12 14.01l-3-3" />
                        </svg>
                      </div>
                      <div className="asm-summary-text">
                        <strong>{selectedServiceName}</strong> will be assigned to{' '}
                        <strong>{qualifiedStaff.find(s => (s.uid || s.id) === formData.staffId)?.firstName} {qualifiedStaff.find(s => (s.uid || s.id) === formData.staffId)?.lastName}</strong>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="asm-footer">
              <button
                className="asm-btn asm-btn--secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                className="asm-btn asm-btn--primary"
                disabled={!isFormValid || isSubmitting || isLoadingStaff || availableServices.length === 0}
                onClick={() => onSubmit(serviceType)}
              >
                {isSubmitting ? (
                  <>
                    <div className="asm-spinner-small asm-spinner--white" />
                    Enrolling...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Enroll Service
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .asm-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          animation: asmFadeIn 0.2s ease;
        }
        @keyframes asmFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .asm-modal {
          background: #fff;
          border-radius: 20px;
          width: 100%;
          max-width: 520px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          position: relative;
          animation: asmSlideUp 0.3s ease;
          overflow: hidden;
        }
        @keyframes asmSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .asm-close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 36px;
          height: 36px;
          border: none;
          background: #f1f5f9;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          transition: all 0.2s ease;
          z-index: 10;
        }
        .asm-close-btn:hover {
          background: #e2e8f0;
          color: #1e293b;
        }

        /* Progress Indicator */
        .asm-progress {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px 24px;
          background: linear-gradient(135deg, #0052A1 0%, #003d7a 100%);
          gap: 12px;
        }
        .asm-progress-step {
          display: flex;
          align-items: center;
          gap: 8px;
          opacity: 0.5;
          transition: all 0.3s ease;
        }
        .asm-progress-step.active,
        .asm-progress-step.completed {
          opacity: 1;
        }
        .asm-step-number {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 600;
        }
        .asm-progress-step.active .asm-step-number {
          background: #FFCB10;
          color: #1e293b;
        }
        .asm-progress-step.completed .asm-step-number {
          background: #FFCB10;
          color: #78350f;
        }
        .asm-step-label {
          color: white;
          font-size: 13px;
          font-weight: 500;
        }
        .asm-progress-line {
          width: 40px;
          height: 2px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 1px;
        }

        /* Step Content */
        .asm-step-content {
          padding: 28px;
        }
        .asm-header {
          text-align: center;
          margin-bottom: 24px;
        }
        .asm-header--with-back {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          text-align: left;
        }
        .asm-header-icon {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #0052A1 0%, #003d7a 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          margin: 0 auto 16px;
        }
        .asm-back-btn {
          width: 40px;
          height: 40px;
          border: none;
          background: #f1f5f9;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .asm-back-btn:hover {
          background: #e2e8f0;
          color: #1e293b;
        }
        .asm-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 6px;
        }
        .asm-badge--therapy {
          background: #eaf4ff;
          color: #0052A1;
        }
        .asm-badge--class {
          background: #fef9e7;
          color: #92400e;
        }
        .asm-title {
          font-size: 22px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 6px 0;
        }
        .asm-subtitle {
          color: #64748b;
          font-size: 14px;
          margin: 0;
        }

        /* Type Selection Cards */
        .asm-type-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }
        .asm-type-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          background: #fff;
          cursor: pointer;
          transition: all 0.25s ease;
          text-align: left;
        }
        .asm-type-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }
        .asm-type-card--therapy:hover {
          border-color: #0052A1;
          background: linear-gradient(135deg, #eaf4ff 0%, #dbeafe 100%);
        }
        .asm-type-card--class:hover {
          border-color: #FFCB10;
          background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%);
        }
        .asm-type-icon-wrapper {
          width: 60px;
          height: 60px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .asm-type-icon--therapy {
          background: linear-gradient(135deg, #0052A1 0%, #003d7a 100%);
          color: white;
        }
        .asm-type-icon--class {
          background: linear-gradient(135deg, #FFCB10 0%, #f59e0b 100%);
          color: #78350f;
        }
        .asm-type-title {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px 0;
        }
        .asm-type-desc {
          font-size: 13px;
          color: #64748b;
          margin: 0;
        }
        .asm-type-arrow {
          margin-left: auto;
          color: #cbd5e1;
          transition: all 0.2s ease;
        }
        .asm-type-card:hover .asm-type-arrow {
          color: #64748b;
          transform: translateX(4px);
        }

        /* Form */
        .asm-form {
          margin-bottom: 24px;
        }
        .asm-field {
          margin-bottom: 20px;
        }
        .asm-label {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 8px;
        }
        .asm-label-text {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }
        .asm-label-required {
          color: #ef4444;
        }
        .asm-select-wrapper {
          position: relative;
        }
        .asm-select {
          width: 100%;
          padding: 14px 44px 14px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 15px;
          color: #1e293b;
          background: #fff;
          appearance: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .asm-select:focus {
          outline: none;
          border-color: #0052A1;
          box-shadow: 0 0 0 4px rgba(0, 82, 161, 0.1);
        }
        .asm-select:disabled,
        .asm-select--disabled {
          background: #f8fafc;
          color: #94a3b8;
          cursor: not-allowed;
        }
        .asm-select-arrow {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          pointer-events: none;
        }
        .asm-field-warning {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
          padding: 10px 12px;
          background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%);
          border: 1px solid #FFCB10;
          border-radius: 8px;
          font-size: 13px;
          color: #78350f;
        }

        /* Loading & Empty States */
        .asm-loading {
          text-align: center;
          padding: 40px 20px;
          color: #64748b;
        }
        .asm-loading p {
          margin: 16px 0 0 0;
          font-size: 14px;
        }
        .asm-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e2e8f0;
          border-top-color: #0052A1;
          border-radius: 50%;
          animation: asmSpin 0.8s linear infinite;
          margin: 0 auto;
        }
        .asm-spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid #e2e8f0;
          border-top-color: #0052A1;
          border-radius: 50%;
          animation: asmSpin 0.8s linear infinite;
        }
        .asm-spinner--white {
          border-color: rgba(255, 255, 255, 0.3);
          border-top-color: white;
        }
        @keyframes asmSpin {
          to { transform: rotate(360deg); }
        }
        .asm-empty-state {
          text-align: center;
          padding: 32px 20px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 12px;
          border: 1px dashed #cbd5e1;
        }
        .asm-empty-icon {
          color: #0052A1;
          opacity: 0.5;
          margin-bottom: 12px;
        }
        .asm-empty-state h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 8px 0;
        }
        .asm-empty-state p {
          font-size: 13px;
          color: #64748b;
          margin: 0;
          line-height: 1.5;
        }

        /* Summary */
        .asm-summary {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          background: linear-gradient(135deg, #eaf4ff 0%, #dbeafe 100%);
          border: 1px solid #93c5fd;
          border-radius: 12px;
          margin-top: 8px;
        }
        .asm-summary-icon {
          color: #0052A1;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .asm-summary-text {
          font-size: 14px;
          color: #1e40af;
          line-height: 1.5;
        }
        .asm-summary-text strong {
          font-weight: 600;
        }

        /* Footer */
        .asm-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
        }
        .asm-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .asm-btn--secondary {
          background: #f1f5f9;
          color: #475569;
          border: none;
        }
        .asm-btn--secondary:hover:not(:disabled) {
          background: #e2e8f0;
        }
        .asm-btn--primary {
          background: linear-gradient(135deg, #0052A1 0%, #003d7a 100%);
          color: white;
          border: none;
          box-shadow: 0 4px 12px rgba(0, 82, 161, 0.3);
        }
        .asm-btn--primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(0, 82, 161, 0.4);
        }
        .asm-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        /* Responsive */
        @media (max-width: 540px) {
          .asm-modal {
            max-width: 100%;
            border-radius: 16px;
          }
          .asm-step-content {
            padding: 20px;
          }
          .asm-type-card {
            padding: 16px;
          }
          .asm-type-icon-wrapper {
            width: 50px;
            height: 50px;
          }
          .asm-footer {
            flex-direction: column;
          }
          .asm-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default AddServiceModal;
