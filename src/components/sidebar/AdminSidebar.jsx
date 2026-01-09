import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import "./AdminSidebar.css";
import SP_Icon from "../../images/sp-icon.svg";
import ooo_Icon from "../../images/1on1-icon.svg";
import group_Icon from "../../images/group-class-icon.svg";
import enroll_Icon from "../../images/enroll-icon.svg";
import admin_Icon from "../../images/admin-icon.svg";
import teacher_Icon from "../../images/teacher-icon.svg";
import therapist_Icon1 from "../../images/therapist-icon/therapist1.svg";
import therapist_Icon2 from "../../images/therapist-icon/therapist2.svg";
import parent_Icon from "../../images/parent-icon.svg";

const ICONS = {
  SP: SP_Icon,
  OOO: ooo_Icon,
  Group: group_Icon,
  Enroll: enroll_Icon,
  Admin: admin_Icon,
  Teacher: teacher_Icon,
  Therapist: therapist_Icon1, therapist_Icon2,
  Parent: parent_Icon,
};

const AdminSidebar = ({ forceActive }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Updated to use forceActive if provided
  const isActive = (path) => {
    if (forceActive) return path === forceActive;
    return location.pathname === path;
  };

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
            <div className="profile-name">{currentUser?.firstName || "Admin"}</div>
          </div>
        </div>

        {/* Main Menu */}
        <div className="menu-section">
          <div className="section-title">MAIN</div>
          <div
            className={`menu-item ${isActive("/admin/StudentProfile") ? "active" : ""}`}
            onClick={() => navigate("/admin/StudentProfile")}
          >
            <img src={ICONS.SP} className="menu-icon" alt="SP" />
            <span className="menu-label">STUDENT PROFILE</span>
          </div>

          <div
            className={`menu-item ${isActive("/admin/one-on-one") ? "active" : ""}`}
            onClick={() => navigate("/admin/one-on-one")}
          >
            <img src={ICONS.OOO} className="menu-icon" alt="One On One" />
            <span className="menu-label">1 : 1 SERVICES</span> 
          </div>
          <div
            className={`menu-item ${isActive("/admin/play-group") ? "active" : ""}`}
            onClick={() => navigate("/admin/play-group")}
          >
            <img src={ICONS.Group} className="menu-icon" alt="Group class" />
            <span className="menu-label">GROUP CLASSES</span>
          </div>

          {/* RESTRICTED: Enroll Students */}
          {isSuperAdmin && (
            <div
              className={`menu-item ${isActive("/admin/enrollment") ? "active" : ""}`}
              onClick={() => navigate("/admin/enrollment")}
            >
              <img src={ICONS.Enroll} className="menu-icon" alt="Enroll" />
              <span className="menu-label">ENROLL STUDENT</span>
            </div>
          )}
        </div>

        {/* User Management */}
        <div className="menu-section">
          <div className="section-title">USER MANAGEMENT</div>

          {/* RESTRICTED: Add Admin (Only for Super Admin) */}
          {isSuperAdmin && (
            <div
              className={`menu-item ${isActive("/admin/manage-admins") ? "active" : ""}`}
              onClick={() => navigate("/admin/manage-admins")}
            >
              <img src={ICONS.Admin} className="menu-icon" alt="Admin" />
              <span className="menu-label">ADMIN</span>
            </div>
          )}

          <div
            className={`menu-item ${isActive("/admin/manage-teachers") ? "active" : ""}`}
            onClick={() => navigate("/admin/manage-teachers")}
          >
            <img src={ICONS.Teacher} className="menu-icon" alt="Teacher" />
            <span className="menu-label">TEACHER</span>
          </div>
          <div
            className={`menu-item ${isActive("/admin/manage-therapists") ? "active" : ""}`}
            onClick={() => navigate("/admin/manage-therapists")}
          >
            <img src={ICONS.Therapist} className="menu-icon" alt="Therapist" />
            <span className="menu-label">THERAPIST</span>
          </div>

          {/* NEW: Pending Accounts Link */}
          <div
            className={`menu-item ${isActive("/admin/pending-accounts") ? "active" : ""}`}
            onClick={() => navigate("/admin/pending-accounts")}
          >
            {/* Clock/Pending Icon using SVG */}
            <svg 
              width="25" 
              height="25" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className="menu-icon"
              style={{ color: '#374151' }}
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
            </svg>
            <span className="menu-label">PENDING ACCOUNTS</span>
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