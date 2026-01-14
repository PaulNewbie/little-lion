import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import childService from '../../services/childService';
import activityService from '../../services/activityService';
import cloudinaryService from '../../services/cloudinaryService';
import Sidebar from '../../components/sidebar/Sidebar';
import { getTeacherConfig } from '../../components/sidebar/sidebarConfigs';
import { Mail, Phone } from 'lucide-react';
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

  // --- 3. TAGGING LOGIC ---
  const toggleStudent = (studentId) => {
    setTaggedStudentIds(prev => {
      if (prev.includes(studentId)) return prev.filter(id => id !== studentId);
      return [...prev, studentId];
    });
  };

  const selectAll = () => {
    if (taggedStudentIds.length === students.length) {
      setTaggedStudentIds([]);
    } else {
      setTaggedStudentIds(students.map(s => s.id));
    }
  };

  // --- 4. UPLOAD & SAVE ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedImages.length === 0) return alert("Please select at least one photo.");
    if (taggedStudentIds.length === 0) return alert("Please tag at least one student.");

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

      alert('Activity Uploaded Successfully!');
      navigate(-1);

    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload activity.");
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back to Dashboard
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
                    onChange={e => setClassName(e.target.value)}
                  />
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

              {/* Section 3: Student Selection */}
              <div className="play-group__section">
                <h3 className="play-group__section-title">
                  <span className="play-group__section-number">3</span>
                  Who was present?
                </h3>

                <div className="play-group__selection-header">
                  <span className="play-group__selection-count">
                    {taggedStudentIds.length} student{taggedStudentIds.length !== 1 ? 's' : ''} selected
                  </span>
                  <button
                    type="button"
                    onClick={selectAll}
                    className="play-group__select-all-btn"
                  >
                    {taggedStudentIds.length === students.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                {loadingStudents ? (
                  <p className="play-group__loading-text">Loading your class list...</p>
                ) : students.length === 0 ? (
                  <p className="play-group__error-text">No students found assigned to this class.</p>
                ) : (
                  <div className="play-group__students-grid">
                    {students.map(student => {
                      const isSelected = taggedStudentIds.includes(student.id);
                      return (
                        <div
                          key={student.id}
                          className={`play-group__student-card ${isSelected ? 'play-group__student-card--selected' : ''}`}
                          onClick={() => toggleStudent(student.id)}
                        >
                          <div className="play-group__student-avatar">
                            {student.photoUrl ? (
                              <img src={student.photoUrl} alt={student.firstName} />
                            ) : '👤'}
                          </div>
                          <p className="play-group__student-name">{student.firstName}</p>
                          {isSelected && (
                            <div className="play-group__student-check">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                              Here
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={uploading}
                className="play-group__submit-btn"
              >
                {uploading ? (
                  'Uploading...'
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Upload Group Activity
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <footer className="play-group__footer">
          <div className="play-group__footer-content">
            <div className="play-group__footer-item">
              <div className="play-group__footer-logo">
                <img src={logo} alt="Little Lions" className="play-group__footer-logo-img" />
              </div>
              <span>Little Lions Learning and Development Center</span>
            </div>
            <span className="play-group__footer-divider">•</span>
            <div className="play-group__footer-item">
              <Mail size={18} className="play-group__footer-icon" />
              <span>littlelionsldc@gmail.com</span>
            </div>
            <span className="play-group__footer-divider">•</span>
            <div className="play-group__footer-item">
              <Phone size={18} className="play-group__footer-icon" />
              <span>(+63) 9677900930</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default PlayGroupActivity;
