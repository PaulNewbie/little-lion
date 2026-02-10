import React from 'react';
import { useNavigate } from 'react-router-dom';
import useManageAdmins from '../../hooks/useManageAdmins';
import Sidebar from '../../components/sidebar/Sidebar';
import { getAdminConfig } from '../../components/sidebar/sidebarConfigs';
import Loading from '../../components/common/Loading';
import BackButton from '../../components/common/BackButton';
import './css/ManageAdmins.css';

const ManageAdmins = () => {
  const navigate = useNavigate();
  const {
    admins,
    loading,
    error,
    newAdmin,
    handleInputChange,
    createAdmin,
    deleteAdmin
  } = useManageAdmins();

  return (
    <div className="sidebar-page">
      <Sidebar {...getAdminConfig(true)} />
      {loading ? (
        <Loading role="admin" message="Loading admins" variant="content" />
      ) : (
      <div className="sidebar-page__content sidebar-page__body">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <BackButton />
          <h1 style={{ color: '#2c3e50', margin: 0 }}>Manage Administrators</h1>
        </div>
        {error && <div style={{ color: 'red', marginBottom: '10px' }}>Error: {error}</div>}

        {/* Creation Form */}
        <div style={{ border: '1px solid #ddd', padding: '25px', marginBottom: '30px', borderRadius: '12px', backgroundColor: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0, color: '#444' }}>Add New Admin</h3>
          <form onSubmit={createAdmin}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', alignItems: 'end' }}>

              <div>
                <label style={{display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '600'}}>First Name</label>
                <input
                  name="firstName"
                  placeholder="First Name"
                  value={newAdmin.firstName}
                  onChange={handleInputChange}
                  required
                  style={{ padding: '10px', width: '100%', border: '1px solid #ccc', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '600'}}>Last Name</label>
                <input
                  name="lastName"
                  placeholder="Last Name"
                  value={newAdmin.lastName}
                  onChange={handleInputChange}
                  required
                  style={{ padding: '10px', width: '100%', border: '1px solid #ccc', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '600'}}>Email</label>
                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  value={newAdmin.email}
                  onChange={handleInputChange}
                  required
                  style={{ padding: '10px', width: '100%', border: '1px solid #ccc', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '600'}}>Phone</label>
                <input
                  name="phone"
                  placeholder="Phone"
                  value={newAdmin.phone}
                  onChange={handleInputChange}
                  style={{ padding: '10px', width: '100%', border: '1px solid #ccc', borderRadius: '6px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ fontSize: '13px', color: '#666' }}>
                Default Password: <strong>{newAdmin.password}</strong>
              </div>
              <button
                type="submit"
                className="admin-create-btn"
                style={{
                  padding: '12px 28px',
                  backgroundColor: '#fbbf24',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '700',
                  borderRadius: '8px',
                  fontSize: '14px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  minWidth: '180px'
                }}
              >
                + Create Admin
              </button>
            </div>
          </form>
        </div>

        {/* List of Admins */}
        <h3 style={{ color: '#444' }}>Existing Admins ({admins.length})</h3>
        <div style={{ overflowX: 'auto' }}>
          <table border="0" cellPadding="15" style={{ width: '100%', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#34495e', color: 'white' }}>
              <tr>
                <th style={{ textAlign: 'left' }}>Name</th>
                <th style={{ textAlign: 'left' }}>Email</th>
                <th style={{ textAlign: 'left' }}>Phone</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.length === 0 && (
                <tr><td colSpan="4" style={{textAlign: 'center', padding: '20px', color: '#888'}}>No admins found.</td></tr>
              )}
              {admins.map(admin => (
                <tr key={admin.uid} style={{ borderBottom: '1px solid #eee' }}>
                  <td>
                    {admin.firstName || admin.lastName
                      ? `${admin.firstName || ''} ${admin.lastName || ''}`.trim()
                      : admin.name || admin.displayName || admin.email?.split('@')[0] || 'Unknown'}
                  </td>
                  <td>{admin.email}</td>
                  <td>{admin.phone || admin.phoneNumber || admin.contactNumber || 'N/A'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      onClick={() => deleteAdmin(admin.uid)}
                      style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius: '4px', fontSize: '13px' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
};

export default ManageAdmins;