import React, { useState, useEffect } from 'react';
import userService from '../../services/userService';

const TherapistCard = ({ therapistId, serviceName }) => {
  const [therapist, setTherapist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchTherapist = async () => {
      if (!therapistId) return;
      try {
        const data = await userService.getUserById(therapistId);
        // Only show if the profile is marked as completed
        if (data && data.profileCompleted) {
          setTherapist(data);
        }
      } catch (error) {
        console.error("Could not fetch therapist info", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTherapist();
  }, [therapistId]);

  if (loading) return <div style={styles.loading}>Loading therapist info...</div>;
  if (!therapist) return null; // Don't show anything if profile is incomplete or not found

  return (
    <div style={styles.card}>
      {/* Service Label Badge */}
      <div style={styles.serviceBadge}>{serviceName}</div>

      <div style={styles.header}>
        {/* Photo */}
        <div style={styles.photoContainer}>
          {therapist.profilePhoto ? (
            <img 
              src={therapist.profilePhoto} 
              alt={therapist.firstName} 
              style={styles.photo} 
            />
          ) : (
            <div style={styles.photoPlaceholder}>
              {therapist.firstName?.[0]}{therapist.lastName?.[0]}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={styles.info}>
          <h4 style={styles.name}>
            {therapist.firstName} {therapist.lastName}
          </h4>
          
          {therapist.licenseNumber && (
            <div style={styles.credentialRow}>
              <span style={styles.verifiedIcon}>✓</span>
              <span style={styles.credentialText}>
                Lic. {therapist.licenseNumber}
              </span>
            </div>
          )}

          <div style={styles.metaRow}>
            <span>🗓️ {therapist.yearsOfExperience || 0} Years Experience</span>
          </div>
        </div>
      </div>

      <div style={styles.divider}></div>

      {/* Body */}
      <div style={styles.body}>
        
        {/* Education Section (Handles Multiple Entries) */}
        {therapist.education && therapist.education.length > 0 && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>🎓 Education</div>
            {Array.isArray(therapist.education) ? (
              therapist.education.map((edu, idx) => (
                <div key={idx} style={styles.eduItem}>
                  <strong>{edu.degree}</strong>
                  <span style={styles.subText}> • {edu.school} ({edu.year})</span>
                </div>
              ))
            ) : (
              // Fallback for old string data
              <div style={styles.eduItem}>{therapist.education}</div>
            )}
          </div>
        )}

        {/* Languages */}
        {therapist.languagesSpoken && therapist.languagesSpoken.length > 0 && (
          <div style={styles.row}>
            <span style={styles.icon}>🗣️</span>
            <div style={styles.text}>
              {therapist.languagesSpoken.join(', ')}
            </div>
          </div>
        )}

        {/* Bio (Expandable) */}
        <div style={styles.bioContainer}>
          <p style={styles.bio}>
            {isExpanded ? therapist.bio : `${therapist.bio?.substring(0, 80)}...`}
          </p>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            style={styles.expandBtn}
          >
            {isExpanded ? 'Show Less' : 'View Full Profile'}
          </button>
        </div>

        {/* Certifications (Only show when expanded) */}
        {isExpanded && therapist.certifications && therapist.certifications.length > 0 && (
          <div style={styles.certSection}>
            <div style={styles.certHeader}>Verified Certifications</div>
            <div style={styles.certGrid}>
              {therapist.certifications.map((cert, idx) => {
                // Handle new Object structure vs potential old String structure
                const certName = typeof cert === 'object' ? cert.name : cert;
                const fileUrl = typeof cert === 'object' ? cert.fileUrl : null;
                const issuer = typeof cert === 'object' ? cert.issuer : null;

                return (
                  <div key={cert.id || idx} style={styles.certTag}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span>🏆 {certName}</span>
                      {issuer && <span style={{ fontSize: '0.7em', color: '#666' }}>({issuer})</span>}
                    </div>
                    {fileUrl && (
                      <a 
                        href={fileUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        title="View Certificate Proof"
                        style={styles.proofLink}
                      >
                        View Proof 📎
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  card: { backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  loading: { padding: '1rem', color: '#64748b', fontSize: '0.875rem', fontStyle: 'italic' },
  serviceBadge: { backgroundColor: '#f0f9ff', color: '#0369a1', padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e0f2fe' },
  header: { padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' },
  photoContainer: { flexShrink: 0 },
  photo: { width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #f1f5f9' },
  photoPlaceholder: { width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', color: 'white', fontWeight: 'bold' },
  info: { flex: 1 },
  name: { margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: '700', color: '#0f172a' },
  credentialRow: { display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' },
  verifiedIcon: { color: '#059669', fontSize: '0.875rem', fontWeight: 'bold' },
  credentialText: { fontSize: '0.8rem', color: '#059669', fontWeight: '600' },
  metaRow: { fontSize: '0.8rem', color: '#64748b' },
  divider: { height: '1px', backgroundColor: '#f1f5f9' },
  body: { padding: '1rem' },
  section: { marginBottom: '0.75rem' },
  sectionHeader: { fontSize: '0.8rem', fontWeight: '700', color: '#64748b', marginBottom: '0.25rem', textTransform: 'uppercase' },
  eduItem: { fontSize: '0.9rem', color: '#334155', marginBottom: '0.2rem' },
  subText: { fontSize: '0.8rem', color: '#94a3b8' },
  row: { display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'flex-start' },
  icon: { fontSize: '1rem', marginTop: '0.1rem' },
  text: { fontSize: '0.9rem', color: '#334155', flex: 1 },
  bioContainer: { backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', marginTop: '0.5rem' },
  bio: { margin: 0, fontSize: '0.875rem', color: '#475569', lineHeight: '1.5' },
  expandBtn: { background: 'none', border: 'none', color: '#2563eb', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', marginTop: '0.5rem', padding: 0 },
  certSection: { marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed #e2e8f0' },
  certHeader: { fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' },
  certGrid: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  certTag: { fontSize: '0.8rem', backgroundColor: '#fffbeb', color: '#b45309', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #fcd34d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  proofLink: { fontSize: '0.75rem', color: '#2563eb', textDecoration: 'none', fontWeight: '600', border: '1px solid #bfdbfe', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'white' }
};

export default TherapistCard;