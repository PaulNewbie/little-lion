import React, { useState, useEffect } from "react";
import AdminSidebar from "../../components/sidebar/AdminSidebar";
import childService from "../../services/childService";
import { db } from "../../config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import useManageTeachers from "../../hooks/useManageTeachers";
import "./css/StudentProfile.css";

/* ================================================================
   SELECTED SERVICE INFO (MULTIPLE DATES + COLLAPSIBLE)
================================================================ */
const SelectedServiceInfo = ({ records, teachers }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleIndex = (i) => setOpenIndex(openIndex === i ? null : i);

  const getTeacherName = (id) => {
    // Try to find in the passed teachers/staff list
    const staff = teachers.find(t => t.id === id || t.uid === id);
    return staff ? `${staff.firstName} ${staff.lastName}` : "—";
  };

  return (
    <div className="service-date-list">
      {records.map((rec, i) => (
        <div key={i} className="service-date-block">

          {/* DATE HEADER */}
          <div className="service-date-header" onClick={() => toggleIndex(i)}>
            <span>{rec.date || "No Date"}</span>
            <span className="arrow-icon">{openIndex === i ? "▲" : "▼"}</span>
          </div>

          {/* COLLAPSIBLE CARD */}
          {openIndex === i && (
            <div className="service-info-card">
              <p>
                <span className="label">Staff:</span>{" "}
                {rec.authorName || rec.teacherName || getTeacherName(rec.teacherId || rec.authorId)}
              </p>
              
              <p>
                <span className="label">Title:</span> {rec.title || "—"}
              </p>
              
              {/* Description / Progress Notes */}
              <p>
                <span className="label">Notes/Activity:</span>{" "}
                {rec.progressNotes || rec.description || "—"}
              </p>

              {/* Goals (if Therapy) */}
              {rec.goalsAddressed && (
                <p>
                  <span className="label">Goals:</span> {rec.goalsAddressed.join(", ")}
                </p>
              )}

              <p>
                <span className="label">Participating Students:</span>{" "}
                {rec.participatingStudentsNames?.join(", ") || "—"}
              </p>
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
const StudentProfile = () => {
  const [currentLevel, setCurrentLevel] = useState("student-list");
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const [selectedService, setSelectedService] = useState("");
  const [studentActivities, setStudentActivities] = useState([]);

  // TEACHER/STAFF DATA
  const { teachers, loading: loadingTeachers } = useManageTeachers();

  // 1. FETCH STUDENTS
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await childService.getAllChildren();
        setStudents(data);
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  // 2. FETCH ACTIVITIES FOR SELECTED STUDENT
  const fetchStudentActivities = async (studentId) => {
    try {
      // Query 1: Where student is the main 'studentId' (e.g. 1:1 therapy)
      const q1 = query(
        collection(db, "activities"),
        where("studentId", "==", studentId)
      );
      
      // Query 2: Where student is in 'participatingStudentIds' (e.g. Group)
      const q2 = query(
        collection(db, "activities"),
        where("participatingStudentIds", "array-contains", studentId)
      );

      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      
      // Merge and deduplicate
      const mergedDocs = new Map();
      [...snap1.docs, ...snap2.docs].forEach(doc => {
        mergedDocs.set(doc.id, { id: doc.id, ...doc.data() });
      });

      const activities = Array.from(mergedDocs.values()).map(act => ({
        ...act,
        // Resolve student names for group activities
        participatingStudentsNames: act.participatingStudentIds 
          ? act.participatingStudentIds.map(id => {
              const s = students.find(st => st.id === id);
              return s ? `${s.firstName} ${s.lastName}` : "Unknown";
            }) 
          : [act.studentName]
      }));

      // Sort by date descending
      activities.sort((a, b) => new Date(b.date) - new Date(a.date));

      setStudentActivities(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      setStudentActivities([]);
    }
  };

  // Helper: Calculate Age
  const calculateAge = (dob) => {
    if (!dob) return "N/A";
    const birthDate = new Date(dob);
    const ageDifMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  // Helper: Get Unified Services List (Therapy + Group + Legacy)
  const getStudentServices = (student) => {
    if (!student) return [];
    const therapy = student.therapyServices || [];
    const group = student.groupClasses || [];
    const legacy = student.services || []; // Fallback for older data
    
    // Combine arrays
    return [...therapy, ...group, ...legacy];
  };

  const filteredStudents = students.filter((student) =>
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setCurrentLevel("student-profile");
    fetchStudentActivities(student.id);
    setSelectedService(""); // reset service selection
  };

  const goBack = () => {
    setSelectedService("");
    setSelectedStudent(null);
    setCurrentLevel("student-list");
    setStudentActivities([]);
  };

  if (loading || loadingTeachers) return <div>Loading...</div>;

  const currentStudentServices = getStudentServices(selectedStudent);

  return (
    <div className="ooo-container">
      <AdminSidebar />

      <div className="ooo-main">

        {/* STUDENT LIST */}
        {currentLevel === "student-list" && (
          <>
            <div className="ooo-header">
              <h1>STUDENT PROFILES</h1>
              <div className="search-wrapper">
                <input
                  type="text"
                  className="ooo-search"
                  placeholder="SEARCH NAME..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className="search-icon">🔍</span>
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <p style={{padding: '20px'}}>No students found.</p>
            ) : (
              <div className="ooo-grid">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="ooo-card"
                    onClick={() => handleSelectStudent(student)}
                  >
                    <div className="ooo-photo-area">
                      {student.photoUrl ? (
                        <img src={student.photoUrl} alt="" className="ooo-photo" />
                      ) : (
                        <span>📷</span>
                      )}
                    </div>
                    <div className="ooo-card-info">
                      <p className="ooo-name">{student.lastName}, {student.firstName}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* STUDENT PROFILE */}
        {currentLevel === "student-profile" && selectedStudent && (
          <div className="profile-wrapper">

            {/* TOP BAR */}
            <div className="profile-top">
              <div className="left-group">
                <span className="back-arrow" onClick={goBack}>←</span>
                <h2>STUDENT PROFILE</h2>
              </div>
            </div>

            <div className="profile-3col">

              {/* COLUMN 1 — PHOTO */}
              <div className="profile-photo-frame">
                {selectedStudent.photoUrl ? (
                  <img src={selectedStudent.photoUrl} alt="" className="profile-photo" />
                ) : (
                  <span>No Photo</span>
                )}
              </div>

              {/* COLUMN 2 — NAME + DETAILS */}
              <div className="profile-info">
                <h1 className="profile-fullname">
                  {selectedStudent.lastName}, {selectedStudent.firstName}
                </h1>

                <div className="profile-details">
                  <div className="profile-left">
                    {/* Note: Parent info isn't stored on child doc by default, 
                        would need to fetch parent user separately if needed. */}
                    <p><span className="icon">🏥</span> <b>Medical:</b> {selectedStudent.medicalInfo || "None"}</p>
                  </div>
                  <div className="profile-right">
                    <p><b>Age:</b> {calculateAge(selectedStudent.dateOfBirth)}</p>
                    <p><b>Gender:</b> {selectedStudent.gender || "N/A"}</p>
                    <p><b>Birthday:</b> {selectedStudent.dateOfBirth || "N/A"}</p>
                  </div>
                </div>

                {/* SERVICES HEADER */}
                <h2 className="services-header">SERVICES AVAILED</h2>

                <div className="services-list">
                  {currentStudentServices.length === 0 && <p>No services enrolled.</p>}
                  {currentStudentServices.map((service, i) => (
                    <div key={i} className="service-row">
                      <div className="service-left">
                        <span className="service-icon">🟡</span>
                        {service.serviceName}
                      </div>
                      <div>
                        {service.therapistName || service.teacherName || "—"}
                      </div>
                    </div>
                  ))}
                </div>

                {/* SELECT SERVICE TO VIEW RECORDS */}
                <div className="service-selector">
                  <label className="service-selector-header">Select a Service to view records: </label>
                  <select className="service-selector-choices"
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                   >
                      <option value="">-- Choose a service --</option>
                      {currentStudentServices.map((service, i) => (
                        <option key={i} value={service.serviceName}>
                          {service.serviceName}
                        </option>
                      ))}
                   </select>
                </div>

                {/* SELECTED SERVICE — DYNAMIC FILTERING */}
                <div className="selected-service-info">
                  {selectedService ? (
                    (() => {
                      // Filter activities by Service Name (works for both Therapy and Group)
                      const filteredActivities = studentActivities.filter(
                        (act) => 
                          (act.serviceType === selectedService) || 
                          (act.className === selectedService)
                      );

                      return filteredActivities.length > 0 ? (
                        <SelectedServiceInfo records={filteredActivities} teachers={teachers} />
                      ) : (
                        <p style={{marginTop: '15px', color: '#666'}}>No records found for {selectedService}.</p>
                      );
                    })()
                  ) : (
                    <p style={{marginTop: '15px', fontStyle: 'italic', color: '#888'}}>
                      Select a service above to view past sessions and activities.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="Profile-Footer"></div>
      </div>
    </div>
  );
};

export default StudentProfile;