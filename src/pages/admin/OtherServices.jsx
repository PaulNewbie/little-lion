import React from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import useOtherServices from "../../hooks/useOtherServices";
import activityService from "../../services/activityService"; // Import Activity Service
import AdminSidebar from "../../components/sidebar/AdminSidebar";
import "./css/OtherServices.css";

const OtherServices = () => {
  const navigate = useNavigate(); // Initialize navigation hooks
  
  const {
    services,
    teachers,
    loading,
    error,
    newService,
    handleInputChange,
    createService,
    toggleTeacherAssignment,
    selectedService,
    selectService,
    clearSelection,
    enrolledStudents,
    allStudents,
    enrollmentData,
    handleEnrollmentChange,
    enrollStudent,
  } = useOtherServices();

  // --- NEW HANDLER: NAVIGATE TO PROFILE ---
  const handleStudentClick = async (student) => {
    try {
      // 1. Fetch Unified Activities (Therapy + Group + Observations)
      const activities = await activityService.getActivitiesByChild(student.id);
      
      // 2. Navigate to Student Profile with Data
      navigate("/admin/StudentProfile", {
        state: {
          student: student,
          activities: activities,
          selectedService: selectedService, // Pass context so profile highlights this service
          fromOneOnOne: true // Reusing this flag to trigger the "Profile Mode"
        }
      });
    } catch (err) {
      console.error("Failed to load student activities", err);
      // Fallback navigation if fetch fails
      navigate("/admin/StudentProfile", { state: { student } });
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  const qualifiedTeachers = selectedService
    ? teachers.filter((t) => t.specializations?.includes(selectedService.name))
    : [];

  const availableStudents = selectedService
    ? allStudents.filter((s) => !enrolledStudents.find((es) => es.id === s.id))
    : [];

  return (
    <div style={{ display: "flex", minHeight: "100vh", maxHeight: "100vh", overflow: "hidden" }}>
      <AdminSidebar />
      <div className="page-container">
        {selectedService ? (
          // ---------------- VIEW: SERVICE DETAILS ----------------
          <>
            <button className="back-btn" onClick={clearSelection}>
              ← Back to Services
            </button>

            <h1>{selectedService.name}</h1>
            <p>{selectedService.description}</p>

            <div className="two-column">
              {/* LEFT: Enrolled Students */}
              <div className="enrolled-section">
                <h3>Enrolled Students ({enrolledStudents.length})</h3>
                <ul className="enrolled-list">
                  {enrolledStudents.length === 0 && (
                    <li>No students enrolled yet.</li>
                  )}
                  {enrolledStudents.map((student) => (
                    <li 
                      key={student.id}
                      onClick={() => handleStudentClick(student)} // Click handler
                      style={{ cursor: 'pointer', borderBottom: '1px solid #eee', padding: '8px 0', transition: '0.2s' }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <span style={{ fontWeight: '600', color: '#2c3e50' }}>
                        {student.firstName} {student.lastName}
                      </span>
                      <br/>
                      <span className="teacher-label" style={{ fontSize: '0.85em', color: '#7f8c8d' }}>
                        (Teacher:{" "}
                        {student.services.find(
                          (s) => s.serviceName === selectedService.name
                        )?.teacherName || "Unknown"}
                        )
                      </span>
                      <span style={{ float: 'right', fontSize: '0.8em', color: '#3498db' }}>View Profile →</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* RIGHT: Enroll New Student */}
              <div className="enroll-box">
                <h3>Enroll Student</h3>
                <form onSubmit={enrollStudent} className="enroll-form">
                  <label>
                    1. Select Student:
                    <select
                      name="studentId"
                      value={enrollmentData.studentId}
                      onChange={handleEnrollmentChange}
                      required
                    >
                      <option value="">-- Choose Student --</option>
                      {availableStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.firstName} {s.lastName}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    2. Assign Teacher:
                    <select
                      name="teacherId"
                      value={enrollmentData.teacherId}
                      onChange={handleEnrollmentChange}
                      required
                    >
                      <option value="">-- Choose Teacher --</option>
                      {qualifiedTeachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.firstName} {t.lastName}
                        </option>
                      ))}
                    </select>
                    {qualifiedTeachers.length === 0 && (
                      <small className="error-text">
                        * No teachers have this specialization.
                      </small>
                    )}
                  </label>

                  <button type="submit" disabled={qualifiedTeachers.length === 0}>
                    Enroll Student
                  </button>
                </form>
              </div>
            </div>
          </>
        ) : (
          // ---------------- VIEW: SERVICE LIST ----------------
          <>
            <h1>Services Management</h1>

            {error && <div className="error-text">Error: {error}</div>}

            {/* Create Service */}
            <div className="service-create-box">
              <h3>Create Service</h3>
              <form onSubmit={createService} className="create-form">
                <input
                  name="name"
                  placeholder="Service Name"
                  value={newService.name}
                  onChange={handleInputChange}
                  required
                />
                <input
                  name="description"
                  placeholder="Description"
                  value={newService.description}
                  onChange={handleInputChange}
                />
                <select
                  name="type"
                  value={newService.type}
                  onChange={handleInputChange}
                >
                  <option value="Therapy">Therapy</option>
                  <option value="Class">Class</option>
                  <option value="Assessment">Assessment</option>
                  <option value="Other">Other</option>
                </select>
                <button type="submit">Add Service</button>
              </form>
            </div>

            {/* List of Services */}
            <h3>All Services (Click name to view students)</h3>

            {services.map((service) => (
              <div key={service.id} className="service-item">
                <div className="service-title-row">
                  <h4
                    className={`service-title ${service.active ? "active" : "inactive"}`}
                    onClick={() => selectService(service)}
                  >
                    {service.name} ({service.enrolledCount} students)
                  </h4>
                </div>

                <p className="service-description">{service.description}</p>

                <div className="teacher-assign-box">
                  <strong>Qualified Teachers:</strong>
                  <div className="teacher-list">
                    {teachers.map((teacher) => (
                      <label key={teacher.id} className="teacher-checkbox">
                        <input
                          type="checkbox"
                          checked={teacher.specializations?.includes(service.name) || false}
                          onChange={() => toggleTeacherAssignment(teacher.id, service.name)}
                        />
                        {teacher.firstName}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default OtherServices;