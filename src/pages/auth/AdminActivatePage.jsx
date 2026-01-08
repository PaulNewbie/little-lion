// src/pages/auth/AdminActivatePage.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../config/firebase';
import activationService from '../../services/activationService';

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  card: {
    backgroundColor: 'white',
    padding: '32px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    maxWidth: '400px',
    width: '100%'
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '8px',
    textAlign: 'center'
  },
  subtitle: {
    color: '#666',
    marginBottom: '24px',
    textAlign: 'center',
    fontSize: '14px'
  },
  inputGroup: {
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    marginBottom: '4px',
    fontWeight: '500',
    fontSize: '14px'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '16px',
    boxSizing: 'border-box'
  },
  codeInput: {
    width: '100%',
    padding: '14px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '20px',
    textAlign: 'center',
    letterSpacing: '4px',
    fontFamily: 'monospace',
    boxSizing: 'border-box'
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    marginTop: '8px'
  },
  buttonDisabled: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#93c5fd',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'not-allowed',
    marginTop: '8px'
  },
  error: {
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '14px'
  },
  success: {
    color: '#059669',
    backgroundColor: '#ecfdf5',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '14px'
  },
  infoBox: {
    backgroundColor: '#fef3c7',
    border: '1px solid #fcd34d',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '14px'
  },
  inputWrapper: {
    position: 'relative'
  },
  passwordToggle: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#666'
  },
  hint: {
    fontSize: '12px',
    color: '#666',
    marginTop: '4px'
  },
  divider: {
    borderTop: '1px solid #eee',
    margin: '20px 0'
  },
  checkItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 0',
    fontSize: '14px'
  }
};

export default function AdminActivatePage() {
  const navigate = useNavigate();
  
  const [step, setStep] = useState('enter_code'); // enter_code, verify, password, success
  const [code, setCode] = useState('');
  const [userData, setUserData] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!code.trim()) {
      setError('Please enter the admin code');
      return;
    }
    
    setLoading(true);
    
    const result = await activationService.validateAdminAssistCode(code);
    
    if (result.valid) {
      setUserData(result.user);
      setStep('verify');
    } else {
      setError(result.error || 'Invalid or expired code');
    }
    
    setLoading(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    const blocked = ['password', '12345678', 'qwerty123', 'password123'];
    if (blocked.includes(password.toLowerCase())) {
      setError('Please choose a stronger password');
      return;
    }
    
    setLoading(true);
    
    try {
      // Send password reset email
      await sendPasswordResetEmail(auth, userData.email, {
        url: `${window.location.origin}/login?activated=true`
      });
      
      // Mark account as active (activated by admin)
      await activationService.markAccountAsActive(userData.uid, 'admin');
      
      // Clear the admin assist code
      await activationService.clearAdminAssistCode(userData.uid);
      
      setStep('success');
    } catch (err) {
      setError(err.message || 'Failed to complete activation');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'enter_code':
        return (
          <>
            <h1 style={styles.title}>Staff-Assisted Setup</h1>
            <p style={styles.subtitle}>Enter the code given by the staff member</p>
            
            <div style={styles.infoBox}>
              <p style={{ margin: 0 }}>⚠️ This code expires in 10 minutes</p>
            </div>
            
            {error && <div style={styles.error}>{error}</div>}
            
            <form onSubmit={handleCodeSubmit}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Admin Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="A7X-9K2-B4M"
                  style={styles.codeInput}
                  maxLength={11}
                  autoFocus
                />
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                style={loading ? styles.buttonDisabled : styles.button}
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </form>
          </>
        );

      case 'verify':
        return (
          <>
            <h1 style={styles.title}>Confirm Your Details</h1>
            <p style={styles.subtitle}>Please verify this is your information</p>
            
            <div style={{ ...styles.infoBox, backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }}>
              <div style={styles.checkItem}>
                <span>👤</span>
                <span><strong>Name:</strong> {userData?.firstName} {userData?.lastName}</span>
              </div>
              <div style={styles.checkItem}>
                <span>📧</span>
                <span><strong>Email:</strong> {userData?.email}</span>
              </div>
              <div style={styles.checkItem}>
                <span>🏷️</span>
                <span><strong>Role:</strong> {userData?.role}</span>
              </div>
            </div>
            
            <button 
              onClick={() => setStep('password')} 
              style={styles.button}
            >
              Yes, continue
            </button>
          </>
        );

      case 'password':
        return (
          <>
            <h1 style={styles.title}>Create Password</h1>
            <p style={styles.subtitle}>Choose a password for {userData?.firstName}</p>
            
            {error && <div style={styles.error}>{error}</div>}
            
            <form onSubmit={handlePasswordSubmit}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>New Password</label>
                <div style={styles.inputWrapper}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    style={{ ...styles.input, paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={styles.passwordToggle}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              
              <div style={styles.inputGroup}>
                <label style={styles.label}>Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  style={styles.input}
                />
                {confirmPassword && password === confirmPassword && (
                  <p style={{ ...styles.hint, color: '#059669' }}>✓ Passwords match</p>
                )}
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                style={loading ? styles.buttonDisabled : styles.button}
              >
                {loading ? 'Setting up...' : 'Complete Setup'}
              </button>
            </form>
          </>
        );

      case 'success':
        return (
          <>
            <h1 style={{ ...styles.title, fontSize: '48px' }}>🎉</h1>
            <h1 style={styles.title}>All Done!</h1>
            
            <div style={styles.success}>
              <p style={{ margin: 0 }}>
                Account for <strong>{userData?.firstName}</strong> is now active!
              </p>
            </div>
            
            <div style={{ ...styles.infoBox, backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }}>
              <p style={{ margin: '0 0 8px 0', fontWeight: '500' }}>Next steps:</p>
              <p style={{ margin: '0 0 4px 0' }}>1. Check email: <strong>{userData?.email}</strong></p>
              <p style={{ margin: '0 0 4px 0' }}>2. Click the password setup link</p>
              <p style={{ margin: 0 }}>3. Set your final password and login</p>
            </div>
            
            <button 
              onClick={() => navigate('/login')}
              style={styles.button}
            >
              Go to Login
            </button>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {renderContent()}
      </div>
    </div>
  );
}