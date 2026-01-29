import React, { useState } from "react";
import "./AssessmentHistory.css";

const AssessmentHistory = ({ childData, assessmentData }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

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

  // Define slides
  const slides = [
    {
      title: "Overview",
      content: (
        <div className="slide-content">
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
      ),
    },
    {
      title: "II. Reason for Referral",
      content: (
        <div className="slide-content">
          <p className="report-text">
            {reasonForReferral || "No information provided."}
          </p>
        </div>
      ),
    },
    {
      title: "III. Purpose of Assessment",
      content: (
        <div className="slide-content">
          {purposeOfAssessment && purposeOfAssessment.length > 0 ? (
            <ol className="report-list">
              {purposeOfAssessment.map((purpose, i) => (
                <li key={i}>{purpose}</li>
              ))}
            </ol>
          ) : (
            <p className="report-text">No purpose listed.</p>
          )}
        </div>
      ),
    },
    {
      title: "IV. Background History",
      content: (
        <div className="slide-content background-history-slide">
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
        </div>
      ),
    },
    {
      title: "V. Behavior During Assessment",
      content: (
        <div className="slide-content">
          <p className="report-text">
            {behaviorDuringAssessment || "No information provided."}
          </p>
        </div>
      ),
    },
    {
      title: "VI, VII, VIII. Assessment Tools & Summary",
      content: (
        <div className="slide-content">
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

          <div className="summary-final-section">
            <h4 className="summary-title">SUMMARY</h4>
            <div className="summary-content-box">
              <p className="report-text">
                {assessmentSummary || "No overall summary provided."}
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const totalSlides = slides.length;

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div className="assessment-history-container">
      <div className="history-top-header">
        <h2 className="report-main-title">ASSESSMENT REPORT</h2>
      </div>

      {/* Slide Navigation Dots */}
      <div className="slide-dots">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`slide-dot ${index === currentSlide ? "active" : ""}`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Current Slide */}
      <div className="slide-wrapper">
        {/* Left Arrow */}
        <button className="slide-arrow slide-arrow-left" onClick={goToPrevious} aria-label="Previous slide">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="slide-content-area">
          <div className="slide-header">
            <h3 className="slide-title">{slides[currentSlide].title}</h3>
            <span className="slide-counter">{currentSlide + 1} / {totalSlides}</span>
          </div>
          <div className="slide-body">
            {slides[currentSlide].content}
          </div>
        </div>

        {/* Right Arrow */}
        <button className="slide-arrow slide-arrow-right" onClick={goToNext} aria-label="Next slide">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default AssessmentHistory;
