import React, { useState, useEffect } from "react";
import AdminSidebar from "../../components/sidebar/AdminSidebar";
import childService from "../../services/childService";
import useManageTeachers from "../../hooks/useManageTeachers";
import "./css/OneOnOne.css";

/* ================================================================
   SELECTED SERVICE INFO (MULTIPLE DATES + COLLAPSIBLE)
================================================================ */
const SelectedServiceInfo = ({ records, teachers }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleIndex = (i) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? `${teacher.firstName} ${teacher.lastName}` : "—";
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
                <span className="label">Teacher:</span>{" "}
                {rec.teacherId ? getTeacherName(rec.teacherId) : "—"}
              </p>
              <p><span className="label">Activities:</span> {rec.activities || "—"}</p>
              <p><span className="label">Observations:</span> {rec.observations || "—"}</p>
              <p><span className="label">Follow Up:</span> {rec.followUp || "—"}</p>
              <p className="other-concerns">
                <span className="label">Other Concerns:</span> {rec.otherConcerns || "—"}
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
const OneOnOne = () => {
  const [currentLevel, setCurrentLevel] = useState("student-list");
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const [selectedService, setSelectedService] = useState("");

  // ------------------------------
  // TEACHER DATA FROM useManageTeachers
  // ------------------------------
  const { teachers, loading: loadingTeachers } = useManageTeachers();

  /* FETCH STUDENTS */
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

  const filteredStudents = students.filter((student) =>
    `${student.firstName} ${student.lastName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setCurrentLevel("student-profile");
  };

  const goBack = () => {
    setSelectedService("");
    setSelectedStudent(null);
    setCurrentLevel("student-list");
  };

  if (loading || loadingTeachers) return <div>Loading...</div>;

  return (
    <div className="ooo-container">
      <AdminSidebar />

      <div className="ooo-main">

        {/* =========================================================
            PAGE 1 — STUDENT LIST
        ========================================================== */}
        {currentLevel === "student-list" && (
          <>
            <div className="ooo-header">
              <h1>1 : 1 SERVICES</h1>

              <input
                type="text"
                className="ooo-search"
                placeholder="SEARCH"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {filteredStudents.length === 0 ? (
              <p>No students found.</p>
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
                        <img
                          src={student.photoUrl}
                          alt=""
                          className="ooo-photo"
                        />
                      ) : (
                        <span>📷</span>
                      )}
                    </div>

                    <div className="ooo-card-info">
                      <p className="ooo-name">
                        {student.lastName}, {student.firstName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* =========================================================
            PAGE 2 — STUDENT PROFILE
        ========================================================== */}
        {currentLevel === "student-profile" && selectedStudent && (
          <div className="profile-wrapper">

            {/* TOP BAR */}
            <div className="profile-top">
              <div className="left-group">
                <span className="back-arrow" onClick={goBack}>←</span>
                <h2>STUDENT PROFILES</h2>
              </div>

              <input
                type="text"
                placeholder="SEARCH"
                className="profile-search"
              />
            </div>

            <div className="profile-3col">

              {/* COLUMN 1 — PHOTO */}
              <div className="profile-photo-frame">
                {selectedStudent.photoUrl ? (
                  <img
                    src={selectedStudent.photoUrl}
                    alt=""
                    className="profile-photo"
                  />
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
                    <p><span className="icon">📞</span> {selectedStudent.phone || "N/A"}</p>
                    <p><span className="icon">👩</span> {selectedStudent.motherName || "N/A"}</p>
                    <p><span className="icon">✉️</span> {selectedStudent.motherEmail || "N/A"}</p>
                    <p><span className="icon">📍</span> {selectedStudent.address || "N/A"}</p>
                  </div>

                  <div className="profile-right">
                    <p><b>Age:</b> {selectedStudent.age || "N/A"}</p>
                    <p><b>Gender:</b> {selectedStudent.gender || "N/A"}</p>
                    <p><b>Birthday:</b> {selectedStudent.birthday || "N/A"}</p>
                    <p><b>Address:</b> {selectedStudent.address || "N/A"}</p>
                  </div>
                </div>

                {/* SERVICES HEADER */}
                <h2 className="services-header">SERVICES AVAILED</h2>

                {/* SERVICES LIST */}
                <div className="services-list">
                  {selectedStudent.services?.map((service, i) => (
                    <div key={i} className="service-row">
                      <div className="service-left">
                        <span className="service-icon">🟡</span>
                        {service.serviceName}
                      </div>
                    </div>
                  ))}
                </div>

                {/* SERVICE DROPDOWN */}
                <div className="select-service">
                  <p>Select a service to view records: </p>
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                  >
                    <option value="">--Select a service--</option>
                    {[...new Set(selectedStudent.services?.map(s => s.serviceName))].map((name, i) => (
                      <option key={i} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                {/* SELECTED SERVICE — MULTIPLE DATES */}
                <div className="selected-service-info">
                  {selectedService &&
                    (() => {
                      const records = selectedStudent.services.filter(
                        (s) => s.serviceName === selectedService
                      );
                      return <SelectedServiceInfo records={records} teachers={teachers} />;
                    })()}
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

export default OneOnOne;
