import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/sidebar/AdminSidebar";
import childService from "../../services/childService";
import activityService from "../../services/activityService"; // Import Unified Service
import { db } from "../../config/firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";
import useManageTherapists from "../../hooks/useManageTherapists";
import "./css/OneOnOne.css";

/* ================================================================
   SELECTED SERVICE INFO (MULTIPLE DATES + COLLAPSIBLE)
================================================================ */
const SelectedServiceInfo = ({ records, therapists }) => {
  const [openIndex, setOpenIndex] = useState(null);
  const toggleIndex = (i) => setOpenIndex(openIndex === i ? null : i);
  const getTherapistName = (therapistId) => {
    const therapist = therapists.find((t) => t.uid === therapistId);
    return therapist ? `${therapist.firstName} ${therapist.lastName}` : "—";
  };

  return (
    <div className="service-date-list">
      {records.map((rec, i) => {
         const isTherapy = rec.type === 'therapy_session';

         return (
          <div key={i} className="service-date-block">
            <div className="service-date-header" onClick={() => toggleIndex(i)}>
              <span>{rec.date || "No Date"}</span>
              <span className="arrow-icon">{openIndex === i ? "▲" : "▼"}</span>
            </div>
            {openIndex === i && (
              <div className="service-info-card">
                <p>
                  <span className="label">Therapist:</span>{" "}
                  {rec.therapistId ? getTherapistName(rec.therapistId) : (rec.authorName || "—")}
                </p>
                
                {/* Unified Display for New & Old Data */}
                <p>
                  <span className="label">Activity/Title:</span>{" "}
                  {rec.title || "—"}
                </p>

                {isTherapy ? (
                  <>
                    <p><span className="label">Notes:</span> {rec.sessionNotes || "—"}</p>
                    {rec.strengths && <p><span className="label">Strengths:</span> {rec.strengths}</p>}
                    {rec.weaknesses && <p><span className="label">Improvements:</span> {rec.weaknesses}</p>}
                    {rec.homeActivities && <p><span className="label">Home Plan:</span> {rec.homeActivities}</p>}
                  </>
                ) : (
                   <p>
                    <span className="label">Description:</span>{" "}
                    {rec.activities || rec.description || "—"}
                  </p>
                )}

                <p>
                  <span className="label">Participating Students:</span>{" "}
                  {rec.participatingStudentsNames?.join(", ") || "—"}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ================================================================
   MAIN COMPONENT
================================================================ */
const OneOnOne = () => {
  const [level, setLevel] = useState("services");
  const [services, setServices] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newService, setNewService] = useState({ name: "", description: "", type: "Therapy" });

  const { therapists } = useManageTherapists();
  const navigate = useNavigate();

  /* ===============================
     FETCH SERVICES + STUDENTS
  =============================== */
  const fetchServicesAndStudents = async () => {
    try {
      const serviceSnap = await getDocs(collection(db, "services"));
      const serviceList = serviceSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const studentList = await childService.getAllChildren();
      setServices(serviceList);
      setStudents(studentList);
    } catch (err) {
      console.error("Error loading services:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicesAndStudents();
  }, []);

  /* ===============================
     FILTER STUDENTS ENROLLED IN SELECTED SERVICE
  =============================== */
  const enrolledStudents = selectedService
    ? students.filter((s) => {
        const allServices = [...(s.therapyServices || []), ...(s.services || [])];
        return allServices.some((srv) => srv.serviceName === selectedService.name);
      })
    : [];

  /* ===============================
     HANDLERS
  =============================== */
  const handleSelectService = (service) => {
    setSelectedService(service);
    setLevel("students");
  };

  const handleSelectStudent = async (student) => {
    try {
      // ✅ UPDATED: Fetch unified activities using the service
      const activities = await activityService.getActivitiesByChild(student.id);

      // Enhance with names
      const enhancedActivities = activities.map((doc) => ({
        ...doc,
        participatingStudentsNames: doc.participatingStudentIds 
          ? doc.participatingStudentIds.map((id) => {
              const s = students.find((st) => st.id === id);
              return s ? `${s.firstName} ${s.lastName}` : id;
            })
          : [doc.studentName || student.firstName]
      }));

      // Navigate
      navigate("/admin/StudentProfile", { 
        state: { 
          student, 
          activities: enhancedActivities, 
          therapists,
          selectedService, 
          fromOneOnOne: true
        } 
      });

    } catch (err) {
      console.error(err);
    }
  };

  const goBack = () => {
    if (level === "students") {
      setSelectedService(null);
      setLevel("services");
    }
  };

  const handleServiceInputChange = (e) => {
    const { name, value } = e.target;
    setNewService((prev) => ({ ...prev, [name]: value }));
  };

  const createService = async (e) => {
    e.preventDefault();
    try {
      const docRef = await addDoc(collection(db, "services"), {
        ...newService,
        active: true,
        createdAt: new Date(),
      });

      setServices((prev) => [...prev, { id: docRef.id, ...newService }]);
      setShowAddServiceModal(false);
      setNewService({ name: "", description: "", type: "Therapy" });

      const studentList = await childService.getAllChildren();
      setStudents(studentList);
    } catch (err) {
      console.error("Error creating service:", err);
    }
  };

  if (loading) return <div>Loading...</div>;

  /* ===============================
     RENDER
  =============================== */
  return (
    <div className="ooo-container">
      <AdminSidebar />
      <div className="ooo-main">

        {level === "services" && (
          <>
            <div className="ooo-header"><h1>1 : 1 SERVICES</h1></div>

            <div className="ooo-grid">
              <button className="floating-add-btn" onClick={() => setShowAddServiceModal(true)}>
                Add 1 on 1 Service
              </button>

              {services.map((service) => (
                <div
                  key={service.id}
                  className="ooo-card"
                  onClick={() => handleSelectService(service)}
                >
                  <div className="ooo-card-info">
                    <h3>{service.name}</h3>
                    {service.type && <small style={{ color: "#888" }}>({service.type})</small>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {level === "students" && selectedService && (
          <>
            <div className="ooo-header">
              <span className="back-arrow" onClick={goBack}>←</span>
              <h1 className="service-name">{selectedService.name}</h1>
            </div>

            <div className="ooo-grid">
              {enrolledStudents.length === 0 ? (
                <p style={{ color: "#888", fontStyle: "italic" }}>No students enrolled for this service yet.</p>
              ) : (
                enrolledStudents.map((student) => {
                  const serviceInfo = [...(student.therapyServices || []), ...(student.services || [])]
                    .find(s => s.serviceName === selectedService.name);

                  return (
                    <div
                      key={student.id}
                      className="ooo-card"
                      onClick={() => handleSelectStudent(student)}
                    >
                      <div className="ooo-photo-area">
                        {student.photoUrl ? <img src={student.photoUrl} alt="" /> : <span>📷</span>}
                      </div>
                      <div className="ooo-card-info">
                        <p className="ooo-name">{student.lastName}, {student.firstName}</p>
                        <p className="ooo-sub">
                          Therapist: {serviceInfo?.therapistName ? serviceInfo.therapistName : "Not assigned"}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {showAddServiceModal && (
          <div className="modal-overlay" onClick={() => setShowAddServiceModal(false)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <h2>Add New Service</h2>
              <form onSubmit={createService} className="modal-form">
                <input
                  name="name"
                  placeholder="Service Name"
                  value={newService.name}
                  onChange={handleServiceInputChange}
                  required
                />
                <textarea
                  name="description"
                  placeholder="Description"
                  value={newService.description}
                  onChange={handleServiceInputChange}
                />
                <div className="modal-actions">
                  <button type="button" onClick={() => setShowAddServiceModal(false)}>Cancel</button>
                  <button type="submit">Add Service</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default OneOnOne;