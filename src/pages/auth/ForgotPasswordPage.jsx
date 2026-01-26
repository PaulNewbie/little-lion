// src/pages/auth/ForgotPasswordPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { ROUTES } from '../../routes/routeConfig';

// Rate limiting constants
const COOLDOWN_SECONDS = 60;
const STORAGE_KEY = 'passwordResetLastAttempt';

// Inline styles following ActivatePage pattern
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
    maxWidth: '420px',
    width: '100%'
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '8px',
    textAlign: 'center',
    color: '#333'
  },
  subtitle: {
    color: '#666',
    marginBottom: '24px',
    textAlign: 'center',
    fontSize: '15px',
    lineHeight: '1.5'
  },
  inputGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontWeight: '500',
    fontSize: '14px',
    color: '#333'
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '16px',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s'
  },
  inputDisabled: {
    width: '100%',
    padding: '14px 16px',
    border: '1px solid #eee',
    borderRadius: '6px',
    fontSize: '16px',
    backgroundColor: '#f9f9f9',
    color: '#666',
    boxSizing: 'border-box'
  },
  button: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'background-color 0.2s'
  },
  buttonDisabled: {
    width: '100%',
    padding: '14px',
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
    padding: '12px',
    backgroundColor: 'transparent',
    color: '#2563eb',
    border: '1px solid #2563eb',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    marginTop: '16px',
    transition: 'background-color 0.2s'
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    cursor: 'pointer',
    fontSize: '14px',
    textDecoration: 'underline',
    padding: '0',
    marginTop: '20px',
    display: 'block',
    textAlign: 'center',
    width: '100%'
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
    padding: '16px',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '14px'
  },
  successIcon: {
    fontSize: '48px',
    textAlign: 'center',
    marginBottom: '16px'
  },
  infoBox: {
    backgroundColor: '#f0f9ff',
    border: '1px solid #bae6fd',
    padding: '14px',
    borderRadius: '6px',
    marginBottom: '20px',
    fontSize: '14px',
    lineHeight: '1.5'
  },
  hint: {
    fontSize: '13px',
    color: '#666',
    marginTop: '8px',
    textAlign: 'center'
  },
  cooldownText: {
    fontSize: '13px',
    color: '#666',
    marginTop: '8px',
    textAlign: 'center'
  },
  divider: {
    borderTop: '1px solid #eee',
    margin: '24px 0'
  },
  stepsList: {
    margin: '16px 0',
    padding: '0 0 0 20px'
  },
  stepItem: {
    marginBottom: '8px',
    fontSize: '14px',
    color: '#555'
  }
};

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Check for existing cooldown on mount
  useEffect(() => {
    const lastAttempt = localStorage.getItem(STORAGE_KEY);
    if (lastAttempt) {
      const elapsed = Math.floor((Date.now() - parseInt(lastAttempt, 10)) / 1000);
      const remaining = COOLDOWN_SECONDS - elapsed;
      if (remaining > 0) {
        setCooldown(remaining);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address (e.g., yourname@email.com)');
      return;
    }

    // Check cooldown
    if (cooldown > 0) {
      setError(`Please wait ${cooldown} seconds before trying again`);
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(email);

      // Set cooldown
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
      setCooldown(COOLDOWN_SECONDS);

      setSuccess(true);
    } catch (err) {
      // Show friendly error messages
      if (err.message.includes('No account found') || err.message.includes('user-not-found')) {
        setError('We couldn\'t find an account with that email. Please check and try again.');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;

    setError('');
    setLoading(true);

    try {
      await authService.resetPassword(email);

      // Reset cooldown
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
      setCooldown(COOLDOWN_SECONDS);
    } catch (err) {
      setError('Failed to resend. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate(ROUTES.LOGIN);
  };

  // Success state
  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.successIcon}>✅</div>
          <h1 style={styles.title}>Check Your Email!</h1>
          <p style={styles.subtitle}>
            We sent password reset instructions to:
          </p>
          <p style={{ textAlign: 'center', fontWeight: '500', marginBottom: '20px' }}>
            {email}
          </p>

          <div style={styles.infoBox}>
            <p style={{ margin: '0 0 12px 0', fontWeight: '500' }}>What to do next:</p>
            <ol style={styles.stepsList}>
              <li style={styles.stepItem}>Open your email inbox</li>
              <li style={styles.stepItem}>Look for an email from Little Lions</li>
              <li style={styles.stepItem}>Click the link in the email</li>
              <li style={styles.stepItem}>Create your new password</li>
            </ol>
          </div>

          <div style={{ ...styles.infoBox, backgroundColor: '#fffbeb', borderColor: '#fcd34d' }}>
            <p style={{ margin: 0, fontSize: '13px' }}>
              <strong>Tip:</strong> Check your spam or junk folder if you don't see the email within a few minutes.
            </p>
          </div>

          <button
            onClick={handleBackToLogin}
            style={styles.button}
          >
            Back to Login
          </button>

          <div style={styles.divider} />

          <p style={{ textAlign: 'center', fontSize: '14px', color: '#666', margin: '0 0 12px 0' }}>
            Didn't receive the email?
          </p>
          <button
            onClick={handleResend}
            disabled={cooldown > 0 || loading}
            style={cooldown > 0 || loading ? styles.buttonDisabled : styles.secondaryButton}
          >
            {loading ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Email'}
          </button>
        </div>
      </div>
    );
  }

  // Initial form state
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Forgot Your Password?</h1>
        <p style={styles.subtitle}>
          No worries! Enter your email address below and we'll send you instructions to reset your password.
        </p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yourname@email.com"
              style={loading ? styles.inputDisabled : styles.input}
              disabled={loading}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || cooldown > 0}
            style={loading || cooldown > 0 ? styles.buttonDisabled : styles.button}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>

          {cooldown > 0 && (
            <p style={styles.cooldownText}>
              You can request another email in {cooldown} seconds
            </p>
          )}
        </form>

        <button
          onClick={handleBackToLogin}
          style={styles.linkButton}
        >
          ← Back to Login
        </button>

        <div style={styles.divider} />

        <p style={{ textAlign: 'center', fontSize: '13px', color: '#888' }}>
          Need help? Contact the school admin
        </p>
      </div>
    </div>
  );
}
