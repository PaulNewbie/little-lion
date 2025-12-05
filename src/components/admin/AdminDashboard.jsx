import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const AdminDashboard = () => {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const menuItems = [
    {
      title: "1 on 1",
      description: "Manage individual therapy sessions and view student profiles.",
      path: "/admin/one-on-one",
      color: "#4ECDC4",
      icon: "👤"
    },
    {
      title: "Play Group",
      description: "Upload group activity photos and tag students.",
      path: "/admin/play-group",
      color: "#FF6B6B",
      icon: "👥"
    },
    {
      title: "Enroll Child",
      description: "Register new students and link parent accounts.",
      path: "/admin/enroll-child",
      color: "#FFE66D",
      icon: "📝"
    },
    {
      title: "Manage Teachers",
      description: "Add teachers and assign their specializations.",
      path: "/admin/manage-teachers",
      color: "#95E1D3",
      icon: "👨‍🏫"
    },
    {
      title: "Other Services",
      description: "Configure services and view enrolled children.",
      path: "/admin/services",
      color: "#1A535C",
      icon: "⚙️"
    }
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '10px',
        paddingBottom: '20px',
        borderBottom: '2px solid #eee'
      }}>
        <div>
          <h1 style={{ margin: '0 0 5px 0' }}>Admin Dashboard</h1>
          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
            Welcome back, {currentUser?.firstName || 'Admin'}
          </p>
        </div>
        <button 
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '500'
          }}
        >
          Logout
        </button>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '20px',
        marginTop: '30px'
      }}>
        {menuItems.map((item, index) => (
          <div 
            key={index}
            onClick={() => navigate(item.path)}
            style={{
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderRadius: '12px',
              padding: '25px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              transition: 'all 0.3s ease',
              borderTop: `4px solid ${item.color}`,
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
            }}
          >
            <div style={{ 
              fontSize: '36px', 
              marginBottom: '15px',
              opacity: 0.9
            }}>
              {item.icon}
            </div>
            <h2 style={{ 
              color: '#333', 
              marginTop: 0, 
              marginBottom: '10px',
              fontSize: '20px'
            }}>
              {item.title}
            </h2>
            <p style={{ 
              color: '#666', 
              lineHeight: '1.6',
              margin: 0,
              fontSize: '14px'
            }}>
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;