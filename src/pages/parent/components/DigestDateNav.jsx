// src/pages/parent/components/DigestDateNav.jsx
// Date navigation component for Daily Digest

import React from 'react';

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '20px',
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '2px solid #e2e8f0',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontSize: '18px',
    color: '#64748b',
  },
  navButtonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  navButtonHover: {
    borderColor: '#0052A1',
    color: '#0052A1',
    backgroundColor: '#eff6ff',
  },
  dateDisplay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '180px',
    padding: '8px 16px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  dateMain: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
  },
  dateYear: {
    fontSize: '13px',
    color: '#64748b',
  },
  todayBadge: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#0052A1',
    backgroundColor: '#dbeafe',
    padding: '2px 8px',
    borderRadius: '10px',
    marginTop: '4px',
  },
  todayButton: {
    padding: '8px 16px',
    backgroundColor: '#0052A1',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  todayButtonHidden: {
    visibility: 'hidden',
    pointerEvents: 'none',
  },
};

// Arrow icons
const LeftArrow = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
);

const RightArrow = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

/**
 * Check if two dates are the same day
 */
const isSameDay = (date1, date2) => {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
};

/**
 * Format date for display
 */
const formatDate = (date) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(date, today)) {
    return { main: 'Today', showYear: false, isToday: true };
  }
  if (isSameDay(date, yesterday)) {
    return { main: 'Yesterday', showYear: false, isToday: false };
  }

  const options = { weekday: 'short', month: 'short', day: 'numeric' };
  const main = date.toLocaleDateString('en-US', options);
  const showYear = date.getFullYear() !== today.getFullYear();

  return { main, showYear, isToday: false, year: date.getFullYear() };
};

/**
 * DigestDateNav - Date navigation for Daily Digest
 * @param {Date} selectedDate - Currently selected date
 * @param {function} onDateChange - Callback when date changes
 * @param {function} onTodayClick - Callback for "Today" button
 */
const DigestDateNav = ({ selectedDate, onDateChange, onTodayClick }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentDate = new Date(selectedDate);
  currentDate.setHours(0, 0, 0, 0);

  const isToday = isSameDay(currentDate, today);
  const formatted = formatDate(currentDate);

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const handleNext = () => {
    if (!isToday) {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 1);
      onDateChange(newDate);
    }
  };

  const handleToday = () => {
    onDateChange(new Date());
    if (onTodayClick) onTodayClick();
  };

  return (
    <div style={styles.container}>
      {/* Previous Day Button */}
      <button
        style={styles.navButton}
        onClick={handlePrevious}
        aria-label="Previous day"
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#0052A1';
          e.currentTarget.style.color = '#0052A1';
          e.currentTarget.style.backgroundColor = '#eff6ff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#e2e8f0';
          e.currentTarget.style.color = '#64748b';
          e.currentTarget.style.backgroundColor = 'white';
        }}
      >
        <LeftArrow />
      </button>

      {/* Date Display */}
      <div style={styles.dateDisplay}>
        <span style={styles.dateMain}>{formatted.main}</span>
        {formatted.showYear && (
          <span style={styles.dateYear}>{formatted.year}</span>
        )}
        {formatted.isToday && (
          <span style={styles.todayBadge}>Current Day</span>
        )}
      </div>

      {/* Next Day Button */}
      <button
        style={{
          ...styles.navButton,
          ...(isToday ? styles.navButtonDisabled : {})
        }}
        onClick={handleNext}
        disabled={isToday}
        aria-label="Next day"
        onMouseEnter={(e) => {
          if (!isToday) {
            e.currentTarget.style.borderColor = '#0052A1';
            e.currentTarget.style.color = '#0052A1';
            e.currentTarget.style.backgroundColor = '#eff6ff';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#e2e8f0';
          e.currentTarget.style.color = '#64748b';
          e.currentTarget.style.backgroundColor = 'white';
        }}
      >
        <RightArrow />
      </button>

      {/* Today Button - Hidden when already on today */}
      <button
        style={{
          ...styles.todayButton,
          ...(isToday ? styles.todayButtonHidden : {})
        }}
        onClick={handleToday}
      >
        Today
      </button>
    </div>
  );
};

export default DigestDateNav;
