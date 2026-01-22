import React from "react";

export default function Step1IdentifyingData({ data, onChange, errors = {} }) {
  return (
    <div className="form-section">
      <h3>I. IDENTIFYING DATA</h3>

      {/* PAIR 1: First Name and Middle Name */}
      <div className="form-row">
        <div className={`input-group ${errors.firstName ? 'has-error' : ''}`}>
          <label>First Name *</label>
          <input
            type="text"
            value={data.firstName}
            onChange={(e) => onChange("firstName", e.target.value)}
            placeholder="Enter First Name"
            required
          />
          {errors.firstName && (
            <div className="field-error-message">{errors.firstName}</div>
          )}
        </div>
        <div className="input-group">
          <label>Middle Name</label>
          <input
            type="text"
            value={data.middleName || ""}
            onChange={(e) => onChange("middleName", e.target.value)}
            placeholder="Enter Middle Name"
          />
        </div>
      </div>

      {/* PAIR 2: Last Name and Nickname */}
      <div className="form-row">
        <div className={`input-group ${errors.lastName ? 'has-error' : ''}`}>
          <label>Last Name *</label>
          <input
            type="text"
            value={data.lastName}
            onChange={(e) => onChange("lastName", e.target.value)}
            placeholder="Enter Last Name"
            required
          />
          {errors.lastName && (
            <div className="field-error-message">{errors.lastName}</div>
          )}
        </div>
        <div className="input-group">
          <label>Nickname</label>
          <input
            type="text"
            value={data.nickname}
            onChange={(e) => onChange("nickname", e.target.value)}
            placeholder="Enter Nickname"
          />
        </div>
      </div>

      {/* PAIR 3: Gender and Relationship */}
      <div className="form-row">
        <div className={`input-group ${errors.gender ? 'has-error' : ''}`}>
          <label>Gender *</label>
          <select
            value={data.gender}
            onChange={(e) => onChange("gender", e.target.value)}
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          {errors.gender && (
            <div className="field-error-message">{errors.gender}</div>
          )}
        </div>
        <div className="input-group">
          <label>Relationship to Client</label>
          <select
            value={data.relationshipToClient}
            onChange={(e) => onChange("relationshipToClient", e.target.value)}
          >
            <option value="biological child">Biological Child</option>
            <option value="adopted child">Adopted Child</option>
            <option value="foster child">Foster Child</option>
            <option value="legal guardian">Legal Guardian</option>
            <option value="Others">Others</option>
          </select>
          {data.relationshipToClient === "Others" && (
            <input
              type="text"
              placeholder="Please specify"
              onChange={(e) => onChange("relationshipToClient", e.target.value)}
              className="mt-2"
            />
          )}
        </div>
      </div>

      {/* PAIR 4: Date of Birth and Age */}
      <div className="form-row">
        <div className={`input-group ${errors.dateOfBirth ? 'has-error' : ''}`}>
          <label>Date of Birth *</label>
          <input
            type="date"
            value={data.dateOfBirth}
            onChange={(e) => onChange("dateOfBirth", e.target.value)}
          />
          {errors.dateOfBirth && (
            <div className="field-error-message">{errors.dateOfBirth}</div>
          )}
        </div>
        <div className="input-group">
          <label>Age at Assessment</label>
          <input
            type="text"
            value={data.ageAtAssessment}
            readOnly
            placeholder="Auto-calculated"
            style={{ backgroundColor: "#f0f0f0" }}
          />
        </div>
      </div>

      {/* PAIR 5: Address and School */}
      <div className="form-row">
        <div className="input-group">
          <label>Address</label>
          <input
            type="text"
            value={data.address}
            onChange={(e) => onChange("address", e.target.value)}
            placeholder="Enter Address"
          />
        </div>
        <div className="input-group">
          <label>School</label>
          <input
            type="text"
            value={data.school}
            onChange={(e) => onChange("school", e.target.value)}
            placeholder="Enter School"
          />
        </div>
      </div>

      {/* PAIR 6: Grade Level and Assessment Date */}
      <div className="form-row">
        <div className="input-group">
          <label>Grade Level</label>
          <select
            value={data.gradeLevel}
            onChange={(e) => onChange("gradeLevel", e.target.value)}
          >
            <option value="">Select Level</option>
            <option value="Nursery">Nursery</option>
            <option value="Kinder 1">Kindergraten</option>
            <option value="Kinder 1">Elementary</option>
            <option value="Others">Others</option>
          </select>
        </div>

        <div className={`input-group ${errors.assessmentDates ? 'has-error' : ''}`}>
          <label>Date of Assessment *</label>
          <input
            type="date"
            value={data.assessmentDates}
            onChange={(e) => onChange("assessmentDates", e.target.value)}
          />
          {errors.assessmentDates && (
            <div className="field-error-message">{errors.assessmentDates}</div>
          )}
        </div>
      </div>

      {/* FINAL ROW: Examiner */}
      <div className="form-row">
        <div className={`input-group ${errors.examiner ? 'has-error' : ''}`}>
          <label>Examiner *</label>
          <input
            type="text"
            value={data.examiner}
            onChange={(e) => onChange("examiner", e.target.value)}
            placeholder="Enter Examiner Name"
          />
          {errors.examiner && (
            <div className="field-error-message">{errors.examiner}</div>
          )}
        </div>
        <div className="input-group">{/* Empty for spacing */}</div>
      </div>
    </div>
  );
}
