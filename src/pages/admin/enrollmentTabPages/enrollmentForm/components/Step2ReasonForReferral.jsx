import React from "react";
import SpeechToTextTextarea from "./SpeechToTextTextarea";

export default function Step2ReasonForReferral({ data, onChange, errors = {} }) {
  return (
    <div className="form-section">
      <h3>II. REASON FOR REFERRAL</h3>
      <div className={`input-group ${errors.reasonForReferral ? 'has-error' : ''}`}>
        <label>Reason for Referral *</label>
        <p className="field-hint">
          Click the microphone button to dictate instead of typing.
        </p>
        <SpeechToTextTextarea
          rows={10}
          value={data.reasonForReferral}
          onChange={(e) => onChange("reasonForReferral", e.target.value)}
          placeholder="Describe why the child is being referred for assessment. You can type or click the microphone to dictate..."
          required
          hasError={!!errors.reasonForReferral}
        />
        {errors.reasonForReferral && (
          <div className="field-error-message">{errors.reasonForReferral}</div>
        )}
      </div>
    </div>
  );
}
