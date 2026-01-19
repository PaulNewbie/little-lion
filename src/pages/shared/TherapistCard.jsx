import React, { useState } from "react";

const TherapistCard = ({ therapist, serviceName }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!therapist) return null;

  // Get primary license for header display
  const primaryLicense = therapist.licenses?.[0];

  return (
    <div style={styles.wrapper}>
      {/* ================= LEFT IMAGE CARD ================= */}
      <div style={styles.imageCard}>
        {therapist.profilePhoto ? (
          <img
            src={therapist.profilePhoto}
            alt={therapist.firstName}
            style={styles.largePhoto}
          />
        ) : (
          <div style={styles.largePhotoPlaceholder}>
            {therapist.firstName?.[0]}
            {therapist.lastName?.[0]}
          </div>
        )}
      </div>

      {/* ================= RIGHT CONTENT CARD ================= */}
      <div style={styles.card}>
        {/* Service Badge */}
        <div style={styles.serviceBadge}>{serviceName || "Therapist Profile"}</div>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.info}>
            <h4 style={styles.name}>
              {therapist.firstName} {therapist.lastName}
            </h4>

            {/* License Types */}
            {therapist.licenses?.length > 0 && (
              <div style={styles.credentialRow}>
                <span style={styles.verifiedIcon}>✓</span>
                <span style={styles.credentialText}>
                  {therapist.licenses.map(l => l.licenseType).join(' / ')}
                </span>
              </div>
            )}

            <div style={styles.metaRow}>
              <span>🗓️ {therapist.yearsExperience || 0} Years Experience</span>
              {therapist.employmentStatus && (
                <span style={{ marginLeft: '12px' }}>• {therapist.employmentStatus}</span>
              )}
            </div>
          </div>
        </div>

        <div style={styles.divider} />

        {/* Body */}
        <div style={styles.body}>
          {/* Licenses Section */}
          {therapist.licenses?.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>📋 Professional Licenses</div>
              <div style={styles.licensesGrid}>
                {therapist.licenses.map((license, idx) => (
                  <div key={idx} style={styles.licenseCard}>
                    <div style={styles.licenseType}>{license.licenseType}</div>
                    <div style={styles.licenseNumber}>#{license.licenseNumber}</div>
                    {license.licenseState && (
                      <div style={styles.licenseMeta}>{license.licenseState}</div>
                    )}
                    {license.licenseExpirationDate && (
                      <div style={styles.licenseMeta}>
                        Exp: {license.licenseExpirationDate}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Specializations */}
          {therapist.specializations?.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>🎯 Specializations</div>
              <div style={styles.tagsContainer}>
                {therapist.specializations.map((spec, idx) => (
                  <span key={idx} style={styles.specTag}>{spec}</span>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {therapist.educationHistory?.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>🎓 Education</div>
              {therapist.educationHistory.map((edu, idx) => (
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

          {/* Expand Button */}
          {therapist.certifications?.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              style={styles.expandBtn}
            >
              {isExpanded ? "Hide Certifications" : `View ${therapist.certifications.length} Certification(s)`}
            </button>
          )}

          {/* Certifications - Expandable */}
          {isExpanded && therapist.certifications?.length > 0 && (
            <div style={styles.certSection}>
              <div style={styles.certHeader}>Verified Certifications</div>
              <div style={styles.certGrid}>
                {therapist.certifications.map((cert, idx) => (
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
            <div style={styles.contactItem}>{therapist.email}</div>
            {therapist.phone && <div style={styles.contactItem}>{therapist.phone}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ================= STYLES ================= */

const styles = {
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
    color: "#059669",
    fontWeight: "bold",
  },

  credentialText: {
    fontSize: "0.85rem",
    color: "#059669",
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

  licensesGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
  },

  licenseCard: {
    backgroundColor: "#f0fdf4",
    border: "1px solid #86efac",
    borderRadius: "8px",
    padding: "10px 14px",
    minWidth: "140px",
  },

  licenseType: {
    fontSize: "0.9rem",
    fontWeight: 700,
    color: "#166534",
  },

  licenseNumber: {
    fontSize: "0.8rem",
    color: "#15803d",
    fontFamily: "monospace",
  },

  licenseMeta: {
    fontSize: "0.75rem",
    color: "#4ade80",
    marginTop: "2px",
  },

  tagsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
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

export default TherapistCard;
