import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import "./AdminSidebar.css";

const AdminSidebar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="sidebar">

      {/* Profile Section */}
      <div className="sidebar-profile">
        <div className="sidebar-avatar">
          <img src="" alt="" />
        </div>

        <div className="sidebar-info">
          <p className="sidebar-role">SUPER ADMIN</p>
          <p className="sidebar-name">
            {currentUser?.firstName || "PHOEBE,"} {currentUser?.lastName || "DL"}
          </p>
        </div>
      </div>

      {/* MAIN */}
      <p className="sidebar-section-title">MAIN</p>

      <div
        className={`sidebar-item ${isActive("/admin/one-on-one") ? "active" : ""}`}
        onClick={() => navigate("/admin/one-on-one")}
      >
        <span className="sidebar-icon">👤</span> 1 : 1 SERVICES
      </div>

      <div
        className={`sidebar-item ${isActive("/admin/play-group") ? "active" : ""}`}
        onClick={() => navigate("/admin/play-group")}
      >
        <span className="sidebar-icon">👥</span> PLAY GROUP
      </div>

      <div
        className={`sidebar-item ${isActive("/admin/services") ? "active" : ""}`}
        onClick={() => navigate("/admin/services")}
      >
        <span className="sidebar-icon">➕</span> ADD SERVICES
      </div>

      {/* USER MANAGEMENT */}
      <p className="sidebar-section-title">USER MANAGEMENT</p>

      <div
        className={`sidebar-item ${isActive("/admin/enroll-child") ? "active" : ""}`}
        onClick={() => navigate("/admin/enroll-child")}
      >
        <span className="sidebar-icon">➕</span> ADD STUDENT
      </div>

      <div className="sidebar-item">
        <span className="sidebar-icon">➕</span> ADD ADMIN
      </div>

      <div
        className={`sidebar-item ${isActive("/admin/manage-teachers") ? "active" : ""}`}
        onClick={() => navigate("/admin/manage-teachers")}
      >
        <span className="sidebar-icon">➕</span> ADD TEACHER
      </div>


      {/* Logout */}
      <button className="sidebar-logout" onClick={handleLogout}>
        LOG OUT
      </button>
    </div>
  );
};

export default AdminSidebar;
