import React, { useEffect, useState } from "react";
import readServices from "../../enrollmentDatabase/readServices";

export default function Step4BackgroundHistory({ data, onChange }) {
  const [serviceOptions, setServiceOptions] = useState([]);

  useEffect(() => {
    const loadServices = async () => {
      const services = await readServices.getTherapyServices();
      setServiceOptions(services);
    };

    loadServices();
  }, []);

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

  const handleAddIntervention = () => {
    const newInts = [
      ...data.backgroundHistory.interventions,
      { type: "", frequency: "" },
    ];
    onChange("backgroundHistory", "interventions", newInts);
  };

  const handleRemoveIntervention = (index) => {
    const newInts = data.backgroundHistory.interventions.filter(
      (_, i) => i !== index
    );
    onChange("backgroundHistory", "interventions", newInts);
  };

  return (
    <div className="form-section">
      <h3 className="section-title">IV. BACKGROUND HISTORY</h3>

      {/* 1. Family Background */}
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

      {/* 2. Family Relationships */}
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

      {/* 3. Daily Life & Activities */}
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

      {/* 4. Medical History */}
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

      {/* 5. Developmental Background (Dynamic) */}
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

      {/* 6. School History */}
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

      {/* 7. Clinical Diagnosis */}
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

      {/* 8. Interventions */}
      <div className="form-section-group input-group">
        <label>Therapies / Interventions</label>

        {/* ===================== */}
        {/* 1 ON 1 SERVICES */}
        {/* ===================== */}
        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ fontSize: "0.9rem", marginBottom: "8px" }}>
            1 on 1 Services
          </h4>

          {data.backgroundHistory.interventions
            .filter((int) => int.serviceType === "Therapy")
            .map((int, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",
                  marginBottom: "10px",
                }}
              >
                <div style={{ flex: 2 }}>
                  <select
                    style={{ width: "100%" }}
                    value={int.name}
                    onChange={(e) => {
                      const newInts = [...data.backgroundHistory.interventions];
                      newInts[index].name = e.target.value;
                      onChange("backgroundHistory", "interventions", newInts);
                    }}
                  >
                    <option value="" disabled>
                      Select 1 on 1 Service
                    </option>

                    {serviceOptions
                      .filter((service) => service.type === "Therapy")
                      .map((service) => (
                        <option key={service.id} value={service.name}>
                          {service.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    placeholder="e.g. 2x weekly"
                    value={int.frequency}
                    onChange={(e) => {
                      const newInts = [...data.backgroundHistory.interventions];
                      newInts[index].frequency = e.target.value;
                      onChange("backgroundHistory", "interventions", newInts);
                    }}
                    required
                  />
                </div>

                <button
                  type="button"
                  className="remove-entry-btn"
                  onClick={() => handleRemoveIntervention(index)}
                >
                  ✕
                </button>
              </div>
            ))}

          <button
            type="button"
            className="add-point-btn"
            onClick={() => {
              const newInts = [
                ...data.backgroundHistory.interventions,
                { serviceType: "Therapy", name: "", frequency: "" },
              ];
              onChange("backgroundHistory", "interventions", newInts);
            }}
          >
            + Add 1 on 1 Service
          </button>
        </div>

        {/* ===================== */}
        {/* GROUP CLASSES */}
        {/* ===================== */}
        <div>
          <h4 style={{ fontSize: "0.9rem", marginBottom: "8px" }}>
            Group Classes
          </h4>

          {data.backgroundHistory.interventions
            .filter((int) => int.serviceType === "Class")
            .map((int, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",
                  marginBottom: "10px",
                }}
              >
                <div style={{ flex: 2 }}>
                  <select
                    style={{ width: "100%" }}
                    value={int.name}
                    onChange={(e) => {
                      const newInts = [...data.backgroundHistory.interventions];
                      newInts[index].name = e.target.value;
                      onChange("backgroundHistory", "interventions", newInts);
                    }}
                  >
                    <option value="" disabled>
                      Select Group Class
                    </option>

                    {serviceOptions
                      .filter((service) => service.type === "Class")
                      .map((service) => (
                        <option key={service.id} value={service.name}>
                          {service.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    placeholder="e.g. 2x weekly"
                    value={int.frequency}
                    onChange={(e) => {
                      const newInts = [...data.backgroundHistory.interventions];
                      newInts[index].frequency = e.target.value;
                      onChange("backgroundHistory", "interventions", newInts);
                    }}
                    required
                  />
                </div>

                <button
                  type="button"
                  className="remove-entry-btn"
                  onClick={() => handleRemoveIntervention(index)}
                >
                  ✕
                </button>
              </div>
            ))}

          <button
            type="button"
            className="add-point-btn"
            onClick={() => {
              const newInts = [
                ...data.backgroundHistory.interventions,
                { serviceType: "Class", name: "", frequency: "" },
              ];
              onChange("backgroundHistory", "interventions", newInts);
            }}
          >
            + Add Group Class
          </button>
        </div>
      </div>

      {/* 9. Strengths & Interests */}
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

      {/* 10. Social Skills */}
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
