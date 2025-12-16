import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import "./AdminSidebar.css";

const AdminSidebar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsDesktop(true);
        setIsOpen(true); // always open on desktop
      } else {
        setIsDesktop(false);
        setIsOpen(false); // default closed on mobile
      }
    };

    window.addEventListener("resize", handleResize);

    // Initialize
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {/* Open Button for mobile */}
      {!isOpen && !isDesktop && (
        <button className="open-btn" onClick={() => setIsOpen(true)}>
          ☰
        </button>
      )}

      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
        {/* Close Button only on mobile */}
        {!isDesktop && (
          <button className="close-btn" onClick={() => setIsOpen(false)}>
            ✕
          </button>
        )}

        {/* Profile */}
        <div className="profile-section">
          <div className="avatar">🦁</div>
          <div>
            <div className="role-label">SUPER ADMIN</div>
            <div className="profile-name">
              {currentUser?.firstName || "Admin"}
            </div>
          </div>
        </div>

        {/* Main Menu */}
        <div className="menu-section">
          <div className="section-title">MAIN</div>
          <div
            className={`menu-item ${
              isActive("/admin/StudentProfile") ? "active" : ""
            }`}
            onClick={() => navigate("/admin/StudentProfile")}
          >
            👤 STUDENT PROFILE
          </div>
          <div
            className={`menu-item ${
              isActive("/admin/OneOnOne") ? "active" : ""
            }`}
            onClick={() => navigate("/admin/OneOnOne")}
          >
            👥 1 : 1 SERVICES
          </div>
          <div
            className={`menu-item ${
              isActive("/admin/play-group") ? "active" : ""
            }`}
            onClick={() => navigate("/admin/play-group")}
          >
            👥 PLAY GROUP
          </div>

          <div
            className={`menu-item ${
              isActive("/admin/services") ? "active" : ""
            }`}
            onClick={() => navigate("/admin/services")}
          >
            ➕ ADD SERVICES
          </div>
        </div>

        {/* User Management */}
        <div className="menu-section">
          <div className="section-title">USER MANAGEMENT</div>
          <div
            className={`menu-item ${
              isActive("/admin/enroll-child") ? "active" : ""
            }`}
            onClick={() => navigate("/admin/enroll-child")}
          >
            ➕ ADD PARENT
          </div>
          <div className="menu-item">➕ ADD ADMIN</div>
          <div
            className={`menu-item ${
              isActive("/admin/manage-teachers") ? "active" : ""
            }`}
            onClick={() => navigate("/admin/manage-teachers")}
          >
            ➕ ADD TEACHER
          </div>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          LOG OUT
        </button>
      </div>
    </>
  );
};

export default AdminSidebar;
