import React from 'react';
import useEnrollChild from '../../hooks/useEnrollChild';

const EnrollChild = () => {
  const {
    loading, error, services,
    handleChildChange, // Removed childInfo
    parentInfo, handleParentChange,
    selectedServices, toggleService, updateServiceTeacher,
    getQualifiedTeachers, handleSubmit
  } = useEnrollChild();

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Enroll New Child</h1>
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Child Section */}
        <fieldset style={{ marginBottom: '20px' }}>
          <legend>Child Information</legend>
          <input name="firstName" placeholder="First Name" onChange={handleChildChange} required />
          <input name="lastName" placeholder="Last Name" onChange={handleChildChange} required />
          <input name="dateOfBirth" type="date" onChange={handleChildChange} required />
          <select name="gender" onChange={handleChildChange}>
            <option value="select">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          <br />
          <textarea name="medicalInfo" placeholder="Medical Info" onChange={handleChildChange} />
        </fieldset>

        {/* Parent Section */}
        <fieldset style={{ marginBottom: '20px' }}>
          <legend>Parent Account</legend>
          <input name="email" type="email" placeholder="Parent Email (Login)" onChange={handleParentChange} required />
          <input name="password" value={parentInfo.password} readOnly style={{ background: '#eee' }} />
          <br />
          <input name="firstName" placeholder="Parent First Name" onChange={handleParentChange} required />
          <input name="lastName" placeholder="Parent Last Name" onChange={handleParentChange} required />
          <input name="phone" placeholder="Phone Number" onChange={handleParentChange} required />
        </fieldset>

        {/* Services Section */}
        <fieldset style={{ marginBottom: '20px' }}>
          <legend>Assign Services</legend>
          {services.map(service => {
            const isSelected = selectedServices.find(s => s.serviceId === service.id);
            const qualified = getQualifiedTeachers(service.name);

            return (
              <div key={service.id} style={{ marginBottom: '10px', padding: '5px', border: '1px solid #eee' }}>
                <label>
                  <input 
                    type="checkbox" 
                    checked={!!isSelected} 
                    onChange={() => toggleService(service.id, service.name)}
                  />
                  <strong>{service.name}</strong>
                </label>

                {isSelected && (
                  <select 
                    style={{ marginLeft: '10px' }}
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

        <button type="submit" style={{ padding: '10px 20px', fontSize: '16px' }}>
          Complete Enrollment
        </button>
      </form>
    </div>
  );
};

export default EnrollChild;