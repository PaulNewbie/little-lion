import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const AdminDashboard = () => {
  const { logout } = useAuth();
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
      color: "#4ECDC4" // Teal
    },
    {
      title: "Play Group",
      description: "Upload group activity photos and tag students.",
      path: "/admin/play-group",
      color: "#FF6B6B" // Red/Coral
    },
    {
      title: "Enroll Child",
      description: "Register new students and link parent accounts.",
      path: "/admin/enroll-child",
      color: "#FFE66D" // Yellow
    },
    {
      title: "Other Services",
      description: "Configure services and assign qualified teachers.",
      path: "/admin/services",
      color: "#1A535C" // Dark Blue/Green
    }
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Admin Dashboard</h1>
        <button 
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
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

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px' 
      }}>
        {menuItems.map((item, index) => (
          <div 
            key={index}
            onClick={() => navigate(item.path)}
            style={{
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '20px',
              cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s',
              borderTop: `5px solid ${item.color}`
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <h2 style={{ color: '#333', marginTop: 0 }}>{item.title}</h2>
            <p style={{ color: '#666', lineHeight: '1.5' }}>{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;