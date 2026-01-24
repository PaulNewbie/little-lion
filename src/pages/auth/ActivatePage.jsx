// src/pages/auth/ActivatePage.jsx

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import activationService from '../../services/activationService';

// Minimal inline styles
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
  inputDisabled: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #eee',
    borderRadius: '6px',
    fontSize: '16px',
    backgroundColor: '#f9f9f9',
    color: '#666',
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
  secondaryButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: 'transparent',
    color: '#2563eb',
    border: '1px solid #2563eb',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    marginTop: '12px'
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    cursor: 'pointer',
    fontSize: '14px',
    textDecoration: 'underline',
    padding: '0'
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
  stepIndicator: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '24px'
  },
  stepDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: '#ddd'
  },
  stepDotActive: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: '#2563eb'
  },
  infoBox: {
    backgroundColor: '#f0f9ff',
    border: '1px solid #bae6fd',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '14px'
  },
  checkItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 0',
    fontSize: '14px'
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
  inputWrapper: {
    position: 'relative'
  },
  hint: {
    fontSize: '12px',
    color: '#666',
    marginTop: '4px'
  },
  divider: {
    borderTop: '1px solid #eee',
    margin: '20px 0'
  }
};

export default function ActivatePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get code from URL if present
  const urlCode = searchParams.get('code') || '';
  
  // States
  const [step, setStep] = useState(urlCode ? 'validating' : 'enter_code'); 
  // Steps: enter_code, validating, welcome, verify, password, success, error
  
  const [code, setCode] = useState(urlCode);
  const [userData, setUserData] = useState(null);
  const [children, setChildren] = useState([]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState(''); // 'expired', 'already_active', 'invalid'

  // Validate code on mount if present in URL
  useEffect(() => {
    if (urlCode) {
      validateCode(urlCode);
    }
  }, [urlCode]);

  // Auto-redirect to login after successful activation
  useEffect(() => {
    if (step === 'success') {
      const timer = setTimeout(() => {
        window.history.replaceState({}, '', '/activate');
        navigate('/login');
      }, 5000); // 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [step, navigate]);

  const validateCode = async (codeToValidate) => {
    setStep('validating');
    setError('');

    try {
      const result = await activationService.validateActivationCode(codeToValidate);

      if (result.valid) {
        setUserData(result.user);

        // Fetch children if parent
        if (result.user.role === 'parent') {
          const childrenData = await activationService.getChildrenForParent(result.user.uid);
          setChildren(childrenData);
        }

        setStep('welcome');
      } else {
        setErrorType(result.error);
        setUserData(result.user || null);
        setStep('error');
      }
    } catch (err) {
      console.error('Validation error:', err);
      setErrorType('validation_failed');
      setStep('error');
    }
  };

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter your activation code');
      return;
    }
    validateCode(code);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Check blocked passwords
    const blocked = ['password', '12345678', 'qwerty123', 'password123'];
    if (blocked.includes(password.toLowerCase())) {
      setError('Please choose a stronger password');
      return;
    }
    
    setLoading(true);
    
    try {
      // Set password directly and clean up activation code document
      const result = await activationService.completeActivation(
        userData.uid,
        userData.email,
        password,
        'self',
        userData.activationCode  // Pass activation code for cleanup
      );
      
      if (result.success) {
        setStep('success');
      } else {
        setError(result.error || 'Failed to set password. Please try again.');
      }
    } catch (err) {
      console.error('Activation error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!userData) return;
    
    setLoading(true);
    try {
      const result = await activationService.regenerateActivationCode(userData.uid, userData.email);
      if (result.success) {
        alert(`New activation code: ${result.newCode}\n\nPlease use this code to activate your account.`);
        setCode(result.newCode);
        setStep('enter_code');
        setError('');
        setErrorType('');
      } else {
        setError('Failed to generate new code. Please contact support.');
      }
    } catch (err) {
      setError('Failed to generate new code');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'enter_code':
        return (
          <>
            <h1 style={styles.title}>Activate Your Account</h1>
            <p style={styles.subtitle}>
              Enter the activation code from your QR code or the code given by the admin
            </p>
            
            {error && <div style={styles.error}>{error}</div>}
            
            <form onSubmit={handleCodeSubmit}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Activation Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g., STAR-7842"
                  style={styles.input}
                  autoFocus
                />
                <p style={styles.hint}>
                  Format: XXXX-XXXX (e.g., STAR-7842)
                </p>
              </div>
              
              <button type="submit" style={styles.button}>
                Continue →
              </button>
            </form>
            
            <div style={styles.divider} />
            <p style={{ textAlign: 'center', fontSize: '14px', color: '#666' }}>
              Don't have a code? Contact the school admin
            </p>
          </>
        );

      case 'validating':
        return (
          <>
            <h1 style={{ ...styles.title, fontSize: '32px' }}>⏳</h1>
            <h1 style={styles.title}>Verifying...</h1>
            <p style={styles.subtitle}>Please wait while we verify your code</p>
          </>
        );

      case 'welcome':
        return (
          <>
            <div style={styles.stepIndicator}>
              <div style={styles.stepDotActive} />
              <div style={styles.stepDot} />
              <div style={styles.stepDot} />
            </div>
            
            <h1 style={styles.title}>Welcome!</h1>
            <p style={styles.subtitle}>
              We're setting up your account so you can monitor your child's progress
            </p>
            
            <div style={styles.infoBox}>
              <p style={{ margin: 0 }}>This will only take 2 minutes</p>
            </div>
            
            <button 
              onClick={() => setStep('verify')} 
              style={styles.button}
            >
              Let's Start →
            </button>
            
            <div style={styles.divider} />
            <p style={{ textAlign: 'center', fontSize: '14px', color: '#666' }}>
              Need help? Ask the admin or call the school
            </p>
          </>
        );

      case 'verify':
        return (
          <>
            <div style={styles.stepIndicator}>
              <div style={styles.stepDotActive} />
              <div style={styles.stepDotActive} />
              <div style={styles.stepDot} />
            </div>
            
            <h1 style={styles.title}>Confirm Your Details</h1>
            <p style={styles.subtitle}>Please verify this information is correct</p>
            
            <div style={styles.infoBox}>
              <div style={styles.checkItem}>
                <span>👤</span>
                <span><strong>Name:</strong> {userData?.firstName} {userData?.lastName}</span>
              </div>
              <div style={styles.checkItem}>
                <span>📧</span>
                <span><strong>Email:</strong> {userData?.email}</span>
              </div>
              {children.length > 0 && (
                <div style={styles.checkItem}>
                  <span>👶</span>
                  <span><strong>Child:</strong> {children.map(c => `${c.firstName} ${c.lastName}`).join(', ')}</span>
                </div>
              )}
              <div style={styles.checkItem}>
                <span>🏷️</span>
                <span><strong>Role:</strong> {userData?.role}</span>
              </div>
            </div>
            
            <button 
              onClick={() => setStep('password')} 
              style={styles.button}
            >
              Yes, this is me ✓
            </button>
            
            <button 
              onClick={() => {
                setError('Please contact the school admin to correct your information');
                setStep('enter_code');
              }}
              style={styles.secondaryButton}
            >
              This is not correct
            </button>
          </>
        );

      case 'password':
        return (
          <>
            <div style={styles.stepIndicator}>
              <div style={styles.stepDotActive} />
              <div style={styles.stepDotActive} />
              <div style={styles.stepDotActive} />
            </div>
            
            <h1 style={styles.title}>Create Password</h1>
            <p style={styles.subtitle}>Choose a password you'll remember</p>
            
            {error && <div style={styles.error}>{error}</div>}
            
            <form onSubmit={handlePasswordSubmit}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  value={userData?.email || ''}
                  disabled
                  style={styles.inputDisabled}
                />
              </div>
              
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
              
              <div style={styles.infoBox}>
                <p style={{ margin: 0, fontSize: '13px' }}>
                  💡 Tip: Use something memorable like "ILoveJuan2024!"
                </p>
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                style={loading ? styles.buttonDisabled : styles.button}
              >
                {loading ? 'Setting up...' : 'Complete Setup'}
              </button>
            </form>
            
            <button 
              onClick={() => setStep('verify')}
              style={{ ...styles.linkButton, marginTop: '16px', display: 'block', textAlign: 'center', width: '100%' }}
            >
              ← Back
            </button>
          </>
        );

      case 'success':
        return (
          <>
            <h1 style={{ ...styles.title, fontSize: '48px' }}>🎉</h1>
            <h1 style={styles.title}>You're All Set!</h1>
            <p style={styles.subtitle}>Your account is now active</p>
            
            <div style={styles.success}>
              <p style={{ margin: 0 }}>
                Your password has been set successfully!
              </p>
            </div>
            
            <div style={styles.infoBox}>
              <p style={{ margin: '0 0 8px 0', fontWeight: '500' }}>You can now log in with:</p>
              <p style={{ margin: '0 0 4px 0' }}>📧 <strong>Email:</strong> {userData?.email}</p>
              <p style={{ margin: 0 }}>🔑 <strong>Password:</strong> The one you just created</p>
            </div>
            
            <button 
              onClick={() => {
                // Clear the URL params and navigate to login
                window.history.replaceState({}, '', '/activate');
                navigate('/login');
              }}
              style={styles.button}
            >
              Go to Login →
            </button>
            
            <p style={{ textAlign: 'center', fontSize: '12px', color: '#999', marginTop: '16px' }}>
              Redirecting to login in 5 seconds...
            </p>
          </>
        );

      case 'error':
        return (
          <>
            {errorType === 'already_active' ? (
              <>
                <h1 style={{ ...styles.title, color: '#059669' }}>✅ Already Active</h1>
                <p style={styles.subtitle}>This account has already been set up</p>
                <button 
                  onClick={() => navigate('/login')}
                  style={styles.button}
                >
                  Go to Login
                </button>
              </>
            ) : errorType === 'expired' ? (
              <>
                <h1 style={{ ...styles.title, color: '#f59e0b' }}>⏰ Code Expired</h1>
                <p style={styles.subtitle}>Your activation code has expired</p>
                
                {userData && (
                  <button 
                    onClick={handleResendCode}
                    disabled={loading}
                    style={loading ? styles.buttonDisabled : styles.button}
                  >
                    {loading ? 'Sending...' : 'Get New Code'}
                  </button>
                )}
                
                <div style={styles.divider} />
                <p style={{ textAlign: 'center', fontSize: '14px', color: '#666' }}>
                  Or contact the school admin for help
                </p>
              </>
            ) : (
              <>
                <h1 style={{ ...styles.title, color: '#dc2626' }}>❌ Invalid Code</h1>
                <p style={styles.subtitle}>This activation code is not valid</p>

                <button
                  onClick={() => {
                    setStep('enter_code');
                    setError('');
                    setCode('');
                  }}
                  style={styles.button}
                >
                  Try Again
                </button>

                <div style={styles.divider} />
                <p style={{ textAlign: 'center', fontSize: '14px', color: '#666' }}>
                  Contact the school admin if you need help
                </p>
              </>
            )}
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