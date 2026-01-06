import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AdminSidebar from "../../../components/sidebar/AdminSidebar";
import GeneralFooter from "../../../components/footer/generalfooter";
import childService from "../../../services/childService";
import offeringsService from "../../../services/offeringsService";
import userService from "../../../services/userService";
import useManageTeachers from "../../../hooks/useManageTeachers";
import useManageTherapists from "../../../hooks/useManageTherapists";
import { useStudentProfileData } from "./hooks/useStudentProfileData";
import AssessmentHistory from "../../shared/AssessmentHistory";
import ActivityCalendar from "./components/ActivityCalendar";
import Loading from "../../../components/common/Loading";
import "./StudentProfile.css";

const StudentProfile = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const studentIdFromEnrollment = location.state?.studentId;
  const fromEnrollment = location.state?.fromEnrollment;
  const parentFromEnrollment = location.state?.parent;

  // 1. THE CUSTOM HOOK
  const {
    loading,
    selectedStudent,
    setSelectedStudent,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    filteredStudents,
    studentActivities,
    refreshData,
    parentData,
    assessmentData,
    isAssessmentLoading,
  } = useStudentProfileData(location.state);

  // 2. UI State
  const [viewMode, setViewMode] = useState(
    selectedStudent ? "profile" : "list"
  );
  const [selectedService, setSelectedService] = useState("");
  const [showAssessment, setShowAssessment] = useState(false);
  const calendarRef = useRef(null);

  useEffect(() => {
    if (studentIdFromEnrollment && selectedStudent) {
      setViewMode("profile");
    }
  }, [studentIdFromEnrollment, selectedStudent]);

  // 3. Staff Data
  const { teachers } = useManageTeachers();
  const { therapists } = useManageTherapists();
  const combinedStaff = [...(teachers || []), ...(therapists || [])];

  // 4. Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addServiceType, setAddServiceType] = useState(null);
  const [availableServices, setAvailableServices] = useState([]);
  const [addForm, setAddForm] = useState({ serviceId: "", staffId: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Handlers ---
  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    // fetchStudentActivities(student.id); // ❌ REMOVED: React Query handles this now
    setViewMode("profile");
    setShowAssessment(false);
    setSelectedService("");
  };

  const handleBack = () => {
    if (location.state?.fromOneOnOne) {
      navigate("/admin/one-on-one", {
        state: { ...location.state, level: "students" },
      });
    } else if (fromEnrollment) {
      navigate("/admin/enrollment", {
        state: {
          selectedParent: parentFromEnrollment,
        },
      });
    } else {
      setSelectedStudent(null);
      setViewMode("list");
    }
  };

  const handleServiceClick = (serviceName) => {
    setSelectedService(serviceName);
    setTimeout(() => {
      calendarRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const handleOpenAddModal = async (type) => {
    setAddServiceType(type);
    setAddForm({ serviceId: "", staffId: "" });
    try {
      const services = await offeringsService.getServicesByType(type);

      // Only use interventions from the assessment data
      const interventionsFromAssessment =
        assessmentData?.backgroundHistory?.interventions || [];

      const savedServiceIds = [
        ...new Set(
          interventionsFromAssessment.map((i) => i.serviceId).filter(Boolean)
        ),
      ];

      // Exclude services that are already enrolled on this child
      const enrolledServiceIds = new Set(
        (selectedStudent?.enrolledServices || []).map((es) => es.serviceId)
      );

      const filteredServices = services.filter(
        (s) => savedServiceIds.includes(s.id) && !enrolledServiceIds.has(s.id)
      );

      if (filteredServices.length === 0) {
        setAvailableServices([]);
        // Notify admin in case there are no matching services
        alert(
          "No services match the student's recorded interventions. Please review Step IV - Background History."
        );
      } else {
        setAvailableServices(filteredServices);
      }

      setIsAddModalOpen(true);
    } catch (error) {
      alert("Error loading services: " + error.message);
    }
  };

  const handleAddSubmit = async () => {
    if (!addForm.serviceId || !addForm.staffId)
      return alert("Select service and staff.");
    setIsSubmitting(true);
    try {
      const serviceObj = availableServices.find(
        (s) => s.id === addForm.serviceId
      );
      const isTherapy = addServiceType === "Therapy";
      const staffList = isTherapy ? therapists : teachers;

      // Fix Key Warning: Use uid OR id
      const staffObj = staffList.find(
        (s) => (s.uid || s.id) === addForm.staffId
      );

      const assignData = {
        serviceId: serviceObj.id,
        serviceName: serviceObj.name,
        staffId: addForm.staffId,
        staffName: `${staffObj.firstName} ${staffObj.lastName}`,
        type: addServiceType,
        staffRole: isTherapy ? "therapist" : "teacher",
      };

      // 1. Assign to Student
      await childService.assignService(selectedStudent.id, assignData);

      // ✅ 2. UPDATE STAFF SPECIALIZATION (The Fix)
      // This ensures the staff member "learns" this skill in the database
      await userService.addSpecialization(addForm.staffId, serviceObj.name);

      await refreshData();
      setIsAddModalOpen(false);
      alert("Service added and Staff updated!");
    } catch (err) {
      alert("Failed: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading)
    return <div className="loading-spinner">Loading Student Data...</div>;

  const calculateAge = (dob) => {
    if (!dob) return "N/A";
    const age = Math.abs(
      new Date(Date.now() - new Date(dob).getTime()).getUTCFullYear() - 1970
    );
    return isNaN(age) ? "N/A" : age;
  };

  const enrolled = [
    ...(selectedStudent?.enrolledServices || []),
    ...(selectedStudent?.therapyServices || []),
    ...(selectedStudent?.groupClasses || []),
  ];
  const therapyServices = enrolled.filter(
    (s) => s.type === "Therapy" || s.staffRole === "therapist"
  );
  const groupServices = enrolled.filter(
    (s) => s.type === "Class" || s.staffRole === "teacher"
  );

  const getQualifiedStaff = (serviceName, serviceType) => {
    if (!serviceName || !serviceType) return [];

    const staffList = serviceType === "Therapy" ? therapists : teachers;

    return staffList.filter((staff) =>
      staff.specializations?.some(
        (spec) => spec.trim().toLowerCase() === serviceName.trim().toLowerCase()
      )
    );
  };

  return (
    <div className="sp-container">
      <AdminSidebar />
      <div className="sp-main">
        <div className="sp-page">
          {/* === VIEW 1: LIST === */}
          {viewMode === "list" && (
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
                      <option value="therapy">Therapy Only</option>
                      <option value="group">Group Class Only</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="sp-content-area">
                <div className="sp-grid">
                  {filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      className="sp-card"
                      onClick={() => handleSelectStudent(student)}
                    >
                      <div className="sp-card-image-box">
                        {student.photoUrl ? (
                          <img
                            src={student.photoUrl}
                            className="sp-photo"
                            alt=""
                          />
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
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* === VIEW 2: PROFILE === */}
          {viewMode === "profile" && selectedStudent && (
            <div className="profile-wrapper">
              <div className="profile-top">
                <div className="left-group">
                  <span className="back-arrow" onClick={handleBack}>
                    ‹
                  </span>
                  <h2>STUDENT PROFILE</h2>
                </div>
              </div>

              <div className="profile-3col">
                <div className="profile-photo-frame">
                  {/* ✅ FIX IMAGE WARNING: Handle empty src */}
                  {selectedStudent.photoUrl ? (
                    <img
                      src={selectedStudent.photoUrl}
                      className="profile-photo"
                      alt="profile"
                    />
                  ) : (
                    <div
                      className="profile-photo-placeholder"
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "3rem",
                        background: "#eee",
                      }}
                    >
                      {selectedStudent.firstName[0]}
                    </div>
                  )}
                </div>

                <div className="profile-info">
                  <h1 className="profile-fullname">
                    {selectedStudent.lastName}, {selectedStudent.firstName}
                  </h1>

                  <div className="profile-details">
                    <div className="profile-left">
                      {/* <p>
                        //I remove this one, because there's no "medical" info inputs for child from the word docu of mam Phoebe.
                        <span className="icon">🏥</span> <b>Medical:</b>{" "}
                        {selectedStudent.medicalInfo || "None"}
                      </p> */}
                      <p>
                        <span className="icon">📍</span> <b>Nickname:</b>{" "}
                        {selectedStudent.nickname || "N/A"}
                      </p>
                      <p>
                        <span className="icon">📍</span> <b>Address:</b>{" "}
                        {selectedStudent.address || "N/A"}
                      </p>
                      <p>
                        <span className="icon">📍</span> <b>Grade Level:</b>{" "}
                        {selectedStudent.gradeLevel || "N/A"}
                      </p>
                      <p>
                        <span className="icon">🎓</span> <b>School:</b>{" "}
                        {selectedStudent.school || "N/A"}
                      </p>
                    </div>
                    <div className="profile-right">
                      <p>
                        <b>Birthdate: {selectedStudent.dateOfBirth || "N/A"}</b>
                      </p>
                      <p>
                        <b>Age:</b> {calculateAge(selectedStudent.dateOfBirth)}
                      </p>
                      <p>
                        <b>Gender:</b> {selectedStudent.gender}
                      </p>
                      {/* <p>
                        <b>Grade Level:</b> {selectedStudent.gradeLevel || "N/A"}
                      </p> */}
                    </div>
                  </div>

                  {parentData && (
                    <div
                      style={{
                        marginTop: "15px",
                        paddingTop: "15px",
                        borderTop: "1px solid #eee",
                        fontSize: "0.95rem",
                      }}
                    >
                      <p style={{ marginBottom: "5px" }}>
                        <span style={{ fontSize: "1.1em" }}>👪</span>{" "}
                        <b>Guardian:</b> {parentData.firstName}{" "}
                        {parentData.lastName}
                        <span style={{ color: "#777", fontSize: "0.9em" }}>
                          {" "}
                          ({selectedStudent.relationshipToClient || "Parent"})
                        </span>
                      </p>
                      <div
                        style={{
                          display: "flex",
                          gap: "15px",
                          flexWrap: "wrap",
                          color: "#555",
                        }}
                      >
                        <span>📧 {parentData.email}</span>
                        <span>📞 {parentData.phone}</span>
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: "20px" }}>
                    <button
                      className="see-more-btn"
                      style={{
                        padding: "10px 20px",
                        background: showAssessment ? "#e0e0e0" : "#4a90e2",
                        color: showAssessment ? "#333" : "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                      onClick={() => setShowAssessment(!showAssessment)}
                    >
                      {showAssessment
                        ? "Hide Assessment History"
                        : "See Assessment History"}
                    </button>
                  </div>
                </div>
              </div>

              {showAssessment &&
                (isAssessmentLoading ? (
                  <Loading />
                ) : (
                  <AssessmentHistory
                    childData={selectedStudent}
                    assessmentData={assessmentData}
                  />
                ))}
              <div
                className="profile-content-scroll"
                style={{ marginTop: "30px" }}
              >
                <div className="services-split-row">
                  <div className="content-section">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <h2 className="services-header">Therapy Services</h2>
                      <button onClick={() => handleOpenAddModal("Therapy")}>
                        + Add
                      </button>
                    </div>
                    <div className="services-list">
                      {therapyServices.map((s, i) => (
                        <div
                          key={i}
                          className={`service-row clickable ${
                            selectedService === s.serviceName ? "active" : ""
                          }`}
                          onClick={() => handleServiceClick(s.serviceName)}
                        >
                          <div className="service-left">🧠 {s.serviceName}</div>
                          <div>{s.staffName}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="content-section">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <h2 className="services-header">Group Classes</h2>
                      <button onClick={() => handleOpenAddModal("Class")}>
                        + Add
                      </button>
                    </div>
                    <div className="services-list">
                      {groupServices.map((s, i) => (
                        <div
                          key={i}
                          className={`service-row clickable ${
                            selectedService === s.serviceName ? "active" : ""
                          }`}
                          onClick={() => handleServiceClick(s.serviceName)}
                        >
                          <div className="service-left">👥 {s.serviceName}</div>
                          <div>{s.staffName}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {selectedService && (
                  <div ref={calendarRef}>
                    <ActivityCalendar
                      activities={studentActivities.filter(
                        (a) =>
                          a.serviceName === selectedService ||
                          a.serviceType === selectedService ||
                          a.className === selectedService
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
      {isAddModalOpen && (
        <div className="add-service-overlay">
          <div className="add-service-modal">
            <h3>Enroll in {addServiceType}</h3>
            <div className="modal-form-body">
              {availableServices.length === 0 ? (
                <p style={{ color: "#ef4444", marginBottom: "10px" }}>
                  No services available for this student based on recorded
                  interventions. Please check Background History.
                </p>
              ) : null}
              <select
                className="modal-select"
                onChange={(e) =>
                  setAddForm({ ...addForm, serviceId: e.target.value })
                }
                value={addForm.serviceId}
              >
                <option value="">Select Service...</option>
                {availableServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <select
                className="modal-select"
                style={{ marginTop: "10px" }}
                onChange={(e) =>
                  setAddForm({ ...addForm, staffId: e.target.value })
                }
                value={addForm.staffId}
                disabled={!addForm.serviceId}
              >
                <option value="">Select Staff...</option>

                {getQualifiedStaff(
                  availableServices.find((s) => s.id === addForm.serviceId)
                    ?.name,
                  addServiceType
                ).map((t) => (
                  <option key={t.uid || t.id} value={t.uid || t.id}>
                    {t.firstName} {t.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn-confirm"
                disabled={isSubmitting}
                onClick={handleAddSubmit}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfile;
