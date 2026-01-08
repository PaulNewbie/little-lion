import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import userService from '../../services/userService';
import cloudinaryService from '../../services/cloudinaryService';
import Loading from '../../components/common/Loading';

const TeacherProfile = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    profilePhoto: '',
    birthday: '',
    schoolGraduated: '',
    college: '',
    diplomaUrl: '',
    prcIdNumber: '',
    bio: '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (currentUser?.uid) {
        try {
          const userData = await userService.getUserById(currentUser.uid);
          setFormData({
            profilePhoto: userData.profilePhoto || '',
            birthday: userData.birthday || '',
            schoolGraduated: userData.schoolGraduated || '',
            college: userData.college || '',
            diplomaUrl: userData.diplomaUrl || '',
            prcIdNumber: userData.prcIdNumber || '',
            bio: userData.bio || '',
          });
        } catch (error) {
          console.error("Error loading profile:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    loadProfile();
  }, [currentUser]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e, field, folder) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const url = await cloudinaryService.uploadImage(file, folder);
      handleInputChange(field, url);
    } catch (error) {
      alert('Upload failed.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await userService.updateUser(currentUser.uid, {
        ...formData,
        profileCompleted: true,
        profileCompletedAt: new Date().toISOString()
      });
      alert('Profile updated successfully!');
      navigate('/teacher/dashboard');
    } catch (error) {
      alert('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  const fullName = `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim();

  return (
    <div style={styles.container}>
      <button onClick={() => navigate('/teacher/dashboard')} style={styles.backBtn}>
        ← Back to Dashboard
      </button>

      <div style={styles.pageHeader}>
        <h1 style={styles.title}>Teacher Profile</h1>
        <p style={styles.subtitle}>Complete your professional information</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Profile Header */}
        <div style={styles.profileHeader}>
          <div style={styles.avatar}>
            {formData.profilePhoto ? (
              <img src={formData.profilePhoto} alt="Profile" style={styles.avatarImg} />
            ) : (
              <span style={styles.avatarPlaceholder}>👤</span>
            )}
          </div>
          <div style={styles.profileInfo}>
            <h2 style={styles.name}>{fullName || 'Teacher Name'}</h2>
            <p style={styles.role}>Teacher</p>
            <label style={styles.uploadBtn}>
              Change Photo
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => handleFileUpload(e, 'profilePhoto', 'little-lions/teachers')} 
                style={{ display: 'none' }} 
              />
            </label>
          </div>
        </div>

        {/* Form Sections */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Personal Information</h3>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Full Name</label>
            <input 
              type="text" 
              value={fullName} 
              disabled 
              style={{ ...styles.input, ...styles.inputDisabled }}
            />
            <span style={styles.hint}>Name is managed by admin</span>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Birthday <span style={styles.required}>*</span></label>
            <input 
              type="date" 
              value={formData.birthday} 
              onChange={(e) => handleInputChange('birthday', e.target.value)} 
              style={styles.input}
              required 
            />
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Educational Background</h3>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>School Graduated (High School)</label>
            <input 
              type="text" 
              value={formData.schoolGraduated} 
              onChange={(e) => handleInputChange('schoolGraduated', e.target.value)} 
              placeholder="Enter your high school"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>College/University <span style={styles.required}>*</span></label>
            <input 
              type="text" 
              value={formData.college} 
              onChange={(e) => handleInputChange('college', e.target.value)} 
              placeholder="Enter your college or university"
              style={styles.input}
              required 
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Diploma</label>
            <input 
              type="file" 
              onChange={(e) => handleFileUpload(e, 'diplomaUrl', 'little-lions/diplomas')} 
              accept="image/*,.pdf"
              style={styles.fileInput}
            />
            {formData.diplomaUrl && (
              <a href={formData.diplomaUrl} target="_blank" rel="noreferrer" style={styles.fileLink}>
                ✓ View Uploaded Diploma
              </a>
            )}
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Professional Credentials</h3>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>PRC ID Number <span style={styles.required}>*</span></label>
            <input 
              type="text" 
              value={formData.prcIdNumber} 
              onChange={(e) => handleInputChange('prcIdNumber', e.target.value)} 
              placeholder="Enter your PRC License Number"
              style={styles.input}
              required 
            />
            <span style={styles.hint}>Professional Regulation Commission ID</span>
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>About Me</h3>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Short Bio</label>
            <textarea 
              rows="4" 
              value={formData.bio} 
              onChange={(e) => handleInputChange('bio', e.target.value)} 
              placeholder="Tell us about your teaching philosophy..."
              maxLength={500}
              style={styles.textarea}
            />
            <span style={styles.hint}>{formData.bio.length}/500 characters</span>
          </div>
        </div>

        <div style={styles.actions}>
          <button type="submit" style={styles.saveBtn} disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

const styles = {
  container: { padding: '20px', maxWidth: '700px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' },
  backBtn: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px', marginBottom: '20px', padding: 0, fontWeight: '500' },
  pageHeader: { marginBottom: '30px', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' },
  title: { fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: '0 0 5px 0' },
  subtitle: { fontSize: '14px', color: '#64748b', margin: 0 },
  
  profileHeader: { display: 'flex', alignItems: 'center', gap: '20px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', marginBottom: '25px' },
  avatar: { width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarPlaceholder: { fontSize: '32px' },
  profileInfo: { flex: 1 },
  name: { fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px 0' },
  role: { fontSize: '14px', color: '#64748b', margin: '0 0 10px 0' },
  uploadBtn: { display: 'inline-block', padding: '6px 12px', backgroundColor: '#e2e8f0', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: '#475569', cursor: 'pointer' },

  section: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '20px' },
  sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: '0 0 20px 0', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' },
  
  formGroup: { marginBottom: '18px' },
  label: { display: 'block', fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '6px' },
  required: { color: '#ef4444' },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' },
  inputDisabled: { backgroundColor: '#f3f4f6', color: '#9ca3af', cursor: 'not-allowed' },
  textarea: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', outline: 'none' },
  fileInput: { fontSize: '14px' },
  fileLink: { display: 'block', marginTop: '8px', fontSize: '13px', color: '#22c55e', fontWeight: '600', textDecoration: 'none' },
  hint: { display: 'block', fontSize: '12px', color: '#94a3b8', marginTop: '4px' },

  actions: { display: 'flex', justifyContent: 'flex-end', marginTop: '10px' },
  saveBtn: { padding: '12px 30px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
};

export default TeacherProfile;