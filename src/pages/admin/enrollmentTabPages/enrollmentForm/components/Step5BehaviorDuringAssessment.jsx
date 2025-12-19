import React from "react";

export default function Step5BehaviorDuringAssessment({ data, onChange }) {
  return (
    <div className="form-section">
      <h3>V. BEHAVIOR DURING ASSESSMENT</h3>
      <div className="input-group">
        <textarea
          rows="8"
          value={data.behaviorDuringAssessment}
          onChange={(e) => onChange("behaviorDuringAssessment", e.target.value)}
          placeholder="Describe the student's behavior during assessment..."
        />
      </div>
    </div>
  );
}
