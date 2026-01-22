import React from "react";

export default function Step7AssessmentResults({ data, onChange, errors = {} }) {
  return (
    <div className="form-section">
      <h3>VII. ASSESSMENT RESULTS</h3>

      {errors.assessmentResults && (
        <div className="field-error-message" style={{ marginBottom: '16px' }}>
          {errors.assessmentResults}
        </div>
      )}

      {data.assessmentTools.map((item, index) => (
        <div className="assessment-result-block" key={index}>
          <h4 className="assessment-result-title">
            {String.fromCharCode(65 + index)}. {item.tool}
          </h4>

          <textarea
            className="assessment-result-text"
            rows="6"
            placeholder="Enter assessment findings and observations..."
            value={item.result || ""}
            onChange={(e) => {
              const newTools = [...data.assessmentTools];
              newTools[index].result = e.target.value;
              onChange("assessmentTools", null, newTools);
            }}
            required
          />
        </div>
      ))}
    </div>
  );
}
