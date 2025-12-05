import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import childService from '../../services/childService';
import Loading from '../common/Loading';
import ErrorMessage from '../common/ErrorMessage';

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
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
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
              <div style={{ backgroundColor: '#4ECDC4', padding: '15px' }}>
                <h3 style={{ margin: 0, color: 'white' }}>
                  {child.firstName} {child.lastName}
                </h3>
              </div>
              
              <div style={{ padding: '20px' }}>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Age:</strong> {calculateAge(child.dateOfBirth)} years old
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Gender:</strong> <span style={{ textTransform: 'capitalize' }}>{child.gender}</span>
                </div>
                {child.medicalInfo && (
                  <div style={{ marginBottom: '15px' }}>
                    <strong>Medical Info:</strong>
                    <p style={{ margin: '5px 0 0', fontSize: '14px', color: '#666' }}>
                      {child.medicalInfo}
                    </p>
                  </div>
                )}
                
                <button style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: '#333',
                  fontWeight: '500'
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