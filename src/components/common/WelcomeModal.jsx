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
    borderRadius: '16px',
    maxWidth: '440px',
    width: '100%',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
    overflow: 'hidden'
  },
  header: {
    background: 'linear-gradient(135deg, #0052A1 0%, #0073e6 100%)',
    padding: '32px 24px',
    textAlign: 'center'
  },
  iconCircle: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
    fontSize: '36px'
  },
  title: {
    color: 'white',
    fontSize: '24px',
    fontWeight: '700',
    margin: '0 0 4px 0'
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: '15px',
    fontWeight: '400',
    margin: 0
  },
  body: {
    padding: '28px 24px'
  },
  message: {
    fontSize: '15px',
    color: '#4b5563',
    lineHeight: '1.7',
    marginBottom: '20px',
    textAlign: 'center'
  },
  stepsList: {
    backgroundColor: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: '12px',
    padding: '16px 20px',
    marginBottom: '24px'
  },
  stepsTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#0369a1',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    margin: '0 0 12px 0'
  },
  stepItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    color: '#374151',
    marginBottom: '8px'
  },
  stepIcon: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#0ea5e9',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '600',
    flexShrink: 0
  },
  highlight: {
    backgroundColor: '#fefce8',
    border: '1px solid #fde047',
    borderRadius: '10px',
    padding: '14px 16px',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px'
  },
  highlightIcon: {
    fontSize: '18px',
    flexShrink: 0
  },
  highlightText: {
    fontSize: '13px',
    color: '#854d0e',
    margin: 0,
    lineHeight: '1.5'
  },
  primaryButton: {
    width: '100%',
    padding: '14px 20px',
    background: 'linear-gradient(135deg, #0052A1 0%, #0073e6 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '12px',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 4px 12px rgba(0, 82, 161, 0.3)'
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
          <div style={styles.iconCircle}>🎉</div>
          <h2 style={styles.title}>Welcome to Little Lions!</h2>
          <p style={styles.subtitle}>Hi {userName}, we're so glad you're here</p>
        </div>

        <div style={styles.body}>
          <p style={styles.message}>
            Let's get your profile set up so parents can get to know you better. It only takes a few minutes!
          </p>

          <div style={styles.stepsList}>
            <p style={styles.stepsTitle}>Quick Setup</p>
            <div style={styles.stepItem}>
              <span style={styles.stepIcon}>1</span>
              <span>Add your photo</span>
            </div>
            <div style={styles.stepItem}>
              <span style={styles.stepIcon}>2</span>
              <span>Fill in your basic info</span>
            </div>
            <div style={{ ...styles.stepItem, marginBottom: 0 }}>
              <span style={styles.stepIcon}>3</span>
              <span>Add credentials (optional)</span>
            </div>
          </div>

          <div style={styles.highlight}>
            <span style={styles.highlightIcon}>💡</span>
            <p style={styles.highlightText}>
              Parents will be able to see your profile, so they know who's taking care of their little ones.
            </p>
          </div>

          <button
            style={styles.primaryButton}
            onClick={onCompleteProfile}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 6px 16px rgba(0, 82, 161, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(0, 82, 161, 0.3)';
            }}
          >
            Let's Get Started
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