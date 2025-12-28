import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import childService from '../../services/childService';
import cloudinaryService from '../../services/cloudinaryService'; 
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import TherapistCard from '../shared/TherapistCard';
import AssessmentHistory from '../shared/AssessmentHistory';

const ParentDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const [children, setChildren] = useState([]);
  const [loading] = useState(true);
  const [error] = useState('');

  // UI States
  const [activeTab, setActiveTab] = useState({}); 
  const [editingChild, setEditingChild] = useState(null); 
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // ✅ NEW: State for the file upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Fetch children
const fetchChildren = useCallback(async () => {
  if (!currentUser) return;
  try {
    // Note: Use your actual service call here
    const data = await childService.getChildrenByParentId(currentUser.uid);
    setChildren(data);
  } catch (err) {
    console.error("Error fetching children:", err);
    // setError(err.message); // Uncomment if you want to use the error state
  }
}, [currentUser]); // Re-create only if user changes

  // 2. Call it in useEffect
  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const age = Math.abs(new Date(Date.now() - new Date(dob).getTime()).getUTCFullYear() - 1970);
    return isNaN(age) ? 'N/A' : age;
  };

  // --- Handlers for Editing ---
  const handleEditClick = (child) => {
    setEditingChild({ ...child });
    setSelectedFile(null); // Reset file on open
    setIsEditModalOpen(true);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSaveEdit = async () => {
    try {
      setUploading(true); // Show uploading state
      
      let finalPhotoUrl = editingChild.photoUrl;

      // 1. ✅ If a file is selected, upload it first
      if (selectedFile) {
        finalPhotoUrl = await cloudinaryService.uploadImage(selectedFile, "little-lions/students");
      }

      // 2. Save to Firestore (Update Address, Medical, and Photo)
      await childService.updateChildProfile(editingChild.id, {
        photoUrl: finalPhotoUrl,
        address: editingChild.address,
        medicalInfo: editingChild.medicalInfo 
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

  const toggleView = (childId, view) => {
    setActiveTab(prev => ({ ...prev, [childId]: view }));
  };

  if (loading) return <Loading />;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, color: '#333' }}>Parent Dashboard</h1>
          <p style={{ margin: '5px 0 0', color: '#666' }}>Welcome back, {currentUser?.firstName}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate('/parent/inquiries')} style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✉️ My Inquiries</button>
          <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>

      <ErrorMessage message={error} />

      {/* Children Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '30px' }}>
        {children.map(child => {
           const currentView = activeTab[child.id] || 'activities';

           return (
            <div key={child.id} style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              
              {/* Card Header */}
              <div style={{ background: '#4ECDC4', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                   <h3 style={{ margin: 0, color: 'white', fontSize: '22px' }}>{child.firstName} {child.lastName}</h3>
                   <p style={{ margin: '5px 0 0', color: 'rgba(255,255,255,0.9)' }}>
                     {calculateAge(child.dateOfBirth)} years old • {child.gender}
                   </p>
                </div>
                <button 
                  onClick={() => handleEditClick(child)}
                  style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                >
                  ✎ Edit Info
                </button>
              </div>

              {/* Photo & Info Strip */}
              <div style={{ padding: '15px 20px', background: '#f8f9fa', borderBottom: '1px solid #eee', display: 'flex', gap: '15px', alignItems: 'center' }}>
                 <img 
                    src={child.photoUrl || "https://via.placeholder.com/50"} 
                    alt="child" 
                    style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                 />
                 <div style={{ fontSize: '13px', color: '#555' }}>
                    <div><strong>📍 Address:</strong> {child.address || "No address set"}</div>
                    <div style={{marginTop:'3px'}}><strong>🏥 Medical:</strong> {child.medicalInfo || "None"}</div>
                 </div>
              </div>
              
              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
                 <button 
                   onClick={() => toggleView(child.id, 'activities')}
                   style={{ flex: 1, padding: '12px', border: 'none', background: currentView === 'activities' ? 'white' : '#f1f1f1', borderBottom: currentView === 'activities' ? '2px solid #4ECDC4' : 'none', fontWeight: 'bold', cursor: 'pointer', color: '#444' }}
                 >
                   Activities & Services
                 </button>
                 <button 
                   onClick={() => toggleView(child.id, 'assessment')}
                   style={{ flex: 1, padding: '12px', border: 'none', background: currentView === 'assessment' ? 'white' : '#f1f1f1', borderBottom: currentView === 'assessment' ? '2px solid #4ECDC4' : 'none', fontWeight: 'bold', cursor: 'pointer', color: '#444' }}
                 >
                   Assessment History
                 </button>
              </div>

              {/* Body */}
              <div style={{ padding: '20px' }}>
                {currentView === 'activities' && (
                  <>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '13px', color: '#888', textTransform: 'uppercase', marginBottom: '10px' }}>🩺 Therapy Team</h4>
                      {child.therapyServices?.length > 0 ? (
                        child.therapyServices.map((s, i) => <TherapistCard key={i} therapistId={s.therapistId} serviceName={s.serviceName} />)
                      ) : <p style={{ color: '#aaa', fontStyle: 'italic', fontSize: '14px' }}>None assigned.</p>}
                    </div>

                    <button 
                      onClick={() => navigate(`/parent/child/${child.id}`)}
                      style={{ width: '100%', padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                    >
                      View Daily Reports →
                    </button>
                  </>
                )}

                {currentView === 'assessment' && (
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                     <AssessmentHistory data={child} />
                  </div>
                )}
              </div>
            </div>
           );
        })}
      </div>

      {/* ✅ UPDATED EDIT MODAL */}
      {isEditModalOpen && editingChild && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '25px', borderRadius: '8px', width: '400px', maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0 }}>Edit Profile: {editingChild.firstName}</h3>
            
            {/* PHOTO UPLOAD SECTION */}
            <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                    Profile Photo:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {/* Live Preview of selected file or existing URL */}
                    <img 
                        src={selectedFile ? URL.createObjectURL(selectedFile) : (editingChild.photoUrl || "https://via.placeholder.com/50")} 
                        alt="Preview" 
                        style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #ddd' }}
                    />
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ fontSize: '13px' }}
                    />
                </div>
            </div>

            <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: 'bold' }}>
               Address:
               <input 
                  type="text" 
                  value={editingChild.address || ''} 
                  onChange={e => setEditingChild({...editingChild, address: e.target.value})}
                  style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
               />
            </label>

            <label style={{ display: 'block', marginBottom: '20px', fontSize: '14px', fontWeight: 'bold' }}>
               Medical Info:
               <textarea 
                  value={editingChild.medicalInfo || ''} 
                  onChange={e => setEditingChild({...editingChild, medicalInfo: e.target.value})}
                  style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc', minHeight: '60px' }}
               />
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                onClick={() => setIsEditModalOpen(false)} 
                disabled={uploading}
                style={{ padding: '8px 16px', background: 'white', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit} 
                disabled={uploading}
                style={{ padding: '8px 16px', background: uploading ? '#ccc' : '#4ECDC4', color: 'white', border: 'none', borderRadius: '4px', cursor: uploading ? 'wait' : 'pointer', fontWeight: 'bold' }}
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