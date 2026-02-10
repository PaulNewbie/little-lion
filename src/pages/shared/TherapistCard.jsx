import React from "react";

const TherapistCard = ({ therapist, serviceName, isSuperAdmin, onManageSpecs, onSpecializationClick, activeFilter }) => {
  if (!therapist) return null;

  // Format name: "Surname, First Middle"
  const formatFullName = () => {
    const parts = [];
    if (therapist.lastName) parts.push(therapist.lastName);
    if (therapist.firstName) parts.push(therapist.firstName);
    if (therapist.middleName) parts.push(therapist.middleName);

    if (parts.length === 0) return "N/A";
    if (parts.length === 1) return parts[0];

    return `${parts[0]}, ${parts.slice(1).join(' ')}`;
  };

  // Format address
  const formatAddress = () => {
    if (!therapist.address) return null;
    if (typeof therapist.address === 'string') return therapist.address;

    const { street, city, state, zip } = therapist.address;
    const parts = [street, city, state, zip].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  };

  return (
    <div style={styles.container}>
      {/* ================= TOP SECTION: Photo + Info + Specs ================= */}
      <div style={styles.topSection}>
        {/* LEFT: Profile Photo */}
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

        {/* RIGHT: Staff Info + Specializations */}
        <div style={styles.infoCard}>
          {/* Profile Info Section */}
          <div style={styles.profileSection}>
            {/* Name - Large and prominent */}
            <h2 style={styles.profileName}>{formatFullName()}</h2>

            <div style={styles.nameDivider} />

            {/* Profile info in 2-column grid */}
            <div style={styles.profileGrid}>
              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>GENDER</div>
                <div style={styles.infoValue}>
                  {therapist.gender || <span style={styles.missingText}>Not provided</span>}
                </div>
              </div>

              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>PHONE</div>
                <div style={styles.infoValue}>
                  {therapist.phone || therapist.phoneNumber || therapist.contactNumber || <span style={styles.missingText}>Not provided</span>}
                </div>
              </div>

              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>EMAIL</div>
                <div style={styles.infoValue}>
                  {therapist.email || <span style={styles.missingText}>Not provided</span>}
                </div>
              </div>

              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>BIRTHDAY</div>
                <div style={styles.infoValue}>
                  {therapist.birthday || therapist.dateOfBirth || <span style={styles.missingText}>Not provided</span>}
                </div>
              </div>

              <div style={{ ...styles.infoItem, gridColumn: '1 / -1' }}>
                <div style={styles.infoLabel}>ADDRESS</div>
                <div style={styles.infoValue}>
                  {formatAddress() || <span style={styles.missingText}>Not provided</span>}
                </div>
              </div>
            </div>

            {/* Profile setup reminder */}
            {(!therapist.gender && !therapist.phone && !therapist.phoneNumber && !therapist.contactNumber) && (
              <div style={styles.setupReminder}>
                <span style={styles.setupText}>Profile information incomplete. User needs to complete their profile setup.</span>
              </div>
            )}
          </div>

          <div style={styles.divider} />

          {/* Specializations */}
          <div style={styles.specsSection}>
            <div style={styles.specsHeader}>
              <div style={styles.sectionHeader}>SPECIALIZATIONS</div>

              {isSuperAdmin && onManageSpecs && (
                <button
                  onClick={() => onManageSpecs(therapist)}
                  style={styles.manageBtn}
                  title="Update services for this therapist"
                >
                  MANAGE
                </button>
              )}
            </div>
            {isSuperAdmin && onManageSpecs && (
              <p style={styles.manageHint}>Tap Manage to update assigned services</p>
            )}

            <div style={styles.specsGrid}>
              {(therapist.specializations && therapist.specializations.length > 0) ? (
                therapist.specializations.map((spec, idx) => (
                  <div
                    key={idx}
                    style={{
                      ...styles.specCard,
                      ...(activeFilter === spec ? styles.specCardActive : {}),
                      ...(onSpecializationClick ? { cursor: 'pointer' } : {})
                    }}
                    onClick={() => onSpecializationClick && onSpecializationClick(spec)}
                  >
                    <span style={styles.specDot} />
                    <span style={styles.specText}>{spec}</span>
                  </div>
                ))
              ) : (
                <span style={styles.emptyText}>No active specializations</span>
              )}

              {isSuperAdmin && therapist.deactivatedSpecializations?.map((spec, index) => (
                <div key={`inactive-${index}`} style={styles.specCardInactive}>
                  <span style={styles.specDotInactive} />
                  <span style={styles.specTextInactive}>{spec} (Inactive)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ================= BOTTOM SECTIONS: Credentials (Separate Cards) ================= */}

      {/* Professional Licenses Section - Only show if data exists */}
      {((therapist.licenses && therapist.licenses.length > 0) || therapist.prcIdNumber) && (
        <div style={styles.credentialCard}>
          <div style={styles.sectionHeader}>PROFESSIONAL LICENSES</div>

          {therapist.licenses && therapist.licenses.length > 0 ? (
            <div style={{
              ...styles.licensesGrid,
              gridTemplateColumns: therapist.licenses.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))'
            }}>
              {therapist.licenses.map((license, idx) => (
                <div key={idx} style={styles.licenseCard}>
                  <div style={styles.licenseHeader}>
                    <span style={styles.licenseType}>{license.licenseType}</span>
                  </div>
                  <div style={styles.licenseBody}>
                    <div style={styles.licenseRow}>
                      <span style={styles.licenseLabel}>License #:</span>
                      <span style={styles.licenseValue}>{license.licenseNumber}</span>
                    </div>
                    {license.licenseState && (
                      <div style={styles.licenseRow}>
                        <span style={styles.licenseLabel}>State/Region:</span>
                        <span style={styles.licenseValue}>{license.licenseState}</span>
                      </div>
                    )}
                    {license.licenseIssueDate && (
                      <div style={styles.licenseRow}>
                        <span style={styles.licenseLabel}>Issued:</span>
                        <span style={styles.licenseValue}>{license.licenseIssueDate}</span>
                      </div>
                    )}
                    {license.licenseExpirationDate && (
                      <div style={styles.licenseRow}>
                        <span style={styles.licenseLabel}>Expires:</span>
                        <span style={styles.licenseValue}>{license.licenseExpirationDate}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.licenseCard}>
              <div style={styles.licenseHeader}>
                <span style={styles.licenseType}>PRC ID</span>
              </div>
              <div style={styles.licenseBody}>
                <div style={styles.licenseRow}>
                  <span style={styles.licenseLabel}>ID #:</span>
                  <span style={styles.licenseValue}>{therapist.prcIdNumber}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Education History Section - Only show if data exists */}
      {((therapist.educationHistory && therapist.educationHistory.length > 0) || therapist.diplomaUrl) && (
        <div style={styles.credentialCard}>
          <div style={styles.sectionHeader}>EDUCATION HISTORY</div>

          {therapist.educationHistory && therapist.educationHistory.length > 0 ? (
            <div style={{
              ...styles.educationGrid,
              gridTemplateColumns: therapist.educationHistory.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))'
            }}>
              {therapist.educationHistory.map((edu, idx) => (
                <div key={idx} style={styles.educationCard}>
                  {edu.certificateURL && (
                    <div
                      style={styles.educationImage}
                      onClick={() => window.open(edu.certificateURL, '_blank')}
                    >
                      <img src={edu.certificateURL} alt={`${edu.degreeType} Certificate`} style={styles.certImg} />
                    </div>
                  )}
                  <div style={styles.educationInfo}>
                    <div style={styles.educationDegree}>
                      {edu.degreeType} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}
                    </div>
                    <div style={styles.educationSchool}>{edu.institution}</div>
                    {edu.graduationYear && (
                      <div style={styles.educationYear}>Graduated: {edu.graduationYear}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.documentPreview}>
              <img
                src={therapist.diplomaUrl}
                alt="Diploma"
                style={styles.documentImage}
                onClick={() => window.open(therapist.diplomaUrl, '_blank')}
              />
            </div>
          )}
        </div>
      )}

      {/* Certifications Section - Only show if data exists */}
      {therapist.certifications && therapist.certifications.length > 0 && (
        <div style={styles.credentialCard}>
          <div style={styles.sectionHeader}>CERTIFICATIONS</div>

          <div style={{
            ...styles.certificationsGrid,
            gridTemplateColumns: therapist.certifications.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))'
          }}>
            {therapist.certifications.map((cert, idx) => (
              <div key={idx} style={styles.certificationCard}>
                {cert.certificateURL && (
                  <div
                    style={styles.certificationImage}
                    onClick={() => window.open(cert.certificateURL, '_blank')}
                  >
                    <img src={cert.certificateURL} alt={cert.name} style={styles.certImg} />
                  </div>
                )}
                <div style={styles.certificationInfo}>
                  <div style={styles.certificationName}>{cert.name}</div>
                  {cert.issuingOrg && (
                    <div style={styles.certificationOrg}>{cert.issuingOrg}</div>
                  )}
                  <div style={styles.certificationMeta}>
                    {cert.issueDate && <span>Issued: {cert.issueDate}</span>}
                    {cert.expirationDate && <span> • Expires: {cert.expirationDate}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ================= STYLES ================= */

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },

  // Top Section: Photo + Info + Specs side by side
  topSection: {
    display: "flex",
    gap: "1.5rem",
    alignItems: "flex-start",
  },

  imageCard: {
    width: "300px",
    height: "385px",
    flexShrink: 0,
    backgroundColor: "white",
    borderRadius: "12px",
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
    borderRadius: "8px",
  },

  largePhotoPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: "8px",
    backgroundColor: "#cbd5e1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "3rem",
    fontWeight: "bold",
    color: "white",
  },

  infoCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
  },

  profileSection: {
    padding: "1.5rem",
  },

  profileName: {
    fontSize: "1.875rem",
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
    marginBottom: "0.75rem",
    letterSpacing: "-0.025em",
  },

  nameDivider: {
    height: "1px",
    backgroundColor: "#e2e8f0",
    marginBottom: "1rem",
  },

  profileGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0.75rem 1.5rem",
  },

  infoItem: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },

  infoLabel: {
    fontSize: "0.7rem",
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.025em",
  },

  infoValue: {
    fontSize: "0.9rem",
    color: "#0f172a",
    fontWeight: 500,
  },

  missingText: {
    color: "#94a3b8",
    fontStyle: "italic",
  },

  setupReminder: {
    marginTop: "1rem",
    padding: "0.75rem 1rem",
    backgroundColor: "#fef3c7",
    borderRadius: "8px",
    borderLeft: "4px solid #f59e0b",
  },

  setupText: {
    fontSize: "0.8rem",
    color: "#92400e",
    lineHeight: 1.4,
  },

  divider: {
    height: "1px",
    backgroundColor: "#e2e8f0",
    margin: "0 1.5rem",
  },

  specsSection: {
    padding: "1.5rem",
  },

  specsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "4px",
  },

  sectionHeader: {
    fontSize: "0.8rem",
    fontWeight: 700,
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },

  manageBtn: {
    background: "#2563eb",
    border: "none",
    color: "#ffffff",
    fontSize: "0.7rem",
    fontWeight: 700,
    cursor: "pointer",
    textDecoration: "none",
    padding: "5px 14px",
    textTransform: "uppercase",
    borderRadius: "20px",
    letterSpacing: "0.5px",
    transition: "background 0.2s ease",
  },

  manageHint: {
    fontSize: "0.7rem",
    color: "#94a3b8",
    fontStyle: "italic",
    margin: "0 0 10px 0",
    textAlign: "right",
  },

  specsGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem",
  },

  specCard: {
    display: "flex",
    alignItems: "center",
    gap: "0.625rem",
    backgroundColor: "#faf5ff",
    border: "2px solid #a855f7",
    borderRadius: "8px",
    padding: "0.75rem 1.25rem",
    transition: "all 0.15s ease",
  },

  specCardActive: {
    backgroundColor: "#a855f7",
    borderColor: "#9333ea",
  },

  specCardInactive: {
    display: "flex",
    alignItems: "center",
    gap: "0.625rem",
    backgroundColor: "#f8fafc",
    border: "2px dashed #cbd5e1",
    borderRadius: "8px",
    padding: "0.75rem 1.25rem",
  },

  specDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    backgroundColor: "#a855f7",
    flexShrink: 0,
  },

  specDotInactive: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    backgroundColor: "#94a3b8",
    flexShrink: 0,
  },

  specText: {
    fontSize: "0.95rem",
    color: "#7e22ce",
    fontWeight: 600,
  },

  specTextInactive: {
    fontSize: "0.95rem",
    color: "#94a3b8",
    fontWeight: 500,
  },

  emptyText: {
    fontSize: "0.85rem",
    color: "#94a3b8",
    fontStyle: "italic",
  },

  // Credential cards (separate)
  credentialCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    padding: "1.5rem",
  },

  // Licenses
  licensesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "1rem",
    marginTop: "0.75rem",
  },

  licenseCard: {
    backgroundColor: "#f0fdf4",
    border: "1px solid #86efac",
    borderRadius: "10px",
    overflow: "hidden",
    maxWidth: "400px",
  },

  licenseHeader: {
    backgroundColor: "#dcfce7",
    padding: "0.75rem 1rem",
    borderBottom: "1px solid #86efac",
  },

  licenseType: {
    fontSize: "0.9rem",
    fontWeight: 700,
    color: "#166534",
  },

  licenseBody: {
    padding: "0.75rem 1rem",
  },

  licenseRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "0.35rem",
  },

  licenseLabel: {
    fontSize: "0.8rem",
    color: "#166534",
    fontWeight: 500,
  },

  licenseValue: {
    fontSize: "0.8rem",
    color: "#166534",
    fontWeight: 600,
  },

  // Education
  educationGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "1rem",
    marginTop: "0.75rem",
  },

  educationCard: {
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    maxWidth: "400px",
  },

  educationImage: {
    width: "100%",
    height: "160px",
    overflow: "hidden",
    cursor: "pointer",
    backgroundColor: "#f1f5f9",
  },

  certImg: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },

  educationInfo: {
    padding: "1rem",
  },

  educationDegree: {
    fontSize: "0.9rem",
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "0.25rem",
  },

  educationSchool: {
    fontSize: "0.85rem",
    color: "#475569",
    marginBottom: "0.25rem",
  },

  educationYear: {
    fontSize: "0.75rem",
    color: "#94a3b8",
  },

  // Certifications
  certificationsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "1rem",
    marginTop: "0.75rem",
  },

  certificationCard: {
    backgroundColor: "#fffbeb",
    border: "1px solid #fcd34d",
    borderRadius: "10px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    maxWidth: "400px",
  },

  certificationImage: {
    width: "100%",
    height: "140px",
    overflow: "hidden",
    cursor: "pointer",
    backgroundColor: "#fef3c7",
  },

  certificationInfo: {
    padding: "1rem",
  },

  certificationName: {
    fontSize: "0.9rem",
    fontWeight: 700,
    color: "#92400e",
    marginBottom: "0.25rem",
  },

  certificationOrg: {
    fontSize: "0.85rem",
    color: "#b45309",
    marginBottom: "0.25rem",
  },

  certificationMeta: {
    fontSize: "0.75rem",
    color: "#d97706",
  },

  documentPreview: {
    maxWidth: "300px",
    marginTop: "0.75rem",
  },

  documentImage: {
    width: "100%",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    cursor: "pointer",
  },
};

export default TherapistCard;
