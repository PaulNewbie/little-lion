import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/sidebar/AdminSidebar';
import childService from '../../services/childService';

const OneOnOne = () => {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch real students from Firebase
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
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#fff', fontFamily: 'sans-serif' }}>
      
      {/* 1. Reusable Sidebar */}
      <AdminSidebar />

      {/* 2. Main Content Area: 1:1 Services Grid */}
      <div style={{ flex: 1, padding: '40px', backgroundColor: '#ffffff', overflowY: 'auto' }}>
        
        {/* Header & Search */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#333' }}>1 : 1 SERVICES</h1>
          
          <input 
            type="text" 
            placeholder="SEARCH" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '300px',
              padding: '10px 15px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              backgroundColor: '#e0e0e0'
            }}
          />
        </div>

        {/* Student Grid */}
        {loading ? (
          <p>Loading students...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
            {filteredStudents.length === 0 && (
              <p style={{ color: '#888' }}>No students found. Use "Add Student" to enroll someone.</p>
            )}

            {filteredStudents.map((student) => (
              <div key={student.id} style={{
                backgroundColor: '#e0e0e0',
                borderRadius: '4px',
                overflow: 'hidden',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-3px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {/* Image Area */}
                <div style={{
                  width: '100%',
                  height: '180px',
                  backgroundColor: '#bdbdbd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  {student.photoUrl ? (
                    <img src={student.photoUrl} alt={student.firstName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '40px', color: 'white' }}>📷</span>
                  )}
                </div>

                {/* Name Area */}
                <div style={{ padding: '15px' }}>
                  <p style={{ fontWeight: 'bold', margin: '0 0 5px 0', color: '#333' }}>
                    {student.lastName}, {student.firstName}
                  </p>
                  <span style={{ fontSize: '12px', color: '#555', textDecoration: 'underline' }}>
                    See More ›
                  </span>
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