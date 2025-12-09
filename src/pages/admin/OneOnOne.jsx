import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/sidebar/AdminSidebar';
import childService from '../../services/childService';
import './css/OneOnOne.css';

const OneOnOne = () => {

  // Navigation
  const [currentLevel, setCurrentLevel] = useState('student-list');
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Data
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Load students from service
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

  // Search filter
  const filteredStudents = students.filter(student =>
    `${student.firstName} ${student.lastName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // When student is clicked
  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setCurrentLevel('student-profile');
  };

  // Back button
  const goBack = () => {
    setSelectedStudent(null);
    setCurrentLevel('student-list');
  };

  return (
    <div className="oneonone-container">

      <AdminSidebar />

      <div className="oneonone-main">

        {/* ----------------------------- */}
        {/* PAGE 1 — STUDENT LIST         */}
        {/* ----------------------------- */}
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
                  <p className="no-students">No students found.</p>
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

        {/* ----------------------------- */}
        {/* PAGE 2 — STUDENT PROFILE      */}
        {/* ----------------------------- */}
        {currentLevel === 'student-profile' && selectedStudent && (
          <div className="profile-container">

            <button className="back-btn" onClick={goBack}>
              ← Back
            </button>

            <h1>{selectedStudent.firstName} {selectedStudent.lastName}</h1>

            <div className="profile-content profile-row">

              {/* LEFT SIDE: PHOTO */}
              <div className="profile-photo-section left-column">
                {selectedStudent.photoUrl ? (
                  <img
                    src={selectedStudent.photoUrl}
                    alt="Student"
                    className="profile-photo"
                  />
                ) : (
                  <div className="profile-photo placeholder">No Photo</div>
                )}
              </div>

              {/* RIGHT SIDE: INFO + SERVICES */}
              <div className="profile-details right-column">

                <h2>Student Information</h2>
                <p><strong>Name:</strong> {selectedStudent.firstName} {selectedStudent.lastName}</p>
                <p><strong>Birthday:</strong> {selectedStudent.birthDate || "N/A"}</p>
                <p><strong>Age:</strong> {selectedStudent.age || "N/A"}</p>
                <p><strong>Gender:</strong> {selectedStudent.gender || "N/A"}</p>

                <h2 style={{ marginTop: '20px' }}>Services Availed</h2>

                <ul className="services-list">
                  {(selectedStudent.services && selectedStudent.services.length > 0)
                    ? selectedStudent.services.map((service, i) => (
                        <li key={i} className="service-item">
                          <strong>{service.serviceName}</strong><br />
                          <span>Teacher: {service.teacherName}</span>
                        </li>
                      ))
                    : <p>No services recorded.</p>}
                </ul>

              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default OneOnOne;
