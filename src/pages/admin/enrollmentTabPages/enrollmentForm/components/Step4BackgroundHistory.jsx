import React from "react";

const SERVICE_OPTIONS = [
  "Behavioral Management",
  "SPED One-on-One",
  "Occupational Therapy",
  "Speech Therapy",
  "Physical Therapy",
  "Counseling",
];

export default function Step4BackgroundHistory({ data, onChange }) {
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
        />
      </div>

      {/* 8. Interventions */}
      <div className="form-section-group input-group">
        <label>Therapies / Interventions</label>

        {data.backgroundHistory.interventions.length > 0 && (
          <div
            className="intervention-grid-header"
            style={{
              display: "flex",
              gap: "15px",
              marginBottom: "8px",
              paddingRight: "45px",
            }}
          >
            <label style={{ flex: 2, fontSize: "0.85rem", color: "#64748b" }}>
              Type of Service
            </label>
            <label style={{ flex: 1, fontSize: "0.85rem", color: "#64748b" }}>
              Frequency
            </label>
          </div>
        )}

        {data.backgroundHistory.interventions.map((int, index) => (
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
                value={int.type}
                onChange={(e) => {
                  const newInts = [...data.backgroundHistory.interventions];
                  newInts[index].type = e.target.value;
                  onChange("backgroundHistory", "interventions", newInts);
                }}
              >
                <option value="" disabled>
                  Select Service
                </option>
                {SERVICE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <input
                type="text"
                style={{ width: "100%" }}
                placeholder="e.g. 2x weekly"
                value={int.frequency}
                onChange={(e) => {
                  const newInts = [...data.backgroundHistory.interventions];
                  newInts[index].frequency = e.target.value;
                  onChange("backgroundHistory", "interventions", newInts);
                }}
              />
            </div>

            <button
              type="button"
              className="remove-entry-btn"
              style={{ padding: "8px", minWidth: "35px" }}
              onClick={() => handleRemoveIntervention(index)}
            >
              ✕
            </button>
          </div>
        ))}

        <button
          className="add-point-btn"
          type="button"
          style={{ marginTop: "10px" }}
          onClick={handleAddIntervention}
        >
          + Add Service
        </button>
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
        />
      </div>
    </div>
  );
}
