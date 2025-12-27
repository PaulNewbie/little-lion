import React, { useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Global Shared Components
import AdminSidebar from "../../../components/sidebar/AdminSidebar";
import GeneralFooter from "../../../components/footer/generalfooter";

// Services & Hooks
import childService from "../../../services/childService";
import offeringsService from "../../../services/offeringsService";
import useManageTeachers from "../../../hooks/useManageTeachers";
import useManageTherapists from "../../../hooks/useManageTherapists";

// Local Feature Imports
import { useStudentProfileData } from "./hooks/useStudentProfileData";
import AssessmentHistory from "./components/AssessmentHistory";
import ActivityCalendar from "./components/ActivityCalendar";
import "./StudentProfile.css";

const StudentProfile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 1. THE CUSTOM HOOK (The Brain)
  const {
    loading,
    selectedStudent,
    setSelectedStudent,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    filteredStudents,
    studentActivities,
    fetchStudentActivities,
    refreshData
  } = useStudentProfileData(location.state);

  // 2. UI State
  const [viewMode, setViewMode] = useState(selectedStudent ? "profile" : "list");
  const [selectedService, setSelectedService] = useState("");
  const [showAssessment, setShowAssessment] = useState(false); // ✅ The Toggle for your new feature
  const calendarRef = useRef(null);

  // 3. Staff Data (needed for Modal & Calendar)
  const { teachers } = useManageTeachers();
  const { therapists } = useManageTherapists();
  const combinedStaff = [...(teachers || []), ...(therapists || [])];

  // 4. Modal State (Kept here for UI simplicity)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addServiceType, setAddServiceType] = useState(null);
  const [availableServices, setAvailableServices] = useState([]);
  const [addForm, setAddForm] = useState({ serviceId: "", staffId: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Handlers ---
  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    fetchStudentActivities(student.id);
    setViewMode("profile");
    setShowAssessment(false); // Reset view
    setSelectedService("");
  };

  const handleBack = () => {
    // If deep linked, go back to One-on-One, else List
    if (location.state?.fromOneOnOne) {
       navigate("/admin/one-on-one", { state: { ...location.state, level: "students" }});
    } else {
       setSelectedStudent(null);
       setViewMode("list");
    }
  };

  const handleServiceClick = (serviceName) => {
    setSelectedService(serviceName);
    setTimeout(() => {
      calendarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  // --- Add Service Logic ---
  const handleOpenAddModal = async (type) => {
    setAddServiceType(type);
    setAddForm({ serviceId: "", staffId: "" });
    try {
      const services = await offeringsService.getServicesByType(type);
      setAvailableServices(services);
      setIsAddModalOpen(true);
    } catch (error) {
      alert("Error loading services: " + error.message);
    }
  };

  const handleAddSubmit = async () => {
    if (!addForm.serviceId || !addForm.staffId) return alert("Select service and staff.");
    setIsSubmitting(true);
    try {
      const serviceObj = availableServices.find(s => s.id === addForm.serviceId);
      const isTherapy = addServiceType === "Therapy";
      const staffList = isTherapy ? therapists : teachers;
      const staffObj = staffList.find(s => (s.uid || s.id) === addForm.staffId);
      
      const assignData = {
        serviceId: serviceObj.id,
        serviceName: serviceObj.name,
        staffId: addForm.staffId,
        staffName: `${staffObj.firstName} ${staffObj.lastName}`,
        type: addServiceType,
        staffRole: isTherapy ? 'therapist' : 'teacher'
      };

      await childService.assignService(selectedStudent.id, assignData);
      
      await refreshData(); // ✅ Refresh the data via Hook
      setIsAddModalOpen(false);
      alert("Service added!");
    } catch (err) {
      alert("Failed: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="loading-spinner">Loading Student Data...</div>;

  // Helper to calculate Age
  const calculateAge = (dob) => {
    if (!dob) return "N/A";
    const age = Math.abs(new Date(Date.now() - new Date(dob).getTime()).getUTCFullYear() - 1970);
    return isNaN(age) ? "N/A" : age;
  };

  // Helper to filter enrolled services
  const enrolled = [
    ...(selectedStudent?.enrolledServices || []),
    ...(selectedStudent?.therapyServices || []),
    ...(selectedStudent?.groupClasses || [])
  ];
  const therapyServices = enrolled.filter(s => s.type === 'Therapy' || s.staffRole === 'therapist');
  const groupServices = enrolled.filter(s => s.type === 'Class' || s.staffRole === 'teacher');

  return (
    <div className="sp-container">
      <AdminSidebar />
      <div className="sp-main">
        <div className="sp-page">
          
          {/* === VIEW 1: LIST === */}
          {viewMode === "list" && (
            <>
              <div className="sp-header">
                <div className="header-title">
                  <h1>STUDENT PROFILES</h1>
                  <p className="header-subtitle">Manage enrolled students and view activities</p>
                </div>
                <div className="filter-actions">
                  <div className="search-wrapper">
                    <span className="search-icon">🔍</span>
                    <input 
                      className="sp-search" 
                      placeholder="Search by name..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="filter-wrapper">
                    <select className="sp-filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
                      <option value="all">All Students</option>
                      <option value="therapy">Therapy Only</option>
                      <option value="group">Group Class Only</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="sp-content-area">
                <div className="sp-grid">
                  {filteredStudents.map((student) => (
                    <div key={student.id} className="sp-card" onClick={() => handleSelectStudent(student)}>
                       <div className="sp-card-image-box">
                          {student.photoUrl ? <img src={student.photoUrl} className="sp-photo" alt=""/> : <div className="sp-photo-placeholder">{student.firstName[0]}</div>}
                       </div>
                       <div className="sp-card-body">
                          <h3 className="sp-name">{student.firstName} {student.lastName}</h3>
                          {/* Badges optional here */}
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* === VIEW 2: PROFILE === */}
          {viewMode === "profile" && selectedStudent && (
            <div className="profile-wrapper">
              <div className="profile-top">
                <div className="left-group">
                  <span className="back-arrow" onClick={handleBack}>‹</span>
                  <h2>STUDENT PROFILE</h2>
                </div>
              </div>

              <div className="profile-3col">
                <div className="profile-photo-frame">
                   <img src={selectedStudent.photoUrl} className="profile-photo" alt="profile"/>
                </div>
                
                <div className="profile-info">
                   <h1 className="profile-fullname">{selectedStudent.lastName}, {selectedStudent.firstName}</h1>
                   <div className="profile-details">
                      <div className="profile-left">
                        <p><span className="icon">🏥</span> <b>Medical:</b> {selectedStudent.medicalInfo || "None"}</p>
                      </div>
                      <div className="profile-right">
                        <p><b>Age:</b> {calculateAge(selectedStudent.dateOfBirth)}</p>
                        <p><b>Gender:</b> {selectedStudent.gender}</p>
                      </div>
                   </div>

                   {/* ✅ THE NEW TOGGLE BUTTON */}
                   <div style={{ marginTop: '20px' }}>
                     <button 
                        className="see-more-btn"
                        style={{ 
                          padding: '10px 20px', 
                          background: showAssessment ? '#e0e0e0' : '#4a90e2', 
                          color: showAssessment ? '#333' : 'white',
                          border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
                        }}
                        onClick={() => setShowAssessment(!showAssessment)}
                     >
                        {showAssessment ? "Hide Assessment History" : "See Assessment History"}
                     </button>
                   </div>
                </div>
              </div>

              {/* ✅ NEW: ASSESSMENT HISTORY SECTION */}
              {showAssessment && (
                 <AssessmentHistory assessmentTools={selectedStudent.assessmentTools} />
              )}

              {/* SERVICES & CALENDAR */}
              <div className="profile-content-scroll" style={{ marginTop: '30px' }}>
                <div className="services-split-row">
                   {/* Therapy List */}
                   <div className="content-section">
                      <div style={{display:'flex', justifyContent:'space-between'}}>
                         <h2 className="services-header">Therapy Services</h2>
                         <button onClick={() => handleOpenAddModal("Therapy")}>+ Add</button>
                      </div>
                      <div className="services-list">
                         {therapyServices.map((s, i) => (
                           <div key={i} className={`service-row clickable ${selectedService === s.serviceName ? 'active' : ''}`} onClick={() => handleServiceClick(s.serviceName)}>
                              <div className="service-left">🧠 {s.serviceName}</div>
                              <div>{s.staffName}</div>
                           </div>
                         ))}
                      </div>
                   </div>
                   
                   {/* Group List */}
                   <div className="content-section">
                      <div style={{display:'flex', justifyContent:'space-between'}}>
                         <h2 className="services-header">Group Classes</h2>
                         <button onClick={() => handleOpenAddModal("Class")}>+ Add</button>
                      </div>
                       <div className="services-list">
                         {groupServices.map((s, i) => (
                           <div key={i} className={`service-row clickable ${selectedService === s.serviceName ? 'active' : ''}`} onClick={() => handleServiceClick(s.serviceName)}>
                              <div className="service-left">👥 {s.serviceName}</div>
                              <div>{s.staffName}</div>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>

                {selectedService && (
                   <div ref={calendarRef}>
                      <ActivityCalendar 
                        activities={studentActivities.filter(a => a.serviceName === selectedService || a.serviceType === selectedService || a.className === selectedService)}
                        teachers={combinedStaff}
                        selectedServiceName={selectedService}
                      />
                   </div>
                )}
              </div>
            </div>
          )}
          
          <GeneralFooter pageLabel="Student Profile" />
        </div>
      </div>

      {/* MODAL for adding services (Simplified for brevity, same logic as before) */}
      {isAddModalOpen && (
        <div className="add-service-overlay">
           <div className="add-service-modal">
              <h3>Enroll in {addServiceType}</h3>
              <div className="modal-form-body">
                 <select className="modal-select" onChange={e => setAddForm({...addForm, serviceId: e.target.value})}>
                    <option value="">Select Service...</option>
                    {availableServices.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                 </select>
                 <select className="modal-select" style={{marginTop:'10px'}} onChange={e => setAddForm({...addForm, staffId: e.target.value})}>
                    <option value="">Select Staff...</option>
                    {(addServiceType === 'Therapy' ? therapists : teachers).map(t => <option key={t.id} value={t.uid || t.id}>{t.firstName} {t.lastName}</option>)}
                 </select>
              </div>
              <div className="modal-actions">
                 <button className="btn-cancel" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                 <button className="btn-confirm" disabled={isSubmitting} onClick={handleAddSubmit}>Confirm</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfile;