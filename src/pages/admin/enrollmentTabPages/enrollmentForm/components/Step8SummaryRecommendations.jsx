import React from "react";

export default function Step8SummaryRecommendations({ data, onChange, errors = {} }) {
  return (
    <div className="form-section">
      <h3>VIII. SUMMARY AND RECOMMENDATIONS</h3>

      {/* SUMMARY */}
      <div className={`assessment-result-block ${errors.assessmentSummary ? 'has-error' : ''}`}>
        <h4 className="assessment-result-title">Summary *</h4>
        <textarea
          className="assessment-result-text"
          rows="6"
          placeholder="Enter overall assessment summary..."
          value={data.assessmentSummary}
          onChange={(e) => onChange("assessmentSummary", null, e.target.value)}
          required
        />
        {errors.assessmentSummary && (
          <div className="field-error-message">{errors.assessmentSummary}</div>
        )}
      </div>

      {/* RECOMMENDATIONS */}
      {errors.recommendations && (
        <div className="field-error-message" style={{ marginBottom: '16px' }}>
          {errors.recommendations}
        </div>
      )}

      {data.assessmentTools.map((item, index) => (
        <div className="assessment-result-block" key={index}>
          <h4 className="assessment-result-title">
            {String.fromCharCode(65 + index)}. {item.tool}
          </h4>

          <textarea
            className="assessment-result-text"
            rows="5"
            placeholder="Enter recommendations for this area..."
            value={item.recommendation || ""}
            onChange={(e) => {
              const newTools = [...data.assessmentTools];
              newTools[index].recommendation = e.target.value;
              onChange("assessmentTools", null, newTools);
            }}
            required
          />
        </div>
      ))}
    </div>
  );
}
