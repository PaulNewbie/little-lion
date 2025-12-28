import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

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

  // --- 1. ✅ CACHED: Fetch Play Group Services ---
  const { data: services = [], isLoading: loadingServices } = useQuery({
    queryKey: ['services', 'Class'], // Specific cache for Classes
    queryFn: () => offeringsService.getServicesByType('Class'),
    staleTime: 1000 * 60 * 5,
  });

  // --- 2. ✅ CACHED: Fetch All Students (Shared with Dashboard/OneOnOne) ---
  // This is likely ALREADY loaded, so it will be instant!
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
    // No fetching needed here! Data is already live.
  };

  // --- HELPERS (Derived Data) ---
  const getServiceActivities = () => {
    if (!selectedService) return [];
    
    // Strict Filter: Only show activities that match the selected Class Name
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

    // Find activities for this specific date
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
    
    // Find activities where this student participated
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
      
      // ✅ MAGIC: Auto-refresh the list
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

  // Simplified Loading Screen
  if (isLoading && services.length === 0) {
    return <div className="pg-loading">Loading Play Group Data...</div>;
  }

  return (
    <div className="ooo-container">
      <AdminSidebar />
      <div className="ooo-main">
        
        {/* === VIEW 1: SERVICE SELECTION === */}
        {currentView === 'service-list' && (
          <div className="pg-service-list-view">
             <div className="ooo-header">
                <div className="header-title">
                  <h1>Play Group Services</h1>
                  <p className="header-subtitle">Select a class to view calendar and students</p>
                </div>
             </div>

             <div className="ooo-content-area">
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
                      <p>{service.description || "No description provided."}</p>
                    </div>
                  ))}
                  {services.length === 0 && !isLoading && (
                    <p className="pg-empty">No Play Group services found. Add one to get started!</p>
                  )}
                </div>
             </div>

             <button className="pg-fab" onClick={() => setShowAddModal(true)}>
               <span className="pg-fab-icon">+</span>
               <span className="pg-fab-text">Add Play Group Service</span>
             </button>
          </div>
        )}

        {/* === VIEW 2: SERVICE DASHBOARD (SPLIT VIEW) === */}
        {currentView === 'service-dashboard' && selectedService && (
          <div className="pg-dashboard-view">
            <div className="ooo-header">
              <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                <button onClick={goBackToServices} className="pg-back-btn">← Back</button>
                <div className="header-title">
                  <h1>{selectedService.name}</h1>
                  <p className="header-subtitle">Manage attendance and activities</p>
                </div>
              </div>
            </div>

            {/* Content is ALREADY loaded, so no loading spinner needed here! */}
            <div className="pg-split-layout">
              {/* LEFT SIDE: Students & Photos */}
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

              {/* RIGHT SIDE: Calendar */}
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

        {/* === ADD SERVICE MODAL (Keep existing logic) === */}
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
                  <button type="submit" className="pg-submit-btn" disabled={uploading}>{uploading ? 'Uploading...' : 'Create Class'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayGroup;