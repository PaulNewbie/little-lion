import React from "react";
import SpeechToTextTextarea from "./SpeechToTextTextarea";

export default function Step5BehaviorDuringAssessment({ data, onChange, errors = {} }) {
  return (
    <div className="form-section">
      <h3>V. BEHAVIOR DURING ASSESSMENT</h3>
      <div className={`input-group ${errors.behaviorDuringAssessment ? 'has-error' : ''}`}>
        <label>Behavior During Assessment *</label>
        <p className="field-hint">
          Describe cooperation, attention, mood, and any notable behaviors. Click 🎤 to dictate.
        </p>
        <SpeechToTextTextarea
          rows={8}
          value={data.behaviorDuringAssessment}
          onChange={(e) => onChange("behaviorDuringAssessment", e.target.value)}
          placeholder="Describe the student's behavior during assessment - their cooperation level, attention span, mood, responses to tasks, any challenging behaviors observed..."
          required
          hasError={!!errors.behaviorDuringAssessment}
        />
        {errors.behaviorDuringAssessment && (
          <div className="field-error-message">{errors.behaviorDuringAssessment}</div>
        )}
      </div>
    </div>
  );
}
