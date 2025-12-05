import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import servicesService from '../../services/servicesService';
import ErrorMessage from '../common/ErrorMessage';
import Loading from '../common/Loading';

const OtherServices = () => {
  const navigate = useNavigate();
  
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [showAddService, setShowAddService] = useState(false);
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    type: 'Therapy',
    color: '#4ECDC4',
    active: true
  });

  const serviceTypes = ['Therapy', 'Class', 'Assessment', 'Other'];

  // Fetch services on load
  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const data = await servicesService.getServicesWithStats();
      setServices(data);
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
      
      // Reset form
      setNewService({
        name: '',
        description: '',
        type: 'Therapy',
        color: '#4ECDC4',
        active: true
      });
      setShowAddService(false);
      
      // Refresh list
      fetchServices();
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
      fetchServices();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <Loading />;

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
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
            cursor: 'pointer'
          }}
        >
          {showAddService ? 'Cancel' : '+ Create New Service'}
        </button>
      </div>

      {success && (
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#d4edda', 
          color: '#155724', 
          marginBottom: '20px', 
          borderRadius: '4px'
        }}>
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
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h2 style={{ marginTop: 0 }}>Create New Service</h2>
          
          <form onSubmit={handleAddService}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
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
                  borderRadius: '4px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Description
              </label>
              <textarea
                rows="3"
                value={newService.description}
                onChange={(e) => setNewService({...newService, description: e.target.value})}
                placeholder="Brief description..."
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  fontFamily: 'inherit'
                }}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Service Type *
                </label>
                <select
                  value={newService.type}
                  onChange={(e) => setNewService({...newService, type: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px'
                  }}
                >
                  {serviceTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Color 🎨
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

      {/* Services List */}
      <h2>All Services ({services.length})</h2>
      
      {services.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          color: '#666'
        }}>
          No services created yet. Click "Create New Service" to add one.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {services.map(service => (
            <div 
              key={service.id}
              style={{
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                overflow: 'hidden'
              }}
            >
              {/* Header */}
              <div 
                style={{
                  backgroundColor: service.color,
                  padding: '15px',
                  color: 'white'
                }}
              >
                <h3 style={{ margin: '0 0 5px 0' }}>{service.name}</h3>
                <small style={{ opacity: 0.9 }}>
                  {service.type} • {service.active ? 'Active' : 'Inactive'}
                </small>
              </div>

              {/* Body */}
              <div style={{ padding: '15px' }}>
                {service.description && (
                  <p style={{ margin: '0 0 15px 0', color: '#666' }}>
                    {service.description}
                  </p>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <strong style={{ fontSize: '14px' }}>📚 Enrolled Children</strong>
                    <p style={{ margin: '5px 0 0', fontSize: '24px', fontWeight: 'bold', color: service.color }}>
                      {service.enrolledCount || 0}
                    </p>
                  </div>
                  <div>
                    <strong style={{ fontSize: '14px' }}>Status</strong>
                    <p style={{ margin: '5px 0 0', fontSize: '14px', color: service.active ? '#28a745' : '#dc3545' }}>
                      {service.active ? '✅ Active' : '❌ Inactive'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Edit
                  </button>
                  {service.active && (
                    <button
                      onClick={() => handleDeactivate(service.id, service.name)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#ffc107',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OtherServices;