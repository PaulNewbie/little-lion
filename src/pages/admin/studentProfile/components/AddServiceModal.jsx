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
    <div className="add-service-overlay">
      <div className="add-service-modal">
        
        {/* STEP 1: Service Type Selection */}
        {!serviceType && (
          <>
            <h3>Add New Service</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px', textAlign: 'center' }}>
              What type of service would you like to enroll?
            </p>
            
            <div className="service-type-buttons">
              <button
                className="service-type-btn service-type-btn--therapy"
                onClick={() => handleSelectType('Therapy')}
              >
                <span className="service-type-icon">🧠</span>
                <span className="service-type-label">Therapy Service</span>
                <span className="service-type-desc">1-on-1 sessions with a therapist</span>
              </button>

              <button
                className="service-type-btn service-type-btn--class"
                onClick={() => handleSelectType('Class')}
              >
                <span className="service-type-icon">👥</span>
                <span className="service-type-label">Group Class</span>
                <span className="service-type-desc">Group activities with a teacher</span>
              </button>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={onClose}>Cancel</button>
            </div>
          </>
        )}

        {/* STEP 2: Service & Staff Selection */}
        {serviceType && (
          <>
            <div className="modal-header-with-back">
              <button className="back-btn" onClick={handleBack} title="Back">←</button>
              <div>
                <span className={`type-badge type-badge--${serviceType.toLowerCase()}`}>
                  {isTherapy ? '🧠 Therapy' : '👥 Group Class'}
                </span>
                <h3>Enroll in {serviceType}</h3>
              </div>
            </div>

            <div className="modal-form-body">
              {loadingServices ? (
                <p className="loading-text">Loading services...</p>
              ) : availableServices.length === 0 ? (
                <div className="modal-warning">
                  <strong>⚠️ No services available</strong><br />
                  <span>
                    Either no {serviceType.toLowerCase()} services were recorded in Background History (Step IV), 
                    or all matching services are already enrolled.
                  </span>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Select Service *</label>
                    <select
                      className="modal-select"
                      onChange={(e) => onFormChange({ ...formData, serviceId: e.target.value, staffId: '' })}
                      value={formData.serviceId}
                    >
                      <option value="">-- Select {serviceType} Service --</option>
                      {availableServices.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Assign {staffLabel} *</label>
                    <select
                      className="modal-select"
                      onChange={(e) => onFormChange({ ...formData, staffId: e.target.value })}
                      value={formData.staffId}
                      disabled={!formData.serviceId || isLoadingStaff}
                    >
                      <option value="">
                        {!formData.serviceId 
                          ? '-- Select a service first --'
                          : isLoadingStaff 
                            ? `Loading ${staffLabel}s...` 
                            : `-- Select ${staffLabel} --`
                        }
                      </option>
                      {qualifiedStaff.map((staff) => (
                        <option key={staff.uid || staff.id} value={staff.uid || staff.id}>
                          {staff.firstName} {staff.lastName}
                        </option>
                      ))}
                    </select>
                    
                    {formData.serviceId && !isLoadingStaff && qualifiedStaff.length === 0 && (
                      <p className="form-warning">
                        ⚠️ No {staffLabel.toLowerCase()}s qualified for "{selectedServiceName}"
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button
                className="btn-confirm"
                disabled={!isFormValid || isSubmitting || isLoadingStaff || availableServices.length === 0}
                onClick={() => onSubmit(serviceType)}
              >
                {isSubmitting ? 'Enrolling...' : 'Confirm'}
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        .add-service-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .add-service-modal {
          background: #fff;
          border-radius: 12px;
          padding: 24px;
          min-width: 400px;
          max-width: 480px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }
        .add-service-modal h3 {
          margin: 0 0 16px 0;
          text-align: center;
          color: #1e293b;
        }
        .modal-header-with-back {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }
        .modal-header-with-back h3 {
          margin: 0;
          text-align: left;
        }
        .back-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.3rem;
          padding: 4px 8px;
          border-radius: 4px;
        }
        .back-btn:hover { background: #f1f5f9; }
        .type-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
          margin-bottom: 4px;
        }
        .type-badge--therapy { background: #f3e8ff; color: #7c3aed; }
        .type-badge--class { background: #dcfce7; color: #16a34a; }
        .service-type-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }
        .service-type-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          background: #fff;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .service-type-btn:hover {
          background: #f8fafc;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .service-type-btn--therapy:hover { border-color: #8b5cf6; background: #faf5ff; }
        .service-type-btn--class:hover { border-color: #10b981; background: #f0fdf4; }
        .service-type-icon { font-size: 2rem; margin-bottom: 8px; }
        .service-type-label { font-weight: 600; color: #1e293b; margin-bottom: 4px; }
        .service-type-desc { font-size: 0.85rem; color: #64748b; }
        .modal-form-body { margin-bottom: 16px; }
        .loading-text { text-align: center; color: #64748b; padding: 20px; }
        .modal-warning {
          padding: 16px;
          background: #fef3c7;
          border: 1px solid #fbbf24;
          border-radius: 8px;
          color: #92400e;
          font-size: 0.9rem;
        }
        .form-group { margin-bottom: 16px; }
        .form-label { display: block; font-weight: 500; margin-bottom: 6px; color: #374151; }
        .form-warning { color: #b45309; font-size: 0.8rem; margin-top: 6px; }
        .modal-select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.95rem;
          background: #fff;
        }
        .modal-select:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        .modal-select:disabled { background: #f3f4f6; cursor: not-allowed; }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }
        .btn-cancel {
          padding: 10px 20px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: #fff;
          cursor: pointer;
          font-weight: 500;
        }
        .btn-cancel:hover:not(:disabled) { background: #f3f4f6; }
        .btn-confirm {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          background: #3b82f6;
          color: #fff;
          font-weight: 500;
          cursor: pointer;
        }
        .btn-confirm:hover:not(:disabled) { background: #2563eb; }
        .btn-confirm:disabled { background: #93c5fd; cursor: not-allowed; }
      `}</style>
    </div>
  );
};

export default AddServiceModal;