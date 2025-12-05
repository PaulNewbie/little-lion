import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const DashboardLayout = ({ title, subtitle, showBack, actions, children }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f6f8', fontFamily: 'system-ui, sans-serif' }}>
      {/* Top Navigation Bar */}
      <nav style={{ backgroundColor: 'white', borderBottom: '1px solid #e0e0e0', padding: '0 20px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {showBack && (
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#666' }}>
              ←
            </button>
          )}
          <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#333' }}>Little Lions</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>
            {currentUser?.firstName} ({currentUser?.role})
          </span>
          <button 
            onClick={handleLogout}
            style={{ padding: '6px 12px', fontSize: '13px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main style={{ maxWidth: '1000px', margin: '30px auto', padding: '0 20px' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' }}>
          <div>
            <h1 style={{ margin: '0 0 5px 0', fontSize: '24px', color: '#1f2937' }}>{title}</h1>
            {subtitle && <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>{subtitle}</p>}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>{actions}</div>
        </div>

        {/* Content */}
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;