import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import childService from '../../services/childService';
import servicesService from '../../services/servicesService';
import teacherService from '../../services/teacherService';
import ErrorMessage from '../common/ErrorMessage';
import Loading from '../common/Loading';

const EnrollChild = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Data from Firebase
  const [availableServices, setAvailableServices] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);

  // Form State
  const [childInfo, setChildInfo] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'select',
    medicalInfo: ''
  });

  const [parentInfo, setParentInfo] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    password: 'Welcome123!'
  });

  const [selectedServices, setSelectedServices] = useState([]);

  // Fetch services and teachers on load
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [servicesData, teachersData] = await Promise.all([
        servicesService.getActiveServices(),
        teacherService.getAllTeachers()
      ]);
      setAvailableServices(servicesData);
      setAllTeachers(teachersData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (service) => {
    if (selectedServices.some(s => s.serviceId === service.id)) {
      setSelectedServices(selectedServices.filter(s => s.serviceId !== service.id));
    } else {
      // Find teachers qualified for this service
      const qualifiedTeachers = allTeachers.filter(teacher => 
        teacher.specializations && teacher.specializations.includes(service.name)
      );

      if (qualifiedTeachers.length === 0) {
        alert(`No teachers available for ${service.name}. Please assign teachers first.`);
        return;
      }

      setSelectedServices([
        ...selectedServices,
        {
          serviceId: service.id,
          serviceName: service.name,
          teacherId: qualifiedTeachers[0].id,
          teacherName: `${qualifiedTeachers[0].firstName} ${qualifiedTeachers[0].lastName}`
        }
      ]);
    }
  };

  const updateServiceTeacher = (serviceId, teacherId) => {
    const teacher = allTeachers.find(t => t.id === teacherId);
    
    setSelectedServices(selectedServices.map(s => 
      s.serviceId === serviceId 
        ? { ...s, teacherId: teacherId, teacherName: `${teacher.firstName} ${teacher.lastName}` }
        : s
    ));
  };

  const getQualifiedTeachers = (serviceName) => {
    return allTeachers.filter(teacher => 
      teacher.specializations && teacher.specializations.includes(serviceName)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const parentUser = await authService.createParentAccount(
        parentInfo.email,
        parentInfo.password,
        {
          firstName: parentInfo.firstName,
          lastName: parentInfo.lastName,
          phone: parentInfo.phone,
          email: parentInfo.email
        }
      );

      const teacherIds = [...new Set(selectedServices.map(s => s.teacherId))];
      
      await childService.enrollChild(
        {
          ...childInfo,
          services: selectedServices,
          teacherIds: teacherIds
        },
        parentUser.uid
      );

      setSuccess(
        `Successfully enrolled ${childInfo.firstName} with ${selectedServices.length} service(s) and created account for ${parentInfo.email}`
      );
      
      // Reset form
      setChildInfo({ firstName: '', lastName: '', dateOfBirth: '', gender: 'select', medicalInfo: '' });
      setParentInfo({ email: '', firstName: '', lastName: '', phone: '', password: 'Welcome123!' });
      setSelectedServices([]);

    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
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

      <h1>Enroll New Child</h1>

      {success && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#d4edda', 
          color: '#155724', 
          marginBottom: '20px', 
          borderRadius: '4px',
          border: '1px solid #c3e6cb'
        }}>
          ✅ {success}
        </div>
      )}
      <ErrorMessage message={error} />

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '25px' }}>
        
        {/* SECTION 1: CHILD INFO */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '25px', 
          borderRadius: '8px', 
          border: '1px solid #ddd',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginTop: 0, color: '#333', borderBottom: '2px solid #4ECDC4', paddingBottom: '10px' }}>
            Child Information
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>First Name *</label>
              <input 
                required
                type="text" 
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                value={childInfo.firstName}
                onChange={(e) => setChildInfo({...childInfo, firstName: e.target.value})}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Last Name *</label>
              <input 
                required
                type="text" 
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                value={childInfo.lastName}
                onChange={(e) => setChildInfo({...childInfo, lastName: e.target.value})}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Date of Birth *</label>
              <input 
                required
                type="date" 
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                value={childInfo.dateOfBirth}
                onChange={(e) => setChildInfo({...childInfo, dateOfBirth: e.target.value})}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Gender *</label>
              <select 
                required
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                value={childInfo.gender}
                onChange={(e) => setChildInfo({...childInfo, gender: e.target.value})}
              >
                <option value="select">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Medical Info / Allergies</label>
              <textarea 
                rows="3"
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                value={childInfo.medicalInfo}
                onChange={(e) => setChildInfo({...childInfo, medicalInfo: e.target.value})}
                placeholder="Any medical conditions, allergies, or special notes..."
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: PARENT INFO */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '25px', 
          borderRadius: '8px', 
          border: '1px solid #ddd',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginTop: 0, color: '#333', borderBottom: '2px solid #FF6B6B', paddingBottom: '10px' }}>
            Parent Account Creation
          </h2>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
            This will create a login for the parent. They can change their password later.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Parent Email (Login ID) *</label>
              <input 
                required
                type="email" 
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                value={parentInfo.email}
                onChange={(e) => setParentInfo({...parentInfo, email: e.target.value})}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Parent First Name *</label>
              <input 
                required
                type="text" 
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                value={parentInfo.firstName}
                onChange={(e) => setParentInfo({...parentInfo, firstName: e.target.value})}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Parent Last Name *</label>
              <input 
                required
                type="text" 
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                value={parentInfo.lastName}
                onChange={(e) => setParentInfo({...parentInfo, lastName: e.target.value})}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Phone Number *</label>
              <input 
                required
                type="tel" 
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                value={parentInfo.phone}
                onChange={(e) => setParentInfo({...parentInfo, phone: e.target.value})}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Initial Password</label>
              <input 
                type="text" 
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9' }}
                value={parentInfo.password}
                readOnly
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: ASSIGN SERVICES */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '25px', 
          borderRadius: '8px', 
          border: '1px solid #ddd',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginTop: 0, color: '#333', borderBottom: '2px solid #FFE66D', paddingBottom: '10px' }}>
            Assign Services
          </h2>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
            Select which services this child will be enrolled in and assign a teacher for each.
          </p>

          {availableServices.length === 0 ? (
            <div style={{
              padding: '20px',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '4px',
              color: '#856404',
              textAlign: 'center'
            }}>
              ⚠️ No services available. Please create services first in "Other Services" section.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {availableServices.map(service => {
                const isSelected = selectedServices.some(s => s.serviceId === service.id);
                const selectedServiceData = selectedServices.find(s => s.serviceId === service.id);
                const qualifiedTeachers = getQualifiedTeachers(service.name);

                return (
                  <div 
                    key={service.id}
                    style={{
                      border: `2px solid ${isSelected ? service.color : '#e0e0e0'}`,
                      borderRadius: '8px',
                      padding: '15px',
                      backgroundColor: isSelected ? `${service.color}15` : '#fafafa',
                      transition: 'all 0.3s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleService(service)}
                        style={{ 
                          marginTop: '4px',
                          width: '20px', 
                          height: '20px', 
                          cursor: 'pointer',
                          accentColor: service.color
                        }}
                      />
                      
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          <div 
                            style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              backgroundColor: service.color
                            }}
                          />
                          <strong style={{ fontSize: '16px', color: '#333' }}>{service.name}</strong>
                          <span style={{ fontSize: '12px', color: '#666' }}>
                            ({qualifiedTeachers.length} teacher{qualifiedTeachers.length !== 1 ? 's' : ''} available)
                          </span>
                        </div>

                        {isSelected && qualifiedTeachers.length > 0 && (
                          <div style={{ marginTop: '12px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                              Assign Teacher:
                            </label>
                            <select
                              value={selectedServiceData?.teacherId || ''}
                              onChange={(e) => updateServiceTeacher(service.id, e.target.value)}
                              style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '14px'
                              }}
                            >
                              {qualifiedTeachers.map(teacher => (
                                <option key={teacher.id} value={teacher.id}>
                                  {teacher.firstName} {teacher.lastName}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {selectedServices.length === 0 && availableServices.length > 0 && (
            <div style={{
              marginTop: '15px',
              padding: '12px',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '4px',
              color: '#856404',
              fontSize: '14px'
            }}>
              ⚠️ No services selected. Child will be enrolled without any services.
            </div>
          )}

          {selectedServices.length > 0 && (
            <div style={{
              marginTop: '15px',
              padding: '12px',
              backgroundColor: '#d4edda',
              border: '1px solid #c3e6cb',
              borderRadius: '4px',
              color: '#155724',
              fontSize: '14px'
            }}>
              ✅ {selectedServices.length} service(s) selected
            </div>
          )}
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={submitting || childInfo.gender === 'select'}
          style={{
            padding: '16px',
            backgroundColor: submitting || childInfo.gender === 'select' ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '18px',
            cursor: submitting || childInfo.gender === 'select' ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          {submitting ? 'Processing...' : 'Enroll Child & Create Parent Account'}
        </button>

      </form>
    </div>
  );
};

export default EnrollChild;