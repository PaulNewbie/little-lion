import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ROUTES } from "../../routes/routeConfig";
import ErrorMessage from "../../components/common/ErrorMessage";
import { 
  ChevronDown, 
  Mail, 
  Phone, 
  Volume2, 
  VolumeX, 
  Volume1 
} from 'lucide-react';
import logo from '../../images/logo.png';
import childImage from '../../images/child.png';
import "./LandingPage.css";
import jingleAudio from "../../audio/Little Lion Jingle.mp3";

const LandingPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.6); // Default 60% volume

  const audioRef = useRef(null);
  const loginRef = useRef(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Sync volume state with the audio element whenever it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Attempt to autoplay on initial mount (may be blocked by browser)
  useEffect(() => {
    const attemptAutoplay = async () => {
      try {
        if (audioRef.current) {
          await audioRef.current.play();
          setIsPlaying(true);
        }
      } catch (err) {
        console.log("Autoplay blocked. Audio will start on user interaction.");
      }
    };
    attemptAutoplay();
  }, []);

  // Scrolls to login and unlocks audio playback via user gesture
  const scrollToLogin = () => {
    if (audioRef.current && !isPlaying) {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.error("Playback failed:", err));
    }
    loginRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleVolumeChange = (e) => {
    setVolume(parseFloat(e.target.value));
  };

  const toggleAudio = (e) => {
    e.stopPropagation();
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
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
      // Role-based redirection logic
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

  const handleForgotPassword = () => {
    navigate(ROUTES.FORGOT_PASSWORD);
  };

  return (
    <div className="landing-page">
      {/* Hidden Audio Component */}
      <audio ref={audioRef} src={jingleAudio} loop />

      {/* Floating Audio & Volume Controls */}
      <div className="audio-controls-container">
        <div className="volume-slider-wrapper">
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.1" 
            value={volume} 
            onChange={handleVolumeChange}
            className="volume-slider"
            aria-label="Volume slider"
          />
        </div>
        <button 
          className={`audio-control-btn ${isPlaying ? 'playing' : ''}`} 
          onClick={toggleAudio}
          aria-label={isPlaying ? "Mute" : "Play"}
        >
          {isPlaying ? (
            volume > 0.5 ? <Volume2 size={24} /> : <Volume1 size={24} />
          ) : (
            <VolumeX size={24} />
          )}
        </button>
      </div>

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
            
            <svg viewBox="0 0 800 180" className="portal-curved-svg">
              <defs>
                <path id="curvedPath" d="M 40,160 Q 400,10 760,160" fill="transparent" />
              </defs>
              <text>
                <textPath xlinkHref="#curvedPath" startOffset="50%" textAnchor="middle" className="curved-portal-title">
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

          <div className="login-card" ref={loginRef}>
            <div className="login-image">
              <img src={childImage} alt="Child Learning" className="child-img" />
            </div>

            <div className="login-form-wrapper">
              <h2 className="login-welcome-title">WELCOME</h2>

              {error && <ErrorMessage message={error} />}

              <div className="login-form">
                <div className="form-group">
                  <label className="login-label">Email</label>
                  <div className="input-with-icon">
                    <Mail className="input-icon" size={20} />
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
          <div className="footer-info-item">
            <div className="footer-logo-circle">
              <img src={logo} alt="Little Lions" className="footer-logo-img" />
            </div>
            <span>Little Lions Learning and Development Center</span>
          </div>
          <span className="footer-divider">•</span>
          <div className="footer-info-item">
            <Mail size={18} className="footer-icon" />
            <span>littlelionsldc@gmail.com</span>
          </div>
          <span className="footer-divider">•</span>
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