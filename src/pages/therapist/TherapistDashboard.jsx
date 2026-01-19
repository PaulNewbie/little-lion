import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Loading from '../../components/common/Loading';
import Sidebar from '../../components/sidebar/Sidebar';
import { getTherapistConfig } from '../../components/sidebar/sidebarConfigs';
import { Mail, Phone, X, Play } from 'lucide-react';
import { useTherapistDashboardData } from '../../hooks/useCachedData';
import logo from '../../images/logo.png';
import './css/TherapistDashboard.css';


const TherapistDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();


  const [searchTerm, setSearchTerm] = useState('');

  // Service Selection Modal State
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedStudentForModal, setSelectedStudentForModal] = useState(null);
  const [availableServices, setAvailableServices] = useState([]);

  const { students, isLoading: loading, error: queryError } = useTherapistDashboardData();
  const [error, setError] = useState('');

  // Set error from query if needed
  useEffect(() => {
    if (queryError) {
      setError('Failed to load assigned students.');
    }
  }, [queryError]);

  // Profile Completion Check
  useEffect(() => {
    if (currentUser && currentUser.profileCompleted === false) {
      const timer = setTimeout(() => {
        const shouldComplete = window.confirm(
          "📋 Complete your professional profile to help parents know you better.\n\nWould you like to do it now?"
        );
        if (shouldComplete) {
          navigate('/therapist/profile');
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [currentUser, navigate]);

  const filteredStudents = useMemo(() => {
    return students.filter(student =>
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const getMyServices = (student) => {
    const allServices = student.enrolledServices || [
      ...(student.oneOnOneServices || []),
      ...(student.groupClassServices || [])
    ];

    return allServices.filter(s =>
      (s.staffId === currentUser.uid) || (s.therapistId === currentUser.uid)
    );
  };

  // UPDATED: Always show modal for service selection
  const handleStartSessionClick = (student) => {
    const myServices = getMyServices(student);

    if (myServices.length === 0) {
      alert("Error: You are not assigned to any services for this student.");
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
    if (name.includes('speech')) return '🗣️';
    if (name.includes('occupational') || name.includes('ot')) return '🖐️';
    if (name.includes('physical') || name.includes('pt')) return '🏃';
    if (name.includes('behavior') || name.includes('aba')) return '🧠';
    if (name.includes('developmental')) return '📈';
    if (name.includes('sped') || name.includes('special')) return '📚';
    return '💼';
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
        {currentUser?.profileCompleted === false && (
          <div className="therapist-dashboard__profile-banner">
            <div>
              <h3 className="therapist-dashboard__profile-banner-title">
                📋 Complete Your Profile
              </h3>
              <p className="therapist-dashboard__profile-banner-text">
                Help parents know you better by adding your credentials, bio, and certifications.
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
          <div className="therapist-dashboard__grid">
            {filteredStudents.map((student) => {
              const myServices = getMyServices(student);
              return (
                <div key={student.id} className="therapist-dashboard__student-card">
                  <div className="therapist-dashboard__student-card-body">
                    <div className="therapist-dashboard__student-info">
                      <div className="therapist-dashboard__avatar-wrapper">
                        {student.photoUrl ? <img src={student.photoUrl} alt="" /> : '👤'}
                      </div>
                      <div>
                        <h3 className="therapist-dashboard__student-name">
                          {student.firstName} {student.lastName}
                        </h3>
                        <p className="therapist-dashboard__student-dob">
                          DOB: {student.dateOfBirth}
                        </p>
                      </div>
                    </div>
                    <div className="therapist-dashboard__services-list">
                      {myServices.map((svc, idx) => (
                        <div key={idx} className="therapist-dashboard__service-tag">
                          {svc.serviceName}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="therapist-dashboard__student-card-footer">
                    <button
                      onClick={() => navigate('/admin/StudentProfile', { state: { studentId: student.id, student, isStaffView: true } })}
                      className="therapist-dashboard__view-profile-button"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                      View Profile
                    </button>
                    <button
                      onClick={() => handleStartSessionClick(student)}
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
                    <span>👤</span>
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
    </div>
  );
};

export default TherapistDashboard;