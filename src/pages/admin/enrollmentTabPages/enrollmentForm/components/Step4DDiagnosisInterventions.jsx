import React, { useEffect, useState } from "react";
import offeringsService from "../../../../../services/offeringsService";

export default function Step4DDiagnosisInterventions({ data, onChange, errors = {} }) {
  const [serviceOptions, setServiceOptions] = useState([]);

  useEffect(() => {
    const loadServices = async () => {
      const services = await offeringsService.getAllServices();
      setServiceOptions(services);
    };
    loadServices();
  }, []);

  // --- Intervention Handlers ---
  const handleAddInterventionType = (type) => {
    const newInts = [
      ...data.backgroundHistory.interventions,
      { serviceType: type, serviceId: "", name: "", frequency: "" },
    ];
    onChange("backgroundHistory", "interventions", newInts);
  };

  const handleRemoveInterventionType = (index) => {
    const newInts = data.backgroundHistory.interventions.filter(
      (_, i) => i !== index
    );
    onChange("backgroundHistory", "interventions", newInts);
  };

  const handleInterventionChange = (index, field, value) => {
    const newInts = [...data.backgroundHistory.interventions];
    newInts[index] = { ...newInts[index], [field]: value };
    onChange("backgroundHistory", "interventions", newInts);
  };

  // --- Handler for service selection (stores both ID and name) ---
  const handleServiceSelect = (index, serviceId) => {
    const selectedService = serviceOptions.find((s) => s.id === serviceId);
    const newInts = [...data.backgroundHistory.interventions];
    newInts[index] = {
      ...newInts[index],
      serviceId: serviceId,
      name: selectedService ? selectedService.name : "",
    };
    onChange("backgroundHistory", "interventions", newInts);
  };

  // Helper to get chosen serviceId's by type
  const getUsedServiceIdsByType = (type) => {
    return data.backgroundHistory.interventions
      .filter((int) => int.serviceType === type && int.serviceId)
      .map((int) => int.serviceId);
  };

  // Count available services and current interventions by type
  const getServiceCountByType = (type) => {
    return serviceOptions.filter((s) => s.type === type).length;
  };

  const getInterventionCountByType = (type) => {
    return data.backgroundHistory.interventions.filter((int) => int.serviceType === type).length;
  };

  const canAddIntervention = (type) => {
    return getInterventionCountByType(type) < getServiceCountByType(type);
  };

  // --- Helper to render intervention entries by type ---
  const renderInterventionsByType = (type, label) => {
    return (
      <div style={{ marginBottom: "20px" }}>
        <h4 style={{ fontSize: "0.95rem", marginBottom: "10px", color: "#374151" }}>{label}</h4>
        {data.backgroundHistory.interventions
          .map((int, idx) => ({ ...int, originalIndex: idx }))
          .filter((int) => int.serviceType === type)
          .map((int) => (
            <div
              key={int.originalIndex}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "15px",
                marginBottom: "10px",
              }}
            >
              {/* Service Dropdown */}
              <div style={{ flex: 2 }}>
                <select
                  style={{ width: "100%" }}
                  value={int.serviceId}
                  onChange={(e) =>
                    handleServiceSelect(int.originalIndex, e.target.value)
                  }
                >
                  <option value="" disabled>
                    Select {label}
                  </option>
                  {serviceOptions
                    .filter((service) => {
                      if (service.type !== type) return false;
                      const usedServiceIds = getUsedServiceIdsByType(type);
                      if (service.id === int.serviceId) return true;
                      return !usedServiceIds.includes(service.id);
                    })
                    .map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Frequency Input */}
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  placeholder="e.g. 2x weekly"
                  value={int.frequency}
                  onChange={(e) =>
                    handleInterventionChange(
                      int.originalIndex,
                      "frequency",
                      e.target.value
                    )
                  }
                  required
                />
              </div>

              {/* Remove Button */}
              <button
                type="button"
                className="remove-entry-btn"
                onClick={() => handleRemoveInterventionType(int.originalIndex)}
              >
                ✕
              </button>
            </div>
          ))}

        {/* Add Button */}
        <button
          type="button"
          className="add-point-btn"
          onClick={() => handleAddInterventionType(type)}
          disabled={!canAddIntervention(type)}
          style={!canAddIntervention(type) ? { opacity: 0.5, cursor: "not-allowed" } : {}}
        >
          + Add {label}
          {getServiceCountByType(type) > 0 && (
            <span style={{ marginLeft: "8px", fontSize: "0.8rem", opacity: 0.7 }}>
              ({getInterventionCountByType(type)}/{getServiceCountByType(type)})
            </span>
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="form-section">
      <h3 className="section-title">IV-D. DIAGNOSIS & INTERVENTIONS</h3>
      <p className="section-description">
        Document the clinical diagnosis and current/previous interventions.
      </p>

      {/* Clinical Diagnosis */}
      <div className={`input-group highlight-box ${errors.clinicalDiagnosis ? 'has-error' : ''}`}>
        <label>Clinical Diagnosis *</label>
        <p className="field-hint">
          Include the formal diagnosis and support requirements.
        </p>
        <textarea
          rows="4"
          value={data.backgroundHistory.clinicalDiagnosis}
          onChange={(e) =>
            onChange("backgroundHistory", "clinicalDiagnosis", e.target.value)
          }
          placeholder="Example: Autism Spectrum Disorder (ASD) - Level 2, requiring substantial support. Diagnosed by Dr. Santos at Philippine Children's Medical Center on January 2024..."
          required
        />
        {errors.clinicalDiagnosis && (
          <div className="field-error-message">{errors.clinicalDiagnosis}</div>
        )}
      </div>

      {/* Interventions */}
      <div className={`form-section-group input-group ${errors.interventions ? 'has-error' : ''}`}>
        <label>Therapies / Interventions *</label>
        <p className="field-hint">
          Add current or previous therapies and their frequency. At least one intervention is required.
        </p>
        {renderInterventionsByType("Therapy", "1 on 1 Services")}
        {renderInterventionsByType("Class", "Group Classes")}
        {errors.interventions && (
          <div className="field-error-message">{errors.interventions}</div>
        )}
      </div>
    </div>
  );
}
