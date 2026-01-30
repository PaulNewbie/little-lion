// src/components/sidebar/Sidebar.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../context/ToastContext";
import { hasPermission } from "../../utils/permissions";
import "./Sidebar.css";

/**
 * Chevron Icon Component for dropdown indicators
 */
const ChevronIcon = ({ isOpen }) => (
  <svg 
    className={`sidebar__chevron ${isOpen ? 'sidebar__chevron--open' : ''}`}
    width="18" 
    height="18" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5"
  >
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

/**
 * Unified Sidebar Component with Dropdown Support
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
  const toast = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  
  // Track which dropdowns are expanded (by section index or dropdown id)
  const [expandedDropdowns, setExpandedDropdowns] = useState({});

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path) => {
    if (forceActive) return path === forceActive;
    return location.pathname === path;
  };

  /**
   * Check if any item in a dropdown is currently active
   */
  const isDropdownActive = (items) => {
    return items.some(item => isActive(item.path));
  };

  /**
   * Toggle dropdown expansion
   */
  const toggleDropdown = (dropdownId) => {
    setExpandedDropdowns(prev => ({
      ...prev,
      [dropdownId]: !prev[dropdownId]
    }));
  };

  // Auto-expand dropdowns that contain the active route
  useEffect(() => {
    const newExpanded = {};
    menuSections.forEach((section, sectionIndex) => {
      section.items.forEach((item, itemIndex) => {
        if (item.isDropdown && item.subItems) {
          const dropdownId = `${sectionIndex}-${itemIndex}`;
          if (isDropdownActive(item.subItems)) {
            newExpanded[dropdownId] = true;
          }
        }
      });
    });
    setExpandedDropdowns(newExpanded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, forceActive]);

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
    if (!item.requiresPermission) return false;
    return !hasPermission(currentUser, item.requiresPermission);
  };

  /**
   * Handle menu item click
   * Shows tooltip/alert for restricted items, navigates for allowed items
   */
  const handleMenuClick = (item) => {
    if (isItemRestricted(item)) {
      toast.warning("You don't have permission to access this feature. Please contact your administrator.");
      return;
    }
    
    navigate(item.path);
    if (!isDesktop) {
      setIsOpen(false);
    }
  };

  /**
   * Render a regular menu item
   */
  const renderMenuItem = (item, itemIndex, isSubItem = false) => {
    const restricted = isItemRestricted(item);
    
    return (
      <div
        key={itemIndex}
        className={`sidebar__menu-item ${isActive(item.path) ? "active" : ""} ${restricted ? "restricted" : ""} ${isSubItem ? "sidebar__menu-item--sub" : ""}`}
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
              opacity: 0.6,
              display: "flex",
              alignItems: "center"
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </span>
        )}
        
        {/* Show notification dot (only if not restricted) */}
        {!restricted && item.showNotification && (
          <span className="sidebar__notification-dot"></span>
        )}
      </div>
    );
  };

  /**
   * Render a dropdown menu item with sub-items
   */
  const renderDropdownItem = (item, sectionIndex, itemIndex) => {
    const dropdownId = `${sectionIndex}-${itemIndex}`;
    const isExpanded = expandedDropdowns[dropdownId];
    
    return (
      <div key={itemIndex} className="sidebar__dropdown">
        {/* Dropdown Header - Blue button style without icon */}
        <div
          className={`sidebar__dropdown-header ${isExpanded ? "expanded" : ""}`}
          onClick={() => toggleDropdown(dropdownId)}
        >
          <span className="sidebar__menu-label">{item.label}</span>
          <ChevronIcon isOpen={isExpanded} />
        </div>
        
        {/* Dropdown Content */}
        <div className={`sidebar__dropdown-content ${isExpanded ? "expanded" : ""}`}>
          {item.subItems
            .filter(subItem => !subItem.hidden)
            .map((subItem, subIndex) => renderMenuItem(subItem, subIndex, true))}
        </div>
      </div>
    );
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
          <div className="sidebar__avatar">
            {currentUser?.profilePhoto ? (
              <img 
                src={currentUser.profilePhoto} 
                alt="Profile" 
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
              />
            ) : (
              avatar
            )}
          </div>
          
          <div>
            <div className="sidebar__role">{roleLabel}</div>
            <div className="sidebar__name">
              {currentUser?.firstName || role.charAt(0).toUpperCase() + role.slice(1)}
            </div>
            {/* This is where our upload button will appear for parents */}
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
                // Check if this is a dropdown item
                if (item.isDropdown && item.subItems) {
                  return renderDropdownItem(item, sectionIndex, itemIndex);
                }
                // Regular menu item
                return renderMenuItem(item, itemIndex);
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