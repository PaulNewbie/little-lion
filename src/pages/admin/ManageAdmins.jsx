import React from 'react';
import useManageAdmins from '../../hooks/useManageAdmins';
import AdminSidebar from '../../components/sidebar/AdminSidebar';

const ManageAdmins = () => {
  const {
    admins,
    loading,
    error,
    newAdmin,
    handleInputChange,
    createAdmin,
    deleteAdmin
  } = useManageAdmins();

  if (loading) return <div>Loading admins...</div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar />
      <div style={{ padding: '20px', width: '100%', backgroundColor: '#f8f9fa' }}>
        <h1 style={{ color: '#2c3e50' }}>Manage Administrators</h1>
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

              <div>
                <button type="submit" style={{ padding: '12px', backgroundColor: '#2ecc71', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', borderRadius: '6px', width: '100%' }}>
                  + Create Admin
                </button>
              </div>
            </div>
            <div style={{ fontSize: '13px', color: '#666', marginTop: '10px' }}>
              Default Password: <strong>{newAdmin.password}</strong>
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
                  <td>{admin.firstName} {admin.lastName}</td>
                  <td>{admin.email}</td>
                  <td>{admin.phone || 'N/A'}</td>
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
    </div>
  );
};

export default ManageAdmins;