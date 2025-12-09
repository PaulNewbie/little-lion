import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/sidebar/AdminSidebar';
import childService from '../../services/childService';
import './OneOnOne.css';

const OneOnOne = () => {
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

  return (
    <div className="oneonone-container">

      <AdminSidebar />

      <div className="oneonone-main">

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
              <p className="no-students">No students found. Use "Add Student" to enroll someone.</p>
            )}

            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="student-card"
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
      </div>
    </div>
  );
};

export default OneOnOne;
