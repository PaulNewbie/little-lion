import React, { useState, useEffect } from "react";
import AdminSidebar from "../../components/sidebar/AdminSidebar";
import childService from "../../services/childService";
import "./css/OneOnOne.css";

const OneOnOne = () => {
  const [currentLevel, setCurrentLevel] = useState("student-list");
  const [selectedStudent, setSelectedStudent] = useState(null);
  

  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const [selectedService, setSelectedService] = useState("");

  // ---------------------------
  // FETCH STUDENTS
  // ---------------------------
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
    setSelectedStudent(null);
    setCurrentLevel("student-list");
  };

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

            {loading ? (
              <p>Loading students...</p>
            ) : (
              <div className="ooo-grid">
                {filteredStudents.length === 0 && (
                  <p>No students found.</p>
                )}

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
                      {/* <span className="ooo-see">See More ›</span> */}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* =========================================================
            PAGE 2 — STUDENT PROFILE (Matches Screenshot Exactly)
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
                    <p><span className="icon">📞</span> {selectedStudent.phone|| "John Patrick J. Ignacio"}</p>
                    <p><span className="icon">👩</span> {selectedStudent.motherName || "ana liza J. Ignacio"}</p>
                    <p><span className="icon">✉️</span> {selectedStudent.motherEmail || "Analiza@gmail.com"}</p>
                    <p><span className="icon">📍</span> {selectedStudent.address || "maligaya st. patubig marilao bulacan"}</p>
                  </div>

                  <div className="profile-center">

                  </div>

                  <div className="profile-right">
                    <p><b>Age:</b> {selectedStudent.age || "21"}</p>
                    <p><b>Gender:</b> {selectedStudent.gender || "N/A"}</p>
                    <p><b>Birthday:</b> {selectedStudent.birthday || "12-21-2003"}</p>
                    <p><b>Address:</b> {selectedStudent.address || "maligaya st. patubig marilao bulacan"}</p>
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
                      <span className="arrow">›</span>
                    </div>
                    
                  ))}
                </div>
                <div className="select-service">
                  <p>Select a service to view records: </p>
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                  >
                    <option value="">--Select a service--</option>
                    {selectedStudent.services?.map((service, i) => (
                      <option key={i} value={service.serviceName}>
                        {service.serviceName}
                      </option>
                    ))}
                  </select>
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
