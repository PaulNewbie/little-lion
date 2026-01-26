// src/components/admin/ActivationModal.jsx

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import activationService from '../../services/activationService';
import { useToast } from '../../context/ToastContext';

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '8px',
    maxWidth: '420px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    margin: 0
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666'
  },
  success: {
    backgroundColor: '#ecfdf5',
    border: '1px solid #6ee7b7',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '16px',
    textAlign: 'center'
  },
  qrContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: '20px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    marginBottom: '16px'
  },
  dividerText: {
    textAlign: 'center',
    color: '#666',
    margin: '16px 0',
    fontSize: '14px'
  },
  codeBox: {
    backgroundColor: '#f3f4f6',
    padding: '16px',
    borderRadius: '6px',
    textAlign: 'center',
    marginBottom: '16px'
  },
  codeLabel: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '4px'
  },
  codeValue: {
    fontSize: '24px',
    fontWeight: '600',
    fontFamily: 'monospace',
    letterSpacing: '2px'
  },
  urlText: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '4px'
  },
  urlValue: {
    fontSize: '14px',
    fontWeight: '500',
    wordBreak: 'break-all'
  },
  buttonRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px'
  },
  button: {
    flex: 1,
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px'
  },
  buttonPrimary: {
    flex: 1,
    padding: '10px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#2563eb',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px'
  },
  divider: {
    borderTop: '1px solid #eee',
    margin: '16px 0'
  },
  helpLink: {
    display: 'block',
    textAlign: 'center',
    color: '#2563eb',
    fontSize: '14px',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    textDecoration: 'underline',
    width: '100%'
  },
  adminCodeSection: {
    backgroundColor: '#fef3c7',
    border: '1px solid #fcd34d',
    padding: '16px',
    borderRadius: '6px',
    marginTop: '16px'
  },
  adminCodeTitle: {
    fontWeight: '600',
    marginBottom: '8px',
    fontSize: '14px'
  },
  adminCodeValue: {
    fontSize: '20px',
    fontWeight: '600',
    fontFamily: 'monospace',
    letterSpacing: '2px',
    textAlign: 'center',
    padding: '12px',
    backgroundColor: 'white',
    borderRadius: '4px',
    marginBottom: '8px'
  },
  adminCodeExpiry: {
    fontSize: '12px',
    color: '#92400e',
    textAlign: 'center'
  },
  instructions: {
    fontSize: '13px',
    color: '#666',
    marginTop: '8px'
  }
};

export default function ActivationModal({ 
  isOpen, 
  onClose, 
  userData,  // { uid, firstName, lastName, email, activationCode }
  onEmailSent 
}) {
  const toast = useToast();
  const [showAdminAssist, setShowAdminAssist] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [adminCodeExpiry, setAdminCodeExpiry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setShowAdminAssist(false);
      setAdminCode('');
      setAdminCodeExpiry(null);
      setEmailSent(false);
    }
  }, [isOpen]);

  if (!isOpen || !userData) return null;

  const activationUrl = `${window.location.origin}/activate?code=${userData.activationCode}`;
  const adminActivateUrl = `${window.location.origin}/admin-activate`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(userData.activationCode);
    toast.success('Code copied!');
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(activationUrl);
    toast.success('URL copied!');
  };

  const handleSendEmail = async () => {
    setLoading(true);
    const result = await activationService.sendActivationEmail(
      userData.email, 
      userData.activationCode
    );
    setLoading(false);
    
    if (result.success) {
      setEmailSent(true);
      if (onEmailSent) onEmailSent();
    } else {
      toast.error('Failed to send email: ' + result.error);
    }
  };

  const handleGenerateAdminCode = async () => {
    setLoading(true);
    const result = await activationService.generateAdminAssistCodeForUser(userData.uid);
    setLoading(false);

    if (result.success) {
      setAdminCode(result.code);
      setAdminCodeExpiry(result.expiry);
      setShowAdminAssist(true);
    } else {
      toast.error('Failed to generate admin code: ' + result.error);
    }
  };

  const formatExpiry = (expiry) => {
    if (!expiry) return '';
    const remaining = Math.max(0, Math.floor((expiry - Date.now()) / 60000));
    return `Expires in ${remaining} minutes`;
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Account Created</h2>
          <button style={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div style={styles.success}>
          ✅ Account created for <strong>{userData.firstName} {userData.lastName}</strong>
        </div>

        {!showAdminAssist ? (
          <>
            {/* QR Code */}
            <div style={styles.qrContainer}>
              <QRCodeSVG 
                value={activationUrl} 
                size={180}
                level="M"
              />
            </div>
            <p style={{ textAlign: 'center', fontSize: '14px', color: '#666', marginTop: '-8px', marginBottom: '16px' }}>
              Scan with phone camera to activate
            </p>

            <div style={styles.dividerText}>— OR enter manually —</div>

            {/* Manual Code */}
            <div style={styles.codeBox}>
              <p style={styles.urlText}>Go to: <strong>{window.location.origin}/activate</strong></p>
              <p style={styles.codeLabel}>Activation Code:</p>
              <p style={styles.codeValue}>{userData.activationCode}</p>
            </div>

            {/* Action Buttons */}
            <div style={styles.buttonRow}>
              <button style={styles.button} onClick={handleCopyCode}>
                📋 Copy Code
              </button>
              <button style={styles.button} onClick={handleCopyUrl}>
                🔗 Copy Link
              </button>
            </div>

            <div style={styles.buttonRow}>
              <button 
                style={styles.buttonPrimary} 
                onClick={handleSendEmail}
                disabled={loading || emailSent}
              >
                {emailSent ? '✓ Email Sent' : loading ? 'Sending...' : '📧 Send Email'}
              </button>
            </div>

            <div style={styles.divider} />

            <button style={styles.helpLink} onClick={handleGenerateAdminCode}>
              Parent having trouble? Activate for them →
            </button>
          </>
        ) : (
          <>
            {/* Admin Assist Mode */}
            <div style={styles.adminCodeSection}>
              <p style={styles.adminCodeTitle}>🔐 Admin-Assisted Activation</p>
              
              <p style={styles.instructions}>
                1. On the parent's phone, go to:
              </p>
              <p style={{ ...styles.urlValue, marginBottom: '12px' }}>{adminActivateUrl}</p>
              
              <p style={styles.instructions}>
                2. Enter this code:
              </p>
              <div style={styles.adminCodeValue}>{adminCode}</div>
              <p style={styles.adminCodeExpiry}>{formatExpiry(adminCodeExpiry)}</p>
              
              <p style={styles.instructions}>
                3. Help them set their password on their device
              </p>
            </div>

            <div style={styles.buttonRow}>
              <button 
                style={styles.button} 
                onClick={() => navigator.clipboard.writeText(adminCode)}
              >
                📋 Copy Code
              </button>
              <button 
                style={styles.button} 
                onClick={handleGenerateAdminCode}
                disabled={loading}
              >
                🔄 New Code
              </button>
            </div>

            <button 
              style={{ ...styles.helpLink, marginTop: '8px' }}
              onClick={() => setShowAdminAssist(false)}
            >
              ← Back to QR Code
            </button>
          </>
        )}

        <div style={styles.divider} />
        
        <button style={styles.buttonPrimary} onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}