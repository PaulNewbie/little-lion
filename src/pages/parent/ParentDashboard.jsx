import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import childService from '../../services/childService';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
const ParentDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch children when the component loads
  useEffect(() => {
    const fetchChildren = async () => {
      if (currentUser?.uid) {
        try {
          const data = await childService.getChildrenByParentId(currentUser.uid);
          setChildren(data);
        } catch (err) {
          setError('Failed to load your children profiles.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchChildren();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  // Helper to calculate age from DOB
  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const difference = Date.now() - birthDate.getTime();
    const ageDate = new Date(difference); 
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  if (loading) return <Loading />;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header Section */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px',
        borderBottom: '1px solid #eee',
        paddingBottom: '20px'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#333' }}>Parent Dashboard</h1>
          <p style={{ margin: '5px 0 0', color: '#666' }}>
            Welcome back, {currentUser?.firstName || 'Parent'}
          </p>
        </div>
        <button 
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>

      <ErrorMessage message={error} />

      {/* Children Grid */}
      <h2 style={{ color: '#444', marginBottom: '20px' }}>My Children</h2>
      
      {children.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          color: '#666'
        }}>
          <p>No children are linked to your account yet.</p>
          <small>Please contact the school administrator if this is a mistake.</small>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: '20px' 
        }}>
          {children.map(child => (
            <div key={child.id} style={{
              backgroundColor: 'white',
              borderRadius: '10px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              border: '1px solid #eaeaea'
            }}>
              {/* Header */}
              <div style={{ backgroundColor: '#4ECDC4', padding: '20px' }}>
                <h3 style={{ margin: 0, color: 'white', fontSize: '20px' }}>
                  {child.firstName} {child.lastName}
                </h3>
                <p style={{ margin: '5px 0 0', color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>
                  {calculateAge(child.dateOfBirth)} years old • <span style={{ textTransform: 'capitalize' }}>{child.gender}</span>
                </p>
              </div>
              
              {/* Body */}
              <div style={{ padding: '20px' }}>
                
                {/* Medical Info */}
                {child.medicalInfo && (
                  <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#fff3cd', borderRadius: '4px', border: '1px solid #ffc107' }}>
                    <strong style={{ fontSize: '13px', color: '#856404' }}>⚠️ Medical Info:</strong>
                    <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#856404' }}>
                      {child.medicalInfo}
                    </p>
                  </div>
                )}

                {/* Enrolled Services */}
                <div style={{ marginBottom: '20px' }}>
                  <strong style={{ fontSize: '14px', color: '#333', display: 'block', marginBottom: '10px' }}>
                    📚 Enrolled Services
                  </strong>
                  
                  {child.services && child.services.length > 0 ? (
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {child.services.map((service, index) => (
                        <div 
                          key={index}
                          style={{
                            padding: '10px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '6px',
                            border: '1px solid #e0e0e0'
                          }}
                        >
                          <div style={{ fontWeight: '500', fontSize: '14px', color: '#333', marginBottom: '4px' }}>
                            {service.serviceName}
                          </div>
                          <div style={{ fontSize: '13px', color: '#666' }}>
                            👨‍🏫 {service.teacherName}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: '13px', color: '#999', fontStyle: 'italic' }}>
                      No services enrolled yet
                    </p>
                  )}
                </div>
                
                {/* View Activities Button */}
                <button style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '14px'
                }}>
                  View Activities & Reports
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;