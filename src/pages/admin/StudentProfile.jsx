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

  useEffect(() => {
    setDate(new Date());
  }, [selectedServiceName]);
  
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
    // Added display: flex to ensure side-by-side layout works with sizing logic
    <div className="calendar-view-container" style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
      
      {/* LEFT: ACTIVITY DETAILS (Expanded Space) */}
      <div className="day-details-section" style={{ flex: 1 }}> 
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

      {/* RIGHT: CALENDAR (Fixed Compact Width) */}
      {/* We use flexShrink: 0 and width: 350px to keep it from stretching */}
      <div className="calendar-section" style={{ width: "350px", flexShrink: 0 }}>
        <Calendar 
          onChange={setDate} 
          value={date} 
          tileContent={tileContent}
          className="custom-calendar"
        />
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
  const [filterType, setFilterType] = useState("all"); 
  const [loading, setLoading] = useState(true);
  
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
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    return isNaN(age) ? "N/A" : age;
  };

  // FILTER LOGIC
  const filteredStudents = students.filter((student) => {
    const matchesSearch = `${student.firstName} ${student.lastName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    
    let matchesFilter = true;
    const hasTherapy = (student.therapyServices && student.therapyServices.length > 0) || (student.services && student.services.length > 0);
    const hasGroup = student.groupClasses && student.groupClasses.length > 0;

    if (filterType === "therapy") {
      matchesFilter = hasTherapy;
    } else if (filterType === "group") {
      matchesFilter = hasGroup;
    } else if (filterType === "none") {
      matchesFilter = !hasTherapy && !hasGroup;
    }
    
    return matchesSearch && matchesFilter;
  });

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

  const therapyServices = selectedStudent?.therapyServices || [];
  const groupServices = selectedStudent?.groupClasses || [];
  const legacyServices = selectedStudent?.services || [];

  return (
    <div className="ooo-container">
      <AdminSidebar />

      <div className="ooo-main">

        {/* --- VIEW 1: STUDENT LIST --- */}
        {currentLevel === "student-list" && (
          <>
            <div className="ooo-header">
              <div className="header-title">
                <h1>STUDENT PROFILES</h1>
                <p className="header-subtitle">Manage enrolled students and view activities</p>
              </div>
              
              <div className="filter-actions">
                <div className="search-wrapper">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    className="ooo-search"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="filter-wrapper">
                  <select 
                    className="ooo-filter-select"
                    value={filterType} 
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="all">All Students</option>
                    <option value="therapy">Therapy Services</option>
                    <option value="group">Group Classes</option>
                    <option value="none">No Enrolled Services</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="ooo-content-area">
              {filteredStudents.length === 0 ? (
                <div className="empty-state">
                  <p>No students found matching your criteria.</p>
                </div>
              ) : (
                <div className="ooo-grid">
                  {filteredStudents.map((student) => {
                     const hasTherapy = (student.therapyServices?.length > 0) || (student.services?.length > 0);
                     const hasGroup = student.groupClasses?.length > 0;

                     return (
                      <div
                        key={student.id}
                        className="ooo-card"
                        onClick={() => handleSelectStudent(student)}
                      >
                        {/* --- NAME TAG IMAGE BOX --- */}
                        <div className="ooo-card-image-box">
                          {student.photoUrl ? (
                            <img src={student.photoUrl} alt="" className="ooo-photo" />
                          ) : (
                            <div className="ooo-photo-placeholder">{student.firstName[0]}</div>
                          )}
                        </div>

                        {/* --- INFO BELOW --- */}
                        <div className="ooo-card-body">
                          <h3 className="ooo-name">{student.firstName} {student.lastName}</h3>
                          {/* Age removed */}
                          
                          <div className="ooo-badges">
                            {hasTherapy && <span className="badge badge-therapy">Therapy</span>}
                            {hasGroup && <span className="badge badge-group">Group</span>}
                            {!hasTherapy && !hasGroup && <span className="badge badge-none">New</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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
              
              <div className="services-split-row">
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
              </div>

              {/* --- SECTION C: ACTIVITY TRACKER (CALENDAR) --- */}
              <div className="content-section" style={{marginTop: '20px'}}>
                <h2 className="services-header">
                  ACTIVITY TRACKER 
                  {selectedService && <span className="tracker-subtitle"> — {selectedService}</span>}
                </h2>

                <div className="selected-service-info">
                  {selectedService ? (
                    (() => {
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