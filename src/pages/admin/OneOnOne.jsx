import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AdminSidebar from "../../components/sidebar/AdminSidebar";
import GeneralFooter from "../../components/footer/generalfooter";
import childService from "../../services/childService";
import offeringsService from "../../services/offeringsService";
import cloudinaryService from "../../services/cloudinaryService"; // Added for image upload
import useManageTherapists from "../../hooks/useManageTherapists";
import { db } from "../../config/firebase";
import { collection, addDoc } from "firebase/firestore";
import "./css/OneOnOne.css";

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
  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ["students"],
    queryFn: () => childService.getAllChildren(),
    staleTime: 1000 * 60 * 5,
  });

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
        const allSrv = s.enrolledServices || [...(s.therapyServices || []), ...(s.services || [])];
        return allSrv.some(
          (srv) => srv.serviceName?.trim().toLowerCase() === selectedService.name?.trim().toLowerCase()
        );
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
      alert("Service added successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to add service.");
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
      alert("Failed to update service.");
    } finally { setEditing(false); }
  };

  if (loading) return <div className="loading-container">Loading...</div>;

  return (
    <div className="ooo-container">
      <AdminSidebar forceActive="/admin/one-on-one" />
      <div className="ooo-main">
        <div className="ooo-page">
          <div className="ooo-content">
            {level === "services" && (
              <>
                <div className="ooo-header">
                  <div className="ooo-title">
                    <h1>ONE-ON-ONE SERVICES</h1>
                    <p className="ooo-subtitle">Manage parent accounts and student registration</p>
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
                        <ServiceDescription description={service.description} />
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
                <div className="ooo-header">
                  <span className="back-arrow" onClick={goBack}>‹</span>
                  <h1 className="service-name">{selectedService.name}</h1>
                </div>
                <div className="ooo-grid">
                  {enrolledStudents.length === 0 ? (
                    <p style={{ color: "#888", fontStyle: "italic" }}>No students enrolled for this service yet.</p>
                  ) : (
                    enrolledStudents.map(student => {
                      const serviceInfo = (student.enrolledServices || [...(student.therapyServices || []), ...(student.services || [])])
                        .find(s => s.serviceName === selectedService.name);

                      return (
                        <div key={student.id} className="ooo-card" onClick={() => handleSelectStudent(student)}>
                          <div className="ooo-photo-area">
                            {student.photoUrl ? <img src={student.photoUrl} alt="" /> : <span>📷</span>}
                          </div>
                          <div className="ooo-card-info">
                            <p className="ooo-name">{student.lastName}, {student.firstName}</p>
                            <p className="ooo-sub">Therapist: {serviceInfo?.staffName || serviceInfo?.therapistName || "Not assigned"}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}

            {/* ADD SERVICE MODAL */}
            {showAddServiceModal && (
              <div className="modal-overlay" onClick={() => !uploading && setShowAddServiceModal(false)}>
                <div className="modal-box" onClick={e => e.stopPropagation()}>
                  <h2>Add New Service</h2>
                  <form onSubmit={createService} className="modal-form">
                    <input name="name" placeholder="Service Name" value={newService.name} onChange={handleServiceInputChange} required />
                    <textarea name="description" placeholder="Description" value={newService.description} onChange={handleServiceInputChange} />
                    <div style={{ margin: "10px 0" }}>
                      <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Service Type:</label>
                      <select name="type" value={newService.type} onChange={handleServiceInputChange} style={{ width: "100%", padding: "8px" }}>
                        <option value="Therapy">Therapy</option>
                        <option value="Assessment">Assessment</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div style={{ marginBottom: "10px" }}>
                      <label>Service Image (Optional)</label>
                      <input type="file" accept="image/*" onChange={(e) => setNewServiceImage(e.target.files[0])} />
                      {newServiceImage && <span>Selected: {newServiceImage.name}</span>}
                    </div>
                    <div className="modal-actions">
                      <button type="button" onClick={() => setShowAddServiceModal(false)} disabled={uploading}>Cancel</button>
                      <button type="submit" disabled={uploading}>{uploading ? "Uploading..." : "Add Service"}</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* EDIT SERVICE MODAL */}
            {showEditModal && (
              <div className="modal-overlay" onClick={() => !editing && setShowEditModal(false)}>
                <div className="modal-box" onClick={e => e.stopPropagation()}>
                  <h2>Edit Service</h2>
                  <form onSubmit={handleEditServiceSubmit} className="modal-form">
                    <input name="name" value={editServiceData.name} onChange={e => setEditServiceData({...editServiceData, name: e.target.value})} required autoFocus disabled={editing} />
                    <textarea name="description" value={editServiceData.description} onChange={e => setEditServiceData({...editServiceData, description: e.target.value})} disabled={editing} />
                    <div style={{ marginBottom: "10px" }}>
                      <label>Service Type:</label>
                      <select value={editServiceData.type} onChange={e => setEditServiceData({...editServiceData, type: e.target.value})} disabled={editing} style={{ width: "100%", padding: "8px" }}>
                        <option value="Therapy">Therapy</option>
                        <option value="Assessment">Assessment</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div style={{ marginBottom: "10px" }}>
                      <label>Service Image (Optional)</label>
                      <input type="file" accept="image/*" onChange={e => setEditServiceImage(e.target.files[0])} disabled={editing} />
                      {editServiceImage ? <span>Selected: {editServiceImage.name}</span> : editServiceData.imageUrl ? <span>Current: {editServiceData.imageUrl.split('/').pop()}</span> : null}
                    </div>
                    <div className="modal-actions">
                      <button type="button" onClick={() => setShowEditModal(false)} disabled={editing}>Cancel</button>
                      <button type="submit" disabled={editing}>{editing ? "Saving..." : "Save Changes"}</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
          <GeneralFooter pageLabel="OneOnOne" />
        </div>
      </div>
    </div>
  );
};

export default OneOnOne;
