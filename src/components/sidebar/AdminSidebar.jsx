import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const AdminSidebar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Helper to check if the current path matches the menu item
  const isActive = (path) => location.pathname === path;

  // --- STYLES ---
  const styles = {
    sidebar: {
      width: '280px',
      backgroundColor: '#f0f0f0',
      padding: '30px',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid #ddd',
      flexShrink: 0,
      minHeight: '100vh'
    },
    profileSection: {
      marginBottom: '40px',
      display: 'flex',
      alignItems: 'center',
      gap: '15px'
    },
    avatar: {
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      backgroundColor: '#FFD700',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px'
    },
    menuSection: { marginBottom: '30px' },
    sectionTitle: {
      fontSize: '12px',
      color: '#888',
      fontWeight: 'bold',
      marginBottom: '15px',
      textTransform: 'uppercase'
    },
    menuItem: (active) => ({
      display: 'flex',
      alignItems: 'center',
      padding: '10px 15px',
      cursor: 'pointer',
      color: active ? '#000' : '#444',
      fontWeight: active ? 'bold' : '500',
      fontSize: '16px',
      backgroundColor: active ? '#e0e0e0' : 'transparent',
      borderRadius: '8px',
      marginBottom: '5px'
    }),
    logoutBtn: {
      marginTop: 'auto',
      backgroundColor: '#EF4444',
      color: 'white',
      padding: '15px',
      border: 'none',
      borderRadius: '8px',
      fontWeight: 'bold',
      cursor: 'pointer',
      width: '100%'
    }
  };

  return (
    <div style={styles.sidebar}>
      {/* Profile Header */}
      <div style={styles.profileSection}>
        <div style={styles.avatar}>🦁</div>
        <div>
          <div style={{fontSize: '12px', color: '#666'}}>SUPER ADMIN</div>
          <div style={{fontSize: '20px', fontWeight: 'bold'}}>{currentUser?.firstName || 'Admin'}</div>
        </div>
      </div>

      {/* Main Menu */}
      <div style={styles.menuSection}>
        <div style={styles.sectionTitle}>MAIN</div>
        
        {/* Updated to point to /admin/one-on-one */}
        <div style={styles.menuItem(isActive('/admin/one-on-one'))} onClick={() => navigate('/admin/one-on-one')}>
          👤 1 : 1 SERVICES
        </div>
        
        <div style={styles.menuItem(isActive('/admin/play-group'))} onClick={() => navigate('/admin/play-group')}>
          👥 PLAY GROUP
        </div>
        <div style={styles.menuItem(isActive('/admin/services'))} onClick={() => navigate('/admin/services')}>
          ➕ ADD SERVICES
        </div>
      </div>

      {/* User Management */}
      <div style={styles.menuSection}>
        <div style={styles.sectionTitle}>USER MANAGEMENT</div>
        <div style={styles.menuItem(isActive('/admin/enroll-child'))} onClick={() => navigate('/admin/enroll-child')}>
          ➕ ADD PARENT
        </div>
        <div style={styles.menuItem(false)}>➕ ADD ADMIN</div>
        <div style={styles.menuItem(isActive('/admin/manage-teachers'))} onClick={() => navigate('/admin/manage-teachers')}>
          ➕ ADD TEACHER
        </div>
        {/* <div style={styles.menuItem(false)}>➕ ADD PARENT</div> */}
      </div>

      <button style={styles.logoutBtn} onClick={handleLogout}>LOG OUT</button>
    </div>
  );
};

export default AdminSidebar;