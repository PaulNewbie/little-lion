import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import childService from '../../services/childService';
import { saveSessionActivity } from '../../services/activityService';
import offeringsService from '../../services/offeringsService';
import Loading from '../../components/common/Loading';
import Sidebar from '../../components/sidebar/Sidebar';
import { getTeacherConfig } from '../../components/sidebar/sidebarConfigs';
import QuickSelectTags from '../../components/common/form-elements/QuickSelectTags';
import VoiceInput from '../../components/common/form-elements/VoiceInput';
import { Mail, Phone, Camera, FileEdit, X, ClipboardList, Users, ChevronRight, ArrowLeft, Search } from 'lucide-react';
import { useTeacherDashboardData } from '../../hooks/useCachedData';
import logo from '../../images/logo.webp';
import './css/TeacherDashboard.css';
import WelcomeModal from '../../components/common/WelcomeModal';

// Storage key for last selected class
const LAST_CLASS_KEY = 'teacher_lastSelectedClass';
const SELECTED_CLASS_VIEW_KEY = 'teacher_selectedClassView';

// --- PAGINATION CONFIG ---
const PAGE_SIZE = 10;

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
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  // Observation Modal State
  const [showObsModal, setShowObsModal] = useState(false);
  const [obsStudent, setObsStudent] = useState(null);
  const [submittingObs, setSubmittingObs] = useState(false);

  // Class Picker Modal State (for quick action when no class selected)
  const [showClassPicker, setShowClassPicker] = useState(false);

  // Form Data
  const [topic, setTopic] = useState('');
  const [moods, setMoods] = useState([]);
  const [selectedStrengths, setSelectedStrengths] = useState([]);
  const [strengthNote, setStrengthNote] = useState('');
  const [selectedNeeds, setSelectedNeeds] = useState([]);
  const [needNote, setNeedNote] = useState('');
  const [homeNote, setHomeNote] = useState('');
  const [concernNote, setConcernNote] = useState('');

  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Fetch Data
  const { students, isLoading: loading, error: queryError } = useTeacherDashboardData();

  // Fetch class services for images
  const { data: classServices = [] } = useQuery({
    queryKey: ['services', 'Class'],
    queryFn: () => offeringsService.getServicesByType('Class'),
    staleTime: 1000 * 60 * 5,
  });

  // Create a map for quick service image lookup
  const serviceImageMap = useMemo(() => {
    const map = new Map();
    classServices.forEach(service => {
      if (service.imageUrl) {
        map.set(service.name, service.imageUrl);
      }
    });
    return map;
  }, [classServices]);

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

  // Restore selected class from sessionStorage when myClasses is loaded
  useEffect(() => {
    if (myClasses.length > 0 && !selectedClass) {
      const savedClassName = sessionStorage.getItem(SELECTED_CLASS_VIEW_KEY);
      if (savedClassName) {
        const foundClass = myClasses.find(cls => cls.name === savedClassName);
        if (foundClass) {
          setSelectedClass(foundClass);
        }
      }
    }
  }, [myClasses]);

  // Profile Completion Check - show welcome for new users with empty profile
  useEffect(() => {
    if (currentUser) {
      // Check if profile is essentially empty (new user)
      const isNewUser = !currentUser.profilePhoto &&
                        !currentUser.phone &&
                        !currentUser.gender &&
                        !currentUser.dateOfBirth;

      if (isNewUser) {
        const timer = setTimeout(() => {
          setShowWelcomeModal(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [currentUser]);

  const handleCompleteProfile = () => {
    setShowWelcomeModal(false);
    navigate('/teacher/profile');
  };

  const handleSkipWelcome = () => {
    setShowWelcomeModal(false);
  };

  // Filter students based on search
  const allFilteredStudents = useMemo(() => {
    if (!selectedClass) return [];
    return selectedClass.students.filter(student =>
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [selectedClass, searchTerm]);

  // Paginated students to display
  const filteredStudents = useMemo(() => {
    return allFilteredStudents.slice(0, displayCount);
  }, [allFilteredStudents, displayCount]);

  // Check if there are more students to load
  const hasMoreStudents = allFilteredStudents.length > displayCount;

  // Filter classes based on search (when no class selected)
  const filteredClasses = useMemo(() => {
    return myClasses.filter(cls =>
      cls.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [myClasses, searchTerm]);

  // Handle Load More
  const handleLoadMore = () => {
    setDisplayCount(prev => prev + PAGE_SIZE);
  };

  // Handlers
  const handlePostGroupActivity = (classToUse = selectedClass) => {
    if (!classToUse) {
      // No class selected - show class picker modal
      setShowClassPicker(true);
      return;
    }
    // Save last selected class
    localStorage.setItem(LAST_CLASS_KEY, classToUse.name);
    navigate('/teacher/play-group-upload', {
      state: { preSelectedClassName: classToUse.name, preSelectedStudents: classToUse.students }
    });
  };

  // Quick action: Post Activity (from Quick Actions section)
  const handleQuickPostActivity = () => {
    // If a class is already selected, go directly to post activity for that class
    if (selectedClass) {
      handlePostGroupActivity(selectedClass);
      return;
    }

    // Auto-select only if there's exactly one class
    if (myClasses.length === 1) {
      handlePostGroupActivity(myClasses[0]);
      return;
    }

    // Multiple classes - show class picker to let user choose
    if (myClasses.length > 1) {
      setShowClassPicker(true);
      return;
    }

    // No classes - show error
    toast.warning("No classes assigned. Please contact admin.");
  };

  // Handle class selection from picker modal
  const handleClassPickerSelect = (cls) => {
    setShowClassPicker(false);
    handlePostGroupActivity(cls);
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
                {/* Back Arrow - only shows when viewing a class */}
                {selectedClass && (
                  <button
                    onClick={() => {
                      setSelectedClass(null);
                      setSearchTerm('');
                      setDisplayCount(PAGE_SIZE);
                      sessionStorage.removeItem(SELECTED_CLASS_VIEW_KEY);
                    }}
                    className="teacher-dashboard__header-back-arrow"
                    aria-label="Back to Classes"
                  >
                    <ArrowLeft size={28} strokeWidth={2.5} />
                  </button>
                )}
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
            {(!currentUser?.profilePhoto || !currentUser?.phone || !currentUser?.gender) && (
              <div className="teacher-dashboard__profile-banner">
                <div>
                  <h3 className="teacher-dashboard__profile-banner-title">
                    <ClipboardList size={20} />
                    Complete Your Profile
                  </h3>
                  <p className="teacher-dashboard__profile-banner-text">
                    Please add your profile photo and contact information to help parents and staff identify you.
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

            {/* Credentials Completion Banner - shows when profile is done but credentials aren't */}
            {currentUser?.profilePhoto && currentUser?.phone && currentUser?.gender && (!currentUser?.licenseType && !currentUser?.teachingLicense && !currentUser?.prcIdNumber) && (
              <div className="teacher-dashboard__profile-banner teacher-dashboard__profile-banner--credentials">
                <div>
                  <h3 className="teacher-dashboard__profile-banner-title">
                    <ClipboardList size={20} />
                    Add Your Teaching Credentials
                  </h3>
                  <p className="teacher-dashboard__profile-banner-text">
                    Your teaching license and credentials are not yet completed. Please update your credentials to keep your profile up to date.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/teacher/profile')}
                  className="teacher-dashboard__profile-banner-button"
                >
                  Add Credentials
                </button>
              </div>
            )}

            {/* Quick Actions Section - Always visible on desktop */}
            <div className="teacher-dashboard__quick-actions">
              <button
                onClick={handleQuickPostActivity}
                className="teacher-dashboard__quick-action teacher-dashboard__quick-action--primary"
              >
                <div className="teacher-dashboard__quick-action-icon">
                  <Camera size={32} strokeWidth={2} />
                </div>
                <div className="teacher-dashboard__quick-action-content">
                  <h3>Post Group Activity</h3>
                  <p>Share photos & updates with parents</p>
                </div>
              </button>
            </div>

            {/* View 1: Class Selection */}
            {!selectedClass && (
              <>
                {filteredClasses.length === 0 ? (
                  <div className="teacher-dashboard__empty-state">
                    <h3 className="teacher-dashboard__empty-state-title">No classes found</h3>
                  </div>
                ) : (
                  <div className="teacher-dashboard__classes-grid">
                    {filteredClasses.map((cls, idx) => {
                      const serviceImage = serviceImageMap.get(cls.name);
                      return (
                        <div
                          key={idx}
                          className="teacher-dashboard__class-card"
                          onClick={() => {
                            setSelectedClass(cls);
                            setSearchTerm('');
                            setDisplayCount(PAGE_SIZE);
                            sessionStorage.setItem(SELECTED_CLASS_VIEW_KEY, cls.name);
                          }}
                        >
                          {serviceImage ? (
                            <div className="teacher-dashboard__class-image-box">
                              <img src={serviceImage} alt={cls.name} className="teacher-dashboard__class-image" />
                            </div>
                          ) : (
                            <div className="teacher-dashboard__class-icon-fallback">
                              <Users size={40} strokeWidth={1.5} />
                            </div>
                          )}
                          <h3 className="teacher-dashboard__class-card-name">{cls.name}</h3>
                          <span className="teacher-dashboard__class-student-badge">
                            {cls.students.length} Student{cls.students.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* View 2: Student Roster */}
            {selectedClass && (
              <>
                {filteredStudents.length === 0 ? (
                  <div className="teacher-dashboard__empty-state">
                    <h3 className="teacher-dashboard__empty-state-title">No students found</h3>
                  </div>
                ) : (
                  <>
                    <div className="teacher-dashboard__students-grid">
                      {filteredStudents.map(student => (
                        <div
                          key={student.id}
                          className="teacher-dashboard__student-card"
                        >
                          {/* Image area - clickable to view profile */}
                          <div
                            className="teacher-dashboard__student-image-box"
                            onClick={() => navigate('/admin/StudentProfile', { state: { studentId: student.id, student, isStaffView: true } })}
                          >
                            {student.photoUrl ? (
                              <img
                                src={student.photoUrl}
                                alt={`${student.firstName} ${student.lastName}`}
                                className="teacher-dashboard__student-photo"
                              />
                            ) : (
                              <div className="teacher-dashboard__student-photo-placeholder">
                                {student.firstName?.[0] || '?'}
                              </div>
                            )}
                          </div>

                          {/* Card body with name and action */}
                          <div className="teacher-dashboard__student-card-body">
                            <h3
                              className="teacher-dashboard__student-name"
                              onClick={() => navigate('/admin/StudentProfile', { state: { studentId: student.id, student, isStaffView: true } })}
                            >
                              {student.firstName} {student.lastName}
                            </h3>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openObservationModal(student);
                              }}
                              className="teacher-dashboard__observation-btn-new"
                              aria-label={`Write observation for ${student.firstName}`}
                            >
                              <FileEdit size={14} strokeWidth={2.5} />
                              <span>Observation</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination Load More */}
                    {hasMoreStudents && (
                      <div className="teacher-dashboard__load-more-wrapper">
                        <button
                          className="teacher-dashboard__load-more-btn"
                          onClick={handleLoadMore}
                        >
                          Load More Students
                        </button>
                        <div className="teacher-dashboard__pagination-info">
                          Showing {filteredStudents.length} of {allFilteredStudents.length} students
                        </div>
                      </div>
                    )}
                  </>
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

          {/* Class Picker Modal */}
          {showClassPicker && (
            <div className="teacher-dashboard__modal-overlay" onClick={() => setShowClassPicker(false)}>
              <div className="teacher-dashboard__class-picker-modal" onClick={(e) => e.stopPropagation()}>
                <div className="teacher-dashboard__class-picker-header">
                  <h3>Select a Class</h3>
                  <button onClick={() => setShowClassPicker(false)} className="teacher-dashboard__modal-close">
                    <X size={20} />
                  </button>
                </div>
                <p className="teacher-dashboard__class-picker-subtitle">
                  Choose which class to post an activity for
                </p>
                <div className="teacher-dashboard__class-picker-list">
                  {myClasses.map((cls, idx) => (
                    <button
                      key={idx}
                      className="teacher-dashboard__class-picker-item"
                      onClick={() => handleClassPickerSelect(cls)}
                    >
                      <div className="teacher-dashboard__class-picker-icon">
                        <Users size={24} strokeWidth={2} />
                      </div>
                      <div className="teacher-dashboard__class-picker-info">
                        <span className="teacher-dashboard__class-picker-name">{cls.name}</span>
                        <span className="teacher-dashboard__class-picker-count">
                          {cls.students.length} student{cls.students.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <ChevronRight size={20} strokeWidth={2} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Mobile FAB - Floating Action Button */}
          <button
            className="teacher-dashboard__fab"
            onClick={handleQuickPostActivity}
            aria-label="Post Group Activity"
          >
            <Camera size={24} strokeWidth={2.5} />
            <span>POST</span>
          </button>
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

      <WelcomeModal
        isOpen={showWelcomeModal}
        userName={currentUser?.firstName || 'there'}
        onCompleteProfile={handleCompleteProfile}
        onSkip={handleSkipWelcome}
      />
    </div>
  );
};

export default TeacherDashboard;