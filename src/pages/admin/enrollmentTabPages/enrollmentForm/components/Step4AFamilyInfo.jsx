import React from "react";

// Living situation options
const LIVING_WITH_OPTIONS = [
  { value: "", label: "Select..." },
  { value: "Both Parents", label: "Both Parents" },
  { value: "Mother Only", label: "Mother Only" },
  { value: "Father Only", label: "Father Only" },
  { value: "Grandparents", label: "Grandparents" },
  { value: "Guardian", label: "Legal Guardian" },
  { value: "Relatives", label: "Other Relatives" },
  { value: "Other", label: "Other" },
];

// Marital status options
const MARITAL_STATUS_OPTIONS = [
  { value: "", label: "Select..." },
  { value: "Married", label: "Married" },
  { value: "Single", label: "Single" },
  { value: "Separated", label: "Separated" },
  { value: "Divorced", label: "Divorced" },
  { value: "Widowed", label: "Widowed" },
  { value: "Living Together", label: "Living Together" },
];

// Sibling relationship options
const SIBLING_RELATIONSHIP_OPTIONS = [
  { value: "Older Brother", label: "Older Brother" },
  { value: "Younger Brother", label: "Younger Brother" },
  { value: "Older Sister", label: "Older Sister" },
  { value: "Younger Sister", label: "Younger Sister" },
  { value: "Twin", label: "Twin" },
  { value: "Step-sibling", label: "Step-sibling" },
  { value: "Half-sibling", label: "Half-sibling" },
];

export default function Step4AFamilyInfo({ data, onChange, errors = {} }) {
  // Initialize family info structure if not present
  const familyInfo = data.backgroundHistory?.familyInfo || {
    father: { name: "", age: "", occupation: "" },
    mother: { name: "", age: "", occupation: "" },
    maritalStatus: "",
    livingWith: "",
    primaryCaregiver: "",
    siblings: [],
    additionalNotes: "",
  };

  // Update family info
  const updateFamilyInfo = (field, value) => {
    const updated = { ...familyInfo, [field]: value };
    onChange("backgroundHistory", "familyInfo", updated);

    // Also update the legacy familyBackground field for compatibility
    const backgroundText = generateBackgroundText(updated);
    onChange("backgroundHistory", "familyBackground", backgroundText);
    onChange("backgroundHistory", "familyRelationships", generateRelationshipsText(updated));
  };

  // Update parent info
  const updateParent = (parent, field, value) => {
    const updated = {
      ...familyInfo,
      [parent]: { ...familyInfo[parent], [field]: value }
    };
    onChange("backgroundHistory", "familyInfo", updated);

    const backgroundText = generateBackgroundText(updated);
    onChange("backgroundHistory", "familyBackground", backgroundText);
  };

  // Add sibling
  const addSibling = () => {
    const updated = {
      ...familyInfo,
      siblings: [...familyInfo.siblings, { name: "", age: "", relationship: "" }]
    };
    onChange("backgroundHistory", "familyInfo", updated);
  };

  // Remove sibling
  const removeSibling = (index) => {
    const updated = {
      ...familyInfo,
      siblings: familyInfo.siblings.filter((_, i) => i !== index)
    };
    onChange("backgroundHistory", "familyInfo", updated);
    onChange("backgroundHistory", "familyRelationships", generateRelationshipsText(updated));
  };

  // Update sibling
  const updateSibling = (index, field, value) => {
    const newSiblings = [...familyInfo.siblings];
    newSiblings[index] = { ...newSiblings[index], [field]: value };
    const updated = { ...familyInfo, siblings: newSiblings };
    onChange("backgroundHistory", "familyInfo", updated);
    onChange("backgroundHistory", "familyRelationships", generateRelationshipsText(updated));
  };

  // Generate legacy background text for compatibility
  const generateBackgroundText = (info) => {
    const parts = [];

    if (info.father?.name) {
      parts.push(`Father: ${info.father.name}${info.father.age ? ` (${info.father.age} years old)` : ""}${info.father.occupation ? `, ${info.father.occupation}` : ""}`);
    }
    if (info.mother?.name) {
      parts.push(`Mother: ${info.mother.name}${info.mother.age ? ` (${info.mother.age} years old)` : ""}${info.mother.occupation ? `, ${info.mother.occupation}` : ""}`);
    }
    if (info.maritalStatus) {
      parts.push(`Parents' marital status: ${info.maritalStatus}`);
    }
    if (info.livingWith) {
      parts.push(`Living with: ${info.livingWith}`);
    }
    if (info.primaryCaregiver) {
      parts.push(`Primary caregiver: ${info.primaryCaregiver}`);
    }

    return parts.join(". ") + (parts.length ? "." : "");
  };

  // Generate legacy relationships text for compatibility
  const generateRelationshipsText = (info) => {
    const parts = [];

    if (info.siblings?.length > 0) {
      const siblingList = info.siblings
        .filter(s => s.name)
        .map(s => `${s.name}${s.age ? ` (${s.age})` : ""}${s.relationship ? ` - ${s.relationship}` : ""}`)
        .join("; ");
      if (siblingList) {
        parts.push(`Siblings: ${siblingList}`);
      }
    } else {
      parts.push("No siblings");
    }

    if (info.additionalNotes) {
      parts.push(info.additionalNotes);
    }

    return parts.join(". ") + (parts.length ? "." : "");
  };

  return (
    <div className="form-section">
      <h3 className="section-title">IV-A. FAMILY INFORMATION</h3>
      <p className="section-description">
        Provide information about the child's family background.
      </p>

      {/* Parents Section */}
      <div className="form-section-group">
        <h4 className="subsection-title">Parents / Guardians</h4>

        {/* Father */}
        <div className="family-member-card">
          <div className="family-member-header">
            <span className="family-member-label">Father</span>
          </div>
          <div className="form-row three-col">
            <div className="input-group">
              <label>Full Name</label>
              <input
                type="text"
                value={familyInfo.father?.name || ""}
                onChange={(e) => updateParent("father", "name", e.target.value)}
                placeholder="Enter father's name"
              />
            </div>
            <div className="input-group">
              <label>Age</label>
              <input
                type="number"
                min="18"
                max="100"
                value={familyInfo.father?.age || ""}
                onChange={(e) => updateParent("father", "age", e.target.value)}
                placeholder="Age"
              />
            </div>
            <div className="input-group">
              <label>Occupation</label>
              <input
                type="text"
                value={familyInfo.father?.occupation || ""}
                onChange={(e) => updateParent("father", "occupation", e.target.value)}
                placeholder="e.g. Engineer, Teacher"
              />
            </div>
          </div>
        </div>

        {/* Mother */}
        <div className="family-member-card">
          <div className="family-member-header">
            <span className="family-member-label">Mother</span>
          </div>
          <div className="form-row three-col">
            <div className="input-group">
              <label>Full Name</label>
              <input
                type="text"
                value={familyInfo.mother?.name || ""}
                onChange={(e) => updateParent("mother", "name", e.target.value)}
                placeholder="Enter mother's name"
              />
            </div>
            <div className="input-group">
              <label>Age</label>
              <input
                type="number"
                min="18"
                max="100"
                value={familyInfo.mother?.age || ""}
                onChange={(e) => updateParent("mother", "age", e.target.value)}
                placeholder="Age"
              />
            </div>
            <div className="input-group">
              <label>Occupation</label>
              <input
                type="text"
                value={familyInfo.mother?.occupation || ""}
                onChange={(e) => updateParent("mother", "occupation", e.target.value)}
                placeholder="e.g. Nurse, Homemaker"
              />
            </div>
          </div>
        </div>

        {/* Marital Status & Living Situation */}
        <div className="form-row">
          <div className="input-group">
            <label>Parents' Marital Status</label>
            <select
              value={familyInfo.maritalStatus || ""}
              onChange={(e) => updateFamilyInfo("maritalStatus", e.target.value)}
            >
              {MARITAL_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label>Child Lives With</label>
            <select
              value={familyInfo.livingWith || ""}
              onChange={(e) => updateFamilyInfo("livingWith", e.target.value)}
            >
              {LIVING_WITH_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Primary Caregiver */}
        <div className="form-row">
          <div className="input-group">
            <label>Primary Caregiver</label>
            <input
              type="text"
              value={familyInfo.primaryCaregiver || ""}
              onChange={(e) => updateFamilyInfo("primaryCaregiver", e.target.value)}
              placeholder="Who primarily takes care of the child?"
            />
          </div>
          <div className="input-group">{/* Spacer */}</div>
        </div>
      </div>

      {/* Siblings Section */}
      <div className="form-section-group" style={{ marginTop: "24px" }}>
        <h4 className="subsection-title">Siblings</h4>

        {familyInfo.siblings?.length > 0 ? (
          <div className="siblings-list">
            {familyInfo.siblings.map((sibling, index) => (
              <div key={index} className="sibling-card">
                <div className="sibling-header">
                  <span className="sibling-number">Sibling {index + 1}</span>
                  <button
                    type="button"
                    className="remove-entry-btn"
                    onClick={() => removeSibling(index)}
                  >
                    ✕
                  </button>
                </div>
                <div className="form-row three-col">
                  <div className="input-group">
                    <label>Name</label>
                    <input
                      type="text"
                      value={sibling.name}
                      onChange={(e) => updateSibling(index, "name", e.target.value)}
                      placeholder="Sibling's name"
                    />
                  </div>
                  <div className="input-group">
                    <label>Age</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={sibling.age}
                      onChange={(e) => updateSibling(index, "age", e.target.value)}
                      placeholder="Age"
                    />
                  </div>
                  <div className="input-group">
                    <label>Relationship</label>
                    <select
                      value={sibling.relationship}
                      onChange={(e) => updateSibling(index, "relationship", e.target.value)}
                    >
                      <option value="">Select...</option>
                      {SIBLING_RELATIONSHIP_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state-text">No siblings added yet.</p>
        )}

        <button
          type="button"
          className="add-point-btn"
          onClick={addSibling}
        >
          + Add Sibling
        </button>
      </div>

      {/* Additional Notes */}
      <div className="form-section-group" style={{ marginTop: "24px" }}>
        <div className="input-group">
          <label>Additional Notes (Optional)</label>
          <textarea
            rows="3"
            value={familyInfo.additionalNotes || ""}
            onChange={(e) => updateFamilyInfo("additionalNotes", e.target.value)}
            placeholder="Any other relevant family information..."
          />
        </div>
      </div>

      {/* Hidden validation - check if at least some family info is provided */}
      {(errors.familyBackground || errors.familyRelationships) && (
        <div className="field-error-message" style={{ marginTop: "16px" }}>
          Please provide at least parent information (father or mother name).
        </div>
      )}
    </div>
  );
}
