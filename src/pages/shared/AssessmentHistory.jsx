import React from "react";
import "./AssessmentHistory.css"; // Import the shared CSS

const AssessmentHistory = ({ childData, assessmentData }) => {
  if (!childData && !assessmentData) return null;

  const merged = { ...(childData || {}), ...(assessmentData || {}) };

 const {
    reasonForReferral,
    purposeOfAssessment,
    backgroundHistory,
    behaviorDuringAssessment,
    assessmentTools, 
    assessmentSummary, 
    examiner,
    assessmentDates,
    ageAtAssessment,
  } = merged;

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
            <span className="label">Date(s):</span>{" "}
            {Array.isArray(assessmentDates)
              ? assessmentDates.join(", ")
              : assessmentDates || "N/A"}
          </div>
          <div className="meta-item">
            <span className="label">Age at Assessment:</span>{" "}
            {ageAtAssessment || "N/A"}
          </div>
        </div>
      </div>

      <section className="report-section">
        <h3 className="report-heading">II. REASON FOR REFERRAL</h3>
        <p className="report-text">
          {reasonForReferral || "No information provided."}
        </p>
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
          <h4>Family Background:</h4>
          <p className="report-text">{bg.familyBackground || "N/A"}</p>
        </div>

        <div className="sub-section">
          <h4>Family Relationships:</h4>
          <p className="report-text">{bg.familyRelationships || "N/A"}</p>
        </div>

        <div className="sub-section">
          <h4>Daily Life & Activities:</h4>
          <p className="report-text">{bg.dailyLifeActivities || "N/A"}</p>
        </div>

        <div className="sub-section">
          <h4>Medical History:</h4>
          <p className="report-text">{bg.medicalHistory || "N/A"}</p>
        </div>

        <div className="sub-section">
          <h4>Developmental Background:</h4>
          {bg.developmentalBackground && bg.developmentalBackground.length > 0 ? (
            <ul className="report-list bulleted">
              {bg.developmentalBackground.map((item, i) => (
                <li key={i}>
                  <strong>{item.devBgTitle}:</strong> {item.devBgInfo}
                </li>
              ))}
            </ul>
          ) : (
            <p className="report-text">N/A</p>
          )}
        </div>

        <div className="sub-section">
          <h4>School History:</h4>
          <p className="report-text">{bg.schoolHistory || "N/A"}</p>
        </div>

        <div className="sub-section">
          <h4>Clinical Diagnosis:</h4>
          <p className="report-text">{bg.clinicalDiagnosis || "N/A"}</p>
        </div>

        <div className="sub-section">
          <h4>Therapies/Interventions:</h4>
          {bg.interventions && bg.interventions.length > 0 ? (
            <ul className="report-list bulleted">
              {bg.interventions.map((item, i) => {
                if (!item) return (
                  <li key={i} className="report-text">N/A</li>
                );
                if (typeof item === "string") return <li key={i}>{item}</li>;

                const name = item.name || item.serviceName || item.serviceId || "Unnamed intervention";
                const freq = item.frequency ? ` — ${item.frequency}` : "";

                return (
                  <li key={i}>
                    <strong>{name}</strong>{freq}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="report-text">N/A</p>
          )}
        </div>

        <div className="sub-section">
          <h4>Strengths & Interests:</h4>
          <p className="report-text">{bg.strengthsAndInterests || "N/A"}</p>
        </div>

        <div className="sub-section">
          <h4>Social Skills:</h4>
          <p className="report-text">{bg.socialSkills || "N/A"}</p>
        </div>
      </section>

      <section className="report-section">
        <h3 className="report-heading">V. BEHAVIOR DURING ASSESSMENT</h3>
        <p className="report-text">
          {behaviorDuringAssessment || "No information provided."}
        </p>
      </section>

      {/* JOINED SECTION VI, VII, & VIII */}
      <section className="report-section assessment-results-joined">
        <h3 className="report-heading">VI, VII, & VIII. ASSESSMENT TOOLS & MEASURES, RESULTS, RECOMMENDATIONS, & SUMMARY</h3>
        
        {/* Mapping Tools and Results (VI & VII) */}
        {assessmentTools && assessmentTools.length > 0 ? (
          <div className="tools-list">
            {assessmentTools.map((item, index) => (
              <div key={index} className="tool-card">
                <div className="tool-header">
                  <span className="tool-index">{String.fromCharCode(65 + index)}.</span>
                  <h4>{item.tool}</h4>
                </div>
                <div className="tool-body">
                  <p><strong>Measure:</strong> {item.details}</p>
                  <div className="result-box">
                    <strong>Results:</strong>
                    <p>{item.result || "No results recorded."}</p>
                  </div>
                  {item.recommendation && (
                    <div className="recommendation-box">
                      <strong>Specific Recommendation:</strong>
                      <p>{item.recommendation}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="report-text">No assessment tools recorded.</p>
        )}

        {/* Final Summary and Recommendations (VIII) */}
        <div className="summary-final-section">
          <h4 className="summary-title">SUMMARY</h4>
          <div className="summary-content-box">
            <p className="report-text">
              {assessmentSummary || "No overall summary provided."}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AssessmentHistory;
