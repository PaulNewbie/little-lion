import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import childService from '../../services/childService';
import ErrorMessage from '../common/ErrorMessage';

const EnrollChild = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [childInfo, setChildInfo] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'select',
    medicalInfo: ''
  });

  const [parentInfo, setParentInfo] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    password: 'Welcome123!' // Default temporary password
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // 1. Create the Parent Account
      // Note: In a real app, you might check if parent exists first. 
      // For now, we assume we are creating a new one.
      const parentUser = await authService.createParentAccount(
        parentInfo.email,
        parentInfo.password,
        {
          firstName: parentInfo.firstName,
          lastName: parentInfo.lastName,
          phone: parentInfo.phone,
          email: parentInfo.email
        }
      );

      // 2. Create the Child and Link to Parent
      await childService.enrollChild(
        childInfo,
        parentUser.uid
      );

      setSuccess(`Successfully enrolled ${childInfo.firstName} and created account for ${parentInfo.email}`);
      
      // Reset form
      setChildInfo({ firstName: '', lastName: '', dateOfBirth: '', gender: 'select', medicalInfo: '' });
      setParentInfo({ email: '', firstName: '', lastName: '', phone: '', password: 'Welcome123!' });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <button 
        onClick={() => navigate('/admin/dashboard')}
        style={{ marginBottom: '20px', padding: '5px 10px', cursor: 'pointer' }}
      >
        ← Back to Dashboard
      </button>

      <h1>Enroll New Child</h1>

      {success && (
        <div style={{ padding: '10px', backgroundColor: '#d4edda', color: '#155724', marginBottom: '20px', borderRadius: '4px' }}>
          {success}
        </div>
      )}
      <ErrorMessage message={error} />

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '30px' }}>
        
        {/* SECTION 1: CHILD INFO */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h2 style={{ marginTop: 0, color: '#333' }}>Child Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>First Name</label>
              <input 
                required
                type="text" 
                style={{ width: '100%', padding: '8px' }}
                value={childInfo.firstName}
                onChange={(e) => setChildInfo({...childInfo, firstName: e.target.value})}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Last Name</label>
              <input 
                required
                type="text" 
                style={{ width: '100%', padding: '8px' }}
                value={childInfo.lastName}
                onChange={(e) => setChildInfo({...childInfo, lastName: e.target.value})}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Date of Birth</label>
              <input 
                required
                type="date" 
                style={{ width: '100%', padding: '8px' }}
                value={childInfo.dateOfBirth}
                onChange={(e) => setChildInfo({...childInfo, dateOfBirth: e.target.value})}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Gender</label>
              <select 
                style={{ width: '100%', padding: '8px' }}
                value={childInfo.gender}
                onChange={(e) => setChildInfo({...childInfo, gender: e.target.value})}
              >
                <option value="select">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Medical Info / Allergies</label>
              <textarea 
                rows="3"
                style={{ width: '100%', padding: '8px' }}
                value={childInfo.medicalInfo}
                onChange={(e) => setChildInfo({...childInfo, medicalInfo: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: PARENT INFO */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h2 style={{ marginTop: 0, color: '#333' }}>Parent Account Creation</h2>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
            This will create a login for the parent. They can change their password later.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Parent Email (Login ID)</label>
              <input 
                required
                type="email" 
                style={{ width: '100%', padding: '8px' }}
                value={parentInfo.email}
                onChange={(e) => setParentInfo({...parentInfo, email: e.target.value})}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Parent First Name</label>
              <input 
                required
                type="text" 
                style={{ width: '100%', padding: '8px' }}
                value={parentInfo.firstName}
                onChange={(e) => setParentInfo({...parentInfo, firstName: e.target.value})}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Parent Last Name</label>
              <input 
                required
                type="text" 
                style={{ width: '100%', padding: '8px' }}
                value={parentInfo.lastName}
                onChange={(e) => setParentInfo({...parentInfo, lastName: e.target.value})}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Phone Number</label>
              <input 
                required
                type="tel" 
                style={{ width: '100%', padding: '8px' }}
                value={parentInfo.phone}
                onChange={(e) => setParentInfo({...parentInfo, phone: e.target.value})}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Initial Password</label>
              <input 
                type="text" 
                style={{ width: '100%', padding: '8px', backgroundColor: '#f9f9f9' }}
                value={parentInfo.password}
                readOnly
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '15px',
            backgroundColor: loading ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Processing...' : 'Enroll Child & Create Account'}
        </button>

      </form>
    </div>
  );
};

export default EnrollChild;