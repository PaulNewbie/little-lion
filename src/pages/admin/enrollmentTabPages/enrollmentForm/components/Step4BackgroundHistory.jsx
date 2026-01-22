import React, { useEffect, useState } from "react";

// import readServices from "../../enrollmentDatabase/readServices"; old import duplicated
import offeringsService from "../../../../../services/offeringsService";

export default function Step4BackgroundHistory({ data, onChange, errors = {} }) {
  const [serviceOptions, setServiceOptions] = useState([]);

  useEffect(() => {
    const loadServices = async () => {
      const services = await offeringsService.getAllServices();
      setServiceOptions(services);
    };
    loadServices();
  }, []);

  // --- Developmental Background Handlers ---
  const handleAddDevBg = () => {
    const newList = [
      ...data.backgroundHistory.developmentalBackground,
      { devBgTitle: "", devBgInfo: "" },
    ];
    onChange("backgroundHistory", "developmentalBackground", newList);
  };

  const handleRemoveDevBg = (index) => {
    const newList = [...data.backgroundHistory.developmentalBackground];
    newList.splice(index, 1);
    onChange("backgroundHistory", "developmentalBackground", newList);
  };

  const handleDevBgChange = (index, field, value) => {
    const newList = [...data.backgroundHistory.developmentalBackground];
    newList[index] = { ...newList[index], [field]: value };
    onChange("backgroundHistory", "developmentalBackground", newList);
  };

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

  //helper to get chosen serviceId's by type
  const getUsedServiceIdsByType = (type) => {
    return data.backgroundHistory.interventions
      .filter((int) => int.serviceType === type && int.serviceId)
      .map((int) => int.serviceId);
  };

  // --- Helper to render intervention entries by type ---
  const renderInterventionsByType = (type, label) => {
    return (
      <div style={{ marginBottom: "20px" }}>
        <h4 style={{ fontSize: "0.9rem", marginBottom: "8px" }}>{label}</h4>
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

                      // Allow the currently selected service
                      if (service.id === int.serviceId) return true;

                      // Remove already-selected services
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
        >
          + Add {label}
        </button>
      </div>
    );
  };

  return (
    <div className="form-section">
      <h3 className="section-title">IV. BACKGROUND HISTORY</h3>

      {/* Family Background */}
      <div className={`input-group ${errors.familyBackground ? 'has-error' : ''}`}>
        <label>Family Background *</label>
        <textarea
          rows="4"
          value={data.backgroundHistory.familyBackground}
          onChange={(e) =>
            onChange("backgroundHistory", "familyBackground", e.target.value)
          }
          placeholder="Parents, residence, and occupations..."
          required
        />
        {errors.familyBackground && (
          <div className="field-error-message">{errors.familyBackground}</div>
        )}
      </div>

      {/* Family Relationships */}
      <div className={`input-group ${errors.familyRelationships ? 'has-error' : ''}`}>
        <label>Family Relationships *</label>
        <textarea
          rows="3"
          value={data.backgroundHistory.familyRelationships}
          onChange={(e) =>
            onChange("backgroundHistory", "familyRelationships", e.target.value)
          }
          placeholder="Interactions, communication style, and siblings..."
          required
        />
        {errors.familyRelationships && (
          <div className="field-error-message">{errors.familyRelationships}</div>
        )}
      </div>

      {/* Daily Life & Activities */}
      <div className={`input-group ${errors.dailyLifeActivities ? 'has-error' : ''}`}>
        <label>Daily Life & Activities *</label>
        <textarea
          rows="3"
          value={data.backgroundHistory.dailyLifeActivities}
          onChange={(e) =>
            onChange("backgroundHistory", "dailyLifeActivities", e.target.value)
          }
          placeholder="Independence levels and preferred activities..."
          required
        />
        {errors.dailyLifeActivities && (
          <div className="field-error-message">{errors.dailyLifeActivities}</div>
        )}
      </div>

      {/* Medical History */}
      <div className={`input-group ${errors.medicalHistory ? 'has-error' : ''}`}>
        <label>Medical History *</label>
        <textarea
          rows="2"
          value={data.backgroundHistory.medicalHistory}
          onChange={(e) =>
            onChange("backgroundHistory", "medicalHistory", e.target.value)
          }
          placeholder="Dermatitis, allergies, asthma, etc..."
          required
        />
        {errors.medicalHistory && (
          <div className="field-error-message">{errors.medicalHistory}</div>
        )}
      </div>

      {/* Developmental Background */}
      <div className={`form-section-group input-group ${errors.developmentalBackground ? 'has-error' : ''}`}>
        <label>Developmental Background *</label>
        {data.backgroundHistory.developmentalBackground.map((item, index) => (
          <div className="dev-bg-entry" key={index}>
            <div className="dev-bg-header">
              <span className="dev-bg-number">
                {index + 1}. Developmental Pediatric Assessment
              </span>
              {data.backgroundHistory.developmentalBackground.length > 1 && (
                <button
                  className="remove-entry-btn"
                  onClick={() => handleRemoveDevBg(index)}
                >
                  Remove
                </button>
              )}
            </div>

            <div className="dev-bg-grid">
              <div className="input-group">
                <label>Title</label>
                <input
                  type="text"
                  placeholder="e.g. Maternal History"
                  value={item.devBgTitle}
                  onChange={(e) =>
                    handleDevBgChange(index, "devBgTitle", e.target.value)
                  }
                  required
                />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Details</label>
                <textarea
                  rows="3"
                  placeholder="Enter specific details..."
                  value={item.devBgInfo}
                  onChange={(e) =>
                    handleDevBgChange(index, "devBgInfo", e.target.value)
                  }
                  required
                />
              </div>
            </div>
          </div>
        ))}

        <button className="add-point-btn" onClick={handleAddDevBg}>
          + Upload Developmental Pediatric Assessment / Diagnosis
        </button>
        {errors.developmentalBackground && (
          <div className="field-error-message">{errors.developmentalBackground}</div>
        )}
      </div>

      {/* School History */}
      <div className={`input-group ${errors.schoolHistory ? 'has-error' : ''}`}>
        <label>School History *</label>
        <textarea
          rows="2"
          value={data.backgroundHistory.schoolHistory}
          onChange={(e) =>
            onChange("backgroundHistory", "schoolHistory", e.target.value)
          }
          placeholder="Current and previous school placements..."
          required
        />
        {errors.schoolHistory && (
          <div className="field-error-message">{errors.schoolHistory}</div>
        )}
      </div>

      {/* Clinical Diagnosis */}
      <div className={`input-group highlight-box ${errors.clinicalDiagnosis ? 'has-error' : ''}`}>
        <label>Clinical Diagnosis *</label>
        <textarea
          rows="3"
          value={data.backgroundHistory.clinicalDiagnosis}
          onChange={(e) =>
            onChange("backgroundHistory", "clinicalDiagnosis", e.target.value)
          }
          placeholder="Diagnosis and support requirements..."
          required
        />
        {errors.clinicalDiagnosis && (
          <div className="field-error-message">{errors.clinicalDiagnosis}</div>
        )}
      </div>

      {/* Interventions */}
      <div className={`form-section-group input-group ${errors.interventions ? 'has-error' : ''}`}>
        <label>Therapies / Interventions *</label>
        {renderInterventionsByType("Therapy", "1 on 1 Services")}
        {renderInterventionsByType("Class", "Group Classes")}
        {errors.interventions && (
          <div className="field-error-message">{errors.interventions}</div>
        )}
      </div>

      {/* Strengths & Interests */}
      <div className={`input-group ${errors.strengthsAndInterests ? 'has-error' : ''}`}>
        <label>Strengths & Interests *</label>
        <textarea
          rows="3"
          value={data.backgroundHistory.strengthsAndInterests}
          onChange={(e) =>
            onChange(
              "backgroundHistory",
              "strengthsAndInterests",
              e.target.value
            )
          }
          placeholder="Academic skills and hobbies..."
          required
        />
        {errors.strengthsAndInterests && (
          <div className="field-error-message">{errors.strengthsAndInterests}</div>
        )}
      </div>

      {/* Social Skills */}
      <div className={`input-group ${errors.socialSkills ? 'has-error' : ''}`}>
        <label>Social Skills *</label>
        <textarea
          rows="2"
          value={data.backgroundHistory.socialSkills}
          onChange={(e) =>
            onChange("backgroundHistory", "socialSkills", e.target.value)
          }
          placeholder="Peer interaction and behavior regulation..."
          required
        />
        {errors.socialSkills && (
          <div className="field-error-message">{errors.socialSkills}</div>
        )}
      </div>
    </div>
  );
}
