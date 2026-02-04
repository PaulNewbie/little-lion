import React, { useEffect, useState } from "react";

// Grade level category options
const GRADE_CATEGORIES = [
  { value: "", label: "Select Level" },
  { value: "Nursery", label: "Nursery", hasNumber: false },
  { value: "Kinder", label: "Kinder", hasNumber: true, maxNumber: 2 },
  { value: "Grade", label: "Grade", hasNumber: true, maxNumber: 12 },
  { value: "College", label: "College", hasNumber: false },
  { value: "Not Applicable", label: "Not Applicable", hasNumber: false },
];

export default function Step1IdentifyingData({ data, onChange, errors = {}, currentUser }) {
  // Check if user can edit examiner field (admin/super_admin only)
  const canEditExaminer = currentUser?.role === "admin" || currentUser?.role === "super_admin";

  // Parse current grade level into category and number
  const parseGradeLevel = (gradeLevel) => {
    if (!gradeLevel) return { category: "", number: "" };

    // Check if it matches "Kinder X" or "Grade X" pattern
    const kinderMatch = gradeLevel.match(/^Kinder\s*(\d+)?$/i);
    if (kinderMatch) {
      return { category: "Kinder", number: kinderMatch[1] || "" };
    }

    const gradeMatch = gradeLevel.match(/^Grade\s*(\d+)?$/i);
    if (gradeMatch) {
      return { category: "Grade", number: gradeMatch[1] || "" };
    }

    // For other values (Nursery, College, Not Applicable)
    const category = GRADE_CATEGORIES.find(c => c.value === gradeLevel);
    if (category) {
      return { category: gradeLevel, number: "" };
    }

    return { category: "", number: "" };
  };

  const { category: gradeCategory, number: gradeNumber } = parseGradeLevel(data.gradeLevel);

  // Handle grade category change
  const handleGradeCategoryChange = (newCategory) => {
    const categoryConfig = GRADE_CATEGORIES.find(c => c.value === newCategory);
    if (categoryConfig?.hasNumber) {
      // If category needs a number, set default to "1"
      onChange("gradeLevel", `${newCategory} 1`);
    } else {
      onChange("gradeLevel", newCategory);
    }
  };

  // Handle grade number change
  const handleGradeNumberChange = (newNumber) => {
    if (gradeCategory) {
      onChange("gradeLevel", `${gradeCategory} ${newNumber}`);
    }
  };

  const currentCategoryConfig = GRADE_CATEGORIES.find(c => c.value === gradeCategory);

  // Pre-fill examiner with current user's name if empty
  useEffect(() => {
    if (!data.examiner && currentUser) {
      const fullName = `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim();
      if (fullName) {
        onChange("examiner", fullName);
      }
    }
  }, [currentUser, data.examiner, onChange]);

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

      {/* PAIR 3: Gender and Date of Birth */}
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
      </div>

      {/* PAIR 4: Age at Assessment and Grade Level */}
      <div className="form-row">
        <div className="input-group">
          <label>Age at Assessment</label>
          <input
            type="text"
            value={data.ageAtAssessment}
            readOnly
            placeholder="Auto-calculated from DOB"
            style={{ backgroundColor: "#f5f5f5", cursor: "not-allowed" }}
          />
        </div>
        <div className="input-group">
          <label>Grade Level</label>
          <div style={{ display: "flex", gap: "8px" }}>
            <select
              value={gradeCategory}
              onChange={(e) => handleGradeCategoryChange(e.target.value)}
              style={{ flex: currentCategoryConfig?.hasNumber ? "2" : "1" }}
            >
              {GRADE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            {currentCategoryConfig?.hasNumber && (
              <input
                type="number"
                min="1"
                max={currentCategoryConfig.maxNumber}
                value={gradeNumber}
                onChange={(e) => handleGradeNumberChange(e.target.value)}
                placeholder="#"
                style={{
                  flex: "1",
                  maxWidth: "70px",
                  textAlign: "center"
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* PAIR 5: School and Address */}
      <div className="form-row">
        <div className="input-group">
          <label>Current School</label>
          <input
            type="text"
            value={data.school}
            onChange={(e) => onChange("school", e.target.value)}
            placeholder="Enter school name"
          />
        </div>
        <div className="input-group">
          <label>Address</label>
          <input
            type="text"
            value={data.address}
            onChange={(e) => onChange("address", e.target.value)}
            placeholder="Street, Barangay, City/Municipality"
          />
        </div>
      </div>

      {/* PAIR 6: Assessment Date and Examiner */}
      <div className="form-row">
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
        <div className={`input-group ${errors.examiner ? 'has-error' : ''}`}>
          <label>Examiner *</label>
          <input
            type="text"
            value={data.examiner}
            onChange={(e) => onChange("examiner", e.target.value)}
            placeholder="Enter Examiner Name"
            readOnly={!canEditExaminer}
            style={!canEditExaminer ? { backgroundColor: "#f5f5f5", cursor: "not-allowed" } : {}}
            title={!canEditExaminer ? "Only admins can edit the examiner name" : ""}
          />
          {errors.examiner && (
            <div className="field-error-message">{errors.examiner}</div>
          )}
          {!canEditExaminer && data.examiner && (
            <small style={{ color: "#64748b", fontSize: "11px", marginTop: "4px", display: "block" }}>
              Auto-filled with your name
            </small>
          )}
        </div>
      </div>
    </div>
  );
}
