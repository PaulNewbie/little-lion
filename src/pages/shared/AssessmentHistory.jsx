import React, { useRef, useState, useEffect, useCallback } from "react";
import "./AssessmentHistory.css";

// Section navigation labels
const SECTION_LABELS = [
  { id: "overview", label: "Overview" },
  { id: "referral", label: "Referral" },
  { id: "purpose", label: "Purpose" },
  { id: "history", label: "Background History" },
  { id: "behavior", label: "Behavior" },
  { id: "tools", label: "Tools & Summary" }
];

const AssessmentHistory = ({ childData, assessmentData }) => {
  const [activeSection, setActiveSection] = useState("overview");
  const scrollContainerRef = useRef(null);
  const sectionRefs = useRef({});

  if (!childData && !assessmentData) return null;

  const merged = { ...(childData || {}), ...(assessmentData || {}) };

  const {
    // Student info
    firstName,
    lastName,
    profilePicture,
    dateOfBirth,
    gender,
    // Assessment info
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

  const studentName = firstName && lastName
    ? `${firstName} ${lastName}`
    : firstName || lastName || "Student";

  const bg = backgroundHistory || {};

  // Background History Card Component for better organization
  const BackgroundHistoryCard = ({ title, children, fullWidth = false }) => (
    <div className={`bg-history-card ${fullWidth ? 'full-width' : ''}`}>
      <h4>{title}</h4>
      {children}
    </div>
  );

  // Scroll to section when badge is clicked
  const scrollToSection = useCallback((sectionId) => {
    const sectionElement = sectionRefs.current[sectionId];
    const container = scrollContainerRef.current;

    if (sectionElement && container) {
      const containerTop = container.getBoundingClientRect().top;
      const sectionTop = sectionElement.getBoundingClientRect().top;
      const offset = sectionTop - containerTop - 80; // 80px offset for sticky nav

      container.scrollTo({
        top: container.scrollTop + offset,
        behavior: 'smooth'
      });
    }
  }, []);

  // Track scroll position to highlight active badge
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const containerRect = container.getBoundingClientRect();
      const scrollTop = container.scrollTop;
      const navHeight = 80; // Height of sticky nav

      // Find which section is currently most visible
      let currentSection = "overview";
      let minDistance = Infinity;

      SECTION_LABELS.forEach(({ id }) => {
        const section = sectionRefs.current[id];
        if (section) {
          const sectionRect = section.getBoundingClientRect();
          const sectionTop = sectionRect.top - containerRect.top;
          const distance = Math.abs(sectionTop - navHeight);

          if (sectionTop <= navHeight + 50 && distance < minDistance) {
            minDistance = distance;
            currentSection = id;
          }
        }
      });

      setActiveSection(currentSection);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Register section ref
  const setSectionRef = (id) => (el) => {
    sectionRefs.current[id] = el;
  };

  return (
    <>
      {/* Header */}
      <div className="history-top-header">
        <h2 className="report-main-title">Assessment Report</h2>
      </div>

      {/* Scrollable Content Area */}
      <div className="assessment-scroll-container" ref={scrollContainerRef}>
        {/* Sticky Navigation Badges */}
        <div className="section-nav-badges">
          {SECTION_LABELS.map(({ id, label }) => (
            <button
              key={id}
              className={`nav-badge ${activeSection === id ? "active" : ""}`}
              onClick={() => scrollToSection(id)}
              aria-label={`Jump to ${label} section`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* All Sections in Scrollable View */}
        <div className="assessment-sections">
          {/* Section 1: Overview */}
          <section
            className="assessment-section overview-section"
            ref={setSectionRef("overview")}
            id="section-overview"
          >
            <div className="section-header">
              <h3 className="section-title">I. Overview</h3>
            </div>
            <div className="section-content">
              {/* Student Profile Card */}
              <div className="student-profile-card">
                <div className="student-avatar">
                  {profilePicture ? (
                    <img src={profilePicture} alt={studentName} />
                  ) : (
                    <div className="avatar-placeholder">
                      {(firstName?.[0] || "S").toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="student-info">
                  <h4 className="student-name">{studentName}</h4>
                  <div className="student-details">
                    {dateOfBirth && (
                      <span className="detail-item">
                        <svg className="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        DOB: {dateOfBirth}
                      </span>
                    )}
                    {gender && (
                      <span className="detail-item">
                        <svg className="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                        {gender}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Assessment Meta Grid */}
              <div className="report-meta-grid">
                <div className="meta-item">
                  <span className="meta-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="8.5" cy="7" r="4"/>
                      <path d="M20 8v6"/>
                      <path d="M23 11h-6"/>
                    </svg>
                  </span>
                  <span className="label">Examiner</span>
                  <span className="value">{examiner || "N/A"}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </span>
                  <span className="label">Assessment Date(s)</span>
                  <span className="value">
                    {Array.isArray(assessmentDates)
                      ? assessmentDates.join(", ")
                      : assessmentDates || "N/A"}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                  </span>
                  <span className="label">Age at Assessment</span>
                  <span className="value">{ageAtAssessment || "N/A"}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Reason for Referral */}
          <section
            className="assessment-section"
            ref={setSectionRef("referral")}
            id="section-referral"
          >
            <div className="section-header">
              <h3 className="section-title">II. Reason for Referral</h3>
            </div>
            <div className="section-content">
              <p className="report-text">
                {reasonForReferral || "No information provided."}
              </p>
            </div>
          </section>

          {/* Section 3: Purpose of Assessment */}
          <section
            className="assessment-section"
            ref={setSectionRef("purpose")}
            id="section-purpose"
          >
            <div className="section-header">
              <h3 className="section-title">III. Purpose of Assessment</h3>
            </div>
            <div className="section-content">
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
          </section>

          {/* Section 4: Background History */}
          <section
            className="assessment-section"
            ref={setSectionRef("history")}
            id="section-history"
          >
            <div className="section-header">
              <h3 className="section-title">IV. Background History</h3>
            </div>
            <div className="section-content background-history-content">
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
          </section>

          {/* Section 5: Behavior During Assessment */}
          <section
            className="assessment-section"
            ref={setSectionRef("behavior")}
            id="section-behavior"
          >
            <div className="section-header">
              <h3 className="section-title">V. Behavior During Assessment</h3>
            </div>
            <div className="section-content">
              <p className="report-text">
                {behaviorDuringAssessment || "No information provided."}
              </p>
            </div>
          </section>

          {/* Section 6: Assessment Tools & Summary */}
          <section
            className="assessment-section"
            ref={setSectionRef("tools")}
            id="section-tools"
          >
            <div className="section-header">
              <h3 className="section-title">VI, VII, VIII. Assessment Tools & Summary</h3>
            </div>
            <div className="section-content">
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
          </section>
        </div>
      </div>
    </>
  );
};

export default AssessmentHistory;
