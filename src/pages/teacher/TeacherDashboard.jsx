import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import childService from '../../services/childService';
import { saveSessionActivity } from '../../services/activityService';
import Loading from '../../components/common/Loading';
import Sidebar from '../../components/sidebar/Sidebar';
import { getTeacherConfig } from '../../components/sidebar/sidebarConfigs';
import QuickSelectTags from '../../components/common/form-elements/QuickSelectTags';
import VoiceInput from '../../components/common/form-elements/VoiceInput';
import { Mail, Phone } from 'lucide-react';
import { useTeacherDashboardData } from '../../hooks/useCachedData';
import logo from '../../images/logo.png';
import './css/TeacherDashboard.css';

// --- TEACHER SMART DATA ---
const CLASS_TOPICS = ["Circle Time", "Art Class", "Music", "Math", "Reading", "Free Play", "Snack/Lunch", "Social Skills", "Nap Time"];
const MOODS = ["Happy", "Focused", "Active", "Tired", "Upset", "Social", "Quiet"];
const COMMON_STRENGTHS = ["Participated", "Shared Toys", "Followed Rules", "Helped Others", "Good Listening", "Creative", "Ate Well"];
const COMMON_NEEDS = ["Distracted", "Hit/Pushed", "Cried", "Refused to Share", "Did not Listen", "Sleepy", "Needs Practice"];

const TeacherDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Data State
  const [myClasses, setMyClasses] = useState([]);
  const [error, setError] = useState('');

  // UI State
  const [selectedClass, setSelectedClass] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Observation Modal State
  const [showObsModal, setShowObsModal] = useState(false);
  const [obsStudent, setObsStudent] = useState(null);
  const [submittingObs, setSubmittingObs] = useState(false);

  // Form Data
  const [topic, setTopic] = useState('');
  const [moods, setMoods] = useState([]);
  const [selectedStrengths, setSelectedStrengths] = useState([]);
  const [strengthNote, setStrengthNote] = useState('');
  const [selectedNeeds, setSelectedNeeds] = useState([]);
  const [needNote, setNeedNote] = useState('');
  const [homeNote, setHomeNote] = useState('');
  const [concernNote, setConcernNote] = useState('');

  // Fetch Data
  const { students, isLoading: loading, error: queryError } = useTeacherDashboardData();

  // Process Data
  useEffect(() => {
    if (students && currentUser) {
      const groupedClasses = {};

      students.forEach(student => {
        let myServices = [];

        // NEW MODEL: Read from serviceEnrollments (primary)
        if (student.serviceEnrollments && student.serviceEnrollments.length > 0) {
          myServices = student.serviceEnrollments.filter(enrollment =>
            enrollment.status === 'active' &&
            enrollment.currentStaff?.staffId === currentUser.uid
          );
        } else {
          // LEGACY FALLBACK: Read from old arrays (for unmigrated data)
          const legacyServices = [
            ...(student.groupClassServices || []),
            ...(student.oneOnOneServices || [])
          ];
          myServices = legacyServices.filter(svc => svc.staffId === currentUser.uid);
        }

        myServices.forEach(svc => {
          const className = svc.serviceName || 'Unassigned Group';

          if (!groupedClasses[className]) {
            groupedClasses[className] = {
              name: className,
              serviceId: svc.serviceId,
              students: []
            };
          }

          if (!groupedClasses[className].students.find(s => s.id === student.id)) {
            groupedClasses[className].students.push(student);
          }
        });
      });

      setMyClasses(Object.values(groupedClasses));
    }
  }, [students, currentUser]);

  // Profile Completion Check
  useEffect(() => {
    if (currentUser && currentUser.profileCompleted === false) {
      const timer = setTimeout(() => {
        const shouldComplete = window.confirm(
          "Complete your professional profile to help parents know you better.\n\nWould you like to do it now?"
        );
        if (shouldComplete) {
          navigate('/teacher/profile');
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [currentUser, navigate]);

  // Filter students based on search
  const filteredStudents = useMemo(() => {
    if (!selectedClass) return [];
    return selectedClass.students.filter(student =>
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [selectedClass, searchTerm]);

  // Filter classes based on search (when no class selected)
  const filteredClasses = useMemo(() => {
    return myClasses.filter(cls =>
      cls.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [myClasses, searchTerm]);

  // Handlers
  const handlePostGroupActivity = () => {
    navigate('/teacher/play-group-upload', {
      state: { preSelectedClassName: selectedClass.name, preSelectedStudents: selectedClass.students }
    });
  };

  const openObservationModal = (student) => {
    setObsStudent(student);
    setTopic(''); setMoods([]); setSelectedStrengths([]); setStrengthNote('');
    setSelectedNeeds([]); setNeedNote(''); setHomeNote(''); setConcernNote('');
    setShowObsModal(true);
  };

  const handleObsSubmit = async (e) => {
    e.preventDefault();
    if (!topic) { toast.warning("Please select or type a topic."); return; }
    setSubmittingObs(true);

    const finalStrengths = [...selectedStrengths, strengthNote].filter(Boolean).join('. ');
    const finalWeaknesses = [...selectedNeeds, needNote].filter(Boolean).join('. ');

    try {
      const sessionData = {
        childId: obsStudent.id,
        childName: `${obsStudent.firstName} ${obsStudent.lastName}`,
        serviceId: selectedClass.serviceId || 'teacher-group-id',
        serviceName: selectedClass.name,
        date: new Date().toISOString(),
        type: 'observation',
        authorId: currentUser.uid,
        authorName: `${currentUser.firstName} ${currentUser.lastName}`,
        title: topic,
        studentReaction: moods,
        strengths: finalStrengths,
        weaknesses: finalWeaknesses,
        homeActivities: homeNote,
        sessionNotes: concernNote
      };

      await saveSessionActivity(sessionData);
      toast.success(`Observation saved for ${obsStudent.firstName}!`);
      setShowObsModal(false);
    } catch (err) {
      toast.error("Failed to save observation.");
    } finally {
      setSubmittingObs(false);
    }
  };

  const appendText = (current, newText, setter) => {
    const trimmed = current.trim();
    setter(trimmed ? `${trimmed}. ${newText}. ` : `${newText}. `);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar {...getTeacherConfig()} forceActive="/teacher/dashboard" />
      {loading ? (
        <Loading role="teacher" message="Loading classes" variant="content" />
      ) : (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', backgroundColor: '#f8f9fa' }}>
        <div style={{ padding: '20px', flex: 1 }}>
          <div className="teacher-dashboard__content">

            {/* Header Banner */}
            <div className="teacher-dashboard__header-banner">
              <div className="teacher-dashboard__header-content">
                <div className="teacher-dashboard__header-text">
                  <h1 className="teacher-dashboard__title">
                    {selectedClass ? selectedClass.name : 'MY CLASSES'}
                  </h1>
                  <p className="teacher-dashboard__subtitle">
                    {selectedClass
                      ? `${selectedClass.students.length} Student${selectedClass.students.length !== 1 ? 's' : ''}`
                      : 'Manage and Track Student Progress'
                    }
                  </p>
                </div>
                <div className="teacher-dashboard__search-wrapper">
                  <span className="teacher-dashboard__search-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="M21 21l-4.35-4.35"/>
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder={selectedClass ? "Search student name..." : "Search class..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="teacher-dashboard__search-input"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="teacher-dashboard__error">
                {error}
              </div>
            )}

            {/* Profile Completion Banner */}
            {currentUser?.profileCompleted === false && (
              <div className="teacher-dashboard__profile-banner">
                <div>
                  <h3 className="teacher-dashboard__profile-banner-title">
                    Complete Your Profile
                  </h3>
                  <p className="teacher-dashboard__profile-banner-text">
                    Help parents know you better by adding your credentials, bio, and certifications.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/teacher/profile')}
                  className="teacher-dashboard__profile-banner-button"
                >
                  Complete Now
                </button>
              </div>
            )}

            {/* View 1: Class Selection */}
            {!selectedClass && (
              <>
                {filteredClasses.length === 0 ? (
                  <div className="teacher-dashboard__empty-state">
                    <h3 className="teacher-dashboard__empty-state-title">No classes found</h3>
                  </div>
                ) : (
                  <div className="teacher-dashboard__classes-grid">
                    {filteredClasses.map((cls, idx) => (
                      <div
                        key={idx}
                        className="teacher-dashboard__class-card"
                        onClick={() => { setSelectedClass(cls); setSearchTerm(''); }}
                      >
                        <div className="teacher-dashboard__class-icon">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 3L1 9l11 6l9-4.91V17h2V9M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
                          </svg>
                        </div>
                        <div className="teacher-dashboard__class-info">
                          <h3 className="teacher-dashboard__class-name">{cls.name}</h3>
                          <p className="teacher-dashboard__class-count">
                            {cls.students.length} Student{cls.students.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="teacher-dashboard__class-arrow">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 18l6-6-6-6"/>
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* View 2: Student Roster */}
            {selectedClass && (
              <>
                <button
                  onClick={() => { setSelectedClass(null); setSearchTerm(''); }}
                  className="teacher-dashboard__back-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                  Back to Classes
                </button>

                <div className="teacher-dashboard__roster-header">
                  <button
                    onClick={handlePostGroupActivity}
                    className="teacher-dashboard__action-button"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    Post Group Activity
                  </button>
                </div>

                {filteredStudents.length === 0 ? (
                  <div className="teacher-dashboard__empty-state">
                    <h3 className="teacher-dashboard__empty-state-title">No students found</h3>
                  </div>
                ) : (
                  <div className="teacher-dashboard__students-grid">
                    {filteredStudents.map(student => (
                      <div 
                        key={student.id} 
                        className="teacher-dashboard__student-card"
                        // ADDED: Click handler for the whole card
                        onClick={() => navigate('/admin/StudentProfile', { state: { studentId: student.id, student, isStaffView: true } })}
                        // ADDED: Pointer cursor
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="teacher-dashboard__student-card-header">
                          <div className="teacher-dashboard__student-info">
                            <div className="teacher-dashboard__student-avatar">
                              {student.photoUrl ? <img src={student.photoUrl} alt="" /> : '👤'}
                            </div>
                            <div>
                              <h3 className="teacher-dashboard__student-name">
                                {student.firstName} {student.lastName}
                              </h3>
                              <p className="teacher-dashboard__student-dob">
                                DOB: {student.dateOfBirth}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="teacher-dashboard__student-card-footer">
                          <button
                            onClick={(e) => {
                                // ADDED: Stop Propagation to prevent card click
                                e.stopPropagation(); 
                                openObservationModal(student)
                            }}
                            className="teacher-dashboard__observation-button"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Write Observation
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Observation Modal */}
          {showObsModal && obsStudent && (
            <div className="teacher-dashboard__modal-overlay">
              <div className="teacher-dashboard__modal">
                <div className="teacher-dashboard__modal-header">
                  <h3 className="teacher-dashboard__modal-title">Observation: {obsStudent.firstName}</h3>
                  <button onClick={() => setShowObsModal(false)} className="teacher-dashboard__modal-close">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleObsSubmit} className="teacher-dashboard__modal-form">
                  <div className="teacher-dashboard__form-group">
                    <label className="teacher-dashboard__label">Activity / Topic</label>
                    <div className="teacher-dashboard__chips">
                      {CLASS_TOPICS.map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTopic(t)}
                          className={`teacher-dashboard__chip ${topic === t ? 'teacher-dashboard__chip--selected' : ''}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <input
                      required
                      className="teacher-dashboard__input"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Or type custom topic..."
                    />
                  </div>

                  <QuickSelectTags label="Mood" options={MOODS} selected={moods} onChange={setMoods} color="purple" />

                  <div className="teacher-dashboard__form-group">
                    <QuickSelectTags label="Strengths" options={COMMON_STRENGTHS} selected={selectedStrengths} onChange={setSelectedStrengths} color="green" />
                    <textarea
                      rows="2"
                      className="teacher-dashboard__textarea"
                      value={strengthNote}
                      onChange={(e) => setStrengthNote(e.target.value)}
                      placeholder="Additional details..."
                    />
                  </div>

                  <div className="teacher-dashboard__form-group">
                    <div className="teacher-dashboard__label-row">
                      <label className="teacher-dashboard__label">Home Note</label>
                      <VoiceInput onTranscript={(text) => appendText(homeNote, text, setHomeNote)} />
                    </div>
                    <textarea
                      rows="2"
                      className="teacher-dashboard__textarea"
                      value={homeNote}
                      onChange={(e) => setHomeNote(e.target.value)}
                      placeholder="Message for parents..."
                    />
                  </div>

                  <div className="teacher-dashboard__modal-actions">
                    <button type="button" onClick={() => setShowObsModal(false)} className="teacher-dashboard__modal-cancel">
                      Cancel
                    </button>
                    <button type="submit" disabled={submittingObs} className="teacher-dashboard__modal-save">
                      {submittingObs ? 'Saving...' : 'Save Report'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="teacher-dashboard__footer">
          <div className="teacher-dashboard__footer-content">
            <div className="teacher-dashboard__footer-item">
              <div className="teacher-dashboard__footer-logo">
                <img src={logo} alt="Little Lions" className="teacher-dashboard__footer-logo-img" />
              </div>
              <span>Little Lions Learning and Development Center</span>
            </div>
            <span className="teacher-dashboard__footer-divider">•</span>
            <div className="teacher-dashboard__footer-item">
              <Mail size={18} className="teacher-dashboard__footer-icon" />
              <span>littlelionsldc@gmail.com</span>
            </div>
            <span className="teacher-dashboard__footer-divider">•</span>
            <div className="teacher-dashboard__footer-item">
              <Phone size={18} className="teacher-dashboard__footer-icon" />
              <span>(+63) 9677900930</span>
            </div>
          </div>
        </footer>
      </div>
      )}
    </div>
  );
};

export default TeacherDashboard;