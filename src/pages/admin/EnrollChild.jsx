import React from 'react';
import useEnrollChild from '../../hooks/useEnrollChild';

const EnrollChild = () => {
  const {
    loading, uploading, error, services,
    handleChildChange,
    handlePhotoChange, photoPreview, // New props
    parentInfo, handleParentChange,
    selectedServices, toggleService, updateServiceTeacher,
    getQualifiedTeachers, handleSubmit
  } = useEnrollChild();

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Enroll New Child</h1>
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Child Section */}
        <fieldset style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <legend style={{ fontWeight: 'bold' }}>Child Information</legend>
          
          {/* Photo Upload Area */}
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ 
              width: '100px', 
              height: '100px', 
              backgroundColor: '#eee', 
              borderRadius: '50%', 
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #ccc'
            }}>
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '30px' }}>📷</span>
              )}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Profile Photo</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handlePhotoChange}
                style={{ fontSize: '14px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <input name="firstName" placeholder="First Name" onChange={handleChildChange} required style={inputStyle} />
            <input name="lastName" placeholder="Last Name" onChange={handleChildChange} required style={inputStyle} />
            <input name="dateOfBirth" type="date" onChange={handleChildChange} required style={inputStyle} />
            <select name="gender" onChange={handleChildChange} style={inputStyle}>
              <option value="select">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <textarea 
            name="medicalInfo" 
            placeholder="Medical Info (Allergies, conditions, etc.)" 
            onChange={handleChildChange}
            style={{ ...inputStyle, width: '100%', marginTop: '15px', height: '80px' }} 
          />
        </fieldset>

        {/* Parent Section */}
        <fieldset style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <legend style={{ fontWeight: 'bold' }}>Parent Account</legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <input name="firstName" placeholder="Parent First Name" onChange={handleParentChange} required style={inputStyle} />
            <input name="lastName" placeholder="Parent Last Name" onChange={handleParentChange} required style={inputStyle} />
            <input name="email" type="email" placeholder="Parent Email (Login)" onChange={handleParentChange} required style={inputStyle} />
            <input name="phone" placeholder="Phone Number" onChange={handleParentChange} required style={inputStyle} />
          </div>
          <div style={{ marginTop: '10px' }}>
            <label style={{ fontSize: '12px', color: '#666' }}>Default Password:</label>
            <input 
              name="password" 
              value={parentInfo.password} 
              readOnly 
              style={{ ...inputStyle, backgroundColor: '#f5f5f5', border: 'none', marginLeft: '10px' }} 
            />
          </div>
        </fieldset>

        {/* Services Section */}
        <fieldset style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <legend style={{ fontWeight: 'bold' }}>Assign Services</legend>
          {services.map(service => {
            const isSelected = selectedServices.find(s => s.serviceId === service.id);
            const qualified = getQualifiedTeachers(service.name);

            return (
              <div key={service.id} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #eee', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="checkbox" 
                    checked={!!isSelected} 
                    onChange={() => toggleService(service.id, service.name)}
                  />
                  <strong>{service.name}</strong>
                </label>

                {isSelected && (
                  <select 
                    style={inputStyle}
                    value={isSelected.teacherId}
                    onChange={(e) => updateServiceTeacher(service.id, e.target.value)}
                  >
                    <option value="">Select Teacher...</option>
                    {qualified.map(t => (
                      <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                    ))}
                  </select>
                )}
              </div>
            );
          })}
        </fieldset>

        <button 
          type="submit" 
          disabled={uploading}
          style={{ 
            padding: '12px 24px', 
            fontSize: '16px', 
            backgroundColor: uploading ? '#ccc' : '#4ECDC4', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: uploading ? 'not-allowed' : 'pointer',
            width: '100%'
          }}
        >
          {uploading ? 'Uploading Photo & Enrolling...' : 'Complete Enrollment'}
        </button>
      </form>
    </div>
  );
};

const inputStyle = {
  padding: '8px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  fontSize: '14px'
};

export default EnrollChild;