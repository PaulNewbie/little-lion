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

  // Helper to check for super admin
  const isSuperAdmin = currentUser?.role === "super_admin";

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

      <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
        {!isDesktop && (
          <button className="close-btn" onClick={() => setIsOpen(false)}>
            ✕
          </button>
        )}

        {/* Profile */}
        <div className="profile-section">
          <div className="avatar">🦁</div>
          <div>
            {/* Dynamic Role Label */}
            <div className="role-label">
              {isSuperAdmin ? "SUPER ADMIN" : "ADMINISTRATOR"}
            </div>
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
              isActive("/admin/one-on-one") ? "active" : ""
            }`}
            onClick={() => navigate("/admin/one-on-one")}
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

          {/* RESTRICTED: Add Services */}
          {isSuperAdmin && (
            <div
              className={`menu-item ${
                isActive("/admin/services") ? "active" : ""
              }`}
              onClick={() => navigate("/admin/services")}
            >
              ➕ ADD SERVICES
            </div>
          )}

          {/* RESTRICTED: Enroll Students*/}
          {isSuperAdmin && (
            <div
              className={`menu-item ${
                isActive("/admin/enrollment") ? "active" : ""
              }`}
              onClick={() => navigate("/admin/enrollment")}
            >
              ➕ ENROLL STUDENT
            </div>
          )}
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

          {/* RESTRICTED: Add Admin (Only for Super Admin) */}
          {isSuperAdmin && (
            <div
              className={`menu-item ${
                isActive("/admin/manage-admins") ? "active" : ""
              }`}
              onClick={() => navigate("/admin/manage-admins")}
            >
              ➕ ADD ADMIN
            </div>
          )}

          <div
            className={`menu-item ${
              isActive("/admin/manage-teachers") ? "active" : ""
            }`}
            onClick={() => navigate("/admin/manage-teachers")}
          >
            ➕ ADD TEACHER
          </div>
          <div
            className={`menu-item ${
              isActive("/admin/manage-therapists") ? "active" : ""
            }`}
            onClick={() => navigate("/admin/manage-therapists")}
          >
            ➕ ADD THERAPIST
          </div>
          <div
            className={`menu-item ${
              isActive("/admin/manage-parents") ? "active" : ""
            }`}
            onClick={() => navigate("/admin/manage-parents")}
          >
            ➕ PARENTS
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
