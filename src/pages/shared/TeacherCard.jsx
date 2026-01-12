// src/components/admin/TeacherCard.jsx

import React, { useState } from 'react';

const TeacherCard = ({ teacher }) => {
  // We keep the expand logic state in case you want to use it for bio/details later
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
          <div style={styles.serviceBadge}>
            Teacher Profile • ID: {teacher.uid}
          </div>

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
                📧 {teacher.email}
              </div>
            </div>
          </div>

          <div style={styles.divider} />

          {/* Body */}
          <div style={styles.body}>
            
            {/* Contact / Info Section */}
            <div style={styles.section}>
              <div style={styles.sectionHeader}>📋 Account Details</div>
              <div style={styles.eduItem}>
                <strong>System Role</strong>
                <span style={styles.subText}> • Teacher Access</span>
              </div>
              <div style={styles.eduItem}>
                <strong>Email Status</strong>
                <span style={styles.subText}> • {teacher.email ? 'Linked' : 'Missing'}</span>
              </div>
            </div>

            {/* Specializations */}
            <div style={styles.bioContainer}>
              <div style={styles.sectionHeader}>Specializations</div>
              
              {teacher.specializations && teacher.specializations.length > 0 ? (
                <div style={styles.tagContainer}>
                  {teacher.specializations.map((spec, index) => (
                    <span key={index} style={styles.tag}>
                      {spec}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={styles.bio}>No specializations listed yet.</p>
              )}
            </div>

            {/* Verified Badge */}
            {teacher.profileCompleted && (
              <div style={styles.certSection}>
                 <div style={styles.certTag}>
                    <div>
                      🏆 Verified Teacher Account
                    </div>
                 </div>
              </div>
            )}
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

  /* LEFT IMAGE CARD */
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

  /* RIGHT CARD */
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
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#0f172a",
  },

  credentialRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    marginBottom: "0.25rem",
  },

  verifiedIcon: {
    fontWeight: "bold",
  },

  credentialText: {
    fontSize: "0.8rem",
    fontWeight: 600,
  },

  metaRow: {
    fontSize: "0.8rem",
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
    marginBottom: "0.75rem",
  },

  sectionHeader: {
    fontSize: "0.8rem",
    fontWeight: 700,
    color: "#64748b",
    marginBottom: "0.5rem",
    textTransform: "uppercase",
  },

  eduItem: {
    fontSize: "0.9rem",
    color: "#334155",
    marginBottom: "4px",
  },

  subText: {
    fontSize: "0.8rem",
    color: "#94a3b8",
  },

  bioContainer: {
    backgroundColor: "#f8fafc",
    padding: "0.75rem",
    borderRadius: "0.5rem",
    marginTop: "1rem",
  },

  bio: {
    margin: 0,
    fontSize: "0.875rem",
    color: "#475569",
    lineHeight: "1.5",
  },

  tagContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  
  tag: {
    backgroundColor: 'white',
    color: '#334155',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: '500',
    border: '1px solid #e2e8f0',
  },

  certSection: {
    marginTop: "1rem",
    paddingTop: "1rem",
    borderTop: "1px dashed #e2e8f0",
  },

  certTag: {
    fontSize: "0.8rem",
    backgroundColor: "#fffbeb",
    color: "#b45309",
    padding: "0.5rem",
    borderRadius: "0.25rem",
    border: "1px solid #fcd34d",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
};

export default TeacherCard;