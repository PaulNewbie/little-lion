import React from "react";

export default function Step1IdentifyingData({ data, onChange }) {
  return (
    <div className="form-section">
      <h3>I. IDENTIFYING DATA</h3>
      <div className="form-row">
        <div className="input-group">
          <label>First Name</label>
          <input
            type="text"
            value={data.firstName}
            onChange={(e) => onChange("firstName", e.target.value)}
            placeholder="Enter First Name"
          />
        </div>
        <div className="input-group">
          <label>Last Name</label>
          <input
            type="text"
            value={data.lastName}
            onChange={(e) => onChange("lastName", e.target.value)}
            placeholder="Enter Last Name"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="input-group">
          <label>Nickname</label>
          <input
            type="text"
            value={data.nickname}
            onChange={(e) => onChange("nickname", e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>Gender</label>
          <input
            type="text"
            value={data.gender}
            onChange={(e) => onChange("gender", e.target.value)}
            placeholder="Male/Female"
          />
        </div>
      </div>

      <div className="input-group">
        <label>Address</label>
        <input
          type="text"
          value={data.address}
          onChange={(e) => onChange("address", e.target.value)}
        />
      </div>

      <div className="form-row">
        <div className="input-group">
          <label>Date of Birth</label>
          <input
            type="text"
            value={data.dateOfBirth}
            onChange={(e) => onChange("dateOfBirth", e.target.value)}
            placeholder="e.g. December 8, 2019"
          />
        </div>
        <div className="input-group">
          <label>Age</label>
          <input
            type="text"
            value={data.age}
            onChange={(e) => onChange("age", e.target.value)}
          />
        </div>
      </div>

      <div className="input-group">
        <label>School</label>
        <input
          type="text"
          value={data.school}
          onChange={(e) => onChange("school", e.target.value)}
        />
      </div>

      <div className="input-group">
        <label>Grade Level</label>
        <input
          type="text"
          value={data.gradeLevel}
          onChange={(e) => onChange("gradeLevel", e.target.value)}
        />
      </div>

      <div className="form-row">
        <div className="input-group">
          <label>Date/s of Assessment</label>
          <input
            type="text"
            value={data.assessmentDate}
            onChange={(e) => onChange("assessmentDate", e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>Examiner</label>
          <input
            type="text"
            value={data.examiner}
            onChange={(e) => onChange("examiner", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
