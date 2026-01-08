import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import childService from "../../services/childService";
import cloudinaryService from "../../services/cloudinaryService";
import Loading from "../../components/common/Loading";
import ErrorMessage from "../../components/common/ErrorMessage";
import ParentSidebar from "../../components/sidebar/ParentSidebar";
import GeneralFooter from "../../components/footer/generalfooter";
import "./ParentDashboard.css";

const ParentDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // UI States
  const [editingChild, setEditingChild] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Fetch children
  const fetchChildren = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await childService.getChildrenByParentId(currentUser.uid);
      setChildren(data);
    } catch (err) {
      console.error("Error fetching children:", err);
      setError(err.message || "Failed to fetch children");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  const calculateAge = (dob) => {
    if (!dob) return "N/A";
    const age = Math.abs(
      new Date(Date.now() - new Date(dob).getTime()).getUTCFullYear() - 1970
    );
    return isNaN(age) ? "N/A" : age;
  };

  // Navigate to full profile view
  const handleViewProfile = (child) => {
    navigate(`/parent/child-profile/${child.id}`, {
      state: { 
        fromParentDashboard: true,
        child: child 
      }
    });
  };

  const handleEditClick = (child) => {
    setEditingChild({ ...child });
    setSelectedFile(null);
    setIsEditModalOpen(true);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSaveEdit = async () => {
    try {
      setUploading(true);
      let finalPhotoUrl = editingChild.photoUrl;

      if (selectedFile) {
        finalPhotoUrl = await cloudinaryService.uploadImage(
          selectedFile,
          "little-lions/students"
        );
      }

      await childService.updateChildProfile(editingChild.id, {
        photoUrl: finalPhotoUrl,
        address: editingChild.address,
        medicalInfo: editingChild.medicalInfo,
      });

      await fetchChildren();
      setIsEditModalOpen(false);
      setEditingChild(null);
      setSelectedFile(null);
    } catch (err) {
      alert("Failed to update profile: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="parent-dashboard-container">
      <ParentSidebar />
      
      <div className="parent-main">
        <div className="parent-page">
          {/* Header */}
          <div className="parent-header">
            <div className="header-title">
              <h1>MY CHILDREN</h1>
              <p className="header-subtitle">
                Welcome back, {currentUser?.firstName}
              </p>
            </div>
          </div>

          <ErrorMessage message={error} />

          {/* Children Grid */}
          <div className="parent-content-area">
            {children.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👶</div>
                <p>No children enrolled yet</p>
              </div>
            ) : (
              <div className="children-grid">
                {children.map((child) => (
                  <div key={child.id} className="child-card">
                    {/* Card Header */}
                    <div className="child-card-header">
                      <div className="child-info">
                        <h3 className="child-name">
                          {child.firstName} {child.lastName}
                        </h3>
                        <p className="child-meta">
                          {calculateAge(child.dateOfBirth)} years old • {child.gender}
                        </p>
                      </div>
                      <button
                        onClick={() => handleEditClick(child)}
                        className="edit-btn-small"
                        title="Edit Profile Info"
                      >
                        ✎
                      </button>
                    </div>

                    {/* Photo & Quick Info */}
                    <div className="child-card-photo-section">
                      <div className="child-photo-container">
                        {child.photoUrl ? (
                          <img
                            src={child.photoUrl}
                            alt={child.firstName}
                            className="child-photo"
                          />
                        ) : (
                          <div className="child-photo-placeholder">
                            {child.firstName?.[0]}{child.lastName?.[0]}
                          </div>
                        )}
                      </div>
                      
                      <div className="child-quick-info">
                        <div className="info-row">
                          <span className="info-icon">📍</span>
                          <span className="info-text">
                            {child.address || "No address set"}
                          </span>
                        </div>
                        <div className="info-row">
                          <span className="info-icon">🏥</span>
                          <span className="info-text">
                            {child.medicalInfo || "No medical info"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Services Summary */}
                    <div className="child-card-services">
                      <div className="services-summary">
                        <div className="service-count">
                          <span className="count-icon">🩺</span>
                          <span className="count-text">
                            {child.enrolledServices?.filter(s => s.type === 'Therapy')?.length || 0} Therapy Services
                          </span>
                        </div>
                        <div className="service-count">
                          <span className="count-icon">👥</span>
                          <span className="count-text">
                            {child.enrolledServices?.filter(s => s.type === 'Class')?.length || 0} Group Classes
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="child-card-actions">
                      <button
                        onClick={() => handleViewProfile(child)}
                        className="view-profile-btn"
                      >
                        View Full Profile →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <GeneralFooter pageLabel="Parent Dashboard" />
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingChild && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 className="modal-title">
              Edit Profile: {editingChild.firstName}
            </h3>

            {/* Photo Upload */}
            <div className="form-group">
              <label className="form-label">Profile Photo:</label>
              <div className="photo-upload-area">
                <img
                  src={
                    selectedFile
                      ? URL.createObjectURL(selectedFile)
                      : editingChild.photoUrl ||
                        "https://via.placeholder.com/50"
                  }
                  alt="Preview"
                  className="photo-preview"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="file-input"
                />
              </div>
            </div>

            {/* Address */}
            <div className="form-group">
              <label className="form-label">Address:</label>
              <input
                type="text"
                value={editingChild.address || ""}
                onChange={(e) =>
                  setEditingChild({ ...editingChild, address: e.target.value })
                }
                className="form-input"
              />
            </div>

            {/* Medical Info */}
            <div className="form-group">
              <label className="form-label">Medical Info:</label>
              <textarea
                value={editingChild.medicalInfo || ""}
                onChange={(e) =>
                  setEditingChild({
                    ...editingChild,
                    medicalInfo: e.target.value,
                  })
                }
                className="form-textarea"
              />
            </div>

            {/* Actions */}
            <div className="modal-actions">
              <button
                onClick={() => setIsEditModalOpen(false)}
                disabled={uploading}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={uploading}
                className="btn-save"
              >
                {uploading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;
