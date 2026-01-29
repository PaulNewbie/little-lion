import React, { useState, useCallback, useEffect } from "react";
import "./AssessmentHistory.css";

// Slide labels for quick navigation
const SLIDE_LABELS = [
  "Overview",
  "Referral",
  "Purpose",
  "History",
  "Behavior",
  "Tools"
];

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

  // Background History Card Component for better organization
  const BackgroundHistoryCard = ({ title, children, fullWidth = false }) => (
    <div className={`bg-history-card ${fullWidth ? 'full-width' : ''}`}>
      <h4>{title}</h4>
      {children}
    </div>
  );

  // Define slides
  const slides = [
    {
      title: "Overview",
      content: (
        <div className="slide-content">
          <div className="report-meta-grid">
            <div className="meta-item">
              <span className="label">Examiner</span>
              <span className="value">{examiner || "N/A"}</span>
            </div>
            <div className="meta-item">
              <span className="label">Assessment Date(s)</span>
              <span className="value">
                {Array.isArray(assessmentDates)
                  ? assessmentDates.join(", ")
                  : assessmentDates || "N/A"}
              </span>
            </div>
            <div className="meta-item">
              <span className="label">Age at Assessment</span>
              <span className="value">{ageAtAssessment || "N/A"}</span>
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
          <div className="bg-history-grid">
            <BackgroundHistoryCard title="Family Background">
              <p className="report-text">{bg.familyBackground || "N/A"}</p>
            </BackgroundHistoryCard>

            <BackgroundHistoryCard title="Family Relationships">
              <p className="report-text">{bg.familyRelationships || "N/A"}</p>
            </BackgroundHistoryCard>

            <BackgroundHistoryCard title="Daily Life & Activities">
              <p className="report-text">{bg.dailyLifeActivities || "N/A"}</p>
            </BackgroundHistoryCard>

            <BackgroundHistoryCard title="Medical History">
              <p className="report-text">{bg.medicalHistory || "N/A"}</p>
            </BackgroundHistoryCard>

            <BackgroundHistoryCard title="Developmental Background" fullWidth>
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
            </BackgroundHistoryCard>

            <BackgroundHistoryCard title="School History">
              <p className="report-text">{bg.schoolHistory || "N/A"}</p>
            </BackgroundHistoryCard>

            <BackgroundHistoryCard title="Clinical Diagnosis">
              <p className="report-text">{bg.clinicalDiagnosis || "N/A"}</p>
            </BackgroundHistoryCard>

            <BackgroundHistoryCard title="Therapies/Interventions" fullWidth>
              {bg.interventions && bg.interventions.length > 0 ? (
                <ul className="report-list bulleted">
                  {bg.interventions.map((item, i) => {
                    if (!item) return (
                      <li key={i} className="report-text">N/A</li>
                    );
                    if (typeof item === "string") return <li key={i}>{item}</li>;

                    const name = item.name || item.serviceName || item.serviceId || "Unnamed intervention";
                    const freq = item.frequency ? ` - ${item.frequency}` : "";

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
            </BackgroundHistoryCard>

            <BackgroundHistoryCard title="Strengths & Interests">
              <p className="report-text">{bg.strengthsAndInterests || "N/A"}</p>
            </BackgroundHistoryCard>

            <BackgroundHistoryCard title="Social Skills">
              <p className="report-text">{bg.socialSkills || "N/A"}</p>
            </BackgroundHistoryCard>
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
                      <strong>Results</strong>
                      <p>{item.result || "No results recorded."}</p>
                    </div>
                    {item.recommendation && (
                      <div className="recommendation-box">
                        <strong>Specific Recommendation</strong>
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
            <h4 className="summary-title">Summary</h4>
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

  const goToPrevious = useCallback(() => {
    setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  }, [totalSlides]);

  const goToNext = useCallback(() => {
    setCurrentSlide((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  }, [totalSlides]);

  const goToSlide = useCallback((index) => {
    setCurrentSlide(index);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrevious, goToNext]);

  // Calculate progress percentage
  const progressPercentage = ((currentSlide + 1) / totalSlides) * 100;

  return (
    <div className="assessment-history-container">
      {/* Header */}
      <div className="history-top-header">
        <h2 className="report-main-title">Assessment Report</h2>
      </div>

      {/* Navigation Section */}
      <div className="slide-navigation">
        {/* Progress Bar */}
        <div className="slide-progress-bar">
          <div
            className="slide-progress-fill"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Slide Dots */}
        <div className="slide-dots">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`slide-dot ${index === currentSlide ? "active" : ""}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to ${SLIDE_LABELS[index]} slide`}
              aria-current={index === currentSlide ? "step" : undefined}
            />
          ))}
        </div>

        {/* Slide Labels */}
        <div className="slide-labels">
          {SLIDE_LABELS.map((label, index) => (
            <button
              key={index}
              className={`slide-label ${index === currentSlide ? "active" : ""}`}
              onClick={() => goToSlide(index)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Slide Content */}
      <div className="slide-wrapper">
        {/* Left Arrow */}
        <button
          className="slide-arrow slide-arrow-left"
          onClick={goToPrevious}
          aria-label="Previous slide"
        >
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
        <button
          className="slide-arrow slide-arrow-right"
          onClick={goToNext}
          aria-label="Next slide"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default AssessmentHistory;
