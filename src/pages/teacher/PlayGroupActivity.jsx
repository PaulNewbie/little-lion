import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import childService from '../../services/childService';
import activityService from '../../services/activityService';
import cloudinaryService from '../../services/cloudinaryService';
import Sidebar from '../../components/sidebar/Sidebar';
import { getTeacherConfig } from '../../components/sidebar/sidebarConfigs';
import logo from '../../images/logo.png';
import './css/PlayGroupActivity.css';

const PlayGroupActivity = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve passed data from Dashboard (if any)
  const { preSelectedClassName, preSelectedStudents } = location.state || {};

  // --- STATE ---
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Form Data
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [className, setClassName] = useState(preSelectedClassName || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Selection Data
  const [selectedImages, setSelectedImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [taggedStudentIds, setTaggedStudentIds] = useState([]);

  // --- 1. FETCH STUDENTS ---
  useEffect(() => {
    const fetchStudents = async () => {
      if (preSelectedStudents && preSelectedStudents.length > 0) {
        setStudents(preSelectedStudents);
        setLoadingStudents(false);
        return;
      }

      if (!currentUser) return;
      setLoadingStudents(true);
      try {
        let data = [];
        if (currentUser.role === 'admin') {
          data = await childService.getAllChildren();
        } else {
          data = await childService.getChildrenByTeacherId(currentUser.uid);
        }
        setStudents(data);
      } catch (error) {
        console.error("Error fetching students:", error);
        alert("Failed to load student list");
      } finally {
        setLoadingStudents(false);
      }
    };
    fetchStudents();
  }, [currentUser, preSelectedStudents]);

  // --- 2. IMAGE HANDLING ---
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setSelectedImages(prev => [...prev, ...files]);
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // --- 3. TAGGING LOGIC (IMPROVED) ---
  const toggleStudent = (studentId) => {
    setTaggedStudentIds(prev => {
      if (prev.includes(studentId)) return prev.filter(id => id !== studentId);
      return [...prev, studentId];
    });
  };

  // Mark ALL students as present (common workflow - most students are present)
  const markAllPresent = () => {
    setTaggedStudentIds(students.map(s => s.id));
  };

  // Clear all selections
  const clearAllSelections = () => {
    setTaggedStudentIds([]);
  };

  // Legacy toggle function (kept for compatibility)
  const selectAll = () => {
    if (taggedStudentIds.length === students.length) {
      setTaggedStudentIds([]);
    } else {
      setTaggedStudentIds(students.map(s => s.id));
    }
  };

  // Helper to get display name with last initial
  const getDisplayName = (student) => {
    const firstName = student.firstName || '';
    const lastInitial = student.lastName ? ` ${student.lastName.charAt(0)}.` : '';
    return `${firstName}${lastInitial}`;
  };

  // Helper to get full name for confirmation
  const getFullName = (student) => {
    return `${student.firstName || ''} ${student.lastName || ''}`.trim();
  };

  // --- 4. UPLOAD & SAVE (WITH CONFIRMATION) ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (selectedImages.length === 0) {
      alert("Please select at least one photo.");
      return;
    }
    if (taggedStudentIds.length === 0) {
      alert("Please mark at least one student as present.");
      return;
    }

    // Get names of selected students for confirmation
    const selectedStudentNames = taggedStudentIds
      .map(id => {
        const student = students.find(s => s.id === id);
        return student ? getDisplayName(student) : '';
      })
      .filter(Boolean);

    // Confirmation dialog
    const confirmMessage = 
      `Post Group Activity?\n\n` +
      `Activity: "${title || 'Untitled'}"\n` +
      `Class: ${className || 'Not specified'}\n` +
      `Date: ${date}\n` +
      `Photos: ${selectedImages.length}\n\n` +
      `✓ Students Present (${taggedStudentIds.length}):\n` +
      `${selectedStudentNames.join(', ')}\n\n` +
      `Do you want to continue?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setUploading(true);

    try {
      const folderPath = `little-lions/group-images/${date}`;

      const uploadPromises = selectedImages.map(file =>
        cloudinaryService.uploadImage(file, folderPath)
      );
      const uploadedUrls = await Promise.all(uploadPromises);

      const activityData = {
        title,
        description,
        date,
        className,
        photoUrls: uploadedUrls,
        participatingStudentIds: taggedStudentIds,
        teacherId: currentUser.uid,
        teacherName: `${currentUser.firstName} ${currentUser.lastName}`,
        authorRole: 'teacher'
      };

      await activityService.createGroupActivity(activityData);

      alert('✅ Activity Uploaded Successfully!');
      navigate(-1);

    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload activity. Please try again.");
      setUploading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar {...getTeacherConfig()} forceActive="/teacher/dashboard" />
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', backgroundColor: '#f8f9fa' }}>
        <div style={{ padding: '20px', flex: 1 }}>
          <div className="play-group__content">

            {/* Header Banner */}
            <div className="play-group__header-banner">
              <div className="play-group__header-content">
                <h1 className="play-group__title">NEW GROUP ACTIVITY</h1>
                <p className="play-group__subtitle">Upload photos and tag participating students</p>
              </div>
            </div>

            {/* Back Button */}
            <button onClick={() => navigate(-1)} className="play-group__back-btn">
              ← Back to Dashboard
            </button>

            <form onSubmit={handleSubmit}>
              {/* Section 1: Activity Details */}
              <div className="play-group__section">
                <h3 className="play-group__section-title">
                  <span className="play-group__section-number">1</span>
                  Activity Details
                </h3>

                <div className="play-group__form-group">
                  <label className="play-group__label">Class Name</label>
                  <input
                    className={`play-group__input ${preSelectedClassName ? 'play-group__input--prefilled' : ''}`}
                    placeholder="e.g. Art Class"
                    value={className}
                    onChange={e => !preSelectedClassName && setClassName(e.target.value)}
                    readOnly={!!preSelectedClassName}
                    disabled={!!preSelectedClassName}
                  />
                  {preSelectedClassName && (
                    <span className="play-group__field-note">Class name is set from your selected class</span>
                  )}
                </div>

                <div className="play-group__form-group">
                  <label className="play-group__label">Activity Title</label>
                  <input
                    className="play-group__input"
                    placeholder="e.g. Outdoor Building Blocks"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="play-group__form-group">
                  <label className="play-group__label">Date</label>
                  <input
                    className="play-group__input"
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="play-group__form-group">
                  <label className="play-group__label">Description</label>
                  <textarea
                    className="play-group__textarea"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="What did the children do today?"
                  />
                </div>
              </div>

              {/* Section 2: Photos */}
              <div className="play-group__section">
                <h3 className="play-group__section-title">
                  <span className="play-group__section-number">2</span>
                  Select Photos
                </h3>

                <div className="play-group__photo-upload">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="play-group__file-input"
                  />
                  <div className="play-group__previews">
                    {previews.map((src, idx) => (
                      <div key={idx} className="play-group__preview-item">
                        <img src={src} alt="Preview" className="play-group__preview-img" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="play-group__remove-btn"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 3: Student Selection (IMPROVED) */}
              <div className="play-group__section">
                <h3 className="play-group__section-title">
                  <span className="play-group__section-number">3</span>
                  Who was present?
                </h3>

                {/* Improved Header with Quick Actions */}
                <div className="play-group__selection-header">
                  <div className="play-group__selection-info">
                    <span className="play-group__selection-count">
                      <strong>{taggedStudentIds.length}</strong> of <strong>{students.length}</strong> students marked present
                    </span>
                    {taggedStudentIds.length === 0 && students.length > 0 && (
                      <span className="play-group__selection-hint">
                        💡 Tip: Click "Mark All Present" then unmark absentees
                      </span>
                    )}
                  </div>
                  
                  {/* Quick Action Buttons */}
                  <div className="play-group__quick-actions">
                    <button
                      type="button"
                      onClick={markAllPresent}
                      className="play-group__action-btn play-group__action-btn--primary"
                      disabled={taggedStudentIds.length === students.length}
                    >
                      ✓ Mark All Present
                    </button>
                    <button
                      type="button"
                      onClick={clearAllSelections}
                      className="play-group__action-btn play-group__action-btn--secondary"
                      disabled={taggedStudentIds.length === 0}
                    >
                      ✕ Clear All
                    </button>
                  </div>
                </div>

                {/* Student Grid (IMPROVED) */}
                {loadingStudents ? (
                  <div className="play-group__loading-state">
                    <div className="play-group__spinner"></div>
                    <p>Loading your class list...</p>
                  </div>
                ) : students.length === 0 ? (
                  <div className="play-group__empty-state">
                    <span className="play-group__empty-icon">👥</span>
                    <p>No students found assigned to this class.</p>
                  </div>
                ) : (
                  <div className="play-group__students-grid">
                    {students.map(student => {
                      const isSelected = taggedStudentIds.includes(student.id);
                      return (
                        <div
                          key={student.id}
                          className={`play-group__student-card ${isSelected ? 'play-group__student-card--selected' : 'play-group__student-card--unselected'}`}
                          onClick={() => toggleStudent(student.id)}
                          role="button"
                          tabIndex={0}
                          aria-pressed={isSelected}
                          aria-label={`${getFullName(student)} - ${isSelected ? 'Present' : 'Not marked'}`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              toggleStudent(student.id);
                            }
                          }}
                        >
                          {/* Checkbox Indicator */}
                          <div className={`play-group__checkbox ${isSelected ? 'play-group__checkbox--checked' : ''}`}>
                            {isSelected && <span>✓</span>}
                          </div>

                          {/* Avatar */}
                          <div className={`play-group__student-avatar ${isSelected ? 'play-group__student-avatar--selected' : ''}`}>
                            {student.photoUrl ? (
                              <img src={student.photoUrl} alt={student.firstName} />
                            ) : (
                              <span className="play-group__avatar-placeholder">
                                {student.firstName?.charAt(0)?.toUpperCase() || '?'}
                              </span>
                            )}
                          </div>

                          {/* Name with Last Initial */}
                          <p className="play-group__student-name">{getDisplayName(student)}</p>

                          {/* Status Badge */}
                          <div className={`play-group__status-badge ${isSelected ? 'play-group__status-badge--present' : 'play-group__status-badge--unmarked'}`}>
                            {isSelected ? '✓ PRESENT' : 'Tap to mark'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Selection Summary (shows when students are selected) */}
                {taggedStudentIds.length > 0 && (
                  <div className="play-group__selection-summary">
                    <div className="play-group__summary-icon">✓</div>
                    <div className="play-group__summary-text">
                      <strong>{taggedStudentIds.length} student{taggedStudentIds.length !== 1 ? 's' : ''}</strong> will be tagged in this activity
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button (IMPROVED) */}
              <button
                type="submit"
                disabled={uploading || taggedStudentIds.length === 0 || selectedImages.length === 0}
                className={`play-group__submit-btn ${(taggedStudentIds.length === 0 || selectedImages.length === 0) ? 'play-group__submit-btn--disabled' : ''}`}
              >
                {uploading ? (
                  <>
                    <span className="play-group__btn-spinner"></span>
                    Uploading Activity...
                  </>
                ) : (
                  <>
                    📤 Post Activity ({taggedStudentIds.length} student{taggedStudentIds.length !== 1 ? 's' : ''})
                  </>
                )}
              </button>

              {/* Validation Hints */}
              {(taggedStudentIds.length === 0 || selectedImages.length === 0) && (
                <div className="play-group__validation-hints">
                  {selectedImages.length === 0 && (
                    <span className="play-group__hint-item">Add at least one photo</span>
                  )}
                  {taggedStudentIds.length === 0 && (
                    <span className="play-group__hint-item">Mark at least one student as present</span>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayGroupActivity;