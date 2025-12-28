import React from "react";
import "./AssessmentHistory.css"; // Import the shared CSS

const AssessmentHistory = ({ data }) => {
  if (!data) return null;

  const {
    reasonForReferral,
    purposeOfAssessment,
    backgroundHistory,
    behaviorDuringAssessment,
    assessmentTools,
    assessmentSummary,
    examiner,
    assessmentDates,
    ageAtAssessment
  } = data;

  const bg = backgroundHistory || {};

  return (
    <div className="assessment-history-container">
      <div className="history-top-header">
        <h2 className="report-main-title">ASSESSMENT REPORT</h2>
        <div className="report-meta-grid">
           <div className="meta-item">
             <span className="label">Examiner:</span> {examiner || "N/A"}
           </div>
           <div className="meta-item">
             <span className="label">Date(s):</span> {Array.isArray(assessmentDates) ? assessmentDates.join(", ") : assessmentDates || "N/A"}
           </div>
           <div className="meta-item">
             <span className="label">Age at Assessment:</span> {ageAtAssessment || "N/A"}
           </div>
        </div>
      </div>

      <section className="report-section">
        <h3 className="report-heading">II. REASON FOR REFERRAL</h3>
        <p className="report-text">{reasonForReferral || "No information provided."}</p>
      </section>

      <section className="report-section">
        <h3 className="report-heading">III. PURPOSE OF ASSESSMENT</h3>
        {purposeOfAssessment && purposeOfAssessment.length > 0 ? (
          <ul className="report-list">
            {purposeOfAssessment.map((purpose, i) => (
              <li key={i}>{purpose}</li>
            ))}
          </ul>
        ) : (
          <p className="report-text">No purpose listed.</p>
        )}
      </section>

      <section className="report-section">
        <h3 className="report-heading">IV. BACKGROUND HISTORY</h3>
        <div className="sub-section">
          <h4>A. Family Background</h4>
          <p className="report-text">{bg.familyBackground || "N/A"}</p>
        </div>
        <div className="sub-section">
          <h4>B. Medical History</h4>
          <p className="report-text">{bg.medicalHistory || "N/A"}</p>
        </div>
        <div className="sub-section">
          <h4>C. Developmental History</h4>
          {bg.developmentalBackground && bg.developmentalBackground.length > 0 ? (
            <ul className="report-list">
              {bg.developmentalBackground.map((item, i) => (
                <li key={i}><strong>{item.devBgTitle}:</strong> {item.devBgInfo}</li>
              ))}
            </ul>
          ) : <p className="report-text">N/A</p>}
        </div>
        <div className="sub-section">
          <h4>D. School History</h4>
          <p className="report-text">{bg.schoolHistory || "N/A"}</p>
        </div>
        <div className="sub-section">
          <h4>E. Clinical Diagnosis</h4>
          <p className="report-text">{bg.clinicalDiagnosis || "N/A"}</p>
        </div>
      </section>

      <section className="report-section">
        <h3 className="report-heading">V. BEHAVIOR DURING ASSESSMENT</h3>
        <p className="report-text">{behaviorDuringAssessment || "No information provided."}</p>
      </section>

      <section className="report-section">
        <h3 className="report-heading">VI & VII. ASSESSMENT TOOLS & RESULTS</h3>
        {assessmentTools && assessmentTools.length > 0 ? (
          <div className="tools-list">
            {assessmentTools.map((item, index) => (
              <div key={index} className="tool-card">
                <div className="tool-header">
                   <span className="tool-index">{String.fromCharCode(65 + index)}.</span>
                   <h4>{item.tool}</h4>
                </div>
                <div className="tool-body">
                   <p><strong>Details:</strong> {item.details}</p>
                   <div className="result-box">
                      <strong>Findings:</strong><p>{item.result || "No results recorded."}</p>
                   </div>
                   {item.recommendation && (
                     <div className="recommendation-box">
                        <strong>Specific Recommendation:</strong><p>{item.recommendation}</p>
                     </div>
                   )}
                </div>
              </div>
            ))}
          </div>
        ) : <p className="report-text">No assessment tools recorded.</p>}
      </section>

      <section className="report-section">
        <h3 className="report-heading">VIII. SUMMARY AND RECOMMENDATIONS</h3>
        <p className="report-text">{assessmentSummary || "No summary provided."}</p>
      </section>
    </div>
  );
};

export default AssessmentHistory;