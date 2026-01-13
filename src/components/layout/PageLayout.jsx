import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './PageLayout.css';

/**
 * PageLayout - Reusable layout component with sidebar and main content area
 * Provides consistent full-height sidebar layout across all pages
 *
 * @param {Object} props
 * @param {string} props.role - Role identifier for theming (admin, parent, therapist, teacher)
 * @param {string} props.roleLabel - Display label for the role
 * @param {string} props.avatar - Emoji or icon for avatar
 * @param {Array} props.menuSections - Array of menu sections with items
 * @param {string} [props.forceActive] - Force a specific path to be active
 * @param {React.ReactNode} props.children - Main content to render
 */
const PageLayout = ({
  role,
  roleLabel,
  avatar = '👤',
  menuSections = [],
  forceActive,
  children
}) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (forceActive) return path === forceActive;
    return location.pathname === path;
  };

  const handleMenuClick = (path) => {
    navigate(path);
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <div className="page-layout">
      {/* Mobile Header */}
      {isMobile && (
        <header className="page-layout__mobile-header">
          <button
            className="page-layout__menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
          <span className="page-layout__mobile-title">{roleLabel}</span>
        </header>
      )}

      {/* Mobile Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div
          className="page-layout__overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`page-layout__sidebar page-layout__sidebar--${role} ${
          isMobile ? (isMobileMenuOpen ? 'open' : 'closed') : ''
        }`}
      >
        {/* Profile Section */}
        <div className="page-layout__profile">
          <div className="page-layout__avatar">{avatar}</div>
          <div className="page-layout__profile-info">
            <span className="page-layout__role">{roleLabel}</span>
            <span className="page-layout__name">
              {currentUser?.firstName || role.charAt(0).toUpperCase() + role.slice(1)}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="page-layout__nav">
          {menuSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="page-layout__nav-section">
              {section.title && (
                <h3 className="page-layout__nav-title">{section.title}</h3>
              )}
              <ul className="page-layout__nav-list">
                {section.items
                  .filter(item => !item.hidden)
                  .map((item, itemIndex) => (
                    <li key={itemIndex}>
                      <button
                        className={`page-layout__nav-item ${isActive(item.path) ? 'active' : ''}`}
                        onClick={() => handleMenuClick(item.path)}
                      >
                        {item.icon && (
                          <span className="page-layout__nav-icon">
                            {typeof item.icon === 'string' ? (
                              <img src={item.icon} alt="" />
                            ) : (
                              item.icon
                            )}
                          </span>
                        )}
                        <span className="page-layout__nav-label">{item.label}</span>
                        {item.showNotification && (
                          <span className="page-layout__notification" />
                        )}
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Logout Button */}
        <button className="page-layout__logout" onClick={handleLogout}>
          LOG OUT
        </button>
      </aside>

      {/* Main Content */}
      <main className="page-layout__main">
        {children}
      </main>
    </div>
  );
};

export default PageLayout;
