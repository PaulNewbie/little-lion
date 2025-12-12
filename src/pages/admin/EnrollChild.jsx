import React from "react";
import useEnrollChild from "../../hooks/useEnrollChild";
import "./css/EnrollChild.css"; // Import the CSS file

const EnrollChild = () => {
  const {
    loading,
    uploading,
    error,
    services,
    handleChildChange,
    handlePhotoChange,
    photoPreview,
    parentInfo,
    handleParentChange,
    parentExists,
    checkParentEmail,
    selectedServices,
    toggleService,
    updateServiceTeacher,
    getQualifiedTeachers,
    handleSubmit,
  } = useEnrollChild();

  if (loading) return <div>Loading...</div>;

  return (
    <div className="enroll-container">
      <h1 className="enroll-title">Enroll New Child</h1>
      
      {error && (
        <div className="error-message">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        {/* --- Child Section --- */}
        <fieldset className="enroll-section">
          <legend className="enroll-legend">Child Information</legend>

          {/* Photo Upload Area */}
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
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="photo-input"
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <input
                name="firstName"
                placeholder="First Name"
                onChange={handleChildChange}
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <input
                name="lastName"
                placeholder="Last Name"
                onChange={handleChildChange}
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <input
                name="dateOfBirth"
                type="date"
                onChange={handleChildChange}
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <select
                name="gender"
                onChange={handleChildChange}
                className="form-select"
              >
                <option value="select">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
          
          <textarea
            name="medicalInfo"
            placeholder="Medical Info (Allergies, conditions, etc.)"
            onChange={handleChildChange}
            className="form-textarea"
          />
        </fieldset>

        {/* --- Parent Section --- */}
        <fieldset className={`enroll-section ${parentExists ? "existing-parent" : ""}`}>
          <legend className="enroll-legend">
            Parent Account 
            {parentExists && (
              <span className="existing-badge">
                ✓ Existing Account Found
              </span>
            )}
          </legend>
          
          <div className="form-group">
            <label className="input-label">Email Address</label>
            <input
              name="email"
              type="email"
              placeholder="Enter Parent Email"
              onChange={handleParentChange}
              onBlur={checkParentEmail}
              required
              className="form-input"
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <input
                name="firstName"
                placeholder="Parent First Name"
                value={parentInfo.firstName}
                onChange={handleParentChange}
                required
                disabled={parentExists}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <input
                name="lastName"
                placeholder="Parent Last Name"
                value={parentInfo.lastName}
                onChange={handleParentChange}
                required
                disabled={parentExists}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <input
                name="phone"
                placeholder="Phone Number"
                value={parentInfo.phone}
                onChange={handleParentChange}
                required
                disabled={parentExists}
                className="form-input"
              />
            </div>
          </div>
          
          {!parentExists && (
            <div className="form-group" style={{ marginTop: '10px' }}>
              <label className="input-label" style={{ color: '#666' }}>Default Password:</label>
              <input
                name="password"
                value={parentInfo.password}
                readOnly
                className="form-input"
                style={{ backgroundColor: '#f5f5f5', border: 'none' }}
              />
            </div>
          )}
        </fieldset>

        {/* --- Services Section --- */}
        <fieldset className="enroll-section">
          <legend className="enroll-legend">Assign Services</legend>
          
          {services.map((service) => {
            const isSelected = selectedServices.find(
              (s) => s.serviceId === service.id
            );
            const qualified = getQualifiedTeachers(service.name);

            return (
              <div key={service.id} className="service-item">
                <label className="service-label">
                  <input
                    type="checkbox"
                    checked={!!isSelected}
                    onChange={() => toggleService(service.id, service.name)}
                    className="service-checkbox"
                  />
                  <strong>{service.name}</strong>
                </label>

                {isSelected && (
                  <select
                    className="teacher-select"
                    value={isSelected.teacherId}
                    onChange={(e) =>
                      updateServiceTeacher(service.id, e.target.value)
                    }
                  >
                    <option value="">Select Teacher...</option>
                    {qualified.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.firstName} {t.lastName}
                      </option>
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
          className="submit-btn"
        >
          {uploading ? "Uploading Photo & Enrolling..." : "Complete Enrollment"}
        </button>
      </form>
    </div>
  );
};

export default EnrollChild;