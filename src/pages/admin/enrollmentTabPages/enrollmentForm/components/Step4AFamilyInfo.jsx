import React from "react";
import TextAreaWithCounter from "./TextAreaWithCounter";

export default function Step4AFamilyInfo({ data, onChange, errors = {} }) {
  return (
    <div className="form-section">
      <h3 className="section-title">IV-A. FAMILY INFORMATION</h3>
      <p className="section-description">
        Provide information about the child's family background and relationships.
      </p>

      {/* Family Background */}
      <div className={`input-group ${errors.familyBackground ? 'has-error' : ''}`}>
        <label>Family Background *</label>
        <p className="field-hint">
          Include information about parents, residence, and occupations.
        </p>
        <TextAreaWithCounter
          rows={4}
          value={data.backgroundHistory.familyBackground}
          onChange={(e) =>
            onChange("backgroundHistory", "familyBackground", e.target.value)
          }
          placeholder="Example: Juan lives with both biological parents in Quezon City. His father, Pedro (45), works as an engineer while his mother, Maria (42), is a homemaker..."
          maxLength={1500}
          required
          hasError={!!errors.familyBackground}
        />
        {errors.familyBackground && (
          <div className="field-error-message">{errors.familyBackground}</div>
        )}
      </div>

      {/* Family Relationships */}
      <div className={`input-group ${errors.familyRelationships ? 'has-error' : ''}`}>
        <label>Family Relationships *</label>
        <p className="field-hint">
          Describe interactions, communication style, and relationship with siblings.
        </p>
        <TextAreaWithCounter
          rows={4}
          value={data.backgroundHistory.familyRelationships}
          onChange={(e) =>
            onChange("backgroundHistory", "familyRelationships", e.target.value)
          }
          placeholder="Example: Juan has a close relationship with his mother who serves as his primary caregiver. He has one younger sister (age 5) with whom he occasionally plays..."
          maxLength={1500}
          required
          hasError={!!errors.familyRelationships}
        />
        {errors.familyRelationships && (
          <div className="field-error-message">{errors.familyRelationships}</div>
        )}
      </div>
    </div>
  );
}
