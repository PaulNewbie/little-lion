// src/components/sidebar/Sidebar.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { hasPermission } from "../../utils/permissions"; // ADD THIS IMPORT
import "./Sidebar.css";

/**
 * Unified Sidebar Component
 * @param {Object} props
 * @param {string} props.role - Role identifier for theming (admin, parent, therapist, teacher)
 * @param {string} props.roleLabel - Display label for the role
 * @param {string} props.avatar - Emoji or icon for avatar
 * @param {Array} props.menuSections - Array of menu sections with items
 * @param {string} [props.forceActive] - Force a specific path to be active
 * @param {Function} [props.renderExtraProfile] - Optional render function for extra profile content
 */
const Sidebar = ({
  role,
  roleLabel,
  avatar = "👤",
  menuSections = [],
  forceActive,
  renderExtraProfile
}) => {
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

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 768;
      setIsDesktop(desktop);
      setIsOpen(desktop);
    };

    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /**
   * Check if menu item is restricted due to missing permission
   * @param {Object} item - Menu item object
   * @returns {boolean} True if user lacks required permission
   */
  const isItemRestricted = (item) => {
    // No permission required for this item
    if (!item.requiresPermission) return false;
    
    // Check if user has the required permission
    return !hasPermission(currentUser, item.requiresPermission);
  };

  /**
   * Handle menu item click
   * Shows tooltip/alert for restricted items, navigates for allowed items
   */
  const handleMenuClick = (item) => {
    if (isItemRestricted(item)) {
      // Show feedback for restricted access
      alert("You don't have permission to access this feature. Please contact your administrator.");
      return;
    }
    
    navigate(item.path);
    if (!isDesktop) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile hamburger button */}
      {!isOpen && !isDesktop && (
        <button className="sidebar__open-btn" onClick={() => setIsOpen(true)}>
          ☰
        </button>
      )}

      <div className={`sidebar sidebar--${role} ${isOpen ? "open" : "closed"}`}>
        {/* Mobile close button */}
        {!isDesktop && (
          <button className="sidebar__close-btn" onClick={() => setIsOpen(false)}>
            ✕
          </button>
        )}

        {/* Profile Section */}
        <div className="sidebar__profile">
          <div className="sidebar__avatar">{avatar}</div>
          <div>
            <div className="sidebar__role">{roleLabel}</div>
            <div className="sidebar__name">
              {currentUser?.firstName || role.charAt(0).toUpperCase() + role.slice(1)}
            </div>
            {renderExtraProfile && renderExtraProfile()}
          </div>
        </div>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="sidebar__menu-section">
            {section.title && (
              <div className="sidebar__section-title">{section.title}</div>
            )}
            {section.items
              .filter(item => !item.hidden)
              .map((item, itemIndex) => {
                const restricted = isItemRestricted(item);
                
                return (
                  <div
                    key={itemIndex}
                    className={`sidebar__menu-item ${isActive(item.path) ? "active" : ""} ${restricted ? "restricted" : ""}`}
                    onClick={() => handleMenuClick(item)}
                    title={restricted ? "Permission required - Contact admin" : item.label}
                    style={restricted ? { opacity: 0.6, cursor: "not-allowed" } : {}}
                  >
                    {item.icon && (
                      typeof item.icon === 'string' ? (
                        <img src={item.icon} className="sidebar__menu-icon" alt={item.label} />
                      ) : (
                        <span className="sidebar__menu-icon sidebar__menu-icon--svg">
                          {item.icon}
                        </span>
                      )
                    )}
                    <span className="sidebar__menu-label">{item.label}</span>
                    
                    {/* Show lock icon for restricted items */}
                    {restricted && (
                      <span 
                        className="sidebar__lock-icon" 
                        style={{ 
                          marginLeft: "auto", 
                          fontSize: "14px",
                          opacity: 0.7 
                        }}
                      >
                        🔒
                      </span>
                    )}
                    
                    {/* Show notification dot (only if not restricted) */}
                    {!restricted && item.showNotification && (
                      <span className="sidebar__notification-dot"></span>
                    )}
                  </div>
                );
              })}
          </div>
        ))}

        {/* Logout Button */}
        <button className="sidebar__logout-btn" onClick={handleLogout}>
          LOG OUT
        </button>
      </div>
    </>
  );
};

export default Sidebar;