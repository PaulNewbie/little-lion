// STEP 3: PURPOSE OF ASSESSMENT
import React from "react";

export default function Step3Form({ studentInput, setStudentInput }) {
  return (
    <div className="form-step">
      <div className="input-group">
        <label>Purpose of Assessment</label>
        <textarea
          value={studentInput.purposeOfAssessment}
          onChange={(e) =>
            setStudentInput({
              ...studentInput,
              purposeOfAssessment: e.target.value,
            })
          }
          rows={4}
        />
      </div>
    </div>
  );
}
