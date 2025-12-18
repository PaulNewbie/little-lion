// STEP 2: REASON FOR REFERRAL
import React from "react";

export default function Step2Form({ studentInput, setStudentInput }) {
  return (
    <div className="form-step">
      <div className="input-group">
        <label>Reason for Referral</label>
        <textarea
          value={studentInput.reasonForReferral}
          onChange={(e) =>
            setStudentInput({
              ...studentInput,
              reasonForReferral: e.target.value,
            })
          }
          rows={4}
        />
      </div>
    </div>
  );
}
