import React from "react";

export default function Step2ReasonForReferral({ data, onChange }) {
  return (
    <div className="form-section">
      <h3>II. REASON FOR REFERRAL</h3>
      <div className="input-group">
        <textarea
          rows="10"
          value={data.reasonForReferral}
          onChange={(e) => onChange("reasonForReferral", e.target.value)}
          placeholder="Type referral details here..."
        />
      </div>
    </div>
  );
}
