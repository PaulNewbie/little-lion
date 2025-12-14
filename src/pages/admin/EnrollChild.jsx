import React from "react";
import useEnrollChild from "../../hooks/useEnrollChild";
import "./css/EnrollChild.css";

const EnrollChild = () => {
  const {
    loading,
    uploading,
    error,
    
    // Data Options
    therapyOptions,
    classOptions,
    
    // Handlers
    handleChildChange,
    handlePhotoChange,
    photoPreview,
    parentInfo,
    handleParentChange,
    parentExists,
    checkParentEmail,
    
    // Therapy Logic
    selectedTherapies,
    toggleTherapy,
    updateTherapyAssignee,
    getQualifiedTherapists,
    
    // Class Logic
    selectedClasses,
    toggleClass,
    updateClassAssignee,
    getQualifiedTeachers,
    
    handleSubmit,
  } = useEnrollChild();

  if (loading) return <div>Loading enrollment data...</div>;

  return (
    <div className="enroll-container">
      <h1 className="enroll-title">Enroll New Child</h1>
      
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* --- 1. Child Information --- */}
        <fieldset className="enroll-section">
          <legend className="enroll-legend">Child Information</legend>

          <div className="photo-upload-area">
            <div className="photo-preview">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" />
              ) : (
                <span className="photo-placeholder">📷</span>
              )}
            </div>
            <div>
              <label className="photo-label">Profile Photo</label>
              <input type="file" accept="image/*" onChange={handlePhotoChange} className="photo-input" />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <input name="firstName" placeholder="First Name" onChange={handleChildChange} required className="form-input" />
            </div>
            <div className="form-group">
              <input name="lastName" placeholder="Last Name" onChange={handleChildChange} required className="form-input" />
            </div>
            <div className="form-group">
              <input name="dateOfBirth" type="date" onChange={handleChildChange} required className="form-input" />
            </div>
            <div className="form-group">
              <select name="gender" onChange={handleChildChange} className="form-select">
                <option value="select">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
          <textarea name="medicalInfo" placeholder="Medical Info (Allergies, etc.)" onChange={handleChildChange} className="form-textarea" />
        </fieldset>

        {/* --- 2. Parent Information --- */}
        <fieldset className={`enroll-section ${parentExists ? "existing-parent" : ""}`}>
          <legend className="enroll-legend">
            Parent Account {parentExists && <span className="existing-badge">✓ Existing Account</span>}
          </legend>
          
          <div className="form-group">
            <label className="input-label">Email Address</label>
            <input name="email" type="email" placeholder="Enter Parent Email" onChange={handleParentChange} onBlur={checkParentEmail} required className="form-input" />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <input name="firstName" placeholder="Parent First Name" value={parentInfo.firstName} onChange={handleParentChange} required disabled={parentExists} className="form-input" />
            </div>
            <div className="form-group">
              <input name="lastName" placeholder="Parent Last Name" value={parentInfo.lastName} onChange={handleParentChange} required disabled={parentExists} className="form-input" />
            </div>
            <div className="form-group">
              <input name="phone" placeholder="Phone Number" value={parentInfo.phone} onChange={handleParentChange} required disabled={parentExists} className="form-input" />
            </div>
          </div>
          
          {!parentExists && (
            <div className="form-group">
              <label className="input-label" style={{ color: '#666' }}>Default Password:</label>
              <input name="password" value={parentInfo.password} readOnly className="form-input" style={{ backgroundColor: '#f5f5f5' }} />
            </div>
          )}
        </fieldset>

        {/* --- 3. Assign Therapies (1:1) --- */}
        <fieldset className="enroll-section" style={{ borderColor: '#4a90e2' }}>
          <legend className="enroll-legend" style={{ color: '#4a90e2' }}>Assign 1:1 Therapies 🩺</legend>
          
          {therapyOptions.length === 0 ? <p>No therapy services available.</p> : therapyOptions.map((service) => {
            const isSelected = selectedTherapies.find(s => s.serviceId === service.id);
            const qualified = getQualifiedTherapists(service.name);

            return (
              <div key={service.id} className="service-item">
                <label className="service-label">
                  <input type="checkbox" checked={!!isSelected} onChange={() => toggleTherapy(service.id, service.name)} className="service-checkbox" />
                  <strong>{service.name}</strong>
                </label>

                {isSelected && (
                  <select className="teacher-select" value={isSelected.therapistId} onChange={(e) => updateTherapyAssignee(service.id, e.target.value)}>
                    <option value="">Select Therapist...</option>
                    {qualified.map(t => (
                      <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                    ))}
                  </select>
                )}
              </div>
            );
          })}
        </fieldset>

        {/* --- 4. Assign Group Classes --- */}
        <fieldset className="enroll-section" style={{ borderColor: '#2ecc71' }}>
          <legend className="enroll-legend" style={{ color: '#2ecc71' }}>Assign Group Classes 🎨</legend>
          
          {classOptions.length === 0 ? <p>No group classes available.</p> : classOptions.map((service) => {
            const isSelected = selectedClasses.find(s => s.serviceId === service.id);
            const qualified = getQualifiedTeachers(service.name);

            return (
              <div key={service.id} className="service-item">
                <label className="service-label">
                  <input type="checkbox" checked={!!isSelected} onChange={() => toggleClass(service.id, service.name)} className="service-checkbox" />
                  <strong>{service.name}</strong>
                </label>

                {isSelected && (
                  <select className="teacher-select" value={isSelected.teacherId} onChange={(e) => updateClassAssignee(service.id, e.target.value)}>
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

        <button type="submit" disabled={uploading} className="submit-btn">
          {uploading ? "Enrolling..." : "Complete Enrollment"}
        </button>
      </form>
    </div>
  );
};

export default EnrollChild;