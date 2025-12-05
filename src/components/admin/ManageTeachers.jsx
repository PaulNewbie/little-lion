import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ManageTeachers = () => {
  const navigate = useNavigate();
  
  // Mock data
  const [teachers, setTeachers] = useState([
    { 
      id: '1', 
      firstName: 'Sarah', 
      lastName: 'Johnson', 
      email: 'sarah@school.com',
      phone: '555-0101',
      specializations: ['Speech Therapy', 'Occupational Therapy'] 
    },
    { 
      id: '2', 
      firstName: 'Mike', 
      lastName: 'Chen', 
      email: 'mike@school.com',
      phone: '555-0102',
      specializations: ['Behavioral Therapy'] 
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTeacher, setNewTeacher] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: 'Welcome123!',
    specializations: []
  });

  const availableServices = [
    'Speech Therapy',
    'Behavioral Therapy',
    'Occupational Therapy',
    'Art Class',
    'Music Class',
    'Physical Therapy'
  ];

  const toggleSpecialization = (service) => {
    if (newTeacher.specializations.includes(service)) {
      setNewTeacher({
        ...newTeacher,
        specializations: newTeacher.specializations.filter(s => s !== service)
      });
    } else {
      setNewTeacher({
        ...newTeacher,
        specializations: [...newTeacher.specializations, service]
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Creating teacher:', newTeacher);
    
    // TODO: Call Firebase service
    setTeachers([...teachers, { ...newTeacher, id: Date.now().toString() }]);
    
    // Reset
    setNewTeacher({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: 'Welcome123!',
      specializations: []
    });
    setShowAddForm(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <button 
        onClick={() => navigate('/admin/dashboard')}
        style={{ 
          marginBottom: '20px', 
          padding: '8px 16px', 
          cursor: 'pointer',
          border: '1px solid #ddd',
          borderRadius: '4px',
          backgroundColor: 'white'
        }}
      >
        ← Back to Dashboard
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0 }}>Manage Teachers</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            padding: '12px 24px',
            backgroundColor: showAddForm ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          {showAddForm ? 'Cancel' : '+ Add New Teacher'}
        </button>
      </div>

      {/* Add Teacher Form */}
      {showAddForm && (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Create New Teacher Account</h2>
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  First Name *
                </label>
                <input
                  required
                  type="text"
                  value={newTeacher.firstName}
                  onChange={(e) => setNewTeacher({...newTeacher, firstName: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px',
                    fontSize: '15px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Last Name *
                </label>
                <input
                  required
                  type="text"
                  value={newTeacher.lastName}
                  onChange={(e) => setNewTeacher({...newTeacher, lastName: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px',
                    fontSize: '15px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Email (Login) *
                </label>
                <input
                  required
                  type="email"
                  value={newTeacher.email}
                  onChange={(e) => setNewTeacher({...newTeacher, email: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px',
                    fontSize: '15px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newTeacher.phone}
                  onChange={(e) => setNewTeacher({...newTeacher, phone: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px',
                    fontSize: '15px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Temporary Password
                </label>
                <input
                  type="text"
                  value={newTeacher.password}
                  readOnly
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px',
                    backgroundColor: '#f5f5f5',
                    fontSize: '15px'
                  }}
                />
                <small style={{ color: '#666', fontSize: '13px' }}>
                  Teacher can change this after first login
                </small>
              </div>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: '500', color: '#333' }}>
                Specializations (Select all that apply) *
              </label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
                gap: '12px',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                border: '1px solid #e0e0e0'
              }}>
                {availableServices.map(service => (
                  <label 
                    key={service} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      padding: '8px'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={newTeacher.specializations.includes(service)}
                      onChange={() => toggleSpecialization(service)}
                      style={{ 
                        marginRight: '10px', 
                        cursor: 'pointer',
                        width: '18px',
                        height: '18px'
                      }}
                    />
                    <span style={{ fontSize: '15px' }}>{service}</span>
                  </label>
                ))}
              </div>
              {newTeacher.specializations.length === 0 && (
                <p style={{ color: '#dc3545', fontSize: '14px', marginTop: '8px', marginBottom: 0 }}>
                  ⚠️ Please select at least one specialization
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={newTeacher.specializations.length === 0}
              style={{
                padding: '14px 32px',
                backgroundColor: newTeacher.specializations.length === 0 ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: newTeacher.specializations.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              Create Teacher Account
            </button>
          </form>
        </div>
      )}

      {/* Teachers List */}
      <h2 style={{ marginBottom: '20px' }}>All Teachers ({teachers.length})</h2>
      
      {teachers.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          color: '#666'
        }}>
          <p style={{ fontSize: '16px', marginBottom: '10px' }}>No teachers added yet</p>
          <p style={{ fontSize: '14px' }}>Click "Add New Teacher" to create the first teacher account</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {teachers.map(teacher => (
            <div 
              key={teacher.id}
              style={{
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#333', fontSize: '18px' }}>
                  {teacher.firstName} {teacher.lastName}
                </h3>
                <p style={{ margin: '0 0 4px 0', color: '#666', fontSize: '14px' }}>
                  📧 {teacher.email}
                </p>
                {teacher.phone && (
                  <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: '14px' }}>
                    📞 {teacher.phone}
                  </p>
                )}
                
                <div style={{ marginTop: '12px' }}>
                  <strong style={{ fontSize: '13px', color: '#555' }}>Specializations:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                    {teacher.specializations.map(spec => (
                      <span 
                        key={spec}
                        style={{
                          backgroundColor: '#e3f2fd',
                          color: '#1976d2',
                          padding: '5px 12px',
                          borderRadius: '14px',
                          fontSize: '13px',
                          fontWeight: '500'
                        }}
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginLeft: '20px' }}>
                <button
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Edit
                </button>
                <button
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageTeachers;