import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import childService from '../../services/childService';

const AdminDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  // State for students and search
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch students on load
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await childService.getAllChildren();
        setStudents(data);
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Filter students based on search
  const filteredStudents = students.filter(student => 
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- STYLES ---
  const styles = {
    container: {
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#fff',
      fontFamily: 'sans-serif'
    },
    sidebar: {
      width: '280px',
      backgroundColor: '#f0f0f0', // Light grey sidebar background
      padding: '30px',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid #ddd'
    },
    main: {
      flex: 1,
      padding: '40px',
      backgroundColor: '#ffffff'
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
      backgroundColor: '#FFD700', // Yellow circle like design
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px'
    },
    menuSection: {
      marginBottom: '30px'
    },
    sectionTitle: {
      fontSize: '12px',
      color: '#888',
      fontWeight: 'bold',
      marginBottom: '15px',
      textTransform: 'uppercase'
    },
    menuItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '10px 0',
      cursor: 'pointer',
      color: '#444',
      fontWeight: '500',
      fontSize: '16px',
      textDecoration: 'none'
    },
    logoutBtn: {
      marginTop: 'auto',
      backgroundColor: '#EF4444', // Red color
      color: 'white',
      padding: '15px',
      border: 'none',
      borderRadius: '8px',
      fontWeight: 'bold',
      cursor: 'pointer',
      width: '100%'
    },
    searchBar: {
      width: '300px',
      padding: '10px 15px',
      borderRadius: '4px',
      border: '1px solid #ccc',
      backgroundColor: '#ccc', // Darker grey input background
      float: 'right',
      marginBottom: '40px'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
      gap: '20px',
      clear: 'both' // Clears the float from search bar
    },
    card: {
      backgroundColor: '#e0e0e0', // Grey card background
      borderRadius: '4px',
      overflow: 'hidden',
      textAlign: 'center'
    },
    cardImage: {
      width: '100%',
      height: '180px',
      backgroundColor: '#bdbdbd', // Darker grey for image placeholder
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '40px'
    },
    cardContent: {
      padding: '15px',
      backgroundColor: '#e0e0e0'
    },
    seeMore: {
      fontSize: '12px',
      color: '#333',
      textDecoration: 'underline',
      cursor: 'pointer',
      marginTop: '5px',
      display: 'block'
    }
  };

  return (
    <div style={styles.container}>
      
      {/* --- LEFT SIDEBAR --- */}
      <div style={styles.sidebar}>
        
        {/* Profile Header */}
        <div style={styles.profileSection}>
          <div style={styles.avatar}>🦁</div>
          <div>
            <div style={{fontSize: '12px', color: '#666'}}>SUPER ADMIN</div>
            <div style={{fontSize: '20px', fontWeight: 'bold'}}>{currentUser?.firstName || 'Admin'}</div>
          </div>
        </div>

        {/* Menu: Main */}
        <div style={styles.menuSection}>
          <div style={styles.sectionTitle}>MAIN</div>
          <div style={styles.menuItem} onClick={() => navigate('/admin/one-on-one')}>👤 1 : 1 SERVICES</div>
          <div style={styles.menuItem} onClick={() => navigate('/admin/play-group')}>👥 PLAY GROUP</div>
          <div style={styles.menuItem} onClick={() => navigate('/admin/services')}>➕ ADD SERVICES</div>
        </div>

        {/* Menu: User Management */}
        <div style={styles.menuSection}>
          <div style={styles.sectionTitle}>USER MANAGEMENT</div>
          <div style={styles.menuItem} onClick={() => navigate('/admin/enroll-child')}>➕ ADD PARENT</div>
          <div style={styles.menuItem}>➕ ADD ADMIN</div>
          <div style={styles.menuItem} onClick={() => navigate('/admin/manage-teachers')}>➕ ADD TEACHER</div>
          <div style={styles.menuItem}>➕ ENROLL</div>
        </div>

        <button style={styles.logoutBtn} onClick={handleLogout}>
          LOG OUT
        </button>
      </div>

      {/* --- RIGHT MAIN CONTENT --- */}
      <div style={styles.main}>
        
        {/* Search Bar */}
        <input 
          type="text" 
          placeholder="SEARCH" 
          style={styles.searchBar}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Loading State */}
        {loading && <p>Loading students...</p>}

        {/* Students Grid */}
        {!loading && (
          <div style={styles.grid}>
            {/* If no students, show a placeholder card just to see the UI */}
            {filteredStudents.length === 0 && (
              <div style={styles.card}>
                <div style={styles.cardImage}>📷</div>
                <div style={styles.cardContent}>
                  <p style={{fontWeight: 'bold'}}>No Students Found</p>
                </div>
              </div>
            )}

            {/* Real Data Map */}
            {filteredStudents.map((student) => (
              <div key={student.id} style={styles.card}>
                <div style={styles.cardImage}>
                  {/* We will eventually put the Cloudinary Image here */}
                  {student.photoUrl ? (
                    <img src={student.photoUrl} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                  ) : (
                    <span>📷</span>
                  )}
                </div>
                <div style={styles.cardContent}>
                  <p style={{fontWeight: 'bold', margin: '0 0 5px 0'}}>
                    {student.lastName}, {student.firstName}
                  </p>
                  <span style={styles.seeMore}>See More ›</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;