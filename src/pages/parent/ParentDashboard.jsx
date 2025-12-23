import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import childService from '../../services/childService';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
// ✅ IMPORT THE NEW CARD
import TherapistCard from '../../components/common/TherapistCard';

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

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const difference = Date.now() - birthDate.getTime();
    const ageDate = new Date(difference); 
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  if (loading) return <Loading />;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Header Section */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '20px' 
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#333' }}>Parent Dashboard</h1>
          <p style={{ margin: '5px 0 0', color: '#666' }}>Welcome back, {currentUser?.firstName || 'Parent'}</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => navigate('/parent/inquiries')}
            style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            ✉️ My Inquiries
          </button>
          <button 
            onClick={handleLogout}
            style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Logout
          </button>
        </div>
      </div>

      <ErrorMessage message={error} />

      {/* Children Grid */}
      <h2 style={{ color: '#444', marginBottom: '20px' }}>My Children</h2>
      
      {children.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f8f9fa', borderRadius: '8px', color: '#666' }}>
          <p>No children are linked to your account yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {children.map(child => (
            <div key={child.id} style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden', border: '1px solid #f3f4f6' }}>
              
              {/* Child Header */}
              <div style={{ backgroundColor: '#4ECDC4', padding: '20px' }}>
                <h3 style={{ margin: 0, color: 'white', fontSize: '20px' }}>{child.firstName} {child.lastName}</h3>
                <p style={{ margin: '5px 0 0', color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>
                  {calculateAge(child.dateOfBirth)} years old • <span style={{ textTransform: 'capitalize' }}>{child.gender}</span>
                </p>
              </div>
              
              {/* Body */}
              <div style={{ padding: '20px' }}>
                
                {/* 1. ✅ Therapy Team Section (NEW) */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '14px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                    🩺 Therapy Team
                  </h4>
                  
                  {child.therapyServices && child.therapyServices.length > 0 ? (
                    <div>
                      {child.therapyServices.map((service, idx) => (
                        <TherapistCard 
                          key={`${service.serviceId}-${idx}`}
                          therapistId={service.therapistId}
                          serviceName={service.serviceName}
                        />
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '14px', color: '#94a3b8', fontStyle: 'italic' }}>No therapy services assigned.</p>
                  )}
                </div>

                {/* 2. Group Classes Section (Existing, slightly styled) */}
                {child.groupClasses && child.groupClasses.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '14px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                      🎨 Group Classes
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {child.groupClasses.map((cls, idx) => (
                        <div key={idx} style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <strong style={{ display: 'block', color: '#334155' }}>{cls.serviceName}</strong>
                          <span style={{ fontSize: '13px', color: '#64748b' }}>Teacher: {cls.teacherName || 'TBA'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* View Activities Button */}
                <button 
                  onClick={() => navigate(`/parent/child/${child.id}`)}
                  style={{ width: '100%', padding: '12px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', marginTop: '10px' }}
                >
                  View Daily Reports & Activities →
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