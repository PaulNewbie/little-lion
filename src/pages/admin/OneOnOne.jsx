import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import Sidebar from '../../components/sidebar/Sidebar';
import { getAdminConfig } from '../../components/sidebar/sidebarConfigs';
import GeneralFooter from "../../components/footer/generalfooter";
import Loading from "../../components/common/Loading";
import childService from "../../services/childService";
import offeringsService from "../../services/offeringsService";
import cloudinaryService from "../../services/cloudinaryService"; // Added for image upload
import useManageTherapists from "../../hooks/useManageTherapists";
import { db } from "../../config/firebase";
import { collection, addDoc } from "firebase/firestore";
import "./css/OneOnOne.css";
import "./studentProfile/StudentProfile.css";
import "../../components/common/Header.css";
import "../../components/common/ServiceModal.css";

/* ==============================
   HELPER: DESCRIPTION WITH SEE MORE
============================== */
const ServiceDescription = ({ description, maxLength = 38 }) => {
  const [expanded, setExpanded] = useState(false);

  if (!description || description.length <= maxLength) return <p>{description || "No description provided."}</p>;

  return (
    <p>
      {expanded ? description : `${description.slice(0, maxLength)}... `}
      <span className="ooo-see-more" onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}>
        {expanded ? "See less" : "See more"}
      </span>
    </p>
  );
};

const OneOnOne = () => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { therapists } = useManageTherapists();

  const [level, setLevel] = useState("services");
  const [selectedService, setSelectedService] = useState(null);

  // ADD SERVICE MODAL
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newService, setNewService] = useState({ name: "", description: "", type: "Therapy" });
  const [newServiceImage, setNewServiceImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  // EDIT SERVICE MODAL
  const [showEditModal, setShowEditModal] = useState(false);
  const [editServiceData, setEditServiceData] = useState({ id: null, name: "", description: "", type: "Therapy", imageUrl: "" });
  const [editServiceImage, setEditServiceImage] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // FETCH STUDENTS
  const { data: studentsData = [], isLoading: loadingStudents } = useQuery({
      queryKey: ["students"],
      queryFn: () => childService.getAllChildren(),
      staleTime: 1000 * 60 * 5,
  });

  const students = Array.isArray(studentsData) 
      ? studentsData 
      : (studentsData?.students || []);

  // FETCH SERVICES
  const { data: allServices = [], isLoading: loadingServices } = useQuery({
    queryKey: ["services"],
    queryFn: () => offeringsService.getAllServices(),
    staleTime: 1000 * 60 * 5,
  });

  const services = allServices.filter((s) => s.type !== "Class");
  const loading = loadingStudents || loadingServices;

  useEffect(() => {
    if (location.state?.returnToService) {
      setSelectedService(location.state.returnToService);
      setLevel("students");
    }
  }, [location.state]);

  // ENROLLED STUDENTS
  const enrolledStudents = selectedService
    ? students.filter((s) => {
        // 1. Combine all service arrays (legacy + new model)
        const legacySrvs = [
          ...(s.oneOnOneServices || []),
          ...(s.groupClassServices || [])
        ];
        
        const newModelSrvs = (s.serviceEnrollments || [])
          .filter(e => e.status === 'ACTIVE' || e.status === 'active'); // Only active enrollments
        
        // 2. Check legacy format
        const foundLegacy = legacySrvs.some(
          (srv) => srv.serviceName?.trim().toLowerCase() === selectedService.name?.trim().toLowerCase()
        );
        
        // 3. Check new model format
        const foundNew = newModelSrvs.some(
          (srv) => srv.serviceName?.trim().toLowerCase() === selectedService.name?.trim().toLowerCase()
        );
        
        return foundLegacy || foundNew;
      })
    : [];

  /* ===============================
     HANDLERS
  =============================== */
  const handleSelectService = (service) => setSelectedService(service) || setLevel("students");
  const handleSelectStudent = (student) => {
    navigate("/admin/studentprofile", {
      state: {
        student,
        therapists,
        selectedService,
        selectedServiceFromOneOnOne: selectedService,
        fromOneOnOne: true,
        scrollToCalendar: true,
      },
    });
  };
  const goBack = () => {
    setSelectedService(null);
    setLevel("services");
  };
  const handleServiceInputChange = (e) => {
    const { name, value } = e.target;
    setNewService(prev => ({ ...prev, [name]: value }));
  };
  const createService = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      let imageUrl = "";
      if (newServiceImage) {
        imageUrl = await cloudinaryService.uploadImage(newServiceImage, 'little-lions/one-on-one/services');
      }
      await addDoc(collection(db, "services"), { ...newService, imageUrl, active: true, createdAt: new Date() });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setShowAddServiceModal(false);
      setNewService({ name: "", description: "", type: "Therapy" });
      setNewServiceImage(null);
      toast.success("Service added successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add service.");
    } finally { setUploading(false); }
  };

  const handleEditServiceSubmit = async (e) => {
    e.preventDefault();
    setEditing(true);
    try {
      let imageUrl = editServiceData.imageUrl;
      if (editServiceImage) imageUrl = await cloudinaryService.uploadImage(editServiceImage, 'little-lions/one-on-one/services');
      await offeringsService.updateService(editServiceData.id, { ...editServiceData, imageUrl });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setShowEditModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update service.");
    } finally { setEditing(false); }
  };

  return (
    <div className="ooo-container">
      <Sidebar {...getAdminConfig(isSuperAdmin)} forceActive="/admin/one-on-one" />
      {loading ? (
        <Loading role="admin" message="Loading services" variant="content" />
      ) : (
      <div className="ooo-main">
        <div className="ooo-page">
          <div className="ooo-content">
            {level === "services" && (
              <div className="ooo-service-list-view">
                <div className="ll-header">
                  <div className="ll-header-content">
                    <div className="header-title">
                      <h1>ONE-ON-ONE SERVICES</h1>
                      <p className="header-subtitle">Manage therapy services and enrolled students</p>
                    </div>
                    <button
                      className={`ooo-header-edit-btn ${editMode ? 'active' : ''}`}
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

                <div className="ooo-content-area">
                  <div className="ooo-services-grid">
                    {services.map(service => (
                      <div
                        key={service.id}
                        className={`ooo-service-card ${editMode ? 'edit-mode' : ''}`}
                        onClick={() => {
                          if (editMode) {
                            setEditServiceData({
                              id: service.id,
                              name: service.name,
                              description: service.description || "",
                              type: service.type,
                              imageUrl: service.imageUrl || ""
                            });
                            setEditServiceImage(null);
                            setShowEditModal(true);
                          } else {
                            handleSelectService(service);
                          }
                        }}
                      >
                        {service.imageUrl ? (
                          <div className="ooo-card-image-box">
                            <img src={service.imageUrl} alt={service.name} className="ooo-card-image" />
                          </div>
                        ) : (
                          <div className="ooo-card-icon">🎨</div>
                        )}
                        <h3>{service.name}</h3>
                        {editMode && <span className="ooo-edit-indicator">✎</span>}
                      </div>
                    ))}
                    {services.length === 0 && (
                      <p className="ooo-empty">No One-on-One services found. Add one to get started!</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* FAB Button - Outside animated containers */}
            {level === "services" && (
              <button className="ooo-fab" onClick={() => setShowAddServiceModal(true)}>
                <span className="ooo-fab-icon">+</span>
                <span className="ooo-fab-text">ONE-ON-ONE SERVICE</span>
              </button>
            )}

            {level === "students" && selectedService && (
              <div className="ooo-students-view">
                {/* --- HEADER --- */}
                <div className="ll-header">
                  <span className="back-arrow" onClick={goBack}>
                    <svg width="24" height="40" viewBox="0 0 32 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M11.6255 22.8691C9.89159 24.4549 9.89159 27.1866 11.6255 28.7724L30.3211 45.8712C31.7604 47.1876 31.7604 49.455 30.3211 50.7714C29.0525 51.9316 27.1081 51.9316 25.8395 50.7714L1.01868 28.0705C0.366419 27.4738 0 26.6645 0 25.8208C0 24.977 0.366419 24.1678 1.01868 23.571L25.8395 0.87018C27.1081 -0.290054 29.0525 -0.290057 30.3211 0.870177C31.7604 2.1865 31.7604 4.45398 30.3211 5.7703L11.6255 22.8691Z" fill="#ffffff"/>
                    </svg>
                  </span>
                  <div className="ll-header-content" style={{ marginLeft: '50px' }}>
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
                {/* ----------------------- */}
                <div className="sp-content-area">
                  <div className="sp-grid">
                      {enrolledStudents.length === 0 ? (
                        <p style={{ color: "#888", fontStyle: "italic" }}>No students enrolled for this service yet.</p>
                      ) : (
                        enrolledStudents.map(student => {
                          // 1. Find the specific service entry to get the staff name
                          const legacySrvs = [
                            ...(student.oneOnOneServices || []),
                            ...(student.groupClassServices || [])
                          ];

                          const activeSrvs = (student.serviceEnrollments || [])
                            .filter(e => e.status === 'ACTIVE' || e.status === 'active');

                          const legacyServiceInfo = legacySrvs.find(
                            s => s.serviceName?.trim().toLowerCase() === selectedService.name?.trim().toLowerCase()
                          );

                          const newModelServiceInfo = activeSrvs.find(
                            s => s.serviceName?.trim().toLowerCase() === selectedService.name?.trim().toLowerCase()
                          );

                          // Determine which staff name to show
                          let staffName = "Not assigned";
                          if (newModelServiceInfo?.currentStaff?.staffName) {
                            staffName = newModelServiceInfo.currentStaff.staffName;
                          } else if (legacyServiceInfo?.staffName) {
                            staffName = legacyServiceInfo.staffName;
                          }

                          return (
                            <div key={student.id} className="sp-card" onClick={() => handleSelectStudent(student)}>
                              <div className="sp-card-image-box">
                                {student.photoUrl ? (
                                  <img src={student.photoUrl} className="sp-photo" alt="" />
                                ) : (
                                  <div className="sp-photo-placeholder">
                                    {student.firstName?.[0] || '?'}
                                  </div>
                                )}
                              </div>
                              <div className="sp-card-body">
                                <p className="sp-name">{student.lastName}, {student.firstName}</p>
                                <p className="sp-therapist">Therapist: {staffName}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                  </div>
                </div>
              </div>
            )}

            {/* ADD SERVICE MODAL */}
            {showAddServiceModal && (
              <div className="service-modal-overlay" onClick={() => !uploading && setShowAddServiceModal(false)}>
                <div className="service-modal" onClick={e => e.stopPropagation()}>
                  <div className="service-modal-header">
                    <h2>Create New Service</h2>
                    <button className="service-modal-close" onClick={() => !uploading && setShowAddServiceModal(false)} disabled={uploading}>
                      &times;
                    </button>
                  </div>
                  <form onSubmit={createService}>
                    <div className="service-modal-body">
                      {/* Service Name */}
                      <div className="service-form-group">
                        <label className="service-form-label">
                          Service Name<span className="required">*</span>
                        </label>
                        <input
                          className={`service-form-input ${newService.name ? 'has-value' : ''}`}
                          name="name"
                          placeholder="e.g. Speech Therapy"
                          value={newService.name}
                          onChange={handleServiceInputChange}
                          required
                          disabled={uploading}
                        />
                      </div>

                      {/* Description */}
                      <div className="service-form-group">
                        <label className="service-form-label">Description</label>
                        <textarea
                          className="service-form-textarea"
                          name="description"
                          placeholder="Brief description of the service..."
                          value={newService.description}
                          onChange={handleServiceInputChange}
                          disabled={uploading}
                        />
                      </div>

                      {/* Image Upload */}
                      <div className={`service-image-section ${newServiceImage ? 'has-image' : ''}`}>
                        <svg className="service-image-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21 15 16 10 5 21"/>
                        </svg>
                        <span className="service-image-label">Service Image</span>
                        <p className="service-image-hint">Optional - Upload an image for this service</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setNewServiceImage(e.target.files[0])}
                          disabled={uploading}
                          className="service-image-input"
                          id="add-service-image"
                        />
                        <label htmlFor="add-service-image" className="service-image-btn">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="17 8 12 3 7 8"/>
                            <line x1="12" y1="3" x2="12" y2="15"/>
                          </svg>
                          Choose Image
                        </label>
                        {newServiceImage && (
                          <div className="service-image-filename">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            {newServiceImage.name}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="service-modal-footer">
                      <button type="button" className="service-btn service-btn-cancel" onClick={() => setShowAddServiceModal(false)} disabled={uploading}>
                        Cancel
                      </button>
                      <button type="submit" className="service-btn service-btn-submit" disabled={uploading}>
                        {uploading ? (
                          <span className="service-btn-loading">
                            <span className="service-spinner"></span>
                            Uploading...
                          </span>
                        ) : 'Add Service'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* EDIT SERVICE MODAL */}
            {showEditModal && (
              <div className="service-modal-overlay" onClick={() => !editing && setShowEditModal(false)}>
                <div className="service-modal" onClick={e => e.stopPropagation()}>
                  <div className="service-modal-header">
                    <h2>Edit Service</h2>
                    <button className="service-modal-close" onClick={() => !editing && setShowEditModal(false)} disabled={editing}>
                      &times;
                    </button>
                  </div>
                  <form onSubmit={handleEditServiceSubmit}>
                    <div className="service-modal-body">
                      {/* Service Name */}
                      <div className="service-form-group">
                        <label className="service-form-label">
                          Service Name
                        </label>
                        <input
                          className="service-form-input disabled"
                          name="name"
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
                          name="description"
                          value={editServiceData.description}
                          onChange={e => setEditServiceData({...editServiceData, description: e.target.value})}
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
                        <span className="service-image-label">{editServiceData.imageUrl ? 'Change Image' : 'Service Image'}</span>
                        <p className="service-image-hint">Optional - Upload a new image</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => setEditServiceImage(e.target.files[0])}
                          disabled={editing}
                          className="service-image-input"
                          id="edit-service-image"
                        />
                        <label htmlFor="edit-service-image" className="service-image-btn">
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
          <GeneralFooter pageLabel="OneOnOne" />
        </div>
      </div>
      )}
    </div>
  );
};

export default OneOnOne;
