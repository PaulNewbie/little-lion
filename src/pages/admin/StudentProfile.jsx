import React, { useState, useEffect, useMemo } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import AdminSidebar from "../../components/sidebar/AdminSidebar";
import childService from "../../services/childService";
import activityService from "../../services/activityService"; // Import the unified service
import useManageTeachers from "../../hooks/useManageTeachers";
import { useLocation, useNavigate } from "react-router-dom";
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

  // Helper for Mood Emojis
  const getEmojiForMood = (mood) => {
    const map = { 'Happy': '😊', 'Focused': '🧐', 'Active': '⚡', 'Tired': '🥱', 'Upset': '😢', 'Social': '👋' };
    return map[mood] || '•';
  };

  return (
    <div className="calendar-view-container" style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
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
            {selectedActivities.map((rec, i) => {
              const isTherapy = rec.type === 'therapy_session' || rec._collection === 'therapy_sessions';
              
              return (
                <div key={i} className="record-card" style={{ borderLeft: isTherapy ? '4px solid #4a90e2' : '4px solid #2ecc71' }}>
                  <div className="record-header">
                    <span className="record-type" style={{ color: isTherapy ? '#0d47a1' : '#1b5e20' }}>
                      {rec.serviceName || rec.serviceType || "Activity"}
                    </span>
                  </div>

                  <p>
                    <span className="label">Staff:</span>{" "}
                    {rec.authorName || rec.teacherName || getTeacherName(rec.teacherId || rec.authorId)}
                  </p>
                  
                  {/* --- NEW: MOOD SECTION --- */}
                  {rec.studentReaction && rec.studentReaction.length > 0 && (
                    <div style={{ margin: '8px 0' }}>
                       {rec.studentReaction.map((m, idx) => (
                         <span key={idx} style={{ marginRight: '5px', fontSize: '12px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                           {getEmojiForMood(m)} {m}
                         </span>
                       ))}
                    </div>
                  )}

                  <p>
                    <span className="label">Title:</span> {rec.title || "—"}
                  </p>

                  {/* --- CONDITIONAL DISPLAY BASED ON TYPE --- */}
                  {isTherapy ? (
                    <>
                      {/* Clinical Notes */}
                      {rec.sessionNotes && <p><span className="label">Notes:</span> {rec.sessionNotes}</p>}
                      
                      {/* Observations */}
                      <div style={{ marginTop: '10px', display: 'grid', gap: '10px' }}>
                        {rec.strengths && (
                          <div style={{ background: '#f0fdf4', padding: '8px', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                            <span style={{ color: '#166534', fontWeight: 'bold', fontSize: '12px' }}>💪 Strengths:</span>
                            <p style={{ margin: '4px 0 0', fontSize: '13px' }}>{rec.strengths}</p>
                          </div>
                        )}
                        {rec.weaknesses && (
                          <div style={{ background: '#fef2f2', padding: '8px', borderRadius: '4px', border: '1px solid #fecaca' }}>
                            <span style={{ color: '#991b1b', fontWeight: 'bold', fontSize: '12px' }}>🔻 Improvements:</span>
                            <p style={{ margin: '4px 0 0', fontSize: '13px' }}>{rec.weaknesses}</p>
                          </div>
                        )}
                      </div>

                      {/* Home Plan */}
                      {rec.homeActivities && (
                        <div style={{ marginTop: '10px', fontStyle: 'italic', color: '#555' }}>
                          <span className="label">🏠 Home Plan:</span> {rec.homeActivities}
                        </div>
                      )}
                    </>
                  ) : (
                    // Legacy / Group Activity Display
                    <>
                      <p>
                        <span className="label">Description:</span>{" "}
                        {rec.progressNotes || rec.description || "—"}
                      </p>
                      {rec.goalsAddressed && (
                        <p><span className="label">Goals:</span> {rec.goalsAddressed.join(", ")}</p>
                      )}
                    </>
                  )}

                  <p style={{ marginTop: '10px' }}>
                    <span className="label">Students:</span>{" "}
                    {rec.participatingStudentsNames?.join(", ") || "—"}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
  const location = useLocation();
  const navigate = useNavigate();
  const passedState = location.state || {};
  const selectedStudentFromOneOnOne = passedState.student || null;
  const activitiesFromOneOnOne = useMemo(() => passedState.activities || [], [passedState.activities]);
  const therapistsFromOneOnOne = passedState.therapists || [];
  const fromOneOnOne = passedState.fromOneOnOne || false;

  const [currentLevel, setCurrentLevel] = useState(
    selectedStudentFromOneOnOne ? "student-profile" : "student-list"
  );
  const [selectedStudent, setSelectedStudent] = useState(selectedStudentFromOneOnOne || null);
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(
    fromOneOnOne && passedState.selectedService ? passedState.selectedService.name : ""
  );
  const [studentActivities, setStudentActivities] = useState([]);

  const { teachers, loading: loadingTeachers } = useManageTeachers();

  // 1. FETCH STUDENTS
  useEffect(() => {
    if (!selectedStudentFromOneOnOne) {
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
    } else {
      setLoading(false);
      setStudentActivities(activitiesFromOneOnOne);
    }
  }, [selectedStudentFromOneOnOne, activitiesFromOneOnOne]);

  // 2. FETCH ACTIVITIES (UPDATED: Uses activityService for Unified View)
  const fetchStudentActivities = async (studentId) => {
    try {
      // Use the new service that fetches from BOTH collections
      const activities = await activityService.getActivitiesByChild(studentId);

      // Enhance with Student Names (for participating lists)
      const enhancedActivities = activities.map(act => ({
        ...act,
        participatingStudentsNames: act.participatingStudentIds
          ? act.participatingStudentIds.map(id => {
              const s = students.find(st => st.id === id);
              return s ? `${s.firstName} ${s.lastName}` : "Unknown";
            })
          : [act.studentName]
      }));

      // Service already sorts by date, but just to be safe
      enhancedActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
      setStudentActivities(enhancedActivities);
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
    const matchesSearch = `${student.firstName} ${student.lastName}`.toLowerCase()
      .includes(searchTerm.toLowerCase());

    let matchesFilter = true;
    const hasTherapy = (student.therapyServices && student.therapyServices.length > 0) || (student.services && student.services.length > 0);
    const hasGroup = student.groupClasses && student.groupClasses.length > 0;

    if (filterType === "therapy") matchesFilter = hasTherapy;
    else if (filterType === "group") matchesFilter = hasGroup;
    else if (filterType === "none") matchesFilter = !hasTherapy && !hasGroup;

    return matchesSearch && matchesFilter;
  });

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setCurrentLevel("student-profile");
    fetchStudentActivities(student.id);
    setSelectedService("");
  };

  const goBack = () => {
    if (fromOneOnOne) {
      navigate(-1); 
    } else {
      setSelectedService("");
      setSelectedStudent(null);
      setCurrentLevel("student-list");
      setStudentActivities([]);
    }
  };

  if (loading || loadingTeachers) return <div>Loading...</div>;

  const studentToDisplay = selectedStudentFromOneOnOne || selectedStudent;
  const activitiesToDisplay = selectedStudentFromOneOnOne ? activitiesFromOneOnOne : studentActivities;
  const therapistsToUse = selectedStudentFromOneOnOne ? therapistsFromOneOnOne : teachers;

  const therapyServices = studentToDisplay?.therapyServices || [];
  const groupServices = studentToDisplay?.groupClasses || [];
  const legacyServices = studentToDisplay?.services || [];

  return (
    <div className="ooo-container">
      {/* Pass forceActive to sidebar if fromOneOnOne */}
      <AdminSidebar forceActive={fromOneOnOne ? "/admin/one-on-one" : null} />

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
                        <div className="ooo-card-image-box">
                          {student.photoUrl ? (
                            <img src={student.photoUrl} alt="" className="ooo-photo" />
                          ) : (
                            <div className="ooo-photo-placeholder">{student.firstName[0]}</div>
                          )}
                        </div>

                        <div className="ooo-card-body">
                          <h3 className="ooo-name">{student.firstName} {student.lastName}</h3>
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
        {currentLevel === "student-profile" && studentToDisplay && (
          <div className="profile-wrapper">
            <div className="profile-top">
              <div className="left-group">
                <span className="back-arrow" onClick={goBack}>‹</span>
                <h2>STUDENT PROFILE</h2>
              </div>
            </div>

            <div className="profile-3col">
              <div className="profile-photo-frame">
                {studentToDisplay.photoUrl ? (
                  <img src={studentToDisplay.photoUrl} alt="" className="profile-photo" />
                ) : (
                  <span>No Photo</span>
                )}
              </div>

              <div className="profile-info">
                <h1 className="profile-fullname">
                  {studentToDisplay.lastName}, {studentToDisplay.firstName}
                </h1>
                <div className="profile-details">
                  <div className="profile-left">
                    <p><span className="icon">🏥</span> <b>Medical:</b> {studentToDisplay.medicalInfo || "None"}</p>
                  </div>
                  <div className="profile-right">
                    <p><b>Age:</b> {calculateAge(studentToDisplay.dateOfBirth)}</p>
                    <p><b>Gender:</b> {studentToDisplay.gender || "N/A"}</p>
                    <p><b>Birthday:</b> {studentToDisplay.dateOfBirth || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="profile-content-scroll">
              <div className="services-split-row">
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
                            <span className="service-icon">👥</span>
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

              {selectedService && (
                <ActivityCalendarView
                  activities={activitiesToDisplay.filter(a => a.serviceName === selectedService)}
                  teachers={therapistsToUse}
                  selectedServiceName={selectedService}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProfile;
