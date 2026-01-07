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
    schoolGraduated: '', // School grad
    college: '',
    diplomaUrl: '', // Diploma proof
    prcIdNumber: '', // PRC ID
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

  return (
    <div style={{ display: 'block', minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
      <div style={styles.container}>
        <div style={styles.header}>
          <button onClick={() => navigate('/teacher/dashboard')} style={styles.backBtn}>← Back to Dashboard</button>
          <h1 style={styles.title}>Teacher Professional Profile</h1>
          <p style={styles.subtitle}>Complete your information to verify your credentials.</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Personal & Professional Info</h2>
            
            <div style={styles.photoContainer}>
              <div style={styles.avatarPreview}>
                {formData.profilePhoto ? <img src={formData.profilePhoto} alt="Profile" style={styles.avatarImg} /> : '👤'}
              </div>
              <label style={styles.uploadBtn}>
                Upload Photo
                <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'profilePhoto', 'little-lions/teachers')} style={{ display: 'none' }} />
              </label>
            </div>

            <div style={styles.gridTwo}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Birthday</label>
                <input type="date" style={styles.input} value={formData.birthday} onChange={(e) => handleInputChange('birthday', e.target.value)} required />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>PRC ID Number</label>
                <input type="text" style={styles.input} value={formData.prcIdNumber} onChange={(e) => handleInputChange('prcIdNumber', e.target.value)} required />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>College/University</label>
              <input type="text" style={styles.input} value={formData.college} onChange={(e) => handleInputChange('college', e.target.value)} required />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>School Graduated (High School/Other)</label>
              <input type="text" style={styles.input} value={formData.schoolGraduated} onChange={(e) => handleInputChange('schoolGraduated', e.target.value)} />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Diploma (Upload Image/PDF)</label>
              <input type="file" onChange={(e) => handleFileUpload(e, 'diplomaUrl', 'little-lions/diplomas')} />
              {formData.diplomaUrl && <a href={formData.diplomaUrl} target="_blank" rel="noreferrer" style={{display: 'block', marginTop: '5px', fontSize: '12px'}}>View Uploaded Diploma</a>}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Short Bio</label>
              <textarea style={styles.textarea} rows="3" value={formData.bio} onChange={(e) => handleInputChange('bio', e.target.value)} placeholder="Tell us about your teaching philosophy..." />
            </div>
          </div>

          <div style={styles.actions}>
            <button type="submit" style={styles.saveBtn} disabled={saving}>
              {saving ? 'Saving...' : 'Save Teacher Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f1f5f9', padding: '2rem', width: '100%', boxSizing: 'border-box' },
  header: { maxWidth: '800px', margin: '0 auto 2rem' },
  backBtn: { border: 'none', background: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '1rem', fontSize: '0.9rem' },
  title: { fontSize: '2rem', fontWeight: '800', color: '#1e293b', margin: 0 },
  subtitle: { color: '#64748b', marginTop: '0.5rem' },
  form: { maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' },
  section: { backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  sectionTitle: { fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1.5rem' },
  photoContainer: { display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' },
  avatarPreview: { width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontSize: '2rem' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  uploadBtn: { backgroundColor: '#e2e8f0', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', display: 'inline-block' },
  formGroup: { marginBottom: '1.5rem' },
  label: { display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' },
  input: { width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box', fontFamily: 'inherit' },
  gridTwo: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  actions: { display: 'flex', justifyContent: 'flex-end' },
  saveBtn: { backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '0.5rem', fontWeight: '700', fontSize: '1rem', cursor: 'pointer' }
};

export default TeacherProfile;