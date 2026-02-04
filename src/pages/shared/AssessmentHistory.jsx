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

// Strength category labels for display
const STRENGTH_LABELS = {
  visual: "Visual-Spatial Skills",
  memory: "Memory",
  motor: "Motor Skills",
  music: "Musical Ability",
  numbers: "Numbers/Math",
  language: "Language",
  focus: "Focus/Attention",
  creativity: "Creativity",
};

// Interest category labels for display
const INTEREST_LABELS = {
  tv: "TV/Videos",
  toys: "Toys/Objects",
  outdoors: "Outdoor Activities",
  art: "Art/Creative",
  music: "Music/Sounds",
  books: "Books/Reading",
  physical: "Physical Play",
  technology: "Technology",
};

// Daily activity labels
const ACTIVITY_LABELS = {
  bathing: "Bathing/Showering",
  dressing: "Dressing",
  feeding: "Eating/Feeding",
  toileting: "Toileting",
  brushingTeeth: "Brushing Teeth",
  sleeping: "Sleeping/Bedtime",
};

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
    recommendations,
    examiner,
    assessmentDates,
    ageAtAssessment,
  } = merged;

  const studentName = firstName && lastName
    ? `${firstName} ${lastName}`
    : firstName || lastName || "Student";

  const bg = backgroundHistory || {};

  // Get structured data with fallbacks
  const familyInfo = bg.familyInfo || {};
  const dailyLifeInfo = bg.dailyLifeInfo || {};
  const medicalInfo = bg.medicalInfo || {};
  const personalProfile = bg.personalProfile || {};

  // Background History Card Component for better organization
  const BackgroundHistoryCard = ({ title, children, fullWidth = false }) => (
    <div className={`bg-history-card ${fullWidth ? 'full-width' : ''}`}>
      <h4>{title}</h4>
      {children}
    </div>
  );

  // Render Family Info (structured or legacy)
  const renderFamilyInfo = () => {
    // Check if we have structured family info
    const hasStructuredData = familyInfo.father?.name || familyInfo.mother?.name || familyInfo.siblings?.length > 0;

    if (hasStructuredData) {
      return (
        <div className="structured-info">
          {/* Parents */}
          {(familyInfo.father?.name || familyInfo.mother?.name) && (
            <div className="info-group">
              <strong>Parents:</strong>
              <ul className="info-list">
                {familyInfo.father?.name && (
                  <li>
                    Father: {familyInfo.father.name}
                    {familyInfo.father.age && ` (${familyInfo.father.age} yrs)`}
                    {familyInfo.father.occupation && ` - ${familyInfo.father.occupation}`}
                  </li>
                )}
                {familyInfo.mother?.name && (
                  <li>
                    Mother: {familyInfo.mother.name}
                    {familyInfo.mother.age && ` (${familyInfo.mother.age} yrs)`}
                    {familyInfo.mother.occupation && ` - ${familyInfo.mother.occupation}`}
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Marital Status & Living Situation */}
          {(familyInfo.maritalStatus || familyInfo.livingWith) && (
            <div className="info-row">
              {familyInfo.maritalStatus && (
                <span><strong>Marital Status:</strong> {familyInfo.maritalStatus}</span>
              )}
              {familyInfo.livingWith && (
                <span><strong>Lives With:</strong> {familyInfo.livingWith}</span>
              )}
            </div>
          )}

          {/* Primary Caregiver */}
          {familyInfo.primaryCaregiver && (
            <p><strong>Primary Caregiver:</strong> {familyInfo.primaryCaregiver}</p>
          )}

          {/* Siblings */}
          {familyInfo.siblings?.length > 0 && (
            <div className="info-group">
              <strong>Siblings:</strong>
              <ul className="info-list">
                {familyInfo.siblings.map((sibling, i) => (
                  <li key={i}>
                    {sibling.name}
                    {sibling.age && ` (${sibling.age} yrs)`}
                    {sibling.relationship && ` - ${sibling.relationship}`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Additional Notes */}
          {familyInfo.additionalNotes && (
            <p className="additional-notes">{familyInfo.additionalNotes}</p>
          )}
        </div>
      );
    }

    // Fallback to legacy text
    return <p className="report-text">{bg.familyBackground || "N/A"}</p>;
  };

  // Render Daily Life Info (structured or legacy)
  const renderDailyLifeInfo = () => {
    const hasStructuredData = dailyLifeInfo.activities && Object.keys(dailyLifeInfo.activities).length > 0;

    if (hasStructuredData) {
      return (
        <div className="structured-info">
          {/* Independence Levels */}
          <div className="info-group">
            <strong>Independence Levels:</strong>
            <div className="independence-display">
              {Object.entries(dailyLifeInfo.activities).map(([key, level]) => (
                level && (
                  <div key={key} className="independence-item">
                    <span className="activity-name">{ACTIVITY_LABELS[key] || key}:</span>
                    <span className={`independence-level level-${level.toLowerCase().replace(/\s+/g, '-')}`}>
                      {level}
                    </span>
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Other daily life info */}
          {dailyLifeInfo.preferredActivities && (
            <p><strong>Preferred Activities:</strong> {dailyLifeInfo.preferredActivities}</p>
          )}
          {dailyLifeInfo.sleepPattern && (
            <p><strong>Sleep Pattern:</strong> {dailyLifeInfo.sleepPattern}</p>
          )}
          {dailyLifeInfo.dietaryNotes && (
            <p><strong>Dietary Notes:</strong> {dailyLifeInfo.dietaryNotes}</p>
          )}
        </div>
      );
    }

    return <p className="report-text">{bg.dailyLifeActivities || "N/A"}</p>;
  };

  // Render Medical Info (structured or legacy)
  const renderMedicalInfo = () => {
    const hasStructuredData = medicalInfo.hasAllergies !== undefined ||
                              medicalInfo.hasMedications !== undefined ||
                              medicalInfo.hasHospitalizations !== undefined;

    if (hasStructuredData) {
      return (
        <div className="structured-info">
          {/* Allergies */}
          <div className="medical-section">
            <strong>Allergies:</strong>
            {medicalInfo.hasAllergies && medicalInfo.allergies?.length > 0 ? (
              <ul className="info-list">
                {medicalInfo.allergies.map((allergy, i) => (
                  <li key={i}>
                    {allergy.type && <span className="tag">{allergy.type}</span>}
                    {allergy.description}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="no-items"> No known allergies</span>
            )}
          </div>

          {/* Medications */}
          <div className="medical-section">
            <strong>Current Medications:</strong>
            {medicalInfo.hasMedications && medicalInfo.medications?.length > 0 ? (
              <ul className="info-list">
                {medicalInfo.medications.map((med, i) => (
                  <li key={i}>
                    {med.name}
                    {med.dosage && ` (${med.dosage})`}
                    {med.frequency && ` - ${med.frequency}`}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="no-items"> None</span>
            )}
          </div>

          {/* Hospitalizations */}
          <div className="medical-section">
            <strong>Previous Hospitalizations:</strong>
            {medicalInfo.hasHospitalizations && medicalInfo.hospitalizations?.length > 0 ? (
              <ul className="info-list">
                {medicalInfo.hospitalizations.map((hosp, i) => (
                  <li key={i}>
                    {hosp.reason}
                    {hosp.year && ` (${hosp.year})`}
                    {hosp.notes && ` - ${hosp.notes}`}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="no-items"> None</span>
            )}
          </div>

          {/* Other medical info */}
          {medicalInfo.regularCheckups && (
            <p><strong>Regular Check-ups:</strong> {medicalInfo.regularCheckups}</p>
          )}
          {medicalInfo.otherConditions && (
            <p><strong>Other Conditions:</strong> {medicalInfo.otherConditions}</p>
          )}
        </div>
      );
    }

    return <p className="report-text">{bg.medicalHistory || "N/A"}</p>;
  };

  // Render Strengths & Interests (structured or legacy)
  const renderStrengthsAndInterests = () => {
    const hasStructuredData = (personalProfile.strengths && Object.keys(personalProfile.strengths).length > 0) ||
                              (personalProfile.interests && Object.keys(personalProfile.interests).length > 0);

    if (hasStructuredData) {
      const selectedStrengths = Object.entries(personalProfile.strengths || {})
        .filter(([_, value]) => value)
        .map(([key]) => STRENGTH_LABELS[key] || key);

      const selectedInterests = Object.entries(personalProfile.interests || {})
        .filter(([_, value]) => value)
        .map(([key]) => INTEREST_LABELS[key] || key);

      return (
        <div className="structured-info">
          {selectedStrengths.length > 0 && (
            <div className="info-group">
              <strong>Strengths:</strong>
              <div className="tag-list">
                {selectedStrengths.map((strength, i) => (
                  <span key={i} className="tag strength-tag">{strength}</span>
                ))}
              </div>
            </div>
          )}

          {personalProfile.strengthNotes && (
            <p className="additional-notes">{personalProfile.strengthNotes}</p>
          )}

          {selectedInterests.length > 0 && (
            <div className="info-group">
              <strong>Interests:</strong>
              <div className="tag-list">
                {selectedInterests.map((interest, i) => (
                  <span key={i} className="tag interest-tag">{interest}</span>
                ))}
              </div>
            </div>
          )}

          {personalProfile.interestNotes && (
            <p className="additional-notes">{personalProfile.interestNotes}</p>
          )}
        </div>
      );
    }

    return <p className="report-text">{bg.strengthsAndInterests || "N/A"}</p>;
  };

  // Render Social Skills (structured or legacy)
  const renderSocialSkills = () => {
    const hasStructuredData = personalProfile.socialInteraction ||
                              personalProfile.communicationStyle ||
                              personalProfile.eyeContact;

    if (hasStructuredData) {
      return (
        <div className="structured-info">
          <div className="social-skills-grid">
            {personalProfile.socialInteraction && (
              <div className="social-item">
                <strong>Peer Interaction:</strong>
                <span className="social-value">{personalProfile.socialInteraction}</span>
              </div>
            )}
            {personalProfile.communicationStyle && (
              <div className="social-item">
                <strong>Communication:</strong>
                <span className="social-value">{personalProfile.communicationStyle}</span>
              </div>
            )}
            {personalProfile.eyeContact && (
              <div className="social-item">
                <strong>Eye Contact:</strong>
                <span className="social-value">{personalProfile.eyeContact}</span>
              </div>
            )}
            {personalProfile.behaviorRegulation && (
              <div className="social-item">
                <strong>Behavior Regulation:</strong>
                <span className="social-value">{personalProfile.behaviorRegulation}</span>
              </div>
            )}
          </div>

          {personalProfile.socialNotes && (
            <p className="additional-notes">{personalProfile.socialNotes}</p>
          )}
        </div>
      );
    }

    return <p className="report-text">{bg.socialSkills || "N/A"}</p>;
  };

  // Render Recommendations (new array or legacy)
  const renderRecommendations = () => {
    // Check for new recommendations array
    if (recommendations && recommendations.length > 0) {
      const validRecs = recommendations.filter(rec => rec && rec.trim());
      if (validRecs.length > 0) {
        return (
          <div className="recommendations-section">
            <h4 className="summary-title">Recommendations</h4>
            <ol className="report-list recommendations-list">
              {validRecs.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ol>
          </div>
        );
      }
    }

    // Fallback: Check assessment tools for recommendations
    const toolRecommendations = assessmentTools?.filter(tool => tool.recommendation?.trim());
    if (toolRecommendations?.length > 0) {
      return null; // Will be displayed within each tool card
    }

    return null;
  };

  // Scroll to section when badge is clicked
  const scrollToSection = useCallback((sectionId) => {
    const sectionElement = sectionRefs.current[sectionId];
    const container = scrollContainerRef.current;

    if (sectionElement && container) {
      const containerTop = container.getBoundingClientRect().top;
      const sectionTop = sectionElement.getBoundingClientRect().top;
      const offset = sectionTop - containerTop - 80;

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
      const navHeight = 80;

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
                  {purposeOfAssessment.filter(p => p?.trim()).map((purpose, i) => (
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
                  {renderFamilyInfo()}
                </BackgroundHistoryCard>

                <BackgroundHistoryCard title="Family Relationships">
                  <p className="report-text">{bg.familyRelationships || "N/A"}</p>
                </BackgroundHistoryCard>

                <BackgroundHistoryCard title="Daily Life & Activities">
                  {renderDailyLifeInfo()}
                </BackgroundHistoryCard>

                <BackgroundHistoryCard title="Medical History">
                  {renderMedicalInfo()}
                </BackgroundHistoryCard>

                <BackgroundHistoryCard title="Developmental Background" fullWidth>
                  {bg.developmentalBackground && bg.developmentalBackground.length > 0 ? (
                    <ul className="report-list bulleted">
                      {bg.developmentalBackground.map((item, i) => (
                        item.devBgTitle && (
                          <li key={i}>
                            <strong>{item.devBgTitle}:</strong> {item.devBgInfo}
                          </li>
                        )
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
                        if (!item) return null;
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
                  {renderStrengthsAndInterests()}
                </BackgroundHistoryCard>

                <BackgroundHistoryCard title="Social Skills">
                  {renderSocialSkills()}
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
              {assessmentTools && assessmentTools.length > 0 && assessmentTools[0].tool ? (
                <div className="tools-list">
                  {assessmentTools.map((item, index) => (
                    item.tool && (
                      <div key={index} className="tool-card">
                        <div className="tool-header">
                          <span className="tool-index">{String.fromCharCode(65 + index)}.</span>
                          <h4>{item.tool}</h4>
                        </div>
                        <div className="tool-body">
                          {item.details && <p><strong>Measure:</strong> {item.details}</p>}
                          {item.result && (
                            <div className="result-box">
                              <strong>Results</strong>
                              <p>{item.result}</p>
                            </div>
                          )}
                          {item.recommendation && (
                            <div className="recommendation-box">
                              <strong>Specific Recommendation</strong>
                              <p>{item.recommendation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              ) : (
                <p className="report-text">No assessment tools recorded.</p>
              )}

              {/* New Recommendations Section */}
              {renderRecommendations()}

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
