import React, { useState } from 'react'; 
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
import AdminSidebar from '../../components/sidebar/AdminSidebar';
import './css/PlayGroup.css';
import './studentProfile/StudentProfile.css'; 

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
  const queryClient = useQueryClient();

  // Navigation: 'service-list' | 'service-dashboard'
  const [currentView, setCurrentView] = useState('service-list');
  
  // Selection State
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Left Panel View State
  const [selectedStudentForPhotos, setSelectedStudentForPhotos] = useState(null);

  // --- Add Service Modal State ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [newServiceData, setNewServiceData] = useState({ name: '', description: '' });
  const [serviceImage, setServiceImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  // --- EDIT SERVICE MODAL STATE (ADDED) ---
  const [showEditModal, setShowEditModal] = useState(false);
  const [editServiceData, setEditServiceData] = useState({ id: null, name: '', description: '', imageUrl: '' });
  const [editServiceImage, setEditServiceImage] = useState(null);
  const [editing, setEditing] = useState(false);

  // --- 1. ✅ CACHED: Fetch Play Group Services ---
  const { data: services = [], isLoading: loadingServices } = useQuery({
    queryKey: ['services', 'Class'], // Specific cache for Classes
    queryFn: () => offeringsService.getServicesByType('Class'),
    staleTime: 1000 * 60 * 5,
  });

  // --- 2. ✅ CACHED: Fetch All Students (Shared with Dashboard/OneOnOne) ---
  const { data: allChildren = [], isLoading: loadingChildren } = useQuery({
    queryKey: ['students'], 
    queryFn: () => childService.getAllChildren(),
    staleTime: 1000 * 60 * 5,
  });

  // --- 3. ✅ CACHED: Fetch All Activities ---
  const { data: allActivities = [], isLoading: loadingActivities } = useQuery({
    queryKey: ['activities', 'playgroup'],
    queryFn: () => activityService.getAllPlayGroupActivities(),
    staleTime: 1000 * 60 * 5,
  });

  // Combined Loading State
  const isLoading = loadingServices || loadingChildren || loadingActivities;

  // --- DASHBOARD LOGIC (Instant Switch) ---
  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setCurrentView('service-dashboard');
    setSelectedDate(new Date()); 
    setSelectedStudentForPhotos(null);
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

  const getPresentChildren = () => {
    const offset = selectedDate.getTimezoneOffset();
    const localDate = new Date(selectedDate.getTime() - (offset * 60 * 1000));
    const dateString = localDate.toISOString().split('T')[0];

    const acts = getServiceActivities().filter(a => a.date === dateString);
    
    const presentIds = new Set();
    acts.forEach(a => {
      if (a.participatingStudentIds) {
        a.participatingStudentIds.forEach(id => presentIds.add(id));
      }
    });
    return allChildren.filter(c => presentIds.has(c.id));
  };

  const getStudentPhotos = () => {
    if (!selectedStudentForPhotos) return [];
    const offset = selectedDate.getTimezoneOffset();
    const localDate = new Date(selectedDate.getTime() - (offset * 60 * 1000));
    const dateString = localDate.toISOString().split('T')[0];
    
    const acts = getServiceActivities().filter(a => 
      a.date === dateString && 
      a.participatingStudentIds?.includes(selectedStudentForPhotos.id)
    );
    return acts.flatMap(a => a.photoUrls || []);
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
    } catch(err) {
      alert("Failed to create service: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const goBackToServices = () => {
    setSelectedService(null);
    setCurrentView('service-list');
    setSelectedStudentForPhotos(null);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedStudentForPhotos(null); 
  };

  if (isLoading && services.length === 0) {
    return <div className="pg-loading">Loading Play Group Data...</div>;
  }

  return (
    <div className="pg-container">
      <AdminSidebar />
      <div className="pg-main">
        <div className="pg-page">
        <div className="pg-content">

        {/* === VIEW 1: SERVICE SELECTION === */}
        {currentView === 'service-list' && (
          <div className="pg-service-list-view">
             <div className="pg-header">
                <div className="pg-title">
                  <h1>PLAY GROUP SERVICES</h1>
                  <p>Select a class to view calendar and students</p>
                </div>
             </div>

             <div className="pg-content-area">
                <div className="pg-services-grid">
                  {services.map(service => (
                    <div 
                      key={service.id} 
                      className="pg-service-card"
                      onClick={() => handleServiceSelect(service)}
                    >
                      {service.imageUrl ? (
                        <div className="pg-card-image-box">
                          <img src={service.imageUrl} alt={service.name} className="pg-card-image" />
                        </div>
                      ) : (
                        <div className="pg-card-icon">🎨</div>
                      )}
                      <h3>{service.name}</h3>
                      
                      {/* ===== UPDATED: DESCRIPTION WITH SEE MORE ===== */}
                      <ServiceDescription description={service.description || "No description provided."} />

                      {/* ===== ADDITION: EDIT BUTTON ===== */}
                      <button 
                        className="pg-edit-btn"
                        onClick={(e) => {
                          e.stopPropagation(); // prevent card click
                          setEditServiceData({ 
                            id: service.id,
                            name: service.name,
                            description: service.description || '',
                            imageUrl: service.imageUrl || ''
                          });
                          setEditServiceImage(null);
                          setShowEditModal(true);
                        }}
                      >
                        ✎
                      </button>
                    </div>
                  ))}
                  {services.length === 0 && !isLoading && (
                    <p className="pg-empty">No Play Group services found. Add one to get started!</p>
                  )}
                </div>
             </div>

             <button className="pg-fab" onClick={() => setShowAddModal(true)}>
               <span className="pg-fab-icon">+</span>
               <span className="pg-fab-text">PLAY GROUP SERVICE</span>
             </button>
          </div>
        )}

        {/* === VIEW 2: SERVICE DASHBOARD === */}
        {currentView === 'service-dashboard' && selectedService && (
          <div className="pg-dashboard-view">
            <div className="pg-header">
              <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                <span onClick={goBackToServices} className="pg-back-btn">‹</span>
                <div className="pg-service-name-desc">
                  <h1>{selectedService.name}</h1>
                  <p>Manage attendance and activities</p>
                </div>
              </div>
            </div>

            <div className="pg-split-layout">
              {/* LEFT PANEL */}
              <div className="pg-left-panel">
                {selectedStudentForPhotos ? (
                  <>
                    <div className="pg-panel-header">
                      <div className="pg-panel-header-left">
                        <button className="pg-mini-back-btn" onClick={() => setSelectedStudentForPhotos(null)}>←</button>
                        <div style={{display:'flex', flexDirection:'column'}}>
                           <h2>{selectedStudentForPhotos.firstName}'s Photos</h2>
                           <span className="pg-subtitle-date">{selectedDate.toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="pg-inner-scroll">
                      <div className="pg-photo-grid">
                        {getStudentPhotos().map((url, idx) => (
                          <div key={idx} className="pg-photo-card" onClick={() => window.open(url, '_blank')}>
                             <img src={url} alt="Activity" />
                          </div>
                        ))}
                        {getStudentPhotos().length === 0 && <p className="pg-no-data">No photos found.</p>}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="pg-panel-header">
                      <h2>Students Present</h2>
                      <span className="pg-date-label">
                        {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="pg-students-list">
                      {getPresentChildren().length > 0 ? (
                        getPresentChildren().map(child => (
                          <div key={child.id} className="pg-student-row" onClick={() => setSelectedStudentForPhotos(child)}>
                            <img src={child.photoUrl || "https://via.placeholder.com/40"} alt="child" className="pg-student-thumb" />
                            <div className="pg-student-info">
                              <span className="pg-student-name">{child.firstName} {child.lastName}</span>
                              <span className="pg-status-badge">Present</span>
                            </div>
                            <span className="pg-arrow">›</span>
                          </div>
                        ))
                      ) : (
                        <div className="pg-no-data">
                          <p>No students recorded for this date.</p>
                          <small>Select a date with a green dot on the calendar.</small>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* RIGHT PANEL */}
              <div className="pg-right-panel">
                 <div className="pg-panel-header"><h2>Schedule</h2></div>
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

        {/* ADD SERVICE MODAL */}
        {showAddModal && (
          <div className="pg-modal-overlay" onClick={() => !uploading && setShowAddModal(false)}>
            <div className="pg-modal-form-card" onClick={e => e.stopPropagation()}>
              <h2>Create New Class</h2>
              <form onSubmit={handleCreateService}>
                <div className="pg-form-group">
                  <label>Class Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Morning Playgroup" 
                    value={newServiceData.name}
                    onChange={(e) => setNewServiceData({...newServiceData, name: e.target.value})}
                    required
                    autoFocus
                    disabled={uploading}
                  />
                </div>
                <div className="pg-form-group">
                  <label>Description</label>
                  <textarea 
                    placeholder="Short description of the class..." 
                    value={newServiceData.description}
                    onChange={(e) => setNewServiceData({...newServiceData, description: e.target.value})}
                    disabled={uploading}
                  />
                </div>
                
                <div className="pg-form-group">
                  <label>Service Image (Optional)</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setServiceImage(e.target.files[0])}
                    disabled={uploading}
                    className="pg-file-input"
                  />
                  {serviceImage && <span className="pg-file-name">Selected: {serviceImage.name}</span>}
                </div>

                <div className="pg-form-actions">
                  <button type="button" className="pg-cancel-btn" onClick={() => setShowAddModal(false)} disabled={uploading}>Cancel</button>
                  <button type="submit" className="pg-submit-btn" disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Create Class'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT SERVICE MODAL */}
        {showEditModal && (
          <div className="pg-modal-overlay" onClick={() => !editing && setShowEditModal(false)}>
            <div className="pg-modal-form-card" onClick={e => e.stopPropagation()}>
              <h2>Edit Class</h2>
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
                } catch(err) {
                  alert("Failed to update service: " + err.message);
                } finally {
                  setEditing(false);
                }
              }}>
                <div className="pg-form-group">
                  <label>Class Name</label>
                  <input 
                    type="text" 
                    value={editServiceData.name}
                    onChange={(e) => setEditServiceData({...editServiceData, name: e.target.value})}
                    required
                    autoFocus
                    disabled={editing}
                  />
                </div>
                <div className="pg-form-group">
                  <label>Description</label>
                  <textarea 
                    value={editServiceData.description}
                    onChange={(e) => setEditServiceData({...editServiceData, description: e.target.value})}
                    disabled={editing}
                  />
                </div>
                <div className="pg-form-group">
                  <label>Service Image (Optional)</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setEditServiceImage(e.target.files[0])}
                    disabled={editing}
                    className="pg-file-input"
                  />
                  {editServiceImage ? (
                    <span className="pg-file-name">Selected: {editServiceImage.name}</span>
                  ) : editServiceData.imageUrl ? (
                    <span className="pg-file-name">Current Image: {editServiceData.imageUrl.split('/').pop()}</span>
                  ) : null}
                </div>

                <div className="pg-form-actions">
                  <button type="button" className="pg-cancel-btn" onClick={() => setShowEditModal(false)} disabled={editing}>Cancel</button>
                  <button type="submit" className="pg-submit-btn" disabled={editing}>
                    {editing ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        </div>

        {/* FOOTER */}
        <GeneralFooter pageLabel="PlayGroup" />

        </div>
      </div>
    </div>
  );
};

export default PlayGroup;
