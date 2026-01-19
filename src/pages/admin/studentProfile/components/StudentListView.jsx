import React from 'react';
import StudentCard from './StudentCard';

/**
 * StudentListView - Grid view of all students with search and filter
 */
const StudentListView = ({
  isParentView,
  students,
  searchTerm,
  onSearchChange,
  filterType,
  onFilterChange,
  onSelectStudent,
  hasMore,
  onLoadMore
}) => {
  return (
    <>
      <div className="sp-header">
        <div className="sp-header-content">
          <div className="header-title">
            <h1>{isParentView ? "MY CHILDREN" : "STUDENT PROFILES"}</h1>
            <p className="header-subtitle">
              {isParentView
                ? "View your children's profiles and activities"
                : "Manage enrolled students and view activities"
              }
            </p>
          </div>
          <div className="filter-actions">
            <div className="search-wrapper">
              <span className="search-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
              </span>
              <input
                type="text"
                className="sp-search"
                placeholder="Search student name..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
            <div className="filter-wrapper">
              <select
                className="sp-filter-select"
                value={filterType}
                onChange={(e) => onFilterChange(e.target.value)}
              >
                <option value="all">All Students</option>
                <option value="therapy">Therapy Only</option>
                <option value="group">Group Class Only</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="sp-content-area">
        <div className="sp-grid">
          {students.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              onSelect={onSelectStudent}
            />
          ))}
        </div>

        {/* Pagination Load More Button */}
        {!isParentView && hasMore && (
          <div className="sp-load-more-wrapper">
            <button
              className="sp-load-more-btn"
              onClick={onLoadMore}
            >
              Load More Students
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default StudentListView;
