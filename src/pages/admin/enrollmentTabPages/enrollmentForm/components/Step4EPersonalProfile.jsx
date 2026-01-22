import React from "react";

export default function Step4EPersonalProfile({ data, onChange, errors = {} }) {
  return (
    <div className="form-section">
      <h3 className="section-title">IV-E. PERSONAL PROFILE</h3>
      <p className="section-description">
        Describe the child's strengths, interests, and social abilities.
      </p>

      {/* Strengths & Interests */}
      <div className={`input-group ${errors.strengthsAndInterests ? 'has-error' : ''}`}>
        <label>Strengths & Interests *</label>
        <p className="field-hint">
          Highlight the child's academic abilities, talents, hobbies, and what motivates them.
        </p>
        <textarea
          rows="4"
          value={data.backgroundHistory.strengthsAndInterests}
          onChange={(e) =>
            onChange(
              "backgroundHistory",
              "strengthsAndInterests",
              e.target.value
            )
          }
          placeholder="Example: Juan shows strong visual-spatial skills and can complete complex puzzles. He enjoys music and responds positively to singing activities. He has good memory for numbers and letters..."
          required
        />
        {errors.strengthsAndInterests && (
          <div className="field-error-message">{errors.strengthsAndInterests}</div>
        )}
      </div>

      {/* Social Skills */}
      <div className={`input-group ${errors.socialSkills ? 'has-error' : ''}`}>
        <label>Social Skills *</label>
        <p className="field-hint">
          Describe peer interactions, communication style, and behavior regulation.
        </p>
        <textarea
          rows="4"
          value={data.backgroundHistory.socialSkills}
          onChange={(e) =>
            onChange("backgroundHistory", "socialSkills", e.target.value)
          }
          placeholder="Example: Juan prefers parallel play and rarely initiates interaction with peers. He can follow simple social rules when prompted. Eye contact is limited but improving with intervention..."
          required
        />
        {errors.socialSkills && (
          <div className="field-error-message">{errors.socialSkills}</div>
        )}
      </div>
    </div>
  );
}
