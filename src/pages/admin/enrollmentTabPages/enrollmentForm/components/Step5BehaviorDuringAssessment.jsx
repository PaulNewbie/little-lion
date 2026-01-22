import React from "react";

export default function Step5BehaviorDuringAssessment({ data, onChange, errors = {} }) {
  return (
    <div className="form-section">
      <h3>V. BEHAVIOR DURING ASSESSMENT</h3>
      <div className={`input-group ${errors.behaviorDuringAssessment ? 'has-error' : ''}`}>
        <label>Behavior During Assessment *</label>
        <textarea
          rows="8"
          value={data.behaviorDuringAssessment}
          onChange={(e) => onChange("behaviorDuringAssessment", e.target.value)}
          placeholder="Describe the student's behavior during assessment..."
          required
        />
        {errors.behaviorDuringAssessment && (
          <div className="field-error-message">{errors.behaviorDuringAssessment}</div>
        )}
      </div>
    </div>
  );
}
