import React from 'react';
import useOtherServices from '../../hooks/useOtherServices';

const OtherServices = () => {
  const {
    services, teachers, loading, error,
    newService, handleInputChange, createService,
    toggleTeacherAssignment, deactivateService,
    // New data
    selectedService, selectService, clearSelection,
    enrolledStudents, allStudents,
    enrollmentData, handleEnrollmentChange, enrollStudent
  } = useOtherServices();

  if (loading) return <div>Loading...</div>;

  // --- VIEW 2: DETAILS & ENROLLMENT ---
  if (selectedService) {
    // Filter teachers who are qualified for this specific service
    const qualifiedTeachers = teachers.filter(t => 
      t.specializations?.includes(selectedService.name)
    );

    // Filter students who are NOT yet enrolled (to keep the dropdown clean)
    const availableStudents = allStudents.filter(s => 
      !enrolledStudents.find(es => es.id === s.id)
    );

    return (
      <div style={{ padding: '20px' }}>
        <button onClick={clearSelection} style={{ marginBottom: '20px' }}>← Back to Services</button>
        
        <h1>{selectedService.name}</h1>
        <p>{selectedService.description}</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          
          {/* LEFT: Enrolled Students List */}
          <div>
            <h3>Enrolled Students ({enrolledStudents.length})</h3>
            <ul style={{ lineHeight: '1.8' }}>
              {enrolledStudents.length === 0 && <li>No students enrolled yet.</li>}
              {enrolledStudents.map(student => (
                <li key={student.id}>
                  {student.firstName} {student.lastName}
                  {/* Find specific teacher for this service */}
                  <span style={{ color: 'gray', fontSize: '0.9em', marginLeft: '10px' }}>
                    (Teacher: {student.services.find(s => s.serviceName === selectedService.name)?.teacherName || 'Unknown'})
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* RIGHT: Enroll New Student Form */}
          <div style={{ padding: '20px', border: '1px solid #ddd' }}>
            <h3>Enroll Student</h3>
            <form onSubmit={enrollStudent}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                
                <label>
                  1. Select Student:
                  <select 
                    name="studentId" 
                    value={enrollmentData.studentId} 
                    onChange={handleEnrollmentChange}
                    required
                    style={{ width: '100%', marginTop: '5px', padding: '8px' }}
                  >
                    <option value="">-- Choose Student --</option>
                    {availableStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
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
                    style={{ width: '100%', marginTop: '5px', padding: '8px' }}
                  >
                    <option value="">-- Choose Teacher --</option>
                    {qualifiedTeachers.map(t => (
                      <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                    ))}
                  </select>
                  {qualifiedTeachers.length === 0 && (
                    <small style={{ color: 'red' }}>* No teachers have this specialization.</small>
                  )}
                </label>

                <button type="submit" disabled={qualifiedTeachers.length === 0}>
                  Enroll Student
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW 1: SERVICE LIST (Keep existing but add onClick) ---
  return (
    <div style={{ padding: '20px' }}>
      <h1>Services Management</h1>
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}

      {/* Create Service Form */}
      <div style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '30px' }}>
        <h3>Create Service</h3>
        <form onSubmit={createService}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px' }}>
            <input name="name" placeholder="Service Name" value={newService.name} onChange={handleInputChange} required />
            <input name="description" placeholder="Description" value={newService.description} onChange={handleInputChange} />
            <select name="type" value={newService.type} onChange={handleInputChange}>
              <option value="Therapy">Therapy</option>
              <option value="Class">Class</option>
              <option value="Assessment">Assessment</option>
              <option value="Other">Other</option>
            </select>
            <button type="submit">Add Service</button>
          </div>
        </form>
      </div>

      {/* Services List */}
      <h3>All Services (Click name to view students)</h3>
      {services.map(service => (
        <div key={service.id} style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Added onClick to title */}
            <h4 
              onClick={() => selectService(service)} 
              style={{ margin: 0, color: service.active ? 'blue' : 'gray', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {service.name} ({service.enrolledCount} students)
            </h4>
            {service.active && (
              <button onClick={() => deactivateService(service.id)}>Deactivate</button>
            )}
          </div>
          
          <p style={{ fontSize: '0.9em', color: '#666' }}>{service.description}</p>

          <div style={{ marginLeft: '20px' }}>
            <strong>Qualified Teachers:</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginTop: '5px' }}>
              {teachers.map(teacher => (
                <label key={teacher.id} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
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
    </div>
  );
};

export default OtherServices;