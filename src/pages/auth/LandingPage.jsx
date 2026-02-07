import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ROUTES } from "../../routes/routeConfig";
import ErrorMessage from "../../components/common/ErrorMessage";
import { ChevronDown, Volume2, VolumeX, Mail, Phone, Eye, EyeOff } from 'lucide-react';
import logo from '../../images/logo.webp';
import childImage from '../../images/login pic.jpg';
import "./LandingPage.css";

const LandingPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Refs
  const loginRef = useRef(null);
  const audioRef = useRef(null);
  const volumeControlRef = useRef(null);
  const userMutedRef = useRef(false);

  // Smooth scroll function
  const scrollToLogin = () => {
    if (audioRef.current && !isPlaying && !userMutedRef.current) {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.error("Playback failed:", err));
    }
    loginRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Start audio on first scroll only (respects user mute)
  useEffect(() => {
    const startAudioOnScroll = () => {
      if (audioRef.current && !isPlaying && !userMutedRef.current) {
        audioRef.current.volume = volume;
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          console.log("Audio autoplay prevented:", err);
        });
      }
    };

    window.addEventListener('scroll', startAudioOnScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', startAudioOnScroll);
    };
  }, [isPlaying, volume]);

  // Handle click outside volume control to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (volumeControlRef.current && !volumeControlRef.current.contains(event.target)) {
        setShowVolumeSlider(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle audio play/pause
  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        userMutedRef.current = true;
      } else {
        userMutedRef.current = false;
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          console.log("Audio play prevented:", err);
        });
      }
    }
  };

  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
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
      {/* Background Audio - lazy loaded */}
      <audio ref={audioRef} loop preload="none">
        <source src={new URL('../../audio/Little Lion Jingle.mp3', import.meta.url).href} type="audio/mpeg" />
      </audio>

      {/* Volume Control */}
      <div className="volume-control" ref={volumeControlRef}>
        <button
          className={`volume-btn ${isPlaying ? 'playing' : ''}`}
          onClick={toggleAudio}
          onMouseEnter={() => setShowVolumeSlider(true)}
          aria-label={isPlaying ? 'Mute audio' : 'Play audio'}
        >
          {isPlaying ? <Volume2 size={20} /> : <VolumeX size={20} />}
          {isPlaying && (
            <div className="equalizer-bars">
              <span className="eq-bar"></span>
              <span className="eq-bar"></span>
              <span className="eq-bar"></span>
              <span className="eq-bar"></span>
            </div>
          )}
        </button>

        <div className={`volume-slider-container ${showVolumeSlider ? 'visible' : ''}`}>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="volume-slider"
            aria-label="Volume control"
          />
          <div className="volume-level" style={{ width: `calc((100% - 24px) * ${volume})` }} />
        </div>
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

            <svg viewBox="0 0 1000 200" className="portal-curved-svg desktop-only">
              <defs>
                <path id="curvedPath" d="M 30,185 Q 500,5 970,185" fill="transparent" />
              </defs>
              <text>
                <textPath xlinkHref="#curvedPath" startOffset="50%" textAnchor="middle" className="curved-portal-title">
                  LITTLE LIONS TEAM PORTAL
                </textPath>
              </text>
            </svg>
            <h2 className="mobile-portal-title mobile-only">LITTLE LIONS TEAM PORTAL</h2>
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
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={loading}
                      className="login-input"
                      placeholder="••••••"
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="password-toggle-btn"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
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
