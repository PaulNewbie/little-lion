import React, { useState, useRef } from "react"; // 1. Added useRef
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import authService from "../../services/authService";
import ErrorMessage from "../../components/common/ErrorMessage";
import { ChevronDown } from 'lucide-react'; // 2. Import the arrow icon
import { ArrowBigDown, Mail, Phone } from 'lucide-react'; // Added Mail and Phone
import logo from '../../images/logo.png'; 
import childImage from '../../images/child.png';
import "./LandingPage.css";

const LandingPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();
  
  // 3. Create a reference for the login section
  const loginRef = useRef(null);

  // 4. Smooth scroll function
  const scrollToLogin = () => {
    loginRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
      <header className="landing-header">
        <div className="header-content">
          <div className="logo-circle">
            <img src={logo} alt="Little Lions Logo" className="logo-img" />
          </div>
          <h1 className="header-title">Little Lions Learning and Development Center</h1>
        </div>
      </header>

      <div className="hero-section">
        <div className="hero-overlay">
          <div className="hero-content">
            <div className="welcome-text">
              <p className="welcome-subtitle">Welcome to the</p>
            </div>
            
            {/* Updated Viewbox to 800 to prevent clipping at font size 40 */}
            <svg viewBox="0 0 800 180" className="portal-curved-svg">
              <defs>
                <path 
                  id="curvedPath" 
                  d="M 40,160 Q 400,10 760,160" 
                  fill="transparent" 
                />
              </defs>
              <text>
                <textPath 
                  xlinkHref="#curvedPath" 
                  startOffset="50%" 
                  textAnchor="middle" 
                  className="curved-portal-title"
                >
                  LITTLE LIONS TEAM PORTAL
                </textPath>
              </text>
            </svg>
          </div>
        </div>
      </div>

      <div className="thanks-login-section">
        <div className="thanks-section">
          <div className="thanks-content">
            <p className="arrow-guide-text">Click the Arrow to Login</p>
             {/* 5. Clickable Arrow with Bounce Animation */}
            <button 
              className="scroll-arrow-btn" 
              onClick={scrollToLogin}
              aria-label="Scroll to Login"
            >
              <ChevronDown size={48} strokeWidth={2.5} />
            </button>

            <h3 className="thanks-title">THANKS TEAM</h3>
            
           
            <p className="thanks-message">
              It's your energy, kindness, and creativity 
              that make every day special. Thanks for 
              everything you do to keep our kids happy, 
              safe and nurtured with learnings — we 
              couldn't do it without you.
            </p>
          </div>

          {/* 6. Attached ref to the login card */}
          <div className="login-card" ref={loginRef}>
            <div className="login-image">
              <img 
                src={childImage}
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
        <div className="footer-content">
          {/* Circle Logo and Title */}
          <div className="footer-info-item">
            <div className="footer-logo-circle">
              <img src={logo} alt="Little Lions" className="footer-logo-img" />
            </div>
            <span>Little Lions Learning and Development Center</span>
          </div>
          
          <span className="footer-divider">•</span>
          
          {/* Email with Icon */}
          <div className="footer-info-item">
            <Mail size={18} className="footer-icon" />
            <span>littlelionsldc@gmail.com</span>
          </div>

          <span className="footer-divider">•</span>

          {/* Phone with Icon */}
          <div className="footer-info-item">
            <Phone size={18} className="footer-icon" />
            <span>(+63) 9677900930</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;