import React from 'react';
import useManageTeachers from '../../hooks/useManageTeachers';

const ManageTeachers = () => {
  const {
    teachers,
    services,
    loading,
    error,
    newTeacher,
    handleInputChange,
    toggleSpecialization,
    createTeacher,
    deleteTeacher
  } = useManageTeachers();

  if (loading) return <div>Loading teachers...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Manage Teachers</h1>
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}

      {/* Simplified Creation Form */}
      <div style={{ border: '1px solid #ccc', padding: '20px', marginBottom: '20px' }}>
        <h3>Add New Teacher</h3>
        <form onSubmit={createTeacher}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px' }}>
            <input 
              name="firstName" 
              placeholder="First Name" 
              value={newTeacher.firstName} 
              onChange={handleInputChange} 
              required 
            />
            <input 
              name="lastName" 
              placeholder="Last Name" 
              value={newTeacher.lastName} 
              onChange={handleInputChange} 
              required 
            />
            <input 
              name="email" 
              type="email" 
              placeholder="Email" 
              value={newTeacher.email} 
              onChange={handleInputChange} 
              required 
            />
            <input 
              name="phone" 
              placeholder="Phone" 
              value={newTeacher.phone} 
              onChange={handleInputChange} 
            />
            <input 
              name="password" 
              value={newTeacher.password} 
              readOnly 
              style={{ background: '#eee' }} 
            />
            
            <div>
              <p>Specializations:</p>
              {services.map(s => (
                <label key={s.id} style={{ display: 'block' }}>
                  <input 
                    type="checkbox" 
                    checked={newTeacher.specializations.includes(s.name)}
                    onChange={() => toggleSpecialization(s.name)}
                  />
                  {s.name}
                </label>
              ))}
            </div>

            <button type="submit">Create Account</button>
          </div>
        </form>
      </div>

      {/* Raw List of Teachers */}
      <h3>Teacher List ({teachers.length})</h3>
      <table border="1" cellPadding="5" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Specs</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {teachers.map(t => (
            <tr key={t.id}>
              <td>{t.firstName} {t.lastName}</td>
              <td>{t.email}</td>
              <td>{t.specializations?.join(', ')}</td>
              <td>
                <button onClick={() => deleteTeacher(t.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManageTeachers;