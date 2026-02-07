import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import Loading from '../../components/common/Loading';
import Sidebar from '../../components/sidebar/Sidebar';
import { getTherapistConfig } from '../../components/sidebar/sidebarConfigs';
import { Mail, Phone, X, Play, MessageCircle, Hand, Activity, Brain, TrendingUp, BookOpen, Briefcase, User, ClipboardList } from 'lucide-react';
import { useTherapistDashboardData } from '../../hooks/useCachedData';
import logo from '../../images/logo.webp';
import './css/TherapistDashboard.css';
import WelcomeModal from '../../components/common/WelcomeModal';

// --- PAGINATION CONFIG ---
const PAGE_SIZE = 10;

const TherapistDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  // Service Selection Modal State
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedStudentForModal, setSelectedStudentForModal] = useState(null);
  const [availableServices, setAvailableServices] = useState([]);

  const { students, isLoading: loading, error: queryError } = useTherapistDashboardData();
  const [error, setError] = useState('');

  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  // Set error from query if needed
  useEffect(() => {
    if (queryError) {
      setError('Failed to load assigned students.');
    }
  }, [queryError]);

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
    navigate('/therapist/profile');
  };

  const handleSkipWelcome = () => {
    setShowWelcomeModal(false);
  };

  // All filtered students (before pagination)
  const allFilteredStudents = useMemo(() => {
    return students.filter(student =>
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  // Paginated students to display
  const filteredStudents = useMemo(() => {
    return allFilteredStudents.slice(0, displayCount);
  }, [allFilteredStudents, displayCount]);

  // Check if there are more students to load
  const hasMoreStudents = allFilteredStudents.length > displayCount;

  // Handle Load More
  const handleLoadMore = () => {
    setDisplayCount(prev => prev + PAGE_SIZE);
  };

  // Reset display count when search changes
  useEffect(() => {
    setDisplayCount(PAGE_SIZE);
  }, [searchTerm]);

  const getMyServices = (student) => {
    // NEW MODEL: Read from serviceEnrollments (primary)
    if (student.serviceEnrollments && student.serviceEnrollments.length > 0) {
      return student.serviceEnrollments.filter(enrollment =>
        enrollment.status === 'active' &&
        enrollment.currentStaff?.staffId === currentUser.uid
      );
    }

    // LEGACY FALLBACK: Read from old arrays (for unmigrated data)
    const legacyServices = [
      ...(student.oneOnOneServices || []),
      ...(student.groupClassServices || [])
    ];

    return legacyServices.filter(s =>
      s.staffId === currentUser.uid || s.therapistId === currentUser.uid
    );
  };

  // UPDATED: Always show modal for service selection
  const handleStartSessionClick = (student) => {
    const myServices = getMyServices(student);

    if (myServices.length === 0) {
      toast.error("You are not assigned to any services for this student.");
      return;
    }

    // Always show modal - even with 1 service, let therapist confirm
    setSelectedStudentForModal(student);
    setAvailableServices(myServices);
    setShowServiceModal(true);
  };

  const goToSessionForm = (student, serviceAssignment) => {
    navigate('/therapist/session-form', {
      state: {
        child: student,
        service: {
          id: serviceAssignment.serviceId,
          name: serviceAssignment.serviceName
        }
      }
    });
    setShowServiceModal(false);
  };

  // Helper to get service icon based on service name
  const getServiceIcon = (serviceName) => {
    const name = serviceName?.toLowerCase() || '';
    if (name.includes('speech')) return <MessageCircle size={20} />;
    if (name.includes('occupational') || name.includes('ot')) return <Hand size={20} />;
    if (name.includes('physical') || name.includes('pt')) return <Activity size={20} />;
    if (name.includes('behavior') || name.includes('aba')) return <Brain size={20} />;
    if (name.includes('developmental')) return <TrendingUp size={20} />;
    if (name.includes('sped') || name.includes('special')) return <BookOpen size={20} />;
    return <Briefcase size={20} />;
  };

  // Helper to get service type badge color
  const getServiceBadgeClass = (serviceName) => {
    const name = serviceName?.toLowerCase() || '';
    if (name.includes('speech')) return 'service-badge--speech';
    if (name.includes('occupational') || name.includes('ot')) return 'service-badge--ot';
    if (name.includes('physical') || name.includes('pt')) return 'service-badge--pt';
    if (name.includes('behavior') || name.includes('aba')) return 'service-badge--behavior';
    return 'service-badge--default';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar {...getTherapistConfig()} forceActive="/therapist/dashboard" />
      {loading ? (
        <Loading role="therapist" message="Loading students" variant="content" />
      ) : (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', backgroundColor: '#f8f9fa' }}>
        <div style={{ padding: '20px', flex: 1 }}>
          <div className="therapist-dashboard__content">

        {/* Header Banner */}
        <div className="therapist-dashboard__header-banner">
          <div className="therapist-dashboard__header-content">
            <div className="therapist-dashboard__header-text">
              <h1 className="therapist-dashboard__title">MY STUDENTS</h1>
              <p className="therapist-dashboard__subtitle">Manage and Track Student Sessions</p>
            </div>
            <div className="therapist-dashboard__search-wrapper">
              <span className="therapist-dashboard__search-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search student name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="therapist-dashboard__search-input"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="therapist-dashboard__error">
            {error}
          </div>
        )}

        {/* Profile Completion Banner */}
        {(!currentUser?.profilePhoto || !currentUser?.phone || !currentUser?.gender) && (
          <div className="therapist-dashboard__profile-banner">
            <div>
              <h3 className="therapist-dashboard__profile-banner-title">
                <ClipboardList size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Complete Your Profile
              </h3>
              <p className="therapist-dashboard__profile-banner-text">
                Please add your profile photo and contact information to help parents and staff identify you.
              </p>
            </div>
            <button
              className="therapist-dashboard__profile-banner-button"
              onClick={() => navigate('/therapist/profile')}
            >
              Complete Profile
            </button>
          </div>
        )}

        {/* Credentials Completion Banner - shows when profile is done but credentials aren't */}
        {currentUser?.profilePhoto && currentUser?.phone && currentUser?.gender && (!currentUser?.licenses || currentUser?.licenses?.length === 0) && (
          <div className="therapist-dashboard__profile-banner therapist-dashboard__profile-banner--credentials">
            <div>
              <h3 className="therapist-dashboard__profile-banner-title">
                <ClipboardList size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Add Your Professional Credentials
              </h3>
              <p className="therapist-dashboard__profile-banner-text">
                You haven't added any professional licenses yet. Please add at least one license to keep your profile complete.
              </p>
            </div>
            <button
              className="therapist-dashboard__profile-banner-button"
              onClick={() => navigate('/therapist/profile')}
            >
              Add Credentials
            </button>
          </div>
        )}

        {/* Student Cards */}
        {filteredStudents.length === 0 ? (
          <div className="therapist-dashboard__empty">
            <p>
              {searchTerm
                ? 'No students found matching your search.'
                : 'No students assigned to you yet.'}
            </p>
          </div>
        ) : (
          <>
            <div className="therapist-dashboard__grid">
              {filteredStudents.map((student) => {
                const myServices = getMyServices(student);
                return (
                  <div key={student.id} className="therapist-dashboard__student-card">
                    {/* Clickable photo area */}
                    <div
                      className="therapist-dashboard__card-image-box"
                      onClick={() => navigate('/admin/StudentProfile', { state: { studentId: student.id, student, isStaffView: true } })}
                    >
                      {student.photoUrl ? (
                        <img src={student.photoUrl} className="therapist-dashboard__photo" alt="" />
                      ) : (
                        <div className="therapist-dashboard__photo-placeholder">
                          {student.firstName?.[0] || '?'}
                        </div>
                      )}
                    </div>

                    {/* Card body with name, services, and button - clickable to view profile */}
                    <div
                      className="therapist-dashboard__card-body"
                      onClick={() => navigate('/admin/StudentProfile', { state: { studentId: student.id, student, isStaffView: true } })}
                    >
                      <h3 className="therapist-dashboard__student-name">
                        {student.firstName} {student.lastName}
                      </h3>
                      <div className="therapist-dashboard__services-list">
                        {myServices.map((svc, idx) => (
                          <div key={idx} className="therapist-dashboard__service-tag">
                            {svc.serviceName}
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartSessionClick(student);
                        }}
                        className="therapist-dashboard__start-session-button"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                        Start Session
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Load More */}
            {hasMoreStudents && (
              <div className="therapist-dashboard__load-more-wrapper">
                <button
                  className="therapist-dashboard__load-more-btn"
                  onClick={handleLoadMore}
                >
                  Load More Students
                </button>
                <div className="therapist-dashboard__pagination-info">
                  Showing {filteredStudents.length} of {allFilteredStudents.length} students
                </div>
              </div>
            )}
          </>
        )}
      </div>

        {/* ENHANCED: Service Selection Modal */}
        {showServiceModal && selectedStudentForModal && (
          <div className="therapist-dashboard__modal-overlay" onClick={() => setShowServiceModal(false)}>
            <div className="therapist-dashboard__modal therapist-dashboard__modal--enhanced" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="therapist-dashboard__modal-header">
                <div className="therapist-dashboard__modal-header-content">
                  <h3 className="therapist-dashboard__modal-title">Start Session</h3>
                  <p className="therapist-dashboard__modal-subtitle">
                    Select the service for <strong>{selectedStudentForModal?.firstName} {selectedStudentForModal?.lastName}</strong>
                  </p>
                </div>
                <button 
                  className="therapist-dashboard__modal-close"
                  onClick={() => setShowServiceModal(false)}
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Student Info Mini Card */}
              <div className="therapist-dashboard__modal-student-info">
                <div className="therapist-dashboard__modal-avatar">
                  {selectedStudentForModal?.photoUrl ? (
                    <img src={selectedStudentForModal.photoUrl} alt="" />
                  ) : (
                    <User size={24} />
                  )}
                </div>
                <div className="therapist-dashboard__modal-student-details">
                  <span className="therapist-dashboard__modal-student-name">
                    {selectedStudentForModal?.firstName} {selectedStudentForModal?.lastName}
                  </span>
                  <span className="therapist-dashboard__modal-student-dob">
                    DOB: {selectedStudentForModal?.dateOfBirth}
                  </span>
                </div>
              </div>

              {/* Service Options */}
              <div className="therapist-dashboard__modal-body">
                <p className="therapist-dashboard__modal-instruction">
                  {availableServices.length > 1 
                    ? 'You have multiple services enrolled with this student. Please select which service to start:'
                    : 'Confirm the service you want to start:'}
                </p>
                
                <div className="therapist-dashboard__modal-services">
                  {availableServices.map((service, index) => (
                    <button
                      key={service.serviceId || index}
                      onClick={() => goToSessionForm(selectedStudentForModal, service)}
                      className={`therapist-dashboard__modal-service-button therapist-dashboard__modal-service-button--enhanced ${getServiceBadgeClass(service.serviceName)}`}
                    >
                      <span className="therapist-dashboard__modal-service-icon">
                        {getServiceIcon(service.serviceName)}
                      </span>
                      <div className="therapist-dashboard__modal-service-info">
                        <span className="therapist-dashboard__modal-service-name">
                          {service.serviceName}
                        </span>
                        {service.enrolledAt && (
                          <span className="therapist-dashboard__modal-service-date">
                            Enrolled: {new Date(service.enrolledAt?.toDate?.() || service.enrolledAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <Play size={18} className="therapist-dashboard__modal-service-play" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="therapist-dashboard__modal-footer">
                <button
                  onClick={() => setShowServiceModal(false)}
                  className="therapist-dashboard__modal-cancel-button"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
        <footer className="therapist-dashboard__footer">
          <div className="therapist-dashboard__footer-content">
            <div className="therapist-dashboard__footer-item">
              <div className="therapist-dashboard__footer-logo">
                <img src={logo} alt="Little Lions" className="therapist-dashboard__footer-logo-img" />
              </div>
              <span>Little Lions Learning and Development Center</span>
            </div>
            <span className="therapist-dashboard__footer-divider">•</span>
            <div className="therapist-dashboard__footer-item">
              <Mail size={18} className="therapist-dashboard__footer-icon" />
              <span>littlelionsldc@gmail.com</span>
            </div>
            <span className="therapist-dashboard__footer-divider">•</span>
            <div className="therapist-dashboard__footer-item">
              <Phone size={18} className="therapist-dashboard__footer-icon" />
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

export default TherapistDashboard;