import React, { useState, useEffect, useMemo, useRef } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import AdminSidebar from "../../components/sidebar/AdminSidebar";
import GeneralFooter from "../../components/footer/generalfooter";
import childService from "../../services/childService";
import activityService from "../../services/activityService";
import servicesService from "../../services/servicesService";
import useManageTeachers from "../../hooks/useManageTeachers";
import useManageTherapists from "../../hooks/useManageTherapists";
import { useLocation, useNavigate } from "react-router-dom";
import "./css/StudentProfile.css";

/* ================================================================
   CALENDAR & ACTIVITY VIEW COMPONENT
================================================================ */
const ActivityCalendarView = ({ activities, teachers, selectedServiceName }) => {
  const [date, setDate] = useState(new Date());

  // Reset date to today when switching services so you don't get lost
  useEffect(() => {
    setDate(new Date());
  }, [selectedServiceName]);

  const getActivitiesForDate = (selectedDate) => {
    return activities.filter((act) => {
      // Ensure we handle both Firestore timestamps and ISO strings
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
    const staff = teachers.find((t) => t.id === id || t.uid === id);
    return staff ? `${staff.firstName} ${staff.lastName}` : "—";
  };

  const getEmojiForMood = (mood) => {
    const map = {
      Happy: "😊",
      Focused: "🧐",
      Active: "⚡",
      Tired: "🥱",
      Upset: "😢",
      Social: "👋",
    };
    return map[mood] || "•";
  };

  return (
    <div className="calendar-view-container">
      <div className="day-details-section">
        <h3 className="date-heading">
          {date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </h3>

        {selectedActivities.length === 0 ? (
          <div className="no-activity-msg">
            <p>No activities recorded for this date.</p>
          </div>
        ) : (
          <div className="daily-records-list">
            {selectedActivities.map((rec, i) => {
              // Teacher Observations are saved as 'therapy_session' type now
              // but we can distinguish them by 'authorRole' or 'sessionType' if needed
              const isTherapy =
                rec.type === "therapy_session" ||
                rec._collection === "therapy_sessions";

              return (
                <div key={i} className="record-card">
                  <div className="record-header">
                    <span className="record-type">
                      {rec.serviceName || rec.serviceType || "Activity"}
                    </span>
                    {/* Optional: Show who wrote it */}
                    <span style={{ fontSize: "0.8rem", color: "#666" }}>
                      {new Date(rec.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p>
                    <span className="label">Staff:</span>{" "}
                    {rec.authorName ||
                      rec.teacherName ||
                      getTeacherName(rec.teacherId || rec.authorId)}
                  </p>

                  {/* MOOD / REACTION (Common to both) */}
                  {rec.studentReaction && rec.studentReaction.length > 0 && (
                    <div style={{ margin: "8px 0" }}>
                      {rec.studentReaction.map((m, idx) => (
                        <span key={idx} style={{ marginRight: "8px", background: "#f0f9ff", padding: "4px 8px", borderRadius: "12px", fontSize: "0.85rem" }}>
                          {getEmojiForMood(m)} {m}
                        </span>
                      ))}
                    </div>
                  )}

                  <p>
                    <span className="label">Title:</span> {rec.title || "—"}
                  </p>

                  {isTherapy ? (
                    <>
                      {/* Clinical / Observation Fields */}
                      {rec.sessionNotes && (
                        <p>
                          <span className="label">Notes:</span>{" "}
                          {rec.sessionNotes}
                        </p>
                      )}
                      
                      <div style={{ display: 'grid', gap: '8px', marginTop: '8px' }}>
                        {rec.strengths && (
                          <div style={{ background: '#f0fdf4', padding: '8px', borderRadius: '4px' }}>
                            <span style={{ color: '#166534', fontWeight: 'bold', fontSize: '0.9rem' }}>
                              💪 Strengths
                            </span>
                            <p style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>
                              {rec.strengths}
                            </p>
                          </div>
                        )}

                        {rec.weaknesses && (
                          <div style={{ background: '#fef2f2', padding: '8px', borderRadius: '4px' }}>
                            <span style={{ color: '#991b1b', fontWeight: 'bold', fontSize: '0.9rem' }}>
                              🔻 Improvements
                            </span>
                            <p style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>
                              {rec.weaknesses}
                            </p>
                          </div>
                        )}
                      </div>

                      {rec.homeActivities && (
                        <div style={{ marginTop: '8px' }}>
                          <span className="label">🏠 Home Plan:</span>{" "}
                          <span style={{ fontSize: '0.9rem' }}>{rec.homeActivities}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Generic / Legacy Activity Fields */
                    <>
                      <p>
                        <span className="label">Description:</span>{" "}
                        {rec.progressNotes || rec.description || "—"}
                      </p>
                      {rec.goalsAddressed && (
                        <p>
                          <span className="label">Goals:</span>{" "}
                          {rec.goalsAddressed.join(", ")}
                        </p>
                      )}
                    </>
                  )}

                  {rec.photoUrls && rec.photoUrls.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      {rec.photoUrls.map((url, imgIdx) => (
                        <img
                          className="activity-image-preview"
                          key={imgIdx}
                          src={url}
                          alt={`Activity ${imgIdx}`}
                          onClick={() => window.open(url, "_blank")}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="calendar-section">
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
  const activitiesFromOneOnOne = useMemo(
    () => passedState.activities || [],
    [passedState.activities]
  );
  const therapistsFromOneOnOne = passedState.therapists || [];
  const fromOneOnOne = passedState.fromOneOnOne || false;
  const selectedServiceFromOneOnOne = passedState.selectedService || null;

  const [currentLevel, setCurrentLevel] = useState(
    selectedStudentFromOneOnOne ? "student-profile" : "student-list"
  );
  const [selectedStudent, setSelectedStudent] = useState(
    selectedStudentFromOneOnOne || null
  );
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);

  const [selectedService, setSelectedService] = useState(
    fromOneOnOne && selectedServiceFromOneOnOne
      ? selectedServiceFromOneOnOne.name
      : ""
  );

  const [studentActivities, setStudentActivities] = useState([]);
  const calendarRef = useRef(null);

  // STAFF HOOKS
  const { teachers, loading: loadingTeachers } = useManageTeachers();
  const { therapists, loading: loadingTherapists } = useManageTherapists();

  // ADD SERVICE MODAL STATE
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addServiceType, setAddServiceType] = useState(null); 
  const [availableServices, setAvailableServices] = useState([]);
  const [addForm, setAddForm] = useState({ serviceId: "", staffId: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. FETCH STUDENTS
  const fetchStudents = async () => {
    try {
      const data = await childService.getAllChildren();
      setStudents(data);

      if (selectedStudent) {
        const updated = data.find((s) => s.id === selectedStudent.id);
        if (updated) setSelectedStudent(updated);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedStudentFromOneOnOne) {
      fetchStudents();
    } else {
      setLoading(false);
      setStudentActivities(activitiesFromOneOnOne);
    }
  }, [selectedStudentFromOneOnOne, activitiesFromOneOnOne]);

  // 2. FETCH ACTIVITIES
  const fetchStudentActivities = async (studentId) => {
    try {
      const activities = await activityService.getActivitiesByChild(studentId);
      const enhancedActivities = activities.map((act) => ({
        ...act,
        participatingStudentsNames: act.participatingStudentIds
          ? act.participatingStudentIds.map((id) => {
              const s = students.find((st) => st.id === id);
              return s ? `${s.firstName} ${s.lastName}` : "Unknown";
            })
          : [act.studentName],
      }));

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

  const filteredStudents = students.filter((student) => {
    const matchesSearch = `${student.firstName} ${student.lastName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    let matchesFilter = true;
    const hasTherapy =
      (student.enrolledServices?.some(s => s.type === 'Therapy')) ||
      (student.therapyServices?.length > 0) ||
      (student.services?.length > 0);

    const hasGroup =
      (student.enrolledServices?.some(s => s.type === 'Class')) ||
      (student.groupClasses?.length > 0) ||
      (student.classes?.length > 0); 

    if (filterType === "therapy") matchesFilter = hasTherapy;
    else if (filterType === "group") matchesFilter = hasGroup;
    else if (filterType === "none") matchesFilter = !hasTherapy && !hasGroup;

    return matchesSearch && matchesFilter;
  });

  const goBack = () => {
    if (fromOneOnOne && selectedServiceFromOneOnOne) {
      navigate("/admin/one-on-one", {
        state: { returnToService: selectedServiceFromOneOnOne, level: "students" },
      });
    } else {
      setCurrentLevel("student-list");
      setSelectedStudent(null);
      setSelectedService("");
    }
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setCurrentLevel("student-profile");
    fetchStudentActivities(student.id);
    setSelectedService("");
  };

  const handleServiceClick = (serviceName) => {
    setSelectedService(serviceName);
    setTimeout(() => {
      calendarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  // --- ADD SERVICE HANDLERS ---
  const handleOpenAddModal = async (type) => {
    setAddServiceType(type);
    setAddForm({ serviceId: "", staffId: "" });
    try {
      const services = await servicesService.getServicesByType(type);
      setAvailableServices(services);
      setIsAddModalOpen(true);
    } catch (error) {
      alert("Error loading services: " + error.message);
    }
  };

  const handleAddSubmit = async () => {
    if (!addForm.serviceId || !addForm.staffId) {
      alert("Please select both a service and a staff member.");
      return;
    }
    setIsSubmitting(true);

    try {
      const selectedServiceObj = availableServices.find(
        (s) => s.id === addForm.serviceId
      );

      // Unified Assign Call
      // We rely on childService.assignService which we fixed in previous steps
      // But we call the wrappers for safety if you still have them, or directly if not.
      // Here we assume standard structure.
      
      const assignData = {
        serviceId: selectedServiceObj.id,
        serviceName: selectedServiceObj.name,
        // Common fields
        staffId: addForm.staffId,
        staffName: '', // Will fill below
      };

      if (addServiceType === "Therapy") {
        const staff = therapists.find((t) => (t.uid || t.id) === addForm.staffId);
        if (!staff) throw new Error("Selected therapist not found.");
        assignData.staffName = `${staff.firstName} ${staff.lastName}`;
        assignData.type = 'Therapy';
        assignData.staffRole = 'therapist';
        
        // Use the new Unified method directly if available, or the wrapper
        await childService.assignTherapyService(selectedStudent.id, assignData);

      } else {
        const staff = teachers.find((t) => (t.uid || t.id) === addForm.staffId);
        if (!staff) throw new Error("Selected teacher not found.");
        assignData.staffName = `${staff.firstName} ${staff.lastName}`;
        assignData.type = 'Class';
        assignData.staffRole = 'teacher';

        await childService.assignGroupClass(selectedStudent.id, assignData);
      }

      await fetchStudents();
      setIsAddModalOpen(false);
      alert("Service added successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to add service: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || loadingTeachers) return <div className="loading-spinner">Loading...</div>;

  const studentToDisplay = selectedStudentFromOneOnOne || selectedStudent;
  const activitiesToDisplay = selectedStudentFromOneOnOne
    ? activitiesFromOneOnOne
    : studentActivities;

  const combinedStaff = [...(teachers || []), ...(therapists || [])];

  // MERGE ALL SERVICE SOURCES
  const allEnrolled = [
    ...(studentToDisplay?.enrolledServices || []),
    ...(studentToDisplay?.therapyServices || []),
    ...(studentToDisplay?.services || []),
    ...(studentToDisplay?.groupClasses || []),
    ...(studentToDisplay?.classes || [])
  ];

  // FILTER LISTS
  const therapyServices = allEnrolled.filter(s => 
    s.type === 'Therapy' || s.staffRole === 'therapist' || s.therapistId
  );
  
  const groupServices = allEnrolled.filter(s => 
    s.type === 'Class' || s.staffRole === 'teacher' || s.teacherId
  );

  return (
    <div className="sp-container">
      <AdminSidebar forceActive={fromOneOnOne ? "/admin/one-on-one" : null} />

      <div className="sp-main">
        <div className="sp-page">
          
          {/* --- VIEW 1: STUDENT LIST --- */}
          {currentLevel === "student-list" && (
            <>
              <div className="sp-header">
                <div className="header-title">
                  <h1>STUDENT PROFILES</h1>
                  <p className="header-subtitle">
                    Manage enrolled students and view activities
                  </p>
                </div>

                <div className="filter-actions">
                  <div className="search-wrapper">
                    <span className="search-icon">🔍</span>
                    <input
                      type="text"
                      className="sp-search"
                      placeholder="Search by name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="filter-wrapper">
                    <select
                      className="sp-filter-select"
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

              <div className="sp-content-area">
                {filteredStudents.length === 0 ? (
                  <div className="empty-state">
                    <p>No students found matching your criteria.</p>
                  </div>
                ) : (
                  <div className="sp-grid">
                    {filteredStudents.map((student) => {
                      const hasTherapy =
                        (student.enrolledServices?.some(s => s.type === 'Therapy')) ||
                        (student.therapyServices?.length > 0) ||
                        (student.services?.length > 0);

                      const hasGroup =
                        (student.enrolledServices?.some(s => s.type === 'Class')) ||
                        (student.groupClasses?.length > 0) ||
                        (student.classes?.length > 0);

                      return (
                        <div
                          key={student.id}
                          className="sp-card"
                          onClick={() => handleSelectStudent(student)}
                        >
                          <div className="sp-card-image-box">
                            {student.photoUrl ? (
                              <img src={student.photoUrl} alt="" className="sp-photo" />
                            ) : (
                              <div className="sp-photo-placeholder">
                                {student.firstName[0]}
                              </div>
                            )}
                          </div>

                          <div className="sp-card-body">
                            <h3 className="sp-name">
                              {student.firstName} {student.lastName}
                            </h3>

                            <div className="sp-badges">
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
                  {/* --- THERAPY SECTION --- */}
                  <div className="content-section">
                    <div>
                      <h2 className="services-header">THERAPY SERVICES</h2>
                      <button onClick={() => handleOpenAddModal("Therapy")}>+ Add</button>
                    </div>

                    <div className="services-list">
                      {therapyServices.length === 0 && <p>No therapy services enrolled.</p>}

                      {therapyServices.map((service, i) => {
                        // ✅ FIX: Prioritize serviceName, match Teacher Dashboard logic
                        const sName = service.serviceName || service.className;
                        const isSelected = selectedService === sName;
                        const displayName = service.staffName || service.therapistName || service.teacherName || "—";

                        return (
                          <div
                            key={i}
                            className={`service-row clickable ${isSelected ? "active" : ""}`}
                            onClick={() => handleServiceClick(sName)}
                          >
                            <div className="service-left">
                              <span className="service-icon">🧠</span>{sName}
                            </div>
                            <div>
                              <span className="teacher-name">{displayName}</span>
                              {isSelected && <span className="selected-check">✔</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* --- GROUP CLASS SECTION --- */}
                  <div className="content-section">
                    <div>
                      <h2 className="services-header">GROUP CLASS SERVICES</h2>
                      <button onClick={() => handleOpenAddModal("Class")}>+ Add</button>
                    </div>
                    <div className="services-list">
                      {groupServices.length === 0 && <p>No group classes enrolled.</p>}

                      {groupServices.map((service, i) => {
                        // ✅ FIX: Prioritize serviceName here too!
                        const sName = service.serviceName || service.className;
                        const isSelected = selectedService === sName;
                        const displayName = service.staffName || service.teacherName || "—";

                        return (
                          <div
                            key={i}
                            className={`service-row clickable ${isSelected ? "active" : ""}`}
                            onClick={() => handleServiceClick(sName)}
                          >
                            <div className="service-left">
                              <span className="service-icon">👥</span>{sName}
                            </div>
                            <div>
                              <span className="teacher-name">{displayName}</span>
                              {isSelected && <span className="selected-check">✔</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {selectedService && (
                  <div ref={calendarRef}>
                    <ActivityCalendarView
                      // ✅ FIX: Check multiple fields in case "Post Group Activity" saves it differently
                      activities={activitiesToDisplay.filter((a) => 
                        a.serviceName === selectedService || 
                        a.className === selectedService || 
                        a.serviceType === selectedService
                      )}
                      teachers={combinedStaff}
                      selectedServiceName={selectedService}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <GeneralFooter pageLabel="Student Profile" />
        </div>
      </div>

      {/* --- ADD SERVICE MODAL --- */}
      {isAddModalOpen && (
        <div className="add-service-overlay">
          <div className="add-service-modal">
            <h3 className="modal-title">
              {addServiceType === "Therapy" ? "🧠" : "👥"} Enroll in {addServiceType}
            </h3>
            <p className="modal-subtitle">Select a service and assign a staff member.</p>

            <div className="modal-form-body">
              <div className="form-group">
                <label>Select Service</label>
                <div className="select-wrapper">
                  <select
                    className="modal-select"
                    value={addForm.serviceId}
                    onChange={(e) => setAddForm({ ...addForm, serviceId: e.target.value })}
                  >
                    <option value="">-- Choose Service --</option>
                    {availableServices.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.className ? `(${s.className})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Assign {addServiceType === "Therapy" ? "Therapist" : "Teacher"}</label>
                <div className="select-wrapper">
                  <select
                    className="modal-select"
                    value={addForm.staffId}
                    onChange={(e) => setAddForm({ ...addForm, staffId: e.target.value })}
                  >
                    <option value="">-- Choose Staff --</option>
                    {(addServiceType === "Therapy" ? therapists : teachers).map((staff) => (
                      <option key={staff.uid || staff.id} value={staff.uid || staff.id}>
                        {staff.firstName} {staff.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
              <button className="btn-confirm" onClick={handleAddSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Confirm Enrollment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfile;