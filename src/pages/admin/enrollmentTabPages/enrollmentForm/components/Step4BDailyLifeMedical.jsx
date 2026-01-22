import React from "react";
import TextAreaWithCounter from "./TextAreaWithCounter";

export default function Step4BDailyLifeMedical({ data, onChange, errors = {} }) {
  return (
    <div className="form-section">
      <h3 className="section-title">IV-B. DAILY LIFE & MEDICAL HISTORY</h3>
      <p className="section-description">
        Document the child's daily activities and medical background.
      </p>

      {/* Daily Life & Activities */}
      <div className={`input-group ${errors.dailyLifeActivities ? 'has-error' : ''}`}>
        <label>Daily Life & Activities *</label>
        <p className="field-hint">
          Describe independence levels in daily tasks and preferred activities.
        </p>
        <TextAreaWithCounter
          rows={4}
          value={data.backgroundHistory.dailyLifeActivities}
          onChange={(e) =>
            onChange("backgroundHistory", "dailyLifeActivities", e.target.value)
          }
          placeholder="Example: Juan requires assistance with bathing and dressing. He can feed himself independently but prefers to eat only certain foods. His preferred activities include watching cartoons and playing with building blocks..."
          maxLength={1500}
          required
          hasError={!!errors.dailyLifeActivities}
        />
        {errors.dailyLifeActivities && (
          <div className="field-error-message">{errors.dailyLifeActivities}</div>
        )}
      </div>

      {/* Medical History */}
      <div className={`input-group ${errors.medicalHistory ? 'has-error' : ''}`}>
        <label>Medical History *</label>
        <p className="field-hint">
          Include any medical conditions, allergies, medications, or health concerns.
        </p>
        <TextAreaWithCounter
          rows={4}
          value={data.backgroundHistory.medicalHistory}
          onChange={(e) =>
            onChange("backgroundHistory", "medicalHistory", e.target.value)
          }
          placeholder="Example: Juan has no known allergies. He was hospitalized at age 2 for high fever. Currently taking no medications. Has regular check-ups with his pediatrician..."
          maxLength={1500}
          required
          hasError={!!errors.medicalHistory}
        />
        {errors.medicalHistory && (
          <div className="field-error-message">{errors.medicalHistory}</div>
        )}
      </div>
    </div>
  );
}
