import React from "react";

export default function Step2ReasonForReferral({ data, onChange, errors = {} }) {
  return (
    <div className="form-section">
      <h3>II. REASON FOR REFERRAL</h3>
      <div className={`input-group ${errors.reasonForReferral ? 'has-error' : ''}`}>
        <label>Reason for Referral *</label>
        <textarea
          rows="10"
          value={data.reasonForReferral}
          onChange={(e) => onChange("reasonForReferral", e.target.value)}
          placeholder="Type referral details here..."
          required
        />
        {errors.reasonForReferral && (
          <div className="field-error-message">{errors.reasonForReferral}</div>
        )}
      </div>
    </div>
  );
}
