import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import "./TherapistSidebar.css";

const TherapistSidebar = ({ forceActive }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path) => {
    if (forceActive) return path === forceActive;
    return location.pathname === path;
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsDesktop(true);
        setIsOpen(true);
      } else {
        setIsDesktop(false);
        setIsOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {!isOpen && !isDesktop && (
        <button className="open-btn" onClick={() => setIsOpen(true)}>
          ☰
        </button>
      )}

      <div className={`therapist-sidebar ${isOpen ? "open" : "closed"}`}>
        {!isDesktop && (
          <button className="close-btn" onClick={() => setIsOpen(false)}>
            ✕
          </button>
        )}

        <div className="profile-section">
          <div className="avatar">👨‍⚕️</div>
          <div>
            <div className="role-label">THERAPIST</div>
            <div className="profile-name">{currentUser?.firstName || "Therapist"}</div>
          </div>
        </div>

        <div className="menu-section">
          <div className="section-title">MAIN</div>
          
          <div
            className={`menu-item ${isActive("/therapist/dashboard") ? "active" : ""}`}
            onClick={() => navigate("/therapist/dashboard")}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="menu-icon">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            <span className="menu-label">MY STUDENTS</span>
          </div>

          <div
            className={`menu-item ${isActive("/therapist/profile") ? "active" : ""}`}
            onClick={() => navigate("/therapist/profile")}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="menu-icon">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
            <span className="menu-label">MY PROFILE</span>
            {currentUser?.profileCompleted === false && (
              <span className="notification-dot"></span>
            )}
          </div>

          <div
            className={`menu-item ${isActive("/staff/inquiries") ? "active" : ""}`}
            onClick={() => navigate("/staff/inquiries")}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="menu-icon">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            <span className="menu-label">INQUIRIES</span>
          </div>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          LOG OUT
        </button>
      </div>
    </>
  );
};

export default TherapistSidebar;