import React, { useEffect, useState } from "react";

// import readServices from "../../enrollmentDatabase/readServices"; old import duplicated
import offeringsService from "../../../../../services/offeringsService";

export default function Step4BackgroundHistory({ data, onChange }) {
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
                    .filter((service) => service.type === type)
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
      <div className="input-group">
        <label>Family Background</label>
        <textarea
          rows="4"
          value={data.backgroundHistory.familyBackground}
          onChange={(e) =>
            onChange("backgroundHistory", "familyBackground", e.target.value)
          }
          placeholder="Parents, residence, and occupations..."
          required
        />
      </div>

      {/* Family Relationships */}
      <div className="input-group">
        <label>Family Relationships</label>
        <textarea
          rows="3"
          value={data.backgroundHistory.familyRelationships}
          onChange={(e) =>
            onChange("backgroundHistory", "familyRelationships", e.target.value)
          }
          placeholder="Interactions, communication style, and siblings..."
          required
        />
      </div>

      {/* Daily Life & Activities */}
      <div className="input-group">
        <label>Daily Life & Activities</label>
        <textarea
          rows="3"
          value={data.backgroundHistory.dailyLifeActivities}
          onChange={(e) =>
            onChange("backgroundHistory", "dailyLifeActivities", e.target.value)
          }
          placeholder="Independence levels and preferred activities..."
          required
        />
      </div>

      {/* Medical History */}
      <div className="input-group">
        <label>Medical History</label>
        <textarea
          rows="2"
          value={data.backgroundHistory.medicalHistory}
          onChange={(e) =>
            onChange("backgroundHistory", "medicalHistory", e.target.value)
          }
          placeholder="Dermatitis, allergies, asthma, etc..."
          required
        />
      </div>

      {/* Developmental Background */}
      <div className="form-section-group input-group">
        <label>Developmental Background</label>
        {data.backgroundHistory.developmentalBackground.map((item, index) => (
          <div className="dev-bg-entry" key={index}>
            <div className="dev-bg-header">
              <span className="dev-bg-number">
                Developmental Entry #{index + 1}
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
          + Add Milestone/History Entry
        </button>
      </div>

      {/* School History */}
      <div className="input-group">
        <label>School History</label>
        <textarea
          rows="2"
          value={data.backgroundHistory.schoolHistory}
          onChange={(e) =>
            onChange("backgroundHistory", "schoolHistory", e.target.value)
          }
          placeholder="Current and previous school placements..."
          required
        />
      </div>

      {/* Clinical Diagnosis */}
      <div className="input-group highlight-box">
        <label>Clinical Diagnosis</label>
        <textarea
          rows="3"
          value={data.backgroundHistory.clinicalDiagnosis}
          onChange={(e) =>
            onChange("backgroundHistory", "clinicalDiagnosis", e.target.value)
          }
          placeholder="Diagnosis and support requirements..."
          required
        />
      </div>

      {/* Interventions */}
      <div className="form-section-group input-group">
        <label>Therapies / Interventions</label>
        {renderInterventionsByType("Therapy", "1 on 1 Services")}
        {renderInterventionsByType("Class", "Group Classes")}
      </div>

      {/* Strengths & Interests */}
      <div className="input-group">
        <label>Strengths & Interests</label>
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
      </div>

      {/* Social Skills */}
      <div className="input-group">
        <label>Social Skills</label>
        <textarea
          rows="2"
          value={data.backgroundHistory.socialSkills}
          onChange={(e) =>
            onChange("backgroundHistory", "socialSkills", e.target.value)
          }
          placeholder="Peer interaction and behavior regulation..."
          required
        />
      </div>
    </div>
  );
}