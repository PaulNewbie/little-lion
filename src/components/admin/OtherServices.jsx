import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const OtherServices = () => {
  const navigate = useNavigate();
  
  const [showAddService, setShowAddService] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  
  // Mock data
  const [services, setServices] = useState([
    {
      id: '1',
      name: 'Speech Therapy',
      description: 'One-on-one speech therapy sessions',
      type: 'Therapy',
      color: '#FF5733',
      active: true,
      enrolledChildren: [
        { id: 'c1', name: 'Emma Smith' },
        { id: 'c2', name: 'Liam Jones' },
        { id: 'c3', name: 'Ava Davis' }
      ],
      qualifiedTeachers: [
        { id: 't1', name: 'Ms. Sarah Johnson' },
        { id: 't2', name: 'Ms. Emily Davis' }
      ]
    },
    {
      id: '2',
      name: 'Behavioral Therapy',
      description: 'Behavioral support and therapy',
      type: 'Therapy',
      color: '#33C3FF',
      active: true,
      enrolledChildren: [
        { id: 'c1', name: 'Emma Smith' }
      ],
      qualifiedTeachers: [
        { id: 't3', name: 'Mr. Mike Chen' }
      ]
    },
    {
      id: '3',
      name: 'Art Class',
      description: 'Creative art activities',
      type: 'Class',
      color: '#FFD700',
      active: true,
      enrolledChildren: [
        { id: 'c2', name: 'Liam Jones' },
        { id: 'c4', name: 'Mia Brown' }
      ],
      qualifiedTeachers: [
        { id: 't4', name: 'Ms. Lisa Brown' },
        { id: 't5', name: 'Mr. David Kim' }
      ]
    }
  ]);

  const [newService, setNewService] = useState({
    name: '',
    description: '',
    type: 'Therapy',
    color: '#4ECDC4',
    active: true
  });

  const serviceTypes = ['Therapy', 'Class', 'Assessment', 'Other'];

  const handleAddService = (e) => {
    e.preventDefault();
    console.log('Creating service:', newService);
    
    setServices([...services, {
      ...newService,
      id: Date.now().toString(),
      enrolledChildren: [],
      qualifiedTeachers: []
    }]);
    
    setNewService({
      name: '',
      description: '',
      type: 'Therapy',
      color: '#4ECDC4',
      active: true
    });
    setShowAddService(false);
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
        <h1 style={{ margin: 0 }}>Manage Services</h1>
        <button
          onClick={() => setShowAddService(!showAddService)}
          style={{
            padding: '12px 24px',
            backgroundColor: showAddService ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          {showAddService ? 'Cancel' : '+ Create New Service'}
        </button>
      </div>

      {/* Add Service Form */}
      {showAddService && (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Create New Service</h2>
          
          <form onSubmit={handleAddService}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Service Name *
                </label>
                <input
                  required
                  type="text"
                  value={newService.name}
                  onChange={(e) => setNewService({...newService, name: e.target.value})}
                  placeholder="e.g., Speech Therapy"
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px',
                    fontSize: '15px'
                  }}
                />
              </div>
              
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Description
                </label>
                <textarea
                  rows="3"
                  value={newService.description}
                  onChange={(e) => setNewService({...newService, description: e.target.value})}
                  placeholder="Brief description of the service..."
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px',
                    fontSize: '15px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Service Type *
                </label>
                <select
                  value={newService.type}
                  onChange={(e) => setNewService({...newService, type: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px',
                    fontSize: '15px'
                  }}
                >
                  {serviceTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                  Color Code 🎨
                </label>
                <input
                  type="color"
                  value={newService.color}
                  onChange={(e) => setNewService({...newService, color: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '5px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px',
                    height: '42px',
                    cursor: 'pointer'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginTop: '28px' }}>
                  <input
                    type="checkbox"
                    checked={newService.active}
                    onChange={(e) => setNewService({...newService, active: e.target.checked})}
                    style={{ marginRight: '10px', width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '15px', fontWeight: '500' }}>Active Service</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              style={{
                padding: '14px 32px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              Create Service
            </button>
          </form>
        </div>
      )}

      {/* Services List */}
      <h2 style={{ marginBottom: '20px' }}>All Services ({services.length})</h2>
      
      {services.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          color: '#666'
        }}>
          <p style={{ fontSize: '16px', marginBottom: '10px' }}>No services created yet</p>
          <p style={{ fontSize: '14px' }}>Click "Create New Service" to add your first service</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {services.map(service => (
            <div 
              key={service.id}
              style={{
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              {/* Service Header */}
              <div 
                style={{
                  backgroundColor: service.color,
                  padding: '20px',
                  color: 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '20px' }}>{service.name}</h3>
                  <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
                    {service.type} • {service.active ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      border: '1px solid white',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setSelectedService(selectedService === service.id ? null : service.id)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'white',
                      color: service.color,
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    {selectedService === service.id ? 'Hide Details' : 'View Details'}
                  </button>
                </div>
              </div>

              {/* Service Body */}
              <div style={{ padding: '20px' }}>
                {service.description && (
                  <p style={{ margin: '0 0 20px 0', color: '#666', fontSize: '15px' }}>
                    {service.description}
                  </p>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {/* Enrolled Children */}
                  <div>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#333' }}>
                      📚 Enrolled Children ({service.enrolledChildren.length})
                    </h4>
                    {service.enrolledChildren.length === 0 ? (
                      <p style={{ color: '#999', fontSize: '14px', fontStyle: 'italic' }}>
                        No children enrolled yet
                      </p>
                    ) : (
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {service.enrolledChildren.map(child => (
                          <li key={child.id} style={{ marginBottom: '8px', color: '#555', fontSize: '14px' }}>
                            {child.name}
                          </li>
                        ))}
                      </ul>
                    )}
                    <button
                      style={{
                        marginTop: '12px',
                        padding: '8px 16px',
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        width: '100%'
                      }}
                    >
                      + Enroll Child to This Service
                    </button>
                  </div>

                  {/* Qualified Teachers */}
                  <div>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#333' }}>
                      👨‍🏫 Qualified Teachers ({service.qualifiedTeachers.length})
                    </h4>
                    {service.qualifiedTeachers.length === 0 ? (
                      <p style={{ color: '#999', fontSize: '14px', fontStyle: 'italic' }}>
                        No qualified teachers assigned
                      </p>
                    ) : (
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {service.qualifiedTeachers.map(teacher => (
                          <li key={teacher.id} style={{ marginBottom: '8px', color: '#555', fontSize: '14px' }}>
                            {teacher.name}
                          </li>
                        ))}
                      </ul>
                    )}
                    <button
                      style={{
                        marginTop: '12px',
                        padding: '8px 16px',
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        width: '100%'
                      }}
                    >
                      Manage Teacher Assignments
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedService === service.id && (
                  <div style={{
                    marginTop: '20px',
                    padding: '20px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    border: '1px solid #e0e0e0'
                  }}>
                    <h4 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Additional Details</h4>
                    <div style={{ display: 'grid', gap: '10px', fontSize: '14px', color: '#555' }}>
                      <div>
                        <strong>Service ID:</strong> {service.id}
                      </div>
                      <div>
                        <strong>Status:</strong> {service.active ? '✅ Active' : '❌ Inactive'}
                      </div>
                      <div>
                        <strong>Total Enrollments:</strong> {service.enrolledChildren.length}
                      </div>
                      <div>
                        <strong>Available Teachers:</strong> {service.qualifiedTeachers.length}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OtherServices;