import React from "react";

export default function Step4CDevelopmentEducation({ data, onChange, errors = {} }) {
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

  return (
    <div className="form-section">
      <h3 className="section-title">IV-C. DEVELOPMENT & EDUCATION</h3>
      <p className="section-description">
        Document developmental milestones and educational history.
      </p>

      {/* Developmental Background */}
      <div className={`form-section-group input-group ${errors.developmentalBackground ? 'has-error' : ''}`}>
        <label>Developmental Background *</label>
        <p className="field-hint">
          Add developmental pediatric assessments or diagnoses. You can add multiple entries.
        </p>

        {data.backgroundHistory.developmentalBackground.map((item, index) => (
          <div className="dev-bg-entry" key={index}>
            <div className="dev-bg-header">
              <span className="dev-bg-number">
                {index + 1}. Developmental Pediatric Assessment
              </span>
              {data.backgroundHistory.developmentalBackground.length > 1 && (
                <button
                  type="button"
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
                  placeholder="e.g. Maternal History, Birth History, Developmental Milestones"
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
                  placeholder="Enter specific details about this developmental area..."
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

        <button type="button" className="add-point-btn" onClick={handleAddDevBg}>
          + Add Developmental Assessment Entry
        </button>
        {errors.developmentalBackground && (
          <div className="field-error-message">{errors.developmentalBackground}</div>
        )}
      </div>

      {/* School History */}
      <div className={`input-group ${errors.schoolHistory ? 'has-error' : ''}`}>
        <label>School History *</label>
        <p className="field-hint">
          Include current and previous school placements, academic performance, and any challenges.
        </p>
        <textarea
          rows="4"
          value={data.backgroundHistory.schoolHistory}
          onChange={(e) =>
            onChange("backgroundHistory", "schoolHistory", e.target.value)
          }
          placeholder="Example: Juan is currently enrolled at ABC Learning Center (nursery level). He previously attended XYZ Preschool for 6 months but was asked to transfer due to behavioral challenges..."
          required
        />
        {errors.schoolHistory && (
          <div className="field-error-message">{errors.schoolHistory}</div>
        )}
      </div>
    </div>
  );
}
