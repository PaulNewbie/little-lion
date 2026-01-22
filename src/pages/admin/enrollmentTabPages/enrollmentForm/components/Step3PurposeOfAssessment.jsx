import React from "react";

export default function Step3PurposeOfAssessment({ data, onChange, errors = {} }) {
  const handleAddPurpose = () => {
    onChange("purposeOfAssessment", [...data.purposeOfAssessment, ""]);
  };

  const handleRemovePurpose = (index) => {
    const newList = [...data.purposeOfAssessment];
    newList.splice(index, 1);
    onChange("purposeOfAssessment", newList);
  };

  const handlePurposeChange = (index, value) => {
    const newList = [...data.purposeOfAssessment];
    newList[index] = value;
    onChange("purposeOfAssessment", newList);
  };

  return (
    <div className="form-section">
      <div className="section-header-flex">
        <h3>III. PURPOSE OF ASSESSMENT</h3>
      </div>

      {errors.purposeOfAssessment && (
        <div className="field-error-message" style={{ marginBottom: '16px' }}>
          {errors.purposeOfAssessment}
        </div>
      )}

      <div className="dynamic-list-container">
        {(data.purposeOfAssessment.length > 0
          ? data.purposeOfAssessment
          : [""]
        ).map((purpose, index) => (
          <div className="dynamic-input-row" key={index}>
            <span className="row-index">{index + 1}</span>
            <input
              type="text"
              placeholder="Enter purpose point..."
              value={purpose}
              onChange={(e) => handlePurposeChange(index, e.target.value)}
              required
            />
            {data.purposeOfAssessment.length > 1 && (
              <button
                className="remove-row-btn"
                onClick={() => handleRemovePurpose(index)}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      <button className="add-point-btn" onClick={handleAddPurpose}>
        + Add Assessment Purpose
      </button>
    </div>
  );
}
