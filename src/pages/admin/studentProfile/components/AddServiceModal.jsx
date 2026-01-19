import React from 'react';

/**
 * AddServiceModal - Modal for adding services to a student (Admin only)
 */
const AddServiceModal = ({
  isOpen,
  serviceType,
  availableServices,
  formData,
  onFormChange,
  qualifiedStaff,
  isLoadingStaff,
  isSubmitting,
  onSubmit,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="add-service-overlay">
      <div className="add-service-modal">
        <h3>Enroll in {serviceType}</h3>
        <div className="modal-form-body">
          {availableServices.length === 0 ? (
            <p className="modal-warning">
              No services available for this student based on recorded
              interventions. Please check Background History.
            </p>
          ) : null}
          <select
            className="modal-select"
            onChange={(e) => onFormChange({ ...formData, serviceId: e.target.value })}
            value={formData.serviceId}
          >
            <option value="">Select Service...</option>
            {availableServices.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            className="modal-select spaced"
            onChange={(e) => onFormChange({ ...formData, staffId: e.target.value })}
            value={formData.staffId}
            disabled={!formData.serviceId || isLoadingStaff}
          >
            <option value="">
              {isLoadingStaff ? "Loading Staff..." : "Select Staff..."}
            </option>
            {qualifiedStaff.map((t) => (
              <option key={t.uid || t.id} value={t.uid || t.id}>
                {t.firstName} {t.lastName}
              </option>
            ))}
          </select>
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-confirm"
            disabled={isSubmitting || isLoadingStaff}
            onClick={onSubmit}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddServiceModal;
