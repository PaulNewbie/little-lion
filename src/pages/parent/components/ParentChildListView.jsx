// src/pages/parent/components/ParentChildListView.jsx
/**
 * Enhanced Parent Child List View
 * Warm, welcoming interface for parents to view their children
 * Features: Personalized header, improved grid layout, empty state
 */

import React from 'react';
import ParentChildCard from './ParentChildCard';
import './ParentChildListView.css';

const ParentChildListView = ({ children, onSelectChild, parentName }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="parent-list-container">
      {/* Warm, personalized header */}
      <header className="parent-list-header">
        <div className="parent-header-content">
          <div className="parent-header-title-section">
            <h1 className="parent-header-title">
              {getGreeting()}{parentName ? `, ${parentName}` : ''}
            </h1>
            <p className="parent-header-subtitle">
              Welcome to your family dashboard. Select a child to view their progress and activities.
            </p>
          </div>

          {/* Little Lions mascot decoration */}
          <div className="parent-header-decoration">
            <span className="mascot-emoji" role="img" aria-label="lion mascot">
              🦁
            </span>
          </div>
        </div>
      </header>

      {/* Children grid or empty state */}
      <main className="parent-list-content">
        {children && children.length > 0 ? (
          <>
            <div className="parent-list-section-title">
              <h2>
                Your {children.length === 1 ? 'Child' : 'Children'}
                <span className="child-count-badge">{children.length}</span>
              </h2>
            </div>

            <div className="parent-children-grid">
              {children.map((child) => (
                <ParentChildCard
                  key={child.id}
                  student={child}
                  onSelect={onSelectChild}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="parent-empty-state">
            <div className="empty-state-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="empty-state-title">No Children Found</h3>
            <p className="empty-state-message">
              Your account is not currently linked to any children's profiles.
              Please contact the school administrator for assistance.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ParentChildListView;
