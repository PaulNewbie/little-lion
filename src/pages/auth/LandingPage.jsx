import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import authService from "../../services/authService";
import ErrorMessage from "../../components/common/ErrorMessage";
import logo from '../../images/logo.png'; 
import "./LandingPage.css";

const LandingPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.mustChangePassword) {
        navigate("/change-password");
        return;
      }
      switch (user.role) {
        case "super_admin":
        case "admin": navigate("/admin/dashboard"); break;
        case "teacher": navigate("/teacher/dashboard"); break;
        case "parent": navigate("/parent/dashboard"); break;
        case "therapist": navigate("/therapist/dashboard"); break;
        default: navigate("/");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) {
      handleLogin();
    }
  };

  const handleForgotPassword = async () => {
    const emailInput = prompt("Please enter your email address:");
    if (emailInput) {
      try {
        await authService.resetPassword(emailInput);
        alert("Password reset email sent!");
      } catch (err) {
        alert("Error: " + err.message);
      }
    }
  };

  return (
    <div className="landing-page">
      {/* 1. Transparent Header */}
      <header className="landing-header">
        <div className="header-content">
          <div className="logo-circle">
            <img src={logo} alt="Little Lions Logo" className="logo-img" />
          </div>
          <h1 className="header-title">Little Lions Learning and Development Center</h1>
        </div>
      </header>

      {/* 2. Hero Section with SVG Curved Text */}
      <div className="hero-section">
        <div className="hero-overlay">
          <div className="hero-content">
            <div className="welcome-text">
              <p className="welcome-subtitle">Welcome to the</p>
            </div>
            
            <svg viewBox="0 0 500 150" className="portal-curved-svg">
                {/* d="M (Start) Q (Control/Peak) (End)" */}
                {/* Peak is at 250,10 to create a shallow elliptical radius */}
                <path id="ellipsePath" d="M 20,140 Q 250,40 480,140" fill="transparent" />
                <text>
                    <textPath xlinkHref="#ellipsePath" startOffset="50%" textAnchor="middle" className="curved-portal-title">
                    LITTLE LIONS TEAM PORTAL
                    </textPath>
                </text>
                </svg>
          </div>
        </div>
      </div>

      {/* 3. Yellow Dome, Thanks, and Login Section */}
      <div className="thanks-login-section">
        <div className="thanks-section">
          <div className="thanks-content">
            <h3 className="thanks-title">THANKS TEAM</h3>
            <p className="thanks-message">
              It's your energy, kindness, and creativity that make every day special. 
              Thanks for everything you do to keep our kids happy, safe and nurtured 
              with learnings — we couldn't do it without you.
            </p>
          </div>

          <div className="login-card">
            <div className="login-image">
              <img 
                src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=500&fit=crop" 
                alt="Child Learning" 
                className="child-img"
              />
            </div>

            <div className="login-form-wrapper">
              <h2 className="login-welcome-title">WELCOME</h2>

              {error && <ErrorMessage message={error} />}

              <div className="login-form">
                <div className="form-group">
                  <label className="login-label">Email</label>
                  <div className="input-with-icon">
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={loading}
                      className="login-input"
                      placeholder="@gmail.com"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="login-label">Password</label>
                  <div className="input-with-icon">
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={loading}
                      className="login-input"
                      placeholder="••••••"
                    />
                  </div>
                </div>

                <div className="forgot-password-link">
                  <button onClick={handleForgotPassword} className="forgot-password-button" disabled={loading}>
                    Forgot your password?
                  </button>
                </div>

                <button onClick={handleLogin} disabled={loading} className="login-button">
                  {loading ? "LOGGING IN..." : "LOGIN"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="landing-footer">
        <div className="footer-logo">
          <img src={logo} alt="Little Lions" className="footer-logo-img" />
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;