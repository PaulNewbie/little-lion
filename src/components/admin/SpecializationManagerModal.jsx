import React, { useState, useEffect } from 'react';
import '../common/Modal.css'; // Assuming you have base modal styles, or we can use inline styles matching your theme

const SpecializationManagerModal = ({ isOpen, onClose, staff, allServices, onSave, role }) => {
  const [activeSpecs, setActiveSpecs] = useState([]);
  const [inactiveSpecs, setInactiveSpecs] = useState([]);
  const [selectedNewSpec, setSelectedNewSpec] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Deactivation confirmation state
  const [confirmingDeactivation, setConfirmingDeactivation] = useState(null);
  const [confirmationInput, setConfirmationInput] = useState('');

  // Initialize state when staff changes
  useEffect(() => {
    if (staff) {
      setActiveSpecs(staff.specializations || []);
      setInactiveSpecs(staff.deactivatedSpecializations || []);
      setSelectedNewSpec('');
      setConfirmingDeactivation(null);
      setConfirmationInput('');
    }
  }, [staff]);

  if (!isOpen || !staff) return null;

  // Filter available services (exclude ones the staff already has, active or inactive)
  const availableToAdd = allServices.filter(service => {
    const serviceName = service.name || service;
    return !activeSpecs.includes(serviceName) && !inactiveSpecs.includes(serviceName);
  });

  const handleDeactivateClick = (spec) => {
    setConfirmingDeactivation(spec);
    setConfirmationInput('');
  };

  const handleConfirmDeactivation = () => {
    if (confirmationInput.toLowerCase() === confirmingDeactivation.toLowerCase()) {
      setActiveSpecs(prev => prev.filter(s => s !== confirmingDeactivation));
      setInactiveSpecs(prev => [...prev, confirmingDeactivation]);
      setConfirmingDeactivation(null);
      setConfirmationInput('');
    }
  };

  const handleCancelDeactivation = () => {
    setConfirmingDeactivation(null);
    setConfirmationInput('');
  };

  const handleReactivate = (spec) => {
    setInactiveSpecs(prev => prev.filter(s => s !== spec));
    setActiveSpecs(prev => [...prev, spec]);
  };

  const handleAdd = () => {
    if (selectedNewSpec) {
      setActiveSpecs(prev => [...prev, selectedNewSpec]);
      setSelectedNewSpec('');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(staff.uid, {
        specializations: activeSpecs,
        deactivatedSpecializations: inactiveSpecs
      });
      onClose();
    } catch (error) {
      console.error("Failed to save specializations", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-modal-overlay" onClick={onClose} style={{zIndex: 1000}}>
      <div 
        className="mt-form-container" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '600px', width: '90%' }}
      >
        <h2 className="mt-form-title">
          Manage {role === 'teacher' ? 'Subjects' : 'Specializations'}
        </h2>
        <p style={{ color: '#64748b', marginBottom: '20px' }}>
          For: <strong>{staff.firstName} {staff.lastName}</strong>
        </p>

        {/* --- ACTIVE SPECIALIZATIONS --- */}
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>✅ Active (Currently Offering)</h4>
          <div style={styles.listContainer}>
            {activeSpecs.length === 0 ? (
              <p style={styles.emptyText}>No active specializations.</p>
            ) : (
              activeSpecs.map((spec, idx) => (
                <div key={idx} style={styles.listItem}>
                  {confirmingDeactivation === spec ? (
                    // Confirmation UI
                    <div style={styles.confirmationContainer}>
                      <p style={styles.confirmationText}>
                        Type "<strong>{spec}</strong>" to confirm deactivation:
                      </p>
                      <div style={styles.confirmationInputRow}>
                        <input
                          type="text"
                          value={confirmationInput}
                          onChange={(e) => setConfirmationInput(e.target.value)}
                          placeholder={spec}
                          style={styles.confirmationInput}
                          autoFocus
                        />
                        <button
                          onClick={handleConfirmDeactivation}
                          disabled={confirmationInput.toLowerCase() !== spec.toLowerCase()}
                          style={{
                            ...styles.confirmBtn,
                            background: confirmationInput.toLowerCase() === spec.toLowerCase()
                              ? '#ef4444' : '#e2e8f0',
                            color: confirmationInput.toLowerCase() === spec.toLowerCase()
                              ? 'white' : '#94a3b8',
                            cursor: confirmationInput.toLowerCase() === spec.toLowerCase()
                              ? 'pointer' : 'not-allowed',
                          }}
                        >
                          Confirm
                        </button>
                        <button
                          onClick={handleCancelDeactivation}
                          style={styles.cancelConfirmBtn}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Normal display
                    <>
                      <span>{spec}</span>
                      <button
                        onClick={() => handleDeactivateClick(spec)}
                        style={{...styles.actionBtn, color: '#ef4444', borderColor: '#fecaca'}}
                        title="Deactivate"
                        disabled={confirmingDeactivation !== null}
                      >
                        Deactivate ⛔
                      </button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* --- INACTIVE SPECIALIZATIONS --- */}
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>⛔ Inactive (Temporarily Disabled)</h4>
          <div style={{...styles.listContainer, background: '#f8fafc'}}>
            {inactiveSpecs.length === 0 ? (
              <p style={styles.emptyText}>No inactive specializations.</p>
            ) : (
              inactiveSpecs.map((spec, idx) => (
                <div key={idx} style={styles.listItem}>
                  <span style={{color: '#94a3b8'}}>{spec}</span>
                  <button 
                    onClick={() => handleReactivate(spec)}
                    style={{...styles.actionBtn, color: '#22c55e', borderColor: '#bbf7d0'}}
                    title="Reactivate"
                  >
                    Reactivate ✅
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* --- ADD NEW --- */}
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>➕ Add New</h4>
          <div style={{ display: 'flex', gap: '10px' }}>
            <select
              value={selectedNewSpec}
              onChange={(e) => setSelectedNewSpec(e.target.value)}
              style={styles.select}
            >
              <option value="">Select Service...</option>
              {availableToAdd.map((s, i) => (
                <option key={i} value={s.name || s}>{s.name || s}</option>
              ))}
            </select>
            <button 
              onClick={handleAdd}
              disabled={!selectedNewSpec}
              style={{
                padding: '8px 16px',
                background: selectedNewSpec ? '#3b82f6' : '#cbd5e1',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: selectedNewSpec ? 'pointer' : 'not-allowed',
                fontWeight: 'bold'
              }}
            >
              Add
            </button>
          </div>
        </div>

        {/* --- ACTIONS --- */}
        <div className="mt-action-row" style={{ marginTop: '20px' }}>
          <button 
            type="button" 
            onClick={onClose} 
            disabled={isSaving}
            className="mt-btn-cancel"
          >
            CANCEL
          </button>
          <button 
            type="button" 
            onClick={handleSave}
            disabled={isSaving}
            className={`mt-btn-submit ${isSaving ? 'loading' : 'normal'}`}
            style={{ width: 'auto', paddingLeft: '30px', paddingRight: '30px'}}
          >
            {isSaving ? 'SAVING...' : 'SAVE CHANGES'}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  section: {
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '0.85rem',
    textTransform: 'uppercase',
    color: '#64748b',
    fontWeight: '700',
    marginBottom: '8px',
  },
  listContainer: {
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 15px',
    borderBottom: '1px solid #f1f5f9',
    fontSize: '0.95rem',
    background: 'white',
  },
  emptyText: {
    padding: '15px',
    color: '#94a3b8',
    fontStyle: 'italic',
    fontSize: '0.9rem',
    textAlign: 'center',
  },
  actionBtn: {
    background: 'white',
    border: '1px solid',
    borderRadius: '6px',
    padding: '4px 10px',
    fontSize: '0.75rem',
    fontWeight: '600',
    cursor: 'pointer',
    textTransform: 'uppercase',
  },
  select: {
    flex: 1,
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '0.9rem',
  },
  confirmationContainer: {
    width: '100%',
  },
  confirmationText: {
    fontSize: '0.85rem',
    color: '#64748b',
    marginBottom: '8px',
  },
  confirmationInputRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  confirmationInput: {
    flex: 1,
    padding: '8px 12px',
    border: '2px solid #fecaca',
    borderRadius: '6px',
    fontSize: '0.9rem',
    outline: 'none',
  },
  confirmBtn: {
    padding: '8px 14px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    transition: 'all 0.2s',
  },
  cancelConfirmBtn: {
    padding: '8px 14px',
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#64748b',
    cursor: 'pointer',
    textTransform: 'uppercase',
  },
};

export default SpecializationManagerModal;