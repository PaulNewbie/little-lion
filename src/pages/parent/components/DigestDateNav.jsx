// src/pages/parent/components/DigestDateNav.jsx
// Date navigation component for Daily Digest

import React from 'react';
import '../css/DigestComponents.css';

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
    <div className="digest-date-nav">
      {/* Previous Day Button */}
      <button
        className="digest-nav-button"
        onClick={handlePrevious}
        aria-label="Previous day"
      >
        <LeftArrow />
      </button>

      {/* Date Display */}
      <div className="digest-date-display">
        <span className="digest-date-main">{formatted.main}</span>
        {formatted.showYear && (
          <span className="digest-date-year">{formatted.year}</span>
        )}
        {formatted.isToday && (
          <span className="digest-today-badge">Current Day</span>
        )}
      </div>

      {/* Next Day Button */}
      <button
        className="digest-nav-button"
        onClick={handleNext}
        disabled={isToday}
        aria-label="Next day"
      >
        <RightArrow />
      </button>

      {/* Today Button - Hidden when already on today */}
      <button
        className={`digest-today-button${isToday ? ' digest-today-button--hidden' : ''}`}
        onClick={handleToday}
      >
        Today
      </button>
    </div>
  );
};

export default DigestDateNav;
