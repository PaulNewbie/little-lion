import React from "react";

// Independence level options
const INDEPENDENCE_LEVELS = [
  { value: "", label: "Select..." },
  { value: "Independent", label: "Independent" },
  { value: "Needs Minimal Assistance", label: "Needs Minimal Assistance" },
  { value: "Needs Moderate Assistance", label: "Needs Moderate Assistance" },
  { value: "Needs Full Assistance", label: "Needs Full Assistance" },
  { value: "Not Applicable", label: "Not Applicable" },
];

// Daily activities to assess
const DAILY_ACTIVITIES = [
  { key: "bathing", label: "Bathing/Showering" },
  { key: "dressing", label: "Dressing" },
  { key: "feeding", label: "Eating/Feeding" },
  { key: "toileting", label: "Toileting" },
];

// Allergy types
const ALLERGY_TYPES = [
  { value: "Food", label: "Food Allergy" },
  { value: "Drug", label: "Drug/Medication" },
  { value: "Environmental", label: "Environmental" },
  { value: "Other", label: "Other" },
];

export default function Step4BDailyLifeMedical({ data, onChange, errors = {} }) {
  // Initialize daily life info structure if not present
  const dailyLifeInfo = data.backgroundHistory?.dailyLifeInfo || {
    activities: {},
    preferredActivities: "",
    sleepPattern: "",
    dietaryNotes: "",
  };

  // Initialize medical info structure if not present
  const medicalInfo = data.backgroundHistory?.medicalInfo || {
    hasAllergies: false,
    allergies: [],
    hasMedications: false,
    medications: [],
    hasHospitalizations: false,
    hospitalizations: [],
    regularCheckups: "",
    otherConditions: "",
  };

  // Update daily life info
  const updateDailyLifeInfo = (field, value) => {
    const updated = { ...dailyLifeInfo, [field]: value };
    onChange("backgroundHistory", "dailyLifeInfo", updated);
    // Generate legacy text
    onChange("backgroundHistory", "dailyLifeActivities", generateDailyLifeText(updated));
  };

  // Update activity independence level
  const updateActivityLevel = (activityKey, level) => {
    const updated = {
      ...dailyLifeInfo,
      activities: { ...dailyLifeInfo.activities, [activityKey]: level }
    };
    onChange("backgroundHistory", "dailyLifeInfo", updated);
    onChange("backgroundHistory", "dailyLifeActivities", generateDailyLifeText(updated));
  };

  // Update medical info
  const updateMedicalInfo = (field, value) => {
    const updated = { ...medicalInfo, [field]: value };
    onChange("backgroundHistory", "medicalInfo", updated);
    // Generate legacy text
    onChange("backgroundHistory", "medicalHistory", generateMedicalText(updated));
  };

  // Add allergy
  const addAllergy = () => {
    const updated = {
      ...medicalInfo,
      allergies: [...medicalInfo.allergies, { type: "", description: "" }]
    };
    onChange("backgroundHistory", "medicalInfo", updated);
  };

  // Remove allergy
  const removeAllergy = (index) => {
    const updated = {
      ...medicalInfo,
      allergies: medicalInfo.allergies.filter((_, i) => i !== index)
    };
    onChange("backgroundHistory", "medicalInfo", updated);
    onChange("backgroundHistory", "medicalHistory", generateMedicalText(updated));
  };

  // Update allergy
  const updateAllergy = (index, field, value) => {
    const newAllergies = [...medicalInfo.allergies];
    newAllergies[index] = { ...newAllergies[index], [field]: value };
    const updated = { ...medicalInfo, allergies: newAllergies };
    onChange("backgroundHistory", "medicalInfo", updated);
    onChange("backgroundHistory", "medicalHistory", generateMedicalText(updated));
  };

  // Add medication
  const addMedication = () => {
    const updated = {
      ...medicalInfo,
      medications: [...medicalInfo.medications, { name: "", dosage: "", frequency: "" }]
    };
    onChange("backgroundHistory", "medicalInfo", updated);
  };

  // Remove medication
  const removeMedication = (index) => {
    const updated = {
      ...medicalInfo,
      medications: medicalInfo.medications.filter((_, i) => i !== index)
    };
    onChange("backgroundHistory", "medicalInfo", updated);
    onChange("backgroundHistory", "medicalHistory", generateMedicalText(updated));
  };

  // Update medication
  const updateMedication = (index, field, value) => {
    const newMeds = [...medicalInfo.medications];
    newMeds[index] = { ...newMeds[index], [field]: value };
    const updated = { ...medicalInfo, medications: newMeds };
    onChange("backgroundHistory", "medicalInfo", updated);
    onChange("backgroundHistory", "medicalHistory", generateMedicalText(updated));
  };

  // Add hospitalization
  const addHospitalization = () => {
    const updated = {
      ...medicalInfo,
      hospitalizations: [...medicalInfo.hospitalizations, { reason: "", year: "", notes: "" }]
    };
    onChange("backgroundHistory", "medicalInfo", updated);
  };

  // Remove hospitalization
  const removeHospitalization = (index) => {
    const updated = {
      ...medicalInfo,
      hospitalizations: medicalInfo.hospitalizations.filter((_, i) => i !== index)
    };
    onChange("backgroundHistory", "medicalInfo", updated);
    onChange("backgroundHistory", "medicalHistory", generateMedicalText(updated));
  };

  // Update hospitalization
  const updateHospitalization = (index, field, value) => {
    const newHosps = [...medicalInfo.hospitalizations];
    newHosps[index] = { ...newHosps[index], [field]: value };
    const updated = { ...medicalInfo, hospitalizations: newHosps };
    onChange("backgroundHistory", "medicalInfo", updated);
    onChange("backgroundHistory", "medicalHistory", generateMedicalText(updated));
  };

  // Generate legacy daily life text
  const generateDailyLifeText = (info) => {
    const parts = [];

    // Activity levels
    const activityDescriptions = DAILY_ACTIVITIES
      .filter(act => info.activities?.[act.key])
      .map(act => `${act.label}: ${info.activities[act.key]}`);
    if (activityDescriptions.length > 0) {
      parts.push(`Independence Levels - ${activityDescriptions.join("; ")}`);
    }

    if (info.preferredActivities) {
      parts.push(`Preferred activities: ${info.preferredActivities}`);
    }
    if (info.sleepPattern) {
      parts.push(`Sleep pattern: ${info.sleepPattern}`);
    }
    if (info.dietaryNotes) {
      parts.push(`Dietary notes: ${info.dietaryNotes}`);
    }

    return parts.join(". ") + (parts.length ? "." : "");
  };

  // Generate legacy medical history text
  const generateMedicalText = (info) => {
    const parts = [];

    // Allergies
    if (info.hasAllergies && info.allergies?.length > 0) {
      const allergyList = info.allergies
        .filter(a => a.description)
        .map(a => `${a.type ? `${a.type}: ` : ""}${a.description}`)
        .join("; ");
      if (allergyList) parts.push(`Allergies: ${allergyList}`);
    } else {
      parts.push("No known allergies");
    }

    // Medications
    if (info.hasMedications && info.medications?.length > 0) {
      const medList = info.medications
        .filter(m => m.name)
        .map(m => `${m.name}${m.dosage ? ` (${m.dosage})` : ""}${m.frequency ? ` - ${m.frequency}` : ""}`)
        .join("; ");
      if (medList) parts.push(`Medications: ${medList}`);
    } else {
      parts.push("Currently not taking any medications");
    }

    // Hospitalizations
    if (info.hasHospitalizations && info.hospitalizations?.length > 0) {
      const hospList = info.hospitalizations
        .filter(h => h.reason)
        .map(h => `${h.reason}${h.year ? ` (${h.year})` : ""}${h.notes ? ` - ${h.notes}` : ""}`)
        .join("; ");
      if (hospList) parts.push(`Hospitalizations: ${hospList}`);
    } else {
      parts.push("No previous hospitalizations");
    }

    if (info.regularCheckups) {
      parts.push(`Regular check-ups: ${info.regularCheckups}`);
    }
    if (info.otherConditions) {
      parts.push(`Other conditions: ${info.otherConditions}`);
    }

    return parts.join(". ") + (parts.length ? "." : "");
  };

  return (
    <div className="form-section">
      <h3 className="section-title">IV-B. DAILY LIFE & MEDICAL HISTORY</h3>
      <p className="section-description">
        Document the child's daily activities and medical background.
      </p>

      {/* Daily Life & Activities */}
      <div className="form-section-group">
        <h4 className="subsection-title">Daily Life & Activities</h4>

        {/* Independence Levels Grid */}
        <div className="independence-grid">
          <p className="field-hint" style={{ marginBottom: "12px" }}>
            Select the child's independence level for each activity:
          </p>
          {DAILY_ACTIVITIES.map((activity) => (
            <div key={activity.key} className="independence-row">
              <label className="activity-label">{activity.label}</label>
              <select
                value={dailyLifeInfo.activities?.[activity.key] || ""}
                onChange={(e) => updateActivityLevel(activity.key, e.target.value)}
              >
                {INDEPENDENCE_LEVELS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Preferred Activities */}
        <div className="input-group" style={{ marginTop: "16px" }}>
          <label>Preferred Activities / Hobbies</label>
          <textarea
            rows="2"
            value={dailyLifeInfo.preferredActivities || ""}
            onChange={(e) => updateDailyLifeInfo("preferredActivities", e.target.value)}
            placeholder="e.g., Watching cartoons, playing with blocks, drawing..."
          />
        </div>

        {/* Sleep Pattern */}
        <div className="form-row">
          <div className="input-group">
            <label>Sleep Pattern</label>
            <input
              type="text"
              value={dailyLifeInfo.sleepPattern || ""}
              onChange={(e) => updateDailyLifeInfo("sleepPattern", e.target.value)}
              placeholder="e.g., Sleeps 8-10 hours, difficulty falling asleep"
            />
          </div>
          <div className="input-group">
            <label>Dietary Notes</label>
            <input
              type="text"
              value={dailyLifeInfo.dietaryNotes || ""}
              onChange={(e) => updateDailyLifeInfo("dietaryNotes", e.target.value)}
              placeholder="e.g., Picky eater, only eats certain textures"
            />
          </div>
        </div>
      </div>

      {/* Medical History */}
      <div className="form-section-group" style={{ marginTop: "24px" }}>
        <h4 className="subsection-title">Medical History</h4>

        {/* Allergies Section */}
        <div className="medical-subsection">
          <div className="checkbox-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={medicalInfo.hasAllergies || false}
                onChange={(e) => updateMedicalInfo("hasAllergies", e.target.checked)}
              />
              Child has known allergies
            </label>
          </div>

          {medicalInfo.hasAllergies && (
            <div className="nested-section">
              {medicalInfo.allergies?.length > 0 ? (
                medicalInfo.allergies.map((allergy, index) => (
                  <div key={index} className="medical-entry-card">
                    <div className="entry-header">
                      <span>Allergy {index + 1}</span>
                      <button
                        type="button"
                        className="remove-entry-btn"
                        onClick={() => removeAllergy(index)}
                      >
                        ✕
                      </button>
                    </div>
                    <div className="form-row">
                      <div className="input-group">
                        <label>Type</label>
                        <select
                          value={allergy.type}
                          onChange={(e) => updateAllergy(index, "type", e.target.value)}
                        >
                          <option value="">Select type...</option>
                          {ALLERGY_TYPES.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="input-group">
                        <label>Description</label>
                        <input
                          type="text"
                          value={allergy.description}
                          onChange={(e) => updateAllergy(index, "description", e.target.value)}
                          placeholder="e.g., Peanuts, Penicillin"
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-state-text">No allergies added yet.</p>
              )}
              <button type="button" className="add-point-btn" onClick={addAllergy}>
                + Add Allergy
              </button>
            </div>
          )}
        </div>

        {/* Medications Section */}
        <div className="medical-subsection">
          <div className="checkbox-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={medicalInfo.hasMedications || false}
                onChange={(e) => updateMedicalInfo("hasMedications", e.target.checked)}
              />
              Child is currently taking medications
            </label>
          </div>

          {medicalInfo.hasMedications && (
            <div className="nested-section">
              {medicalInfo.medications?.length > 0 ? (
                medicalInfo.medications.map((med, index) => (
                  <div key={index} className="medical-entry-card">
                    <div className="entry-header">
                      <span>Medication {index + 1}</span>
                      <button
                        type="button"
                        className="remove-entry-btn"
                        onClick={() => removeMedication(index)}
                      >
                        ✕
                      </button>
                    </div>
                    <div className="form-row three-col">
                      <div className="input-group">
                        <label>Medication Name</label>
                        <input
                          type="text"
                          value={med.name}
                          onChange={(e) => updateMedication(index, "name", e.target.value)}
                          placeholder="e.g., Risperidone"
                        />
                      </div>
                      <div className="input-group">
                        <label>Dosage</label>
                        <input
                          type="text"
                          value={med.dosage}
                          onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                          placeholder="e.g., 0.5mg"
                        />
                      </div>
                      <div className="input-group">
                        <label>Frequency</label>
                        <input
                          type="text"
                          value={med.frequency}
                          onChange={(e) => updateMedication(index, "frequency", e.target.value)}
                          placeholder="e.g., Once daily"
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-state-text">No medications added yet.</p>
              )}
              <button type="button" className="add-point-btn" onClick={addMedication}>
                + Add Medication
              </button>
            </div>
          )}
        </div>

        {/* Hospitalizations Section */}
        <div className="medical-subsection">
          <div className="checkbox-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={medicalInfo.hasHospitalizations || false}
                onChange={(e) => updateMedicalInfo("hasHospitalizations", e.target.checked)}
              />
              Child has previous hospitalizations
            </label>
          </div>

          {medicalInfo.hasHospitalizations && (
            <div className="nested-section">
              {medicalInfo.hospitalizations?.length > 0 ? (
                medicalInfo.hospitalizations.map((hosp, index) => (
                  <div key={index} className="medical-entry-card">
                    <div className="entry-header">
                      <span>Hospitalization {index + 1}</span>
                      <button
                        type="button"
                        className="remove-entry-btn"
                        onClick={() => removeHospitalization(index)}
                      >
                        ✕
                      </button>
                    </div>
                    <div className="form-row three-col">
                      <div className="input-group">
                        <label>Reason</label>
                        <input
                          type="text"
                          value={hosp.reason}
                          onChange={(e) => updateHospitalization(index, "reason", e.target.value)}
                          placeholder="e.g., High fever"
                        />
                      </div>
                      <div className="input-group">
                        <label>Year</label>
                        <input
                          type="text"
                          value={hosp.year}
                          onChange={(e) => updateHospitalization(index, "year", e.target.value)}
                          placeholder="e.g., 2022"
                        />
                      </div>
                      <div className="input-group">
                        <label>Notes</label>
                        <input
                          type="text"
                          value={hosp.notes}
                          onChange={(e) => updateHospitalization(index, "notes", e.target.value)}
                          placeholder="Optional notes"
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-state-text">No hospitalizations added yet.</p>
              )}
              <button type="button" className="add-point-btn" onClick={addHospitalization}>
                + Add Hospitalization
              </button>
            </div>
          )}
        </div>

        {/* Regular Check-ups */}
        <div className="form-row" style={{ marginTop: "16px" }}>
          <div className="input-group">
            <label>Regular Check-ups</label>
            <input
              type="text"
              value={medicalInfo.regularCheckups || ""}
              onChange={(e) => updateMedicalInfo("regularCheckups", e.target.value)}
              placeholder="e.g., Monthly pediatrician visits"
            />
          </div>
          <div className="input-group">
            <label>Other Medical Conditions</label>
            <input
              type="text"
              value={medicalInfo.otherConditions || ""}
              onChange={(e) => updateMedicalInfo("otherConditions", e.target.value)}
              placeholder="e.g., Asthma, Seizures"
            />
          </div>
        </div>
      </div>

      {/* Validation Error */}
      {(errors.dailyLifeActivities || errors.medicalHistory) && (
        <div className="field-error-message" style={{ marginTop: "16px" }}>
          Please complete the daily life and medical history sections.
        </div>
      )}
    </div>
  );
}
