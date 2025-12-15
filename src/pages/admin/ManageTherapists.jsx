import React from 'react';
import useManageTherapists from '../../hooks/useManageTherapists';

const ManageTherapists = () => {
  const {
    therapists,
    services,
    loading,
    error,
    newTherapist,
    handleInputChange,
    toggleSpecialization,
    createTherapist,
    deleteTherapist
  } = useManageTherapists();

  if (loading) return <div>Loading therapists...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Manage Therapists</h1>
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}

      <div style={{ border: '1px solid #ccc', padding: '20px', marginBottom: '20px' }}>
        <h3>Add New Therapist</h3>
        <form onSubmit={createTherapist}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px' }}>
            <input 
              name="firstName" 
              placeholder="First Name" 
              value={newTherapist.firstName} 
              onChange={handleInputChange} 
              required 
            />
            <input 
              name="lastName" 
              placeholder="Last Name" 
              value={newTherapist.lastName} 
              onChange={handleInputChange} 
              required 
            />
            <input 
              name="email" 
              type="email" 
              placeholder="Email" 
              value={newTherapist.email} 
              onChange={handleInputChange} 
              required 
            />
            <input 
              name="phone" 
              placeholder="Phone" 
              value={newTherapist.phone} 
              onChange={handleInputChange} 
            />
            <input 
              name="password" 
              value={newTherapist.password} 
              readOnly 
              style={{ background: '#eee' }} 
            />
            
            <div>
              <p>Specializations:</p>
              {services.map(s => (
                <label key={s.id} style={{ display: 'block' }}>
                  <input 
                    type="checkbox" 
                    checked={newTherapist.specializations.includes(s.name)}
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

      <h3>Therapist List ({therapists.length})</h3>
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
          {therapists.map(t => (
            <tr key={t.id}>
              <td>{t.firstName} {t.lastName}</td>
              <td>{t.email}</td>
              <td>{t.specializations?.join(', ')}</td>
              <td>
                <button onClick={() => deleteTherapist(t.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManageTherapists;