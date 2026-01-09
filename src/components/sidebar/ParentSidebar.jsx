import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import "./ParentSidebar.css";

const ParentSidebar = () => {
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
    return location.pathname === path;
  };

  // Handle window resize
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

      <div className={`parent-sidebar ${isOpen ? "open" : "closed"}`}>
        {!isDesktop && (
          <button className="close-btn" onClick={() => setIsOpen(false)}>
            ✕
          </button>
        )}

        {/* Profile */}
        <div className="profile-section">
          <div className="avatar">👤</div>
          <div>
            <div className="role-label">PARENT</div>
            <div className="profile-name">{currentUser?.firstName || "Parent"}</div>
          </div>
        </div>

        {/* Main Menu */}
        <div className="menu-section">
          <div className="section-title">MAIN</div>
          
          <div
            className={`menu-item ${isActive("/parent/dashboard") ? "active" : ""}`}
            onClick={() => navigate("/parent/dashboard")}
          >
            <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span className="menu-label">MY CHILDREN</span>
          </div>

          <div
            className={`menu-item ${isActive("/parent/inquiries") ? "active" : ""}`}
            onClick={() => navigate("/parent/inquiries")}
          >
            <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
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

export default ParentSidebar;
