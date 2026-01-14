import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Loading from '../../components/common/Loading';
import Sidebar from '../../components/sidebar/Sidebar';
import { getTherapistConfig } from '../../components/sidebar/sidebarConfigs';
import { Mail, Phone } from 'lucide-react';
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

  const handleStartSessionClick = (student) => {
    const myServices = getMyServices(student);

    if (myServices.length === 0) {
      alert("Error: You are not assigned to any services for this student.");
      return;
    }

    if (myServices.length === 1) {
      goToSessionForm(student, myServices[0]);
    } else {
      setSelectedStudentForModal(student);
      setAvailableServices(myServices);
      setShowServiceModal(true);
    }
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

  if (loading) return <Loading />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar {...getTherapistConfig()} forceActive="/therapist/dashboard" />
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
              onClick={() => navigate('/therapist/profile')}
              className="therapist-dashboard__profile-banner-button"
            >
              Complete Now →
            </button>
          </div>
        )}

        {/* Students List */}
        {filteredStudents.length === 0 ? (
          <div className="therapist-dashboard__empty-state">
            <h3 className="therapist-dashboard__empty-state-title">No students found</h3>
          </div>
        ) : (
          <div className="therapist-dashboard__students-grid">
            {filteredStudents.map(student => {
              const myServices = getMyServices(student);
              return (
                <div key={student.id} className="therapist-dashboard__student-card">
                  <div className="therapist-dashboard__student-card-header">
                    <div className="therapist-dashboard__student-info">
                      <div className="therapist-dashboard__student-avatar">
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
                      onClick={() => handleStartSessionClick(student)}
                      className="therapist-dashboard__start-session-button"
                    >
                      📝 Start Session
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

        {/* Service Selection Modal */}
        {showServiceModal && (
          <div className="therapist-dashboard__modal-overlay">
            <div className="therapist-dashboard__modal">
              <h3 className="therapist-dashboard__modal-title">Select Service</h3>
              <p className="therapist-dashboard__modal-subtitle">
                Which session are you starting for <strong>{selectedStudentForModal?.firstName}</strong>?
              </p>
              <div className="therapist-dashboard__modal-services">
                {availableServices.map((service) => (
                  <button
                    key={service.serviceId}
                    onClick={() => goToSessionForm(selectedStudentForModal, service)}
                    className="therapist-dashboard__modal-service-button"
                  >
                    {service.serviceName}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowServiceModal(false)}
                className="therapist-dashboard__modal-cancel-button"
              >
                Cancel
              </button>
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
    </div>
  );
};

export default TherapistDashboard;
