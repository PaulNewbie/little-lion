import React from "react";

export default function Step6AssessmentTools({ data, onChange }) {
  const handleAddAssessmentTool = () => {
    const newTools = [...data.assessmentTools, { tool: "", details: "" }];
    onChange("assessmentTools", null, newTools);
  };

  const handleRemoveAssessmentTool = (index) => {
    const newTools = data.assessmentTools.filter((_, i) => i !== index);
    onChange("assessmentTools", null, newTools);
  };

  const handleAssessmentToolChange = (index, field, value) => {
    const newTools = [...data.assessmentTools];
    newTools[index] = { ...newTools[index], [field]: value };
    onChange("assessmentTools", null, newTools);
  };

  return (
    <div className="form-section">
      <h3>VI. ASSESSMENT TOOLS AND MEASURES</h3>

      {data.assessmentTools.length > 0 && (
        <div className="assessment-tools-header">
          <label>Tool / Measure</label>
          <label>Details</label>
        </div>
      )}

      {data.assessmentTools.map((item, index) => (
        <div className="assessment-tool-row" key={index}>
          <div className="assessment-tool-field">
            <input
              type="text"
              placeholder="e.g. Cognitive / Pre-academic Skills"
              value={item.tool}
              onChange={(e) =>
                handleAssessmentToolChange(index, "tool", e.target.value)
              }
              required
            />
          </div>

          <div className="assessment-tool-field">
            <textarea
              rows="2"
              placeholder="Observation, structured tasks, ECCD Checklist..."
              value={item.details}
              onChange={(e) =>
                handleAssessmentToolChange(index, "details", e.target.value)
              }
            />
          </div>

          <button
            type="button"
            className="remove-entry-btn"
            onClick={() => handleRemoveAssessmentTool(index)}
          >
            ✕
          </button>
        </div>
      ))}

      <button
        type="button"
        className="add-point-btn"
        onClick={handleAddAssessmentTool}
      >
        + Add Tool / Measure
      </button>
    </div>
  );
}
