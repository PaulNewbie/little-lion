// STEP 1: IDENTIFYING DATA
import React from "react";

export default function Step1Form({ studentInput, setStudentInput }) {
  return (
    <div className="form-step">
      <div className="input-group">
        <label>First Name</label>
        <input
          type="text"
          value={studentInput.firstName}
          onChange={(e) =>
            setStudentInput({ ...studentInput, firstName: e.target.value })
          }
          required
        />
      </div>
      <div className="input-group">
        <label>Last Name</label>
        <input
          type="text"
          value={studentInput.lastName}
          onChange={(e) =>
            setStudentInput({ ...studentInput, lastName: e.target.value })
          }
          required
        />
      </div>
    </div>
  );
}
