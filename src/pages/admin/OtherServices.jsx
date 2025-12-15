// import React, { useState } from "react";
import useOtherServices from "../../hooks/useOtherServices";
import AdminSidebar from "../../components/sidebar/AdminSidebar";
import "./css/OtherServices.css";

const OtherServices = () => {
  // const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const {
    services,
    teachers,
    loading,
    error,
    newService,
    handleInputChange,
    createService,
    toggleTeacherAssignment,
    // deactivateService,
    selectedService,
    selectService,
    clearSelection,
    enrolledStudents,
    allStudents,
    enrollmentData,
    handleEnrollmentChange,
    enrollStudent,
  } = useOtherServices();

  if (loading) return <div className="loading">Loading...</div>;

  // Prepare data for Service Details View
  const qualifiedTeachers = selectedService
    ? teachers.filter((t) => t.specializations?.includes(selectedService.name))
    : [];

  const availableStudents = selectedService
    ? allStudents.filter((s) => !enrolledStudents.find((es) => es.id === s.id))
    : [];

  // // Toggle function
  // const toggleSidebar = () => {
  //   setIsSidebarVisible((prev) => !prev);
  // };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        maxHeight: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Sidebar */}

      <AdminSidebar />

      {/* Main Content */}
      <div className="page-container">
        {/* Conditional Rendering: Service Details OR Service List */}
        {selectedService ? (
          // ---------------- VIEW: SERVICE DETAILS & ENROLLMENT ----------------
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
                    <li key={student.id}>
                      {student.firstName} {student.lastName}
                      <span className="teacher-label">
                        (Teacher:{" "}
                        {student.services.find(
                          (s) => s.serviceName === selectedService.name
                        )?.teacherName || "Unknown"}
                        )
                      </span>
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

                  <button
                    type="submit"
                    disabled={qualifiedTeachers.length === 0}
                  >
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
                    className={`service-title ${
                      service.active ? "active" : "inactive"
                    }`}
                    onClick={() => selectService(service)}
                  >
                    {service.name} ({service.enrolledCount} students)
                  </h4>

                  {/* {service.active && (
                    <button
                      className="danger-btn"
                      onClick={() => deactivateService(service.id)}
                    >
                      Deactivate
                    </button>
                  )} */}
                </div>

                <p className="service-description">{service.description}</p>

                <div className="teacher-assign-box">
                  <strong>Qualified Teachers:</strong>

                  <div className="teacher-list">
                    {teachers.map((teacher) => (
                      <label key={teacher.id} className="teacher-checkbox">
                        <input
                          type="checkbox"
                          checked={
                            teacher.specializations?.includes(service.name) ||
                            false
                          }
                          onChange={() =>
                            toggleTeacherAssignment(teacher.id, service.name)
                          }
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
