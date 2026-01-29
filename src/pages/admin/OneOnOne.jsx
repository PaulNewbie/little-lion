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
  const goBack = () => { if (level === "students") { setSelectedService(null); setLevel("services"); } };
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
        imageUrl = await cloudinaryService.uploadImage(newServiceImage, 'one-on-one/services');
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
      if (editServiceImage) imageUrl = await cloudinaryService.uploadImage(editServiceImage, 'one-on-one/services');
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
              <>
                <div className="ll-header">
                  <div className="ll-header-content">
                    <div className="header-title">
                      <h1>ONE-ON-ONE SERVICES</h1>
                      <p className="header-subtitle">Manage therapy services and enrolled students</p>
                    </div>
                  </div>
                </div>

                <div className="ooo-grid">
                  <button className="floating-add-btn" onClick={() => setShowAddServiceModal(true)}>
                    + ONE-ON-ONE SERVICE
                  </button>

                  {services.map(service => (
                    <div key={service.id} className="ooo-card" onClick={() => handleSelectService(service)}>
                      {service.imageUrl ? (
                        <div className="ooo-card-image-box"><img src={service.imageUrl} alt={service.name} /></div>
                      ) : <div className="ooo-card-icon">🎨</div>}

                      <div className="ooo-card-info">
                        <h3>{service.name}</h3>
                      </div>

                      {/* EDIT BUTTON */}
                      <button
                        className="ooo-edit-btn"
                        onClick={e => {
                          e.stopPropagation();
                          setEditServiceData({
                            id: service.id,
                            name: service.name,
                            description: service.description || "",
                            type: service.type,
                            imageUrl: service.imageUrl || ""
                          });
                          setEditServiceImage(null);
                          setShowEditModal(true);
                        }}
                      >
                        ✎
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {level === "students" && selectedService && (
              <>
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
              </>
            )}

            {/* ADD SERVICE MODAL */}
            {showAddServiceModal && (
              <div className="modal-overlay" onClick={() => !uploading && setShowAddServiceModal(false)}>
                <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                  <h2>Create New Service</h2>
                  <form onSubmit={createService} className="modal-form">

                    {/* SERVICE DETAILS SECTION */}
                    <div style={{
                      padding: '20px',
                      backgroundColor: '#faf5ff',
                      borderRadius: '12px',
                      border: '2px solid #a855f7',
                      marginBottom: '20px'
                    }}>
                      <h3 style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        color: '#7e22ce',
                        letterSpacing: '0.5px',
                        marginBottom: '16px'
                      }}>
                        Service Details <span style={{ color: '#ef4444' }}>*</span>
                      </h3>

                      <p style={{
                        fontSize: '13px',
                        color: '#64748b',
                        marginBottom: '16px'
                      }}>
                        Enter the name and description for this therapy service.
                      </p>

                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>Service Name</label>
                        <input
                          name="name"
                          placeholder="e.g. Speech Therapy"
                          value={newService.name}
                          onChange={handleServiceInputChange}
                          required
                          disabled={uploading}
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            border: newService.name ? '2px solid #22c55e' : '1px solid #ddd',
                            borderRadius: '8px',
                            fontSize: '14px',
                            backgroundColor: newService.name ? '#f0fdf4' : 'white',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>Description</label>
                        <textarea
                          name="description"
                          placeholder="Brief description of the service..."
                          value={newService.description}
                          onChange={handleServiceInputChange}
                          disabled={uploading}
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            fontSize: '14px',
                            minHeight: '80px',
                            resize: 'vertical',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      {newService.name && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 14px',
                          backgroundColor: '#dcfce7',
                          borderRadius: '8px',
                          marginTop: '12px'
                        }}>
                          <span style={{ fontSize: '13px', color: '#166534', fontWeight: '600' }}>
                            Service name entered
                          </span>
                        </div>
                      )}
                    </div>

                    {/* IMAGE SECTION */}
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      marginBottom: '20px'
                    }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                        Service Image (Optional)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setNewServiceImage(e.target.files[0])}
                        disabled={uploading}
                        style={{ fontSize: '14px' }}
                      />
                      {newServiceImage && (
                        <span style={{ display: 'block', marginTop: '8px', fontSize: '13px', color: '#059669' }}>
                          Selected: {newServiceImage.name}
                        </span>
                      )}
                    </div>

                    <div className="modal-actions">
                      <button className="cancel-service-btn" type="button" onClick={() => setShowAddServiceModal(false)} disabled={uploading}>Cancel</button>
                      <button className="add-edit-service-btn" type="submit" disabled={uploading}>{uploading ? "Uploading..." : "Add Service"}</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* EDIT SERVICE MODAL */}
            {showEditModal && (
              <div className="modal-overlay" onClick={() => !editing && setShowEditModal(false)}>
                <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                  <h2>Edit Service</h2>
                  <form onSubmit={handleEditServiceSubmit} className="modal-form">

                    {/* SERVICE DETAILS SECTION */}
                    <div style={{
                      padding: '20px',
                      backgroundColor: '#faf5ff',
                      borderRadius: '12px',
                      border: '2px solid #a855f7',
                      marginBottom: '20px'
                    }}>
                      <h3 style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        color: '#7e22ce',
                        letterSpacing: '0.5px',
                        marginBottom: '16px'
                      }}>
                        Service Details <span style={{ color: '#ef4444' }}>*</span>
                      </h3>

                      <p style={{
                        fontSize: '13px',
                        color: '#64748b',
                        marginBottom: '16px'
                      }}>
                        Update the name and description for this therapy service.
                      </p>

                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>Service Name</label>
                        <input
                          name="name"
                          value={editServiceData.name}
                          onChange={e => setEditServiceData({...editServiceData, name: e.target.value})}
                          required
                          autoFocus
                          disabled={editing}
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            border: editServiceData.name ? '2px solid #22c55e' : '1px solid #ddd',
                            borderRadius: '8px',
                            fontSize: '14px',
                            backgroundColor: editServiceData.name ? '#f0fdf4' : 'white',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>Description</label>
                        <textarea
                          name="description"
                          value={editServiceData.description}
                          onChange={e => setEditServiceData({...editServiceData, description: e.target.value})}
                          disabled={editing}
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            fontSize: '14px',
                            minHeight: '80px',
                            resize: 'vertical',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      {editServiceData.name && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 14px',
                          backgroundColor: '#dcfce7',
                          borderRadius: '8px',
                          marginTop: '12px'
                        }}>
                          <span style={{ fontSize: '13px', color: '#166534', fontWeight: '600' }}>
                            Service name entered
                          </span>
                        </div>
                      )}
                    </div>

                    {/* IMAGE SECTION */}
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      marginBottom: '20px'
                    }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                        Service Image (Optional)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => setEditServiceImage(e.target.files[0])}
                        disabled={editing}
                        style={{ fontSize: '14px' }}
                      />
                      {editServiceImage && (
                        <span style={{ display: 'block', marginTop: '8px', fontSize: '13px', color: '#059669' }}>
                          New image selected: {editServiceImage.name}
                        </span>
                      )}
                    </div>

                    <div className="modal-actions">
                      <button className="cancel-service-btn" type="button" onClick={() => setShowEditModal(false)} disabled={editing}>Cancel</button>
                      <button className="add-edit-service-btn" type="submit" disabled={editing}>{editing ? "Saving..." : "Save Changes"}</button>
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
