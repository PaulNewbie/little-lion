import React, { useRef, useState, useEffect, useCallback } from "react";
import "./AssessmentHistory.css";
import storageService from "../../services/storageService";
import childService from "../../services/childService";

// Section navigation labels
const SECTION_LABELS = [
  { id: "overview", label: "Overview" },
  { id: "referral", label: "Referral" },
  { id: "purpose", label: "Purpose" },
  { id: "history", label: "Background History" },
  { id: "behavior", label: "Behavior" },
  { id: "tools", label: "Tools & Results" },
  { id: "recommendations", label: "Summary & Recommendations" }
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

const AssessmentHistory = ({
  childData,
  assessmentData,
  additionalReports = [],
  isAdmin = false,
  currentUser = null,
  onReportsChange = null
}) => {
  const [activeSection, setActiveSection] = useState("overview");
  const [navHidden, setNavHidden] = useState(false);
  const scrollContainerRef = useRef(null);
  const sectionRefs = useRef({});
  const lastScrollY = useRef(0);
  const scrollUpCount = useRef(0);

  // Additional Reports state
  const [showReportsPanel, setShowReportsPanel] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [reportError, setReportError] = useState(null);
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = 700 * 1024; // 700KB

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

  // === Additional Reports Handlers ===

  const generateReportId = () => {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const formatReportDate = (dateStr) => {
    if (!dateStr) return 'Unknown date';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setReportError('Only PDF files are allowed');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setReportError('File size must be less than 700KB');
      return;
    }

    setReportError(null);
    setSelectedFile(file);
    setShowUploadModal(true);
  };

  const handleUploadReport = async () => {
    if (!selectedFile || !childData?.id) return;

    setUploading(true);
    setReportError(null);

    try {
      const fileUrl = await storageService.uploadPDF(selectedFile);

      const reportData = {
        id: generateReportId(),
        fileName: selectedFile.name,
        fileUrl: fileUrl,
        description: description.trim() || null,
        uploadedBy: {
          uid: currentUser?.uid,
          name: currentUser?.firstName
            ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim()
            : currentUser?.email || 'Admin'
        }
      };

      await childService.addAdditionalReport(childData.id, reportData);

      if (onReportsChange) {
        onReportsChange([...additionalReports, { ...reportData, uploadedAt: new Date().toISOString() }]);
      }

      setShowUploadModal(false);
      setSelectedFile(null);
      setDescription('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Upload error:', err);
      setReportError(err.message || 'Failed to upload report');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteReport = async (report) => {
    if (!window.confirm(`Delete "${report.fileName}"?`)) return;

    setDeleting(report.id);
    try {
      await storageService.deletePDF(report.fileUrl);
      await childService.removeAdditionalReport(childData.id, report);

      if (onReportsChange) {
        onReportsChange(additionalReports.filter(r => r.id !== report.id));
      }
    } catch (err) {
      console.error('Delete error:', err);
      setReportError('Failed to delete report');
    } finally {
      setDeleting(null);
    }
  };

  const handleCancelUpload = () => {
    setShowUploadModal(false);
    setSelectedFile(null);
    setDescription('');
    setReportError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

  // Hide nav badges on scroll down, require 2 scroll-ups to reappear
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const DELTA = 15;

    const handleNavScroll = () => {
      const st = el.scrollTop;
      const diff = st - lastScrollY.current;

      if (Math.abs(diff) < DELTA) return;

      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
      if (nearBottom) return;

      if (diff > 0 && st > 60) {
        // Scrolling down — hide and reset up-count
        setNavHidden(true);
        scrollUpCount.current = 0;
      } else if (diff < 0) {
        // Scrolling up — increment counter, show after 2 up-scrolls
        scrollUpCount.current += 1;
        if (scrollUpCount.current >= 2) {
          setNavHidden(false);
        }
      }
      lastScrollY.current = st;
    };

    el.addEventListener('scroll', handleNavScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleNavScroll);
  }, []);

  const setSectionRef = (id) => (el) => {
    sectionRefs.current[id] = el;
  };

  return (
    <>
      {/* Header */}
      <div className="history-top-header">
        <h2 className="report-main-title">Assessment Report</h2>
        <button
          className="additional-reports-header-btn"
          onClick={() => setShowReportsPanel(!showReportsPanel)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"/>
            <path d="M14 2V8H20"/>
          </svg>
          Additional Reports
          {additionalReports.length > 0 && (
            <span className="reports-count-badge">{additionalReports.length}</span>
          )}
        </button>
      </div>

      {/* Scrollable Content Area */}
      <div className="assessment-scroll-container" ref={scrollContainerRef}>
        {/* Sticky Navigation Badges */}
        <div className={`section-nav-badges${navHidden ? ' nav-hidden' : ''}`}>
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

          {/* Section 6: Assessment Tools & Results */}
          <section
            className="assessment-section"
            ref={setSectionRef("tools")}
            id="section-tools"
          >
            <div className="section-header">
              <h3 className="section-title">VI, VII. Assessment Tools & Results</h3>
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
            </div>
          </section>

          {/* Section 7: Summary & Recommendations */}
          <section
            className="assessment-section"
            ref={setSectionRef("recommendations")}
            id="section-recommendations"
          >
            <div className="section-header">
              <h3 className="section-title">VIII. Summary & Recommendations</h3>
            </div>
            <div className="section-content">
              {/* Summary */}
              <div className="summary-final-section">
                <h4 className="summary-title">Summary</h4>
                <div className="summary-content-box">
                  <p className="report-text">
                    {assessmentSummary || "No overall summary provided."}
                  </p>
                </div>
              </div>

              {/* Recommendations */}
              <div className="recommendations-final-section">
                <h4 className="summary-title">Recommendations</h4>
                {recommendations && recommendations.length > 0 ? (
                  <ol className="report-list recommendations-list">
                    {recommendations
                      .filter(rec => rec && rec.trim())
                      .map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                  </ol>
                ) : (
                  <p className="report-text">No recommendations provided.</p>
                )}
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* Additional Reports Slide Panel */}
      {showReportsPanel && (
        <div className="reports-panel-overlay" onClick={() => setShowReportsPanel(false)}>
          <div className="reports-slide-panel" onClick={(e) => e.stopPropagation()}>
            <div className="reports-panel-header">
              <h3>Additional Reports</h3>
              <button className="close-panel-btn" onClick={() => setShowReportsPanel(false)}>×</button>
            </div>

            <div className="reports-panel-info">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span><strong>PDF format only</strong> &bull; Maximum 700KB per file</span>
            </div>

            {isAdmin && (
              <label className="add-report-btn-panel">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  style={{ display: 'none' }}
                />
                <span>+ Add Report</span>
              </label>
            )}

            {reportError && (
              <div className="report-error-msg">
                {reportError}
                <button onClick={() => setReportError(null)}>×</button>
              </div>
            )}

            <div className="reports-panel-content">
              {additionalReports.length === 0 ? (
                <div className="no-reports-message">
                  <p>No additional reports uploaded</p>
                </div>
              ) : (
                <div className="reports-list-container">
                  {additionalReports.map((report) => (
                    <div key={report.id} className="report-item-card">
                      <div className="report-item-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
                          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"/>
                          <path d="M14 2V8H20"/>
                        </svg>
                      </div>
                      <div className="report-item-details">
                        <h4>{report.fileName}</h4>
                        {report.description && <p className="report-desc">{report.description}</p>}
                        <span className="report-meta-info">
                          {formatReportDate(report.uploadedAt)}
                          {report.uploadedBy?.name && ` • ${report.uploadedBy.name}`}
                        </span>
                      </div>
                      <div className="report-item-actions">
                        <button
                          className="view-report-btn"
                          onClick={() => storageService.openPDF(report.fileUrl, report.fileName)}
                          title="View PDF"
                        >
                          View
                        </button>
                        {isAdmin && (
                          <button
                            className="delete-report-btn"
                            onClick={() => handleDeleteReport(report)}
                            disabled={deleting === report.id}
                            title="Delete"
                          >
                            {deleting === report.id ? '...' : '×'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="report-upload-overlay" onClick={handleCancelUpload}>
          <div className="report-upload-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Upload Additional Report</h3>

            <div className="upload-file-info">
              <span className="file-icon">📄</span>
              <span className="file-name">{selectedFile?.name}</span>
              <span className="file-size">({(selectedFile?.size / 1024).toFixed(1)} KB)</span>
            </div>

            <div className="upload-field">
              <label>Description (optional)</label>
              <input
                type="text"
                placeholder="e.g., OT Evaluation 2024"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="upload-actions">
              <button className="cancel-upload-btn" onClick={handleCancelUpload} disabled={uploading}>
                Cancel
              </button>
              <button className="confirm-upload-btn" onClick={handleUploadReport} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AssessmentHistory;
