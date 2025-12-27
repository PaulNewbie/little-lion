// src/pages/admin/studentProfile/components/AssessmentHistory.jsx
import React from "react";
import "../StudentProfile.css"; // We will use the main CSS to keep styles consistent

const AssessmentHistory = ({ assessmentTools }) => {
  // Safety check: if no data, show a simple message
  if (!assessmentTools || assessmentTools.length === 0) {
    return (
      <div className="assessment-history-empty">
        <p>No assessment history recorded for this student.</p>
      </div>
    );
  }

  return (
    <div className="assessment-history-container">
      <h3 className="history-title">Assessment History</h3>
      
      <div className="history-list">
        {assessmentTools.map((item, index) => (
          <div key={index} className="history-card">
            <div className="history-header">
              <span className="history-number">#{index + 1}</span>
              <h4 className="history-tool-name">{item.tool || "Unnamed Tool"}</h4>
            </div>

            <div className="history-body">
              {/* DETAILS SECTION (From Step 6) */}
              <div className="history-section">
                <span className="history-label">📝 Measure / Details:</span>
                <p className="history-text">{item.details || "No details provided."}</p>
              </div>

              {/* RESULTS SECTION (From Step 7) */}
              <div className="history-section">
                <span className="history-label">📊 Findings / Results:</span>
                <p className="history-text result-text">
                  {item.result || "No results recorded yet."}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssessmentHistory;