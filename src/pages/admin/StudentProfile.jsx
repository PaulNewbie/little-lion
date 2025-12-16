import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import AdminSidebar from "../../components/sidebar/AdminSidebar";
import childService from "../../services/childService";
import { db } from "../../config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import useManageTeachers from "../../hooks/useManageTeachers";
import "./css/StudentProfile.css";

/* ================================================================
   CALENDAR & ACTIVITY VIEW COMPONENT
================================================================ */
const ActivityCalendarView = ({ activities, teachers, selectedServiceName }) => {
  const [date, setDate] = useState(new Date());

  // Reset date when switching services
  useEffect(() => {
    setDate(new Date());
  }, [selectedServiceName]);
  
  // Helper: Get activities for the selected date
  const getActivitiesForDate = (selectedDate) => {
    return activities.filter(act => {
      const actDate = new Date(act.date);
      return (
        actDate.getDate() === selectedDate.getDate() &&
        actDate.getMonth() === selectedDate.getMonth() &&
        actDate.getFullYear() === selectedDate.getFullYear()
      );
    });
  };

  const selectedActivities = getActivitiesForDate(date);

  // Helper: Add dots to calendar tiles that have activities
  const tileContent = ({ date, view }) => {
    if (view === "month") {
      const hasActivity = getActivitiesForDate(date).length > 0;
      return hasActivity ? <div className="calendar-dot"></div> : null;
    }
    return null;
  };

  const getTeacherName = (id) => {
    const staff = teachers.find(t => t.id === id || t.uid === id);
    return staff ? `${staff.firstName} ${staff.lastName}` : "—";
  };

  return (
    <div className="calendar-view-container">
      {/* LEFT: CALENDAR */}
      <div className="calendar-section">
        <Calendar 
          onChange={setDate} 
          value={date} 
          tileContent={tileContent}
          className="custom-calendar"
        />
      </div>

      {/* RIGHT: ACTIVITY DETAILS */}
      <div className="day-details-section">
        <h3 className="date-heading">
          {date.toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric' })}
        </h3>

        {selectedActivities.length === 0 ? (
          <div className="no-activity-msg">
            <p>No activities recorded for this date.</p>
          </div>
        ) : (
          <div className="daily-records-list">
            {selectedActivities.map((rec, i) => (
              <div key={i} className="record-card">
                <div className="record-header">
                  <span className="record-type">{rec.serviceType || "Activity"}</span>
                </div>
                
                <p>
                  <span className="label">Staff:</span>{" "}
                  {rec.authorName || rec.teacherName || getTeacherName(rec.teacherId || rec.authorId)}
                </p>
                <p>
                  <span className="label">Title:</span> {rec.title || "—"}
                </p>
                <p>
                  <span className="label">Notes:</span>{" "}
                  {rec.progressNotes || rec.description || "—"}
                </p>
                
                {rec.goalsAddressed && (
                  <p><span className="label">Goals:</span> {rec.goalsAddressed.join(", ")}</p>
                )}
                
                <p>
                  <span className="label">Students:</span>{" "}
                  {rec.participatingStudentsNames?.join(", ") || "—"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
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
  
  // Track selected service by name for filtering
  const [selectedService, setSelectedService] = useState("");
  const [studentActivities, setStudentActivities] = useState([]);

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

  // 2. FETCH ACTIVITIES
  const fetchStudentActivities = async (studentId) => {
    try {
      const q1 = query(collection(db, "activities"), where("studentId", "==", studentId));
      const q2 = query(collection(db, "activities"), where("participatingStudentIds", "array-contains", studentId));

      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      
      const mergedDocs = new Map();
      [...snap1.docs, ...snap2.docs].forEach(doc => {
        mergedDocs.set(doc.id, { id: doc.id, ...doc.data() });
      });

      const activities = Array.from(mergedDocs.values()).map(act => ({
        ...act,
        participatingStudentsNames: act.participatingStudentIds 
          ? act.participatingStudentIds.map(id => {
              const s = students.find(st => st.id === id);
              return s ? `${s.firstName} ${s.lastName}` : "Unknown";
            }) 
          : [act.studentName]
      }));

      // Sort recent first
      activities.sort((a, b) => new Date(b.date) - new Date(a.date));
      setStudentActivities(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      setStudentActivities([]);
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return "N/A";
    const birthDate = new Date(dob);
    const ageDifMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const filteredStudents = students.filter((student) =>
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setCurrentLevel("student-profile");
    fetchStudentActivities(student.id);
    setSelectedService(""); 
  };

  const goBack = () => {
    setSelectedService("");
    setSelectedStudent(null);
    setCurrentLevel("student-list");
    setStudentActivities([]);
  };

  if (loading || loadingTeachers) return <div>Loading...</div>;

  // Split services for display
  const therapyServices = selectedStudent?.therapyServices || [];
  const groupServices = selectedStudent?.groupClasses || [];
  
  // Legacy services fallback (optional, if you want to show them)
  const legacyServices = selectedStudent?.services || [];

  return (
    <div className="ooo-container">
      <AdminSidebar />

      <div className="ooo-main">

        {/* --- VIEW 1: STUDENT LIST --- */}
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

        {/* --- VIEW 2: INDIVIDUAL PROFILE --- */}
        {currentLevel === "student-profile" && selectedStudent && (
          <div className="profile-wrapper">
            
            {/* 1. TOP NAV */}
            <div className="profile-top">
              <div className="left-group">
                <span className="back-arrow" onClick={goBack}>←</span>
                <h2>STUDENT PROFILE</h2>
              </div>
            </div>

            {/* 2. PROFILE INFO CARD */}
            <div className="profile-3col">
              <div className="profile-photo-frame">
                {selectedStudent.photoUrl ? (
                  <img src={selectedStudent.photoUrl} alt="" className="profile-photo" />
                ) : (
                  <span>No Photo</span>
                )}
              </div>

              <div className="profile-info">
                <h1 className="profile-fullname">
                  {selectedStudent.lastName}, {selectedStudent.firstName}
                </h1>
                <div className="profile-details">
                  <div className="profile-left">
                    <p><span className="icon">🏥</span> <b>Medical:</b> {selectedStudent.medicalInfo || "None"}</p>
                  </div>
                  <div className="profile-right">
                    <p><b>Age:</b> {calculateAge(selectedStudent.dateOfBirth)}</p>
                    <p><b>Gender:</b> {selectedStudent.gender || "N/A"}</p>
                    <p><b>Birthday:</b> {selectedStudent.dateOfBirth || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. SCROLLABLE SECTIONS */}
            <div className="profile-content-scroll">
              
              {/* --- SECTION A: THERAPY SERVICES --- */}
              <div className="content-section">
                <h2 className="services-header">THERAPY SERVICES</h2>
                <div className="services-list">
                  {therapyServices.length === 0 && legacyServices.length === 0 && (
                    <p style={{color:'#888', fontStyle:'italic'}}>No therapy services enrolled.</p>
                  )}
                  {[...therapyServices, ...legacyServices].map((service, i) => {
                    const sName = service.serviceName;
                    const isSelected = selectedService === sName;
                    
                    return (
                      <div 
                        key={i} 
                        className={`service-row clickable ${isSelected ? "active" : ""}`}
                        onClick={() => setSelectedService(sName)}
                      >
                        <div className="service-left">
                          <span className="service-icon">🧠</span>
                          {sName}
                        </div>
                        <div>
                          <span className="teacher-name">
                            {service.therapistName || service.teacherName || "—"}
                          </span>
                          {isSelected && <span className="selected-check">✔</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* --- SECTION B: GROUP CLASSES --- */}
              <div className="content-section">
                <h2 className="services-header">GROUP CLASS SERVICES</h2>
                <div className="services-list">
                  {groupServices.length === 0 && (
                    <p style={{color:'#888', fontStyle:'italic'}}>No group classes enrolled.</p>
                  )}
                  {groupServices.map((service, i) => {
                    // Sometimes group classes use 'className' or 'serviceName'
                    const sName = service.className || service.serviceName;
                    const isSelected = selectedService === sName;

                    return (
                      <div 
                        key={i} 
                        className={`service-row clickable ${isSelected ? "active" : ""}`}
                        onClick={() => setSelectedService(sName)}
                      >
                        <div className="service-left">
                          <span className="service-icon">🎨</span>
                          {sName}
                        </div>
                        <div>
                          <span className="teacher-name">
                            {service.teacherName || "—"}
                          </span>
                          {isSelected && <span className="selected-check">✔</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* --- SECTION C: ACTIVITY TRACKER (CALENDAR) --- */}
              <div className="content-section" style={{marginTop: '40px'}}>
                <h2 className="services-header">
                  ACTIVITY TRACKER 
                  {selectedService && <span className="tracker-subtitle"> — {selectedService}</span>}
                </h2>

                <div className="selected-service-info">
                  {selectedService ? (
                    (() => {
                      // Filter activities by the clicked service
                      const filteredActivities = studentActivities.filter(
                        (act) => 
                          (act.serviceType === selectedService) || 
                          (act.className === selectedService) ||
                          (act.title === selectedService)
                      );

                      return (
                        <ActivityCalendarView 
                          activities={filteredActivities} 
                          teachers={teachers} 
                          selectedServiceName={selectedService}
                        />
                      );
                    })()
                  ) : (
                    <div className="empty-calendar-placeholder">
                      <p>Select a service from the lists above to view its activity calendar.</p>
                    </div>
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