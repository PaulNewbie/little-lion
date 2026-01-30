// src/components/common/WelcomeModal.jsx

import React from 'react';

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    maxWidth: '420px',
    width: '100%',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
    overflow: 'hidden'
  },
  header: {
    backgroundColor: '#0052A1',
    padding: '24px',
    textAlign: 'center'
  },
  iconCircle: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 12px',
    fontSize: '28px'
  },
  title: {
    color: 'white',
    fontSize: '22px',
    fontWeight: '600',
    margin: 0
  },
  body: {
    padding: '24px'
  },
  message: {
    fontSize: '15px',
    color: '#374151',
    lineHeight: '1.6',
    marginBottom: '16px',
    textAlign: 'center'
  },
  highlight: {
    backgroundColor: '#fef3c7',
    border: '1px solid #fcd34d',
    borderRadius: '8px',
    padding: '14px',
    marginBottom: '20px',
    textAlign: 'center'
  },
  highlightText: {
    fontSize: '14px',
    color: '#92400e',
    margin: 0,
    fontWeight: '500'
  },
  primaryButton: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#0052A1',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '10px',
    transition: 'background-color 0.2s'
  },
  secondaryButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: 'transparent',
    color: '#6b7280',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'color 0.2s'
  }
};

const WelcomeModal = ({ 
  isOpen, 
  userName, 
  onCompleteProfile, 
  onSkip 
}) => {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div style={styles.iconCircle}>👋</div>
          <h2 style={styles.title}>Welcome, {userName}!</h2>
        </div>
        
        <div style={styles.body}>
          <p style={styles.message}>
            Your account is ready. Before you get started, take a moment to complete your professional profile.
          </p>
          
          <div style={styles.highlight}>
            <p style={styles.highlightText}>
              📋 Your profile will be visible to parents, helping them learn about their child's teacher or therapist.
            </p>
          </div>
          
          <button 
            style={styles.primaryButton}
            onClick={onCompleteProfile}
            onMouseOver={(e) => e.target.style.backgroundColor = '#003d7a'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#0052A1'}
          >
            Complete My Profile
          </button>
          
          <button 
            style={styles.secondaryButton}
            onClick={onSkip}
            onMouseOver={(e) => e.target.style.color = '#374151'}
            onMouseOut={(e) => e.target.style.color = '#6b7280'}
          >
            I'll do this later
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;