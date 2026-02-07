import React from 'react';
import logo from '../../images/logo.webp';
import './LoadingScreen.css';

/**
 * Unified Loading Screen Component
 * A beautiful, animated loading screen for Little Lions
 *
 * @param {Object} props
 * @param {string} props.message - Custom loading message (default: "Loading")
 * @param {string} props.variant - Size variant: "fullpage" | "inline" | "compact" (default: "fullpage")
 * @param {string} props.role - User role for theming: "admin" | "parent" | "therapist" | "teacher"
 * @param {boolean} props.showProgress - Show animated progress bar
 * @param {boolean} props.showBrand - Show "Little Lions" brand text (default: true)
 * @param {string} props.animation - Animation style: "default" | "minimal" | "static"
 */
const LoadingScreen = ({
  message = "Loading",
  variant = "fullpage",
  role = "admin",
  showProgress = false,
  showBrand = true,
  animation = "default",
  className = ""
}) => {
  // Build class names
  const containerClasses = [
    'loading-screen',
    `loading-screen--${variant}`,
    `loading-screen--${role}`,
    animation !== "default" && `loading-screen--${animation}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      <div className="loading-screen__content">
        {/* Logo with animated rings */}
        <div className="loading-screen__logo-container">
          <div className="loading-screen__ring loading-screen__ring--outer" />
          <div className="loading-screen__ring" />
          <div className="loading-screen__logo-wrapper">
            <img
              src={logo}
              alt="Little Lions"
              className="loading-screen__logo"
            />
          </div>
        </div>

        {/* Text content */}
        <div className="loading-screen__text">
          {showBrand && (
            <h1 className="loading-screen__brand">Little Lions</h1>
          )}
          <p className="loading-screen__message">
            {message}
            <span className="loading-screen__dots">
              <span className="loading-screen__dot" />
              <span className="loading-screen__dot" />
              <span className="loading-screen__dot" />
            </span>
          </p>
        </div>

        {/* Optional progress bar */}
        {showProgress && (
          <div className="loading-screen__progress">
            <div className="loading-screen__progress-bar" />
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;
