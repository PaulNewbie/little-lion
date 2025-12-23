import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AdminSidebar from "../../components/sidebar/AdminSidebar";
import GeneralFooter from "../../components/footer/generalfooter";
import childService from "../../services/childService";
import activityService from "../../services/activityService";
import { db } from "../../config/firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";
import useManageTherapists from "../../hooks/useManageTherapists";
import "./css/OneOnOne.css";

const OneOnOne = () => {
  const [level, setLevel] = useState("services");
  const [services, setServices] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newService, setNewService] = useState({
    name: "",
    description: "",
    type: "Therapy",
  });

  const { therapists } = useManageTherapists();
  const navigate = useNavigate();
  const location = useLocation();

  /* ===============================
     CHECK IF COMING BACK FROM STUDENTPROFILE
  =============================== */
  useEffect(() => {
    if (location.state?.returnToService) {
      setSelectedService(location.state.returnToService);
      setLevel("students");
    }
  }, [location.state]);

  /* ===============================
     FETCH SERVICES + STUDENTS
  =============================== */
  const fetchServicesAndStudents = async () => {
    try {
      const serviceSnap = await getDocs(collection(db, "services"));

      const serviceList = serviceSnap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((service) => service.type !== "Class");

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
      const activities = await activityService.getActivitiesByChild(student.id);

      const enhancedActivities = activities.map((doc) => ({
        ...doc,
        participatingStudentsNames: doc.participatingStudentIds
          ? doc.participatingStudentIds.map((id) => {
              const s = students.find((st) => st.id === id);
              return s ? `${s.firstName} ${s.lastName}` : id;
            })
          : [doc.studentName || student.firstName],
      }));

      navigate("/admin/StudentProfile", {
        state: {
          student,
          activities: enhancedActivities,
          therapists,
          selectedService,
          selectedServiceFromOneOnOne: selectedService,
          fromOneOnOne: true,
          scrollToCalendar: true,
        },
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

      if (newService.type !== "Class") {
        setServices((prev) => [...prev, { id: docRef.id, ...newService }]);
      }

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
      <AdminSidebar forceActive="/admin/one-on-one" />

      <div className="ooo-main">
        {/* ✅ WRAPPER so footer behaves correctly (same pattern as StudentProfile) */}
        <div className="ooo-page">
          {/* ✅ All page content */}
          <div className="ooo-content">
            {level === "services" && (
              <>
                <div className="ooo-header">
                  <div className="ooo-title">
                    <h1>ONE-ON-ONE SERVICES</h1>
                    <p className="ooo-subtitle">
                      Manage parent accounts and student registration
                    </p>
                  </div>
                </div>

                <div className="ooo-grid">
                  <button
                    className="floating-add-btn"
                    onClick={() => setShowAddServiceModal(true)}
                  >
                    + ONE-ON-ONE SERVICE
                  </button>

                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="ooo-card"
                      onClick={() => handleSelectService(service)}
                    >
                      <div className="ooo-card-info">
                        <h3>{service.name}</h3>
                        {service.type && (
                          <small style={{ color: "#888" }}>({service.type})</small>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {level === "students" && selectedService && (
              <>
                <div className="ooo-header">
                  <span className="back-arrow" onClick={goBack}>
                    ‹
                  </span>
                  <h1 className="service-name">{selectedService.name}</h1>
                </div>

                <div className="ooo-grid">
                  {enrolledStudents.length === 0 ? (
                    <p style={{ color: "#888", fontStyle: "italic" }}>
                      No students enrolled for this service yet.
                    </p>
                  ) : (
                    enrolledStudents.map((student) => {
                      const serviceInfo = [
                        ...(student.therapyServices || []),
                        ...(student.services || []),
                      ].find((s) => s.serviceName === selectedService.name);

                      return (
                        <div
                          key={student.id}
                          className="ooo-card"
                          onClick={() => handleSelectStudent(student)}
                        >
                          <div className="ooo-photo-area">
                            {student.photoUrl ? (
                              <img src={student.photoUrl} alt="" />
                            ) : (
                              <span>📷</span>
                            )}
                          </div>
                          <div className="ooo-card-info">
                            <p className="ooo-name">
                              {student.lastName}, {student.firstName}
                            </p>
                            <p className="ooo-sub">
                              Therapist:{" "}
                              {serviceInfo?.therapistName
                                ? serviceInfo.therapistName
                                : "Not assigned"}
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
              <div
                className="modal-overlay"
                onClick={() => setShowAddServiceModal(false)}
              >
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
                    <div style={{ margin: "15px 0" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "5px",
                          fontWeight: "bold",
                        }}
                      >
                        Service Type:
                      </label>
                      <select
                        name="type"
                        value={newService.type}
                        onChange={handleServiceInputChange}
                        style={{ width: "100%", padding: "8px" }}
                      >
                        <option value="Therapy">Therapy</option>
                        <option value="Assessment">Assessment</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="modal-actions">
                      <button
                        type="button"
                        onClick={() => setShowAddServiceModal(false)}
                      >
                        Cancel
                      </button>
                      <button type="submit">Add Service</button>
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
