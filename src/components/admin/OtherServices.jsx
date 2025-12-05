import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import servicesService from '../../services/servicesService';
import teacherService from '../../services/teacherService';
import ErrorMessage from '../common/ErrorMessage';
import Loading from '../common/Loading';

const OtherServices = () => {
  const navigate = useNavigate();
  
  const [services, setServices] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal States
  const [showAddService, setShowAddService] = useState(false);
  const [selectedService, setSelectedService] = useState(null); // For View Details modal

  const [newService, setNewService] = useState({
    name: '',
    description: '',
    type: 'Therapy',
    color: '#4ECDC4',
    active: true
  });

  const serviceTypes = ['Therapy', 'Class', 'Assessment', 'Other'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [servicesData, teachersData] = await Promise.all([
        servicesService.getServicesWithStats(),
        teacherService.getAllTeachers()
      ]);
      setServices(servicesData);
      setTeachers(teachersData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await servicesService.createService(newService);
      setSuccess(`Successfully created ${newService.name}`);
      setNewService({
        name: '',
        description: '',
        type: 'Therapy',
        color: '#4ECDC4',
        active: true
      });
      setShowAddService(false);
      fetchData(); // Refresh both to be safe
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (serviceId, serviceName) => {
    if (!window.confirm(`Deactivate ${serviceName}?`)) return;
    try {
      await servicesService.deactivateService(serviceId);
      setSuccess(`Deactivated ${serviceName}`);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Toggle a teacher's qualification for a specific service
  const toggleTeacherAssignment = async (teacher, serviceName) => {
    try {
      const currentSpecs = teacher.specializations || [];
      let newSpecs;

      if (currentSpecs.includes(serviceName)) {
        // Remove
        newSpecs = currentSpecs.filter(s => s !== serviceName);
      } else {
        // Add
        newSpecs = [...currentSpecs, serviceName];
      }

      // Optimistic UI update for the modal
      setTeachers(teachers.map(t => 
        t.id === teacher.id ? { ...t, specializations: newSpecs } : t
      ));

      await teacherService.updateSpecializations(teacher.id, newSpecs);
    } catch (err) {
      setError('Failed to update teacher assignment: ' + err.message);
      // Revert fetch on error
      fetchData(); 
    }
  };

  // Helper to get teachers qualified for a specific service
  const getQualifiedTeachers = (serviceName) => {
    return teachers.filter(t => t.specializations && t.specializations.includes(serviceName));
  };

  if (loading) return <Loading />;

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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>Manage Services</h1>
        <button
          onClick={() => setShowAddService(!showAddService)}
          style={{
            padding: '10px 20px',
            backgroundColor: showAddService ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {showAddService ? 'Cancel' : '+ Create New Service'}
        </button>
      </div>

      {success && (
        <div style={{ padding: '12px', backgroundColor: '#d4edda', color: '#155724', marginBottom: '20px', borderRadius: '4px' }}>
          ✅ {success}
        </div>
      )}
      <ErrorMessage message={error} />

      {/* Add Service Form */}
      {showAddService && (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '25px',
          marginBottom: '30px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{ marginTop: 0 }}>Create New Service</h2>
          <form onSubmit={handleAddService}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Service Name *</label>
              <input
                required
                type="text"
                value={newService.name}
                onChange={(e) => setNewService({...newService, name: e.target.value})}
                placeholder="e.g., Speech Therapy"
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Description</label>
              <textarea
                rows="2"
                value={newService.description}
                onChange={(e) => setNewService({...newService, description: e.target.value})}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Type *</label>
                <select
                  value={newService.type}
                  onChange={(e) => setNewService({...newService, type: e.target.value})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  {serviceTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Color Code</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="color"
                    value={newService.color}
                    onChange={(e) => setNewService({...newService, color: e.target.value})}
                    style={{ width: '50px', height: '42px', padding: '0', border: 'none', cursor: 'pointer' }}
                  />
                  <input 
                    type="text" 
                    value={newService.color}
                    onChange={(e) => setNewService({...newService, color: e.target.value})}
                    style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '12px 24px',
                backgroundColor: submitting ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? 'Creating...' : 'Create Service'}
            </button>
          </form>
        </div>
      )}

      {/* Services List Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {services.map(service => {
          const qualifiedTeachers = getQualifiedTeachers(service.name);
          
          return (
            <div key={service.id} style={{
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderRadius: '8px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Card Header */}
              <div style={{ backgroundColor: service.color, padding: '15px', color: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ margin: '0 0 5px 0', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>{service.name}</h3>
                  <span style={{ 
                    backgroundColor: 'rgba(255,255,255,0.2)', 
                    padding: '2px 8px', 
                    borderRadius: '12px', 
                    fontSize: '12px' 
                  }}>
                    {service.type}
                  </span>
                </div>
                <div style={{ fontSize: '13px', opacity: 0.9 }}>
                  {service.active ? 'Active' : 'Inactive'}
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: '20px', flex: 1 }}>
                {service.description && (
                  <p style={{ margin: '0 0 15px 0', color: '#666', fontSize: '14px' }}>
                    {service.description}
                  </p>
                )}

                {/* Stats */}
                <div style={{ display: 'flex', gap: '20px', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: service.color }}>
                      {service.enrolledCount || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#888' }}>Enrolled Students</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#555' }}>
                      {qualifiedTeachers.length}
                    </div>
                    <div style={{ fontSize: '12px', color: '#888' }}>Qualified Teachers</div>
                  </div>
                </div>

                {/* Quick Teacher List */}
                <div style={{ marginBottom: '20px' }}>
                  <strong style={{ fontSize: '13px', color: '#333' }}>Teachers:</strong>
                  <div style={{ marginTop: '5px', fontSize: '13px', color: '#666', lineHeight: '1.4' }}>
                    {qualifiedTeachers.length > 0 ? (
                      qualifiedTeachers.map(t => `${t.firstName} ${t.lastName}`).join(', ')
                    ) : (
                      <span style={{ fontStyle: 'italic', color: '#999' }}>No teachers assigned</span>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                  <button
                    onClick={() => setSelectedService(service)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: '#333'
                    }}
                  >
                    View Details & Assign
                  </button>
                  {service.active && (
                    <button
                      onClick={() => handleDeactivate(service.id, service.name)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#fff',
                        border: '1px solid #dc3545',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: '#dc3545'
                      }}
                      title="Deactivate Service"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {services.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          No services found. Click "Create New Service" to start.
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {selectedService && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            {/* Modal Header */}
            <div style={{ 
              padding: '20px', 
              borderBottom: '1px solid #eee', 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: selectedService.color,
              color: 'white',
              borderRadius: '8px 8px 0 0'
            }}>
              <h2 style={{ margin: 0 }}>{selectedService.name} - Details</h2>
              <button 
                onClick={() => setSelectedService(null)}
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <div style={{ padding: '25px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                
                {/* LEFT COLUMN: Student List */}
                <div>
                  <h3 style={{ marginTop: 0, borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                    📚 Enrolled Students ({selectedService.enrolledChildren?.length || 0})
                  </h3>
                  
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {selectedService.enrolledChildren && selectedService.enrolledChildren.length > 0 ? (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {selectedService.enrolledChildren.map(child => (
                          <li key={child.id} style={{ 
                            padding: '10px', 
                            borderBottom: '1px solid #f0f0f0',
                            display: 'flex',
                            alignItems: 'center'
                          }}>
                            <div style={{
                              width: '30px', height: '30px', 
                              backgroundColor: selectedService.color, 
                              borderRadius: '50%',
                              color: 'white',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              marginRight: '10px',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>
                              {child.firstName.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontWeight: '500' }}>{child.firstName} {child.lastName}</div>
                              <div style={{ fontSize: '12px', color: '#666' }}>
                                Age: {Math.floor((new Date() - new Date(child.dateOfBirth)) / 31557600000)}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ color: '#666', fontStyle: 'italic' }}>No students currently enrolled.</p>
                    )}
                  </div>
                </div>

                {/* RIGHT COLUMN: Teacher Assignments */}
                <div>
                  <h3 style={{ marginTop: 0, borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                    👨‍🏫 Qualified Teachers
                  </h3>
                  <p style={{ fontSize: '13px', color: '#666' }}>
                    Select teachers qualified to provide this service:
                  </p>

                  <div style={{ maxHeight: '300px', overflowY: 'auto', backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '4px' }}>
                    {teachers.map(teacher => {
                      const isAssigned = teacher.specializations?.includes(selectedService.name);
                      
                      return (
                        <div key={teacher.id} style={{ padding: '8px 0' }}>
                          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={isAssigned}
                              onChange={() => toggleTeacherAssignment(teacher, selectedService.name)}
                              style={{ width: '18px', height: '18px', marginRight: '10px', accentColor: selectedService.color }}
                            />
                            <span style={{ fontWeight: isAssigned ? 'bold' : 'normal' }}>
                              {teacher.firstName} {teacher.lastName}
                            </span>
                          </label>
                        </div>
                      );
                    })}
                    {teachers.length === 0 && <p>No teachers available in the system.</p>}
                  </div>
                </div>

              </div>

              {/* Footer Actions */}
              <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #eee', textAlign: 'right' }}>
                <button
                  onClick={() => setSelectedService(null)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OtherServices;