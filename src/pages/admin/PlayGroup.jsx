import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import GeneralFooter from "../../components/footer/generalfooter";

// 1. Import React Query
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Services
import childService from '../../services/childService';
import activityService from '../../services/activityService';
import offeringsService from '../../services/offeringsService';
import cloudinaryService from '../../services/cloudinaryService';

// Components & Styles
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import Sidebar from '../../components/sidebar/Sidebar';
import { getAdminConfig } from '../../components/sidebar/sidebarConfigs';
import Loading from '../../components/common/Loading';
import BackButton from '../../components/common/BackButton';
import './css/PlayGroup.css';
import './studentProfile/StudentProfile.css';
import '../../components/common/Header.css';
import '../../components/common/ServiceModal.css';

// ===== HELPER: SERVICE DESCRIPTION WITH SEE MORE =====
const ServiceDescription = ({ description, maxLength = 70 }) => {
  const [expanded, setExpanded] = useState(false);

  if (description.length <= maxLength) {
    return <p>{description}</p>;
  }

  return (
    <p>
      {expanded ? description : `${description.slice(0, maxLength)}... `}
      <span
        className="pg-see-more"
        onClick={(e) => {
          e.stopPropagation(); // prevent card click
          setExpanded(!expanded);
        }}
      >
        {expanded ? "See less" : "See more"}
      </span>
    </p>
  );
};

const PlayGroup = () => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const queryClient = useQueryClient();

  // Navigation: 'service-list' | 'service-dashboard'
  const [currentView, setCurrentView] = useState('service-list');

  // Selection State
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // --- Add Service Modal State ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [newServiceData, setNewServiceData] = useState({ name: '', description: '' });
  const [serviceImage, setServiceImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  // --- EDIT SERVICE MODAL STATE ---
  const [showEditModal, setShowEditModal] = useState(false);
  const [editServiceData, setEditServiceData] = useState({ id: null, name: '', description: '', imageUrl: '' });
  const [editServiceImage, setEditServiceImage] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // --- 1. Fetch Play Group Services ---
  const { data: services = [], isLoading: loadingServices } = useQuery({
    queryKey: ['services', 'Class'],
    queryFn: () => offeringsService.getServicesByType('Class'),
    staleTime: 1000 * 60 * 5,
  });

  // --- 2. Students are fetched lazily based on activity participants ---
  // No upfront fetch - we'll fetch only the students we need

  // --- 3. Real-time listener for Activities ---
  const [allActivities, setAllActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  useEffect(() => {
    setLoadingActivities(true);

    const unsubscribe = activityService.listenToPlayGroupActivities((activities) => {
      setAllActivities(activities);
      setLoadingActivities(false);
    });

    return () => unsubscribe();
  }, []);

  // --- 4. Lazy load students based on selected date's activities ---
  // Get participating student IDs only from the selected date's activities
  const participantIds = React.useMemo(() => {
    if (!selectedService) return [];

    // Get date string for selected date
    const offset = selectedDate.getTimezoneOffset();
    const localDate = new Date(selectedDate.getTime() - (offset * 60 * 1000));
    const dateString = localDate.toISOString().split('T')[0];

    // Filter activities by service AND date
    const dailyActs = allActivities.filter(act =>
      ((act.className === selectedService.name) || (act.serviceType === selectedService.name)) &&
      act.date === dateString
    );

    const ids = new Set();
    dailyActs.forEach(a => {
      if (a.participatingStudentIds) {
        a.participatingStudentIds.forEach(id => ids.add(id));
      }
    });

    return [...ids];
  }, [selectedService, selectedDate, allActivities]);

  // Fetch only the students we need (with caching per unique set of IDs)
  const { data: fetchedStudents = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['students', 'byIds', participantIds.sort().join(',')],
    queryFn: () => childService.getChildrenByIds(participantIds),
    enabled: participantIds.length > 0,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes - students are reused across dates
  });

  // Create a map for quick lookup
  const studentsMap = React.useMemo(() => {
    const map = new Map();
    fetchedStudents.forEach(student => map.set(student.id, student));
    return map;
  }, [fetchedStudents]);

  const isLoading = loadingServices || loadingActivities;

  // --- DASHBOARD LOGIC ---
  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setCurrentView('service-dashboard');
    setSelectedDate(new Date());
  };

  // --- HELPERS (Derived Data) ---
  const getServiceActivities = () => {
    if (!selectedService) return [];
    return allActivities.filter(act =>
      (act.className === selectedService.name) ||
      (act.serviceType === selectedService.name)
    );
  };

  const getActivityDates = () => {
    const serviceActs = getServiceActivities();
    return serviceActs.map(a => a.date);
  };

  // Helper to get formatted date string matching DB format
  const getSelectedDateString = () => {
    const offset = selectedDate.getTimezoneOffset();
    const localDate = new Date(selectedDate.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  // NEW: Get actual activity objects for the selected day
  const getDailyActivities = () => {
    const dateString = getSelectedDateString();
    return getServiceActivities().filter(a => a.date === dateString);
  };

  const getPresentChildren = () => {
    const dailyActs = getDailyActivities();

    const presentIds = new Set();
    dailyActs.forEach(a => {
      if (a.participatingStudentIds) {
        a.participatingStudentIds.forEach(id => presentIds.add(id));
      }
    });

    // Use the cached students map for lookup
    return [...presentIds]
      .map(id => studentsMap.get(id))
      .filter(Boolean); // Remove any undefined entries
  };

  // --- HANDLERS ---
  const handleCreateService = async (e) => {
    e.preventDefault();
    if(!newServiceData.name) return;

    setUploading(true);
    try {
      let imageUrl = "";
      if (serviceImage) {
        imageUrl = await cloudinaryService.uploadImage(serviceImage, 'little-lions/services');
      }

      await offeringsService.createService({
        name: newServiceData.name,
        description: newServiceData.description,
        type: 'Class',
        imageUrl: imageUrl
      });

      await queryClient.invalidateQueries({ queryKey: ['services', 'Class'] });

      setNewServiceData({ name: '', description: '' });
      setServiceImage(null);
      setShowAddModal(false);
      toast.success('Play group class created successfully!');
    } catch(err) {
      toast.error("Failed to create service: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const goBackToServices = () => {
    setSelectedService(null);
    setCurrentView('service-list');
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  return (
    <div className="pg-container">
      <Sidebar {...getAdminConfig(isSuperAdmin)} />
      {(isLoading && services.length === 0) ? (
        <Loading role="admin" message="Loading play groups" variant="content" />
      ) : (
      <div className="pg-main">
        <div className="pg-page">
        <div className="pg-content">

        {/* === VIEW 1: SERVICE SELECTION === */}
        {currentView === 'service-list' && (
          <div className="pg-service-list-view">
             <div className="ll-header">
                <div className="ll-header-content">
                  <div className="header-title">
                    <h1>PLAY GROUP SERVICES</h1>
                    <p className="header-subtitle">Select a class to view calendar and students</p>
                  </div>
                  <button
                    className={`pg-header-edit-btn ${editMode ? 'active' : ''}`}
                    onClick={() => setEditMode(!editMode)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    {editMode ? 'Done' : 'Edit'}
                  </button>
                </div>
             </div>

             <div className="pg-content-area">
                <div className="pg-services-grid">
                  {services.map(service => (
                    <div
                      key={service.id}
                      className={`pg-service-card ${editMode ? 'edit-mode' : ''}`}
                      onClick={() => {
                        if (editMode) {
                          setEditServiceData({
                            id: service.id,
                            name: service.name,
                            description: service.description || '',
                            imageUrl: service.imageUrl || ''
                          });
                          setEditServiceImage(null);
                          setShowEditModal(true);
                        } else {
                          handleServiceSelect(service);
                        }
                      }}
                    >
                      {service.imageUrl ? (
                        <div className="pg-card-image-box">
                          <img src={service.imageUrl} alt={service.name} className="pg-card-image" />
                        </div>
                      ) : (
                        <div className="pg-card-icon">🎨</div>
                      )}
                      <h3>{service.name}</h3>
                      {editMode && <span className="pg-edit-indicator">✎</span>}
                    </div>
                  ))}
                  {services.length === 0 && !isLoading && (
                    <p className="pg-empty">No Play Group services found. Add one to get started!</p>
                  )}
                </div>
             </div>
          </div>
        )}

        {/* FAB Button - Outside animated containers */}
        {currentView === 'service-list' && (
          <button className="pg-fab" onClick={() => setShowAddModal(true)}>
            <span className="pg-fab-icon">+</span>
            <span className="pg-fab-text">PLAY GROUP CLASS</span>
          </button>
        )}

        {/* === VIEW 2: SERVICE DASHBOARD (REFACTORED) === */}
        {currentView === 'service-dashboard' && selectedService && (
          <div className="pg-dashboard-view">
            <div className="ll-header">
              <div className="ll-header-content">
                <BackButton onClick={goBackToServices} />
                <div className="header-title">
                  <h1>{selectedService.name}</h1>
                  {selectedService.description && (
                    <p className="header-subtitle">
                      <ServiceDescription
                        description={selectedService.description}
                        maxLength={120}
                      />
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="pg-split-layout">
              {/* LEFT PANEL: Activities & Attendance */}
              <div className="pg-left-panel">

                <div className="pg-panel-header">
                   <h2>Daily Activities</h2>
                   <span className="pg-date-label">
                     {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                   </span>
                </div>

                <div className="pg-inner-scroll">
                  {/* 1. ACTIVITY LIST (Title, Description, Photos) */}
                  <div className="pg-activities-container">
                    {getDailyActivities().length > 0 ? (
                      getDailyActivities().map((activity, index) => {
                        // Get participating students for this activity using cached map
                        const activityStudents = activity.participatingStudentIds
                          ? activity.participatingStudentIds
                              .map(id => studentsMap.get(id))
                              .filter(Boolean)
                          : [];

                        return (
                          <div key={index} className="pg-activity-block">
                            {/* Header: Title & Teacher Badge */}
                            <div className="pg-activity-header">
                              <div className="pg-activity-text">
                                <h3 className="pg-activity-title">
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <polyline points="12 6 12 12 16 14"/>
                                  </svg>
                                  {activity.title || activity.activityName || "Activity"}
                                </h3>
                                {(activity.description || activity.notes) && (
                                  <p className="pg-activity-desc">{activity.description || activity.notes}</p>
                                )}
                              </div>

                              {/* Teacher Badge */}
                              {activity.teacherName && (
                                <div className="pg-teacher-badge">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                    <circle cx="12" cy="7" r="4"/>
                                  </svg>
                                  <span>{activity.teacherName}</span>
                                </div>
                              )}
                            </div>

                            {/* Photos for this specific activity */}
                            {activity.photoUrls && activity.photoUrls.length > 0 ? (
                              <div className="pg-photo-grid">
                                {activity.photoUrls.map((url, i) => (
                                  <div key={i} className="pg-photo-card" onClick={() => window.open(url, '_blank')}>
                                    <img src={url} alt="Activity" />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="pg-no-photos-msg">No photos uploaded for this activity.</div>
                            )}

                            {/* Participating Students */}
                            {(activityStudents.length > 0 || (loadingStudents && activity.participatingStudentIds?.length > 0)) && (
                              <div className="pg-activity-students">
                                <div className="pg-activity-students-header">
                                  <span className="pg-activity-students-label">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                      <circle cx="9" cy="7" r="4"/>
                                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                    </svg>
                                    Students Present
                                  </span>
                                  <span className="pg-activity-students-count">
                                    {loadingStudents ? '...' : activityStudents.length}
                                  </span>
                                </div>
                                <div className="pg-activity-students-list">
                                  {loadingStudents ? (
                                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>Loading...</span>
                                  ) : (
                                    activityStudents.map(child => (
                                      <div key={child.id} className="pg-activity-student-chip">
                                        {child.photoUrl ? (
                                          <img src={child.photoUrl} alt={child.firstName} />
                                        ) : (
                                          <span className="pg-avatar-placeholder pg-avatar-sm">
                                            {child.firstName?.charAt(0)?.toUpperCase() || '?'}
                                          </span>
                                        )}
                                        <span>{child.firstName} {child.lastName?.charAt(0)}.</span>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="pg-no-data">
                         <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
                           <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                           <line x1="16" y1="2" x2="16" y2="6"/>
                           <line x1="8" y1="2" x2="8" y2="6"/>
                           <line x1="3" y1="10" x2="21" y2="10"/>
                         </svg>
                         <p>No activities recorded for this date</p>
                         <small>Select a date with a yellow dot on the calendar</small>
                      </div>
                    )}
                  </div>

                  {/* 2. ATTENDANCE ROSTER (Simple List) */}
                  {getDailyActivities().length > 0 && (
                    <div className="pg-attendance-section">
                      <div className="pg-attendance-header">
                        <div className="pg-attendance-title-row">
                          <h3>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                              <circle cx="9" cy="7" r="4"/>
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                            </svg>
                            Overall Students Present
                          </h3>
                          <span className="pg-attendance-count">
                            {loadingStudents ? '...' : getPresentChildren().length}
                          </span>
                        </div>
                      </div>
                      {loadingStudents ? (
                        <div className="pg-no-students">Loading students...</div>
                      ) : getPresentChildren().length > 0 ? (
                        <div className="pg-attendance-grid">
                          {getPresentChildren().map(child => (
                            <div key={child.id} className="pg-simple-student-card">
                              {child.photoUrl ? (
                                <img src={child.photoUrl} alt={child.firstName} />
                              ) : (
                                <span className="pg-avatar-placeholder pg-avatar-md">
                                  {child.firstName?.charAt(0)?.toUpperCase() || '?'}
                                </span>
                              )}
                              <span className="pg-student-name">{child.firstName} {child.lastName}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="pg-no-students">No students recorded for this activity</div>
                      )}
                    </div>
                  )}

                </div>
              </div>

              {/* RIGHT PANEL: Calendar */}
              <div className="pg-right-panel">
                 <div className="pg-panel-header">
                    <h2>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}>
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      Schedule
                    </h2>
                 </div>
                 <div className="pg-calendar-wrapper">
                    <Calendar
                      onChange={handleDateChange}
                      value={selectedDate}
                      tileClassName={({ date, view }) => {
                        if (view === 'month') {
                          const offset = date.getTimezoneOffset();
                          const localDate = new Date(date.getTime() - (offset * 60 * 1000));
                          const dStr = localDate.toISOString().split('T')[0];
                          if (getActivityDates().includes(dStr)) return 'has-activity-dot';
                        }
                      }}
                    />
                    <div className="pg-calendar-legend">
                      <span className="dot-legend"></span> Activities Recorded
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* === ADD SERVICE MODAL === */}
        {showAddModal && (
          <div className="service-modal-overlay" onClick={() => !uploading && setShowAddModal(false)}>
            <div className="service-modal" onClick={e => e.stopPropagation()}>
              <div className="service-modal-header">
                <h2>Create New Class</h2>
                <button className="service-modal-close" onClick={() => !uploading && setShowAddModal(false)} disabled={uploading}>
                  &times;
                </button>
              </div>
              <form onSubmit={handleCreateService}>
                <div className="service-modal-body">
                  {/* Class Name */}
                  <div className="service-form-group">
                    <label className="service-form-label">
                      Class Name<span className="required">*</span>
                    </label>
                    <input
                      className={`service-form-input ${newServiceData.name ? 'has-value' : ''}`}
                      type="text"
                      placeholder="e.g. Morning Playgroup"
                      value={newServiceData.name}
                      onChange={(e) => setNewServiceData({...newServiceData, name: e.target.value})}
                      required
                      autoFocus
                      disabled={uploading}
                    />
                  </div>

                  {/* Description */}
                  <div className="service-form-group">
                    <label className="service-form-label">Description</label>
                    <textarea
                      className="service-form-textarea"
                      placeholder="Short description of the class..."
                      value={newServiceData.description}
                      onChange={(e) => setNewServiceData({...newServiceData, description: e.target.value})}
                      disabled={uploading}
                    />
                  </div>

                  {/* Image Upload */}
                  <div className={`service-image-section ${serviceImage ? 'has-image' : ''}`}>
                    <svg className="service-image-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <span className="service-image-label">Class Image</span>
                    <p className="service-image-hint">Optional - Upload an image for this class</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setServiceImage(e.target.files[0])}
                      disabled={uploading}
                      className="service-image-input"
                      id="add-class-image"
                    />
                    <label htmlFor="add-class-image" className="service-image-btn">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      Choose Image
                    </label>
                    {serviceImage && (
                      <div className="service-image-filename">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        {serviceImage.name}
                      </div>
                    )}
                  </div>
                </div>

                <div className="service-modal-footer">
                  <button type="button" className="service-btn service-btn-cancel" onClick={() => setShowAddModal(false)} disabled={uploading}>
                    Cancel
                  </button>
                  <button type="submit" className="service-btn service-btn-submit" disabled={uploading}>
                    {uploading ? (
                      <span className="service-btn-loading">
                        <span className="service-spinner"></span>
                        Uploading...
                      </span>
                    ) : 'Create Class'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* === EDIT SERVICE MODAL === */}
        {showEditModal && (
          <div className="service-modal-overlay" onClick={() => !editing && setShowEditModal(false)}>
            <div className="service-modal" onClick={e => e.stopPropagation()}>
              <div className="service-modal-header">
                <h2>Edit Class</h2>
                <button className="service-modal-close" onClick={() => !editing && setShowEditModal(false)} disabled={editing}>
                  &times;
                </button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                setEditing(true);
                try {
                  let imageUrl = editServiceData.imageUrl;
                  if (editServiceImage) {
                    imageUrl = await cloudinaryService.uploadImage(editServiceImage, 'little-lions/services');
                  }

                  await offeringsService.updateService(editServiceData.id, {
                    name: editServiceData.name,
                    description: editServiceData.description,
                    imageUrl
                  });

                  await queryClient.invalidateQueries({ queryKey: ['services', 'Class'] });
                  setShowEditModal(false);
                  toast.success('Class updated successfully!');
                } catch(err) {
                  toast.error("Failed to update service: " + err.message);
                } finally {
                  setEditing(false);
                }
              }}>
                <div className="service-modal-body">
                  {/* Class Name */}
                  <div className="service-form-group">
                    <label className="service-form-label">
                      Class Name
                    </label>
                    <input
                      className="service-form-input disabled"
                      type="text"
                      value={editServiceData.name}
                      disabled
                      readOnly
                    />
                  </div>

                  {/* Description */}
                  <div className="service-form-group">
                    <label className="service-form-label">Description</label>
                    <textarea
                      className="service-form-textarea"
                      value={editServiceData.description}
                      onChange={(e) => setEditServiceData({...editServiceData, description: e.target.value})}
                      disabled={editing}
                    />
                  </div>

                  {/* Image Upload */}
                  <div className={`service-image-section ${editServiceImage ? 'has-image' : ''}`}>
                    <svg className="service-image-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <span className="service-image-label">{editServiceData.imageUrl ? 'Change Image' : 'Class Image'}</span>
                    <p className="service-image-hint">Optional - Upload a new image</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setEditServiceImage(e.target.files[0])}
                      disabled={editing}
                      className="service-image-input"
                      id="edit-class-image"
                    />
                    <label htmlFor="edit-class-image" className="service-image-btn">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      Choose Image
                    </label>
                    {editServiceImage && (
                      <div className="service-image-filename">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        {editServiceImage.name}
                      </div>
                    )}
                  </div>
                </div>

                <div className="service-modal-footer">
                  <button type="button" className="service-btn service-btn-cancel" onClick={() => setShowEditModal(false)} disabled={editing}>
                    Cancel
                  </button>
                  <button type="submit" className="service-btn service-btn-submit" disabled={editing}>
                    {editing ? (
                      <span className="service-btn-loading">
                        <span className="service-spinner"></span>
                        Saving...
                      </span>
                    ) : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        </div>
        <GeneralFooter pageLabel="PlayGroup" />
        </div>
      </div>
      )}
    </div>
  );
};

export default PlayGroup;
