import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/sidebar/AdminSidebar';
import childService from '../../services/childService';
import './css/OneOnOne.css';

const OneOnOne = () => {

  // NEW: Navigation State
  const [currentLevel, setCurrentLevel] = useState('student-list');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

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

  const filteredStudents = students.filter(student =>
    `${student.firstName} ${student.lastName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setCurrentLevel('student-profile');
  };

  const goBack = () => {
    setSelectedStudent(null);
    setCurrentLevel('student-list');
  };

  return (
    <div className="oneonone-container">

      <AdminSidebar />

      <div className="oneonone-main">

        {/* ------------------------------ */}
        {/* PAGE 1 — STUDENT LIST           */}
        {/* ------------------------------ */}
        {currentLevel === 'student-list' && (
          <>
            <div className="oneonone-header">
              <h1>1 : 1 SERVICES</h1>

              <input
                type="text"
                placeholder="SEARCH"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="oneonone-search"
              />
            </div>

            {loading ? (
              <p>Loading students...</p>
            ) : (
              <div className="student-grid">

                {filteredStudents.length === 0 && (
                  <p className="no-students">
                    No students found.
                  </p>
                )}

                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="student-card"
                    onClick={() => handleSelectStudent(student)}
                  >
                    <div className="student-image-area">
                      {student.photoUrl ? (
                        <img
                          src={student.photoUrl}
                          alt={student.firstName}
                          className="student-image"
                        />
                      ) : (
                        <span className="no-image-icon">📷</span>
                      )}
                    </div>

                    <div className="student-info">
                      <p className="student-name">
                        {student.lastName}, {student.firstName}
                      </p>
                      <span className="see-more">See More ›</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ------------------------------ */}
        {/* PAGE 2 — STUDENT PROFILE        */}
        {/* ------------------------------ */}
{currentLevel === 'student-profile' && selectedStudent && (
  <div className="profile-container">

    <button className="back-btn" onClick={goBack}>
      ← Back
    </button>

    <div className="profile-layout">

      {/* LEFT — STUDENT PHOTO */}
      <div className="photo-box">
        {selectedStudent.photoUrl ? (
          <img
            src={selectedStudent.photoUrl}
            alt="Student"
            className="photo-img"
          />
        ) : (
          <span>No Photo</span>
        )}
      </div>

      {/* RIGHT SIDE CONTENT */}
      <div className="right-side">

        {/* PROFILE BOX */}
        <div className="profile-box">
          <h2>PROFILE</h2>

          <div className="profile-card">
            <h3 className="profile-name">
              {selectedStudent.lastName}, {selectedStudent.firstName}
            </h3>

            <p>📞 {selectedStudent.phone || "N/A"}</p>
            <p>👩 {selectedStudent.motherName || "N/A"}</p>
            <p>✉️ {selectedStudent.motherEmail || "N/A"}</p>
            <p>📍 {selectedStudent.address || "N/A"}</p>
          </div>
        </div>

        {/* SERVICES AVAILED BOX */}
        <div className="services-box">
          <h2>SERVICES AVAILED</h2>

          <div className="services-card">
            {selectedStudent.services && selectedStudent.services.length > 0 ? (
              <ul className="services-list">
                {selectedStudent.services.map((service, i) => (
                  <li key={i} className="service-item">
                    <span className="service-icon">🟦</span>
                    <span>{service.serviceName}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No services recorded.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  </div>
)}


      </div>
    </div>
  );
};

export default OneOnOne;
