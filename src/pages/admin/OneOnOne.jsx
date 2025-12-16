import React, { useEffect, useState } from "react";
import AdminSidebar from "../../components/sidebar/AdminSidebar";
import childService from "../../services/childService";
import { db } from "../../config/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc
} from "firebase/firestore";
import useManageTeachers from "../../hooks/useManageTeachers";
import "./css/OneOnOne.css";

/* ================================================================
   SELECTED SERVICE INFO (MULTIPLE DATES + COLLAPSIBLE)
================================================================ */
const SelectedServiceInfo = ({ records, teachers }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleIndex = (i) => setOpenIndex(openIndex === i ? null : i);

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? `${teacher.firstName} ${teacher.lastName}` : "—";
  };

  return (
    <div className="service-date-list">
      {records.map((rec, i) => (
        <div key={i} className="service-date-block">
          <div className="service-date-header" onClick={() => toggleIndex(i)}>
            <span>{rec.date || "No Date"}</span>
            <span className="arrow-icon">{openIndex === i ? "▲" : "▼"}</span>
          </div>
          {openIndex === i && (
            <div className="service-info-card">
              <p><span className="label">Teacher:</span> {rec.teacherId ? getTeacherName(rec.teacherId) : "—"}</p>
              <p><span className="label">Activity:</span> {rec.title || "—"}: {rec.activities || rec.description || "—"}</p>
              <p><span className="label">Participating Students:</span> {rec.participatingStudentsNames?.join(", ") || "—"}</p>
              <p><span className="label">Observations:</span> {rec.observations || "—"}</p>
              <p><span className="label">Follow up:</span> {rec.followUp || "—"}</p>
              <p><span className="label">Other concerns:</span> {rec.otherConcerns || "—"}</p>
            </div>
          )}
        </div>
      ))}
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
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentActivities, setStudentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ADD SERVICE STATE */
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newService, setNewService] = useState({
    name: "",
    description: "",
    type: "Therapy" // Default type
  });

  const { teachers } = useManageTeachers();

  /* ===============================
     FETCH SERVICES + STUDENTS
  =============================== */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const serviceSnap = await getDocs(collection(db, "services"));
        const serviceList = serviceSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const studentList = await childService.getAllChildren();

        setServices(serviceList);
        setStudents(studentList);
      } catch (err) {
        console.error("Error loading services:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* ===============================
     HELPERS
  =============================== */
  const getTeacherName = (teacherId) => {
    const t = teachers.find(t => t.id === teacherId);
    return t ? `${t.firstName} ${t.lastName}` : "—";
  };

  const enrolledStudents = selectedService
    ? students.filter(s =>
        s.services?.some(srv => srv.serviceId === selectedService.id)
      )
    : [];

  const handleSelectService = (service) => {
    setSelectedService(service);
    setLevel("students");
  };

  const handleSelectStudent = async (student) => {
    setSelectedStudent(student);
    setLevel("student-profile");

    try {
      const q = query(
        collection(db, "activities"),
        where("participatingStudentIds", "array-contains", student.id)
      );
      const snap = await getDocs(q);
      const activities = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        participatingStudentsNames: doc.data().participatingStudentIds.map(id => {
          const s = students.find(st => st.id === id);
          return s ? `${s.firstName} ${s.lastName}` : id;
        })
      }));
      setStudentActivities(activities);
    } catch (err) {
      console.error(err);
    }
  };

  const goBack = () => {
    if (level === "student-profile") {
      setSelectedStudent(null);
      setStudentActivities([]);
      setLevel("students");
    } else if (level === "students") {
      setSelectedService(null);
      setLevel("services");
    }
  };

  /* ===============================
     ADD SERVICE LOGIC
  =============================== */
  const handleServiceInputChange = (e) => {
    const { name, value } = e.target;
    setNewService(prev => ({ ...prev, [name]: value }));
  };

  const createService = async (e) => {
    e.preventDefault();
    try {
      const docRef = await addDoc(collection(db, "services"), {
        ...newService,
        active: true, // Defaulting to active
        createdAt: new Date()
      });

      setServices(prev => [
        ...prev,
        { id: docRef.id, ...newService }
      ]);

      setShowAddServiceModal(false);
      setNewService({ name: "", description: "", type: "Therapy" });
    } catch (err) {
      console.error("Error creating service:", err);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="ooo-container">
      <AdminSidebar />
      <div className="ooo-main">

        {/* ===============================
            SERVICES LANDING PAGE
        =============================== */}
        {level === "services" && (
          <>
            <div className="ooo-header">
              <h1>1 : 1 SERVICES</h1>
            </div>

            <div className="ooo-grid">

              {/* ADD SERVICE CARD */}
              <div
                className="ooo-card add-service-card"
                onClick={() => setShowAddServiceModal(true)}
              >
                <div className="ooo-card-info add-card">
                  <h3>＋ Add Service</h3>
                  <p>Create new service</p>
                </div>
              </div>

              {services.map(service => (
                <div
                  key={service.id}
                  className="ooo-card"
                  onClick={() => handleSelectService(service)}
                >
                  <div className="ooo-card-info">
                    <h3>{service.name}</h3>
                    <p>
                      {
                        students.filter(s =>
                          s.services?.some(sr => sr.serviceId === service.id)
                        ).length
                      } enrolled students
                    </p>
                    {/* Optional: Show type if useful */}
                    {service.type && <small style={{color:'#888'}}>({service.type})</small>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ===============================
            STUDENTS PER SERVICE
        =============================== */}
        {level === "students" && selectedService && (
          <>
            <div className="ooo-header">
              <span className="back-arrow" onClick={goBack}>←</span>
              <h1 className="service-name">{selectedService.name}</h1>
            </div>

            {enrolledStudents.length === 0 ? (
              <p>No students enrolled in this service.</p>
            ) : (
              <div className="ooo-grid">
                {enrolledStudents.map(student => {
                  const serviceInfo = student.services.find(
                    s => s.serviceId === selectedService.id
                  );
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
                        <p className="ooo-sub">Teacher: {getTeacherName(serviceInfo?.teacherId)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ===============================
            STUDENT PROFILE
        =============================== */}
        {level === "student-profile" && selectedStudent && (
          <div className="profile-wrapper">
            <span className="back-arrow" onClick={goBack}>←</span>
            <h2>{selectedStudent.lastName}, {selectedStudent.firstName}</h2>

            <SelectedServiceInfo
              records={studentActivities}
              teachers={teachers}
            />
          </div>
        )}

        {/* ===============================
            ADD SERVICE MODAL (UPDATED)
        =============================== */}
        {showAddServiceModal && (
          <div
            className="modal-overlay"
            onClick={() => setShowAddServiceModal(false)}
          >
            <div
              className="modal-box"
              onClick={(e) => e.stopPropagation()}
            >
              <h2>Add New Service</h2>

              <form onSubmit={createService} className="modal-form">
                <input
                  name="name"
                  placeholder="Service Name"
                  value={newService.name}
                  onChange={handleServiceInputChange}
                  required
                />

                <select
                  name="type"
                  value={newService.type}
                  onChange={handleServiceInputChange}
                  style={{marginBottom: '10px', padding: '10px', width: '100%', borderRadius: '4px', border: '1px solid #ddd'}}
                >
                  <option value="Therapy">Therapy</option>
                  <option value="Class">Class</option>
                  <option value="Assessment">Assessment</option>
                  <option value="Other">Other</option>
                </select>

                <textarea
                  name="description"
                  placeholder="Description"
                  value={newService.description}
                  onChange={handleServiceInputChange}
                />

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
    </div>
  );
};

export default OneOnOne;