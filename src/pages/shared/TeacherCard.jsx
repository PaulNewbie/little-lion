import React, { useState } from 'react';

const TeacherCard = ({ teacher }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!teacher) return null;

  return (
    <div style={styles.mainContainer}>
      <div style={styles.wrapper}>
        {/* ================= LEFT IMAGE CARD ================= */}
        <div style={styles.imageCard}>
          {teacher.profilePhoto ? (
            <img
              src={teacher.profilePhoto}
              alt={teacher.firstName}
              style={styles.largePhoto}
            />
          ) : (
            <div style={styles.largePhotoPlaceholder}>
              {teacher.firstName?.[0]}
              {teacher.lastName?.[0]}
            </div>
          )}
        </div>

        {/* ================= RIGHT CONTENT CARD ================= */}
        <div style={styles.card}>
          {/* Service Badge */}
          <div style={styles.serviceBadge}>Teacher Profile</div>

          {/* Header */}
          <div style={styles.header}>
            <div style={styles.info}>
              <h4 style={styles.name}>
                {teacher.firstName} {teacher.lastName}
              </h4>

              {/* Status Row */}
              <div style={styles.credentialRow}>
                <span style={{
                  ...styles.verifiedIcon,
                  color: teacher.profileCompleted ? '#059669' : '#d97706'
                }}>
                  {teacher.profileCompleted ? '✓' : '⚠️'}
                </span>
                <span style={{
                  ...styles.credentialText,
                  color: teacher.profileCompleted ? '#059669' : '#d97706'
                }}>
                  {teacher.profileCompleted ? 'Profile Active' : 'Setup Pending'}
                </span>
              </div>

              {/* Meta Row */}
              <div style={styles.metaRow}>
                <span>🗓️ {teacher.yearsExperience || 0} Years Experience</span>
                {teacher.employmentStatus && (
                  <span style={{ marginLeft: '12px' }}>• {teacher.employmentStatus}</span>
                )}
              </div>
            </div>
          </div>

          <div style={styles.divider} />

          {/* Body */}
          <div style={styles.body}>
            {/* License Information */}
            {(teacher.teachingLicense || teacher.certificationLevel) && (
              <div style={styles.section}>
                <div style={styles.sectionHeader}>📋 Teaching Credentials</div>
                <div style={styles.licenseGrid}>
                  {teacher.certificationLevel && (
                    <div style={styles.licenseCard}>
                      <div style={styles.licenseLabel}>Certification Level</div>
                      <div style={styles.licenseValue}>{teacher.certificationLevel}</div>
                    </div>
                  )}
                  {teacher.teachingLicense && (
                    <div style={styles.licenseCard}>
                      <div style={styles.licenseLabel}>Teaching License</div>
                      <div style={styles.licenseValue}>{teacher.teachingLicense}</div>
                    </div>
                  )}
                  {teacher.prcIdNumber && (
                    <div style={styles.licenseCard}>
                      <div style={styles.licenseLabel}>PRC ID</div>
                      <div style={styles.licenseValue}>{teacher.prcIdNumber}</div>
                    </div>
                  )}
                  {teacher.licenseState && (
                    <div style={styles.licenseCard}>
                      <div style={styles.licenseLabel}>State/Region</div>
                      <div style={styles.licenseValue}>{teacher.licenseState}</div>
                    </div>
                  )}
                  {teacher.licenseExpirationDate && (
                    <div style={styles.licenseCard}>
                      <div style={styles.licenseLabel}>License Expiration</div>
                      <div style={styles.licenseValue}>{teacher.licenseExpirationDate}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Specializations */}
            {teacher.specializations?.length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionHeader}>🎯 Specializations</div>
                <div style={styles.tagContainer}>
                  {teacher.specializations.map((spec, index) => (
                    <span key={index} style={styles.specTag}>
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {teacher.educationHistory?.length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionHeader}>🎓 Education</div>
                {teacher.educationHistory.map((edu, idx) => (
                  <div key={idx} style={styles.eduItem}>
                    <strong>{edu.degree}</strong>
                    <span style={styles.subText}>
                      {" "}• {edu.institution}
                      {edu.graduationYear && ` (${edu.graduationYear})`}
                    </span>
                    {edu.certificateURL && (
                      <a href={edu.certificateURL} target="_blank" rel="noreferrer" style={styles.viewLink}>
                        View Certificate
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Expand Button for Certifications */}
            {teacher.certifications?.length > 0 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                style={styles.expandBtn}
              >
                {isExpanded ? "Hide Certifications" : `View ${teacher.certifications.length} Certification(s)`}
              </button>
            )}

            {/* Certifications - Expandable */}
            {isExpanded && teacher.certifications?.length > 0 && (
              <div style={styles.certSection}>
                <div style={styles.certHeader}>Verified Certifications</div>
                <div style={styles.certGrid}>
                  {teacher.certifications.map((cert, idx) => (
                    <div key={idx} style={styles.certTag}>
                      <div style={styles.certInfo}>
                        <span style={styles.certName}>🏆 {cert.name}</span>
                        {cert.issuingOrg && (
                          <span style={styles.certIssuer}>{cert.issuingOrg}</span>
                        )}
                        {cert.expirationDate && (
                          <span style={styles.certMeta}>Exp: {cert.expirationDate}</span>
                        )}
                      </div>
                      {cert.certificateURL && (
                        <a
                          href={cert.certificateURL}
                          target="_blank"
                          rel="noreferrer"
                          style={styles.proofLink}
                        >
                          View 📎
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Info */}
            <div style={styles.contactSection}>
              <div style={styles.sectionHeader}>📧 Contact</div>
              <div style={styles.contactItem}>{teacher.email}</div>
              {teacher.phone && <div style={styles.contactItem}>{teacher.phone}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ================= STYLES ================= */

const styles = {
  mainContainer: {
    width: '100%',
    maxWidth: '1000px',
    margin: '0 0 0 20px',
    animation: 'fadeIn 0.3s ease-in-out',
  },

  wrapper: {
    display: "flex",
    gap: "2.5rem",
    marginBottom: "1rem",
    alignItems: "flex-start",
  },

  imageCard: {
    width: "300px",
    height: "385px",
    flexShrink: 0,
    backgroundColor: "white",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    padding: "1rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  largePhoto: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: "12px",
  },

  largePhotoPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: "12px",
    backgroundColor: "#cbd5e1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "3rem",
    fontWeight: "bold",
    color: "white",
  },

  card: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
  },

  serviceBadge: {
    backgroundColor: "#f0f9ff",
    color: "#0369a1",
    padding: "0.5rem 1rem",
    fontSize: "0.75rem",
    fontWeight: 700,
    textTransform: "uppercase",
    borderBottom: "1px solid #e0f2fe",
  },

  header: { padding: "1rem" },
  info: { flex: 1 },

  name: {
    margin: "0 0 0.25rem 0",
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "#0f172a",
  },

  credentialRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    marginBottom: "0.5rem",
  },

  verifiedIcon: {
    fontWeight: "bold",
  },

  credentialText: {
    fontSize: "0.85rem",
    fontWeight: 600,
  },

  metaRow: {
    fontSize: "0.85rem",
    color: "#64748b",
  },

  divider: {
    height: "1px",
    backgroundColor: "#f1f5f9",
  },

  body: {
    padding: "1rem",
  },

  section: {
    marginBottom: "1rem",
  },

  sectionHeader: {
    fontSize: "0.8rem",
    fontWeight: 700,
    color: "#64748b",
    marginBottom: "0.5rem",
    textTransform: "uppercase",
  },

  licenseGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
  },

  licenseCard: {
    backgroundColor: "#f0fdf4",
    border: "1px solid #86efac",
    borderRadius: "8px",
    padding: "10px 14px",
    minWidth: "120px",
  },

  licenseLabel: {
    fontSize: "0.7rem",
    fontWeight: 600,
    color: "#15803d",
    textTransform: "uppercase",
    marginBottom: "2px",
  },

  licenseValue: {
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#166534",
  },

  tagContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },

  specTag: {
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    padding: "4px 12px",
    borderRadius: "16px",
    fontSize: "0.8rem",
    fontWeight: 500,
    border: "1px solid #bfdbfe",
  },

  eduItem: {
    fontSize: "0.9rem",
    color: "#334155",
    marginBottom: "8px",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "8px",
  },

  subText: {
    fontSize: "0.8rem",
    color: "#94a3b8",
  },

  viewLink: {
    fontSize: "0.75rem",
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: 600,
  },

  expandBtn: {
    background: "none",
    border: "1px solid #e2e8f0",
    color: "#2563eb",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "pointer",
    padding: "8px 16px",
    borderRadius: "6px",
    marginTop: "0.5rem",
    width: "100%",
  },

  certSection: {
    marginTop: "1rem",
    paddingTop: "1rem",
    borderTop: "1px dashed #e2e8f0",
  },

  certHeader: {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#94a3b8",
    marginBottom: "0.5rem",
    textTransform: "uppercase",
  },

  certGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },

  certTag: {
    fontSize: "0.8rem",
    backgroundColor: "#fffbeb",
    color: "#b45309",
    padding: "0.75rem",
    borderRadius: "8px",
    border: "1px solid #fcd34d",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  certInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },

  certName: {
    fontWeight: 600,
  },

  certIssuer: {
    fontSize: "0.75rem",
    color: "#92400e",
  },

  certMeta: {
    fontSize: "0.7rem",
    color: "#d97706",
  },

  proofLink: {
    fontSize: "0.75rem",
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: 600,
    border: "1px solid #bfdbfe",
    padding: "4px 10px",
    borderRadius: "4px",
    backgroundColor: "white",
  },

  contactSection: {
    marginTop: "1rem",
    paddingTop: "1rem",
    borderTop: "1px solid #f1f5f9",
  },

  contactItem: {
    fontSize: "0.85rem",
    color: "#475569",
    marginBottom: "4px",
  },
};

export default TeacherCard;
