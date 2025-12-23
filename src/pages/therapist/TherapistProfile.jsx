import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import userService from '../../services/userService';
import cloudinaryService from '../../services/cloudinaryService';
import Loading from '../../components/common/Loading';

const TherapistProfile = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  const [formData, setFormData] = useState({
    profilePhoto: '',
    bio: '',
    licenseNumber: '',
    licenseExpiry: '',
    education: '',
    certifications: [],
    yearsOfExperience: '',
    languagesSpoken: []
  });
  
  const [newCertification, setNewCertification] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);

  const LANGUAGE_OPTIONS = ['English', 'Tagalog', 'Bisaya', 'Ilocano', 'Spanish', 'Mandarin', 'Other'];

  useEffect(() => {
    const loadProfile = async () => {
      if (currentUser?.uid) {
        try {
          const userData = await userService.getUserById(currentUser.uid);
          setFormData({
            profilePhoto: userData.profilePhoto || '',
            bio: userData.bio || '',
            licenseNumber: userData.licenseNumber || '',
            licenseExpiry: userData.licenseExpiry || '',
            education: userData.education || '',
            certifications: userData.certifications || [],
            yearsOfExperience: userData.yearsOfExperience || '',
            languagesSpoken: userData.languagesSpoken || []
          });
          setPhotoPreview(userData.profilePhoto || null);
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

  const handlePhotoSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPhotoPreview(URL.createObjectURL(file));
    setUploadingPhoto(true);

    try {
      const photoUrl = await cloudinaryService.uploadImage(file, 'little-lions/therapist-profiles');
      handleInputChange('profilePhoto', photoUrl);
    } catch (error) {
      alert('Failed to upload photo.');
      setPhotoPreview(formData.profilePhoto || null);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAddCertification = () => {
    if (!newCertification.trim()) return;
    if (formData.certifications.includes(newCertification)) {
      alert('This certification is already added.');
      return;
    }
    handleInputChange('certifications', [...formData.certifications, newCertification]);
    setNewCertification('');
  };

  const handleRemoveCertification = (cert) => {
    handleInputChange('certifications', formData.certifications.filter(c => c !== cert));
  };

  const toggleLanguage = (lang) => {
    const current = formData.languagesSpoken;
    if (current.includes(lang)) {
      handleInputChange('languagesSpoken', current.filter(l => l !== lang));
    } else {
      handleInputChange('languagesSpoken', [...current, lang]);
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
      navigate('/therapist/dashboard');
    } catch (error) {
      console.error("Error saving profile:", error);
      alert('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/therapist/dashboard')} style={styles.backBtn}>
          ← Back to Dashboard
        </button>
        <h1 style={styles.title}>Professional Profile</h1>
        <p style={styles.subtitle}>Complete your profile to help parents know you better</p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Profile Photo</h2>
          <div style={styles.photoArea}>
            <div style={styles.photoPreview}>
              {photoPreview ? (
                <img src={photoPreview} alt="Profile" style={styles.photoImg} />
              ) : (
                <div style={styles.photoPlaceholder}>📷</div>
              )}
            </div>
            <div style={styles.photoActions}>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handlePhotoSelect}
                style={{ display: 'none' }}
                id="photo-upload"
                disabled={uploadingPhoto}
              />
              <label htmlFor="photo-upload" style={styles.uploadBtn(uploadingPhoto)}>
                {uploadingPhoto ? 'Uploading...' : 'Upload New Photo'}
              </label>
              <small style={styles.photoHint}>Recommended: Square image, at least 300x300px</small>
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <label style={styles.label}>
            📝 Professional Bio <span style={styles.required}>*</span>
          </label>
          <textarea
            required
            rows="5"
            maxLength="500"
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            placeholder="Tell parents about your experience, approach, and what makes you passionate about helping children..."
            style={styles.textarea}
          />
          <small style={styles.charCount}>{formData.bio.length}/500 characters</small>
        </div>

        <div style={styles.gridTwo}>
          <div style={styles.formGroup}>
            <label style={styles.label}>
              🎓 Education <span style={styles.required}>*</span>
            </label>
            <input
              required
              type="text"
              value={formData.education}
              onChange={(e) => handleInputChange('education', e.target.value)}
              placeholder="e.g. Master's in Speech-Language Pathology"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              💼 Years of Experience <span style={styles.required}>*</span>
            </label>
            <input
              required
              type="number"
              min="0"
              max="50"
              value={formData.yearsOfExperience}
              onChange={(e) => handleInputChange('yearsOfExperience', e.target.value)}
              placeholder="e.g. 10"
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.gridTwo}>
          <div style={styles.formGroup}>
            <label style={styles.label}>
              📜 License Number <span style={styles.required}>*</span>
            </label>
            <input
              required
              type="text"
              value={formData.licenseNumber}
              onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
              placeholder="e.g. PT-12345"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              📅 License Expiry Date <span style={styles.required}>*</span>
            </label>
            <input
              required
              type="date"
              value={formData.licenseExpiry}
              onChange={(e) => handleInputChange('licenseExpiry', e.target.value)}
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.section}>
          <label style={styles.label}>⭐ Certifications</label>
          <div style={styles.certInputRow}>
            <input
              type="text"
              value={newCertification}
              onChange={(e) => setNewCertification(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCertification())}
              placeholder="e.g. ASHA Certified"
              style={styles.input}
            />
            <button type="button" onClick={handleAddCertification} style={styles.addBtn}>
              + Add
            </button>
          </div>
          
          <div style={styles.certList}>
            {formData.certifications.length === 0 ? (
              <p style={styles.emptyText}>No certifications added yet</p>
            ) : (
              formData.certifications.map((cert, idx) => (
                <div key={idx} style={styles.certChip}>
                  <span>{cert}</span>
                  <button type="button" onClick={() => handleRemoveCertification(cert)} style={styles.removeBtn}>
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={styles.section}>
          <label style={styles.label}>
            🗣️ Languages Spoken <span style={styles.required}>*</span>
          </label>
          <div style={styles.langGrid}>
            {LANGUAGE_OPTIONS.map(lang => (
              <button
                key={lang}
                type="button"
                onClick={() => toggleLanguage(lang)}
                style={styles.langBtn(formData.languagesSpoken.includes(lang))}
              >
                {lang}
              </button>
            ))}
          </div>
          {formData.languagesSpoken.length === 0 && (
            <small style={styles.errorText}>Please select at least one language</small>
          )}
        </div>

        <div style={styles.actions}>
          <button type="button" onClick={() => navigate('/therapist/dashboard')} style={styles.cancelBtn}>
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={saving || uploadingPhoto || formData.languagesSpoken.length === 0}
            style={styles.saveBtn(saving || uploadingPhoto || formData.languagesSpoken.length === 0)}
          >
            {saving ? 'Saving Profile...' : 'Save Profile'}
          </button>
        </div>

      </form>
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f8fafc', padding: '2rem', fontFamily: 'system-ui, sans-serif' },
  header: { maxWidth: '900px', margin: '0 auto 2rem', textAlign: 'center' },
  backBtn: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600', marginBottom: '1rem' },
  title: { fontSize: '2rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.5rem 0' },
  subtitle: { color: '#64748b', margin: 0 },
  form: { maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' },
  section: { backgroundColor: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  sectionTitle: { fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', margin: '0 0 1.5rem 0' },
  photoArea: { display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' },
  photoPreview: { width: '150px', height: '150px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #e2e8f0' },
  photoImg: { width: '100%', height: '100%', objectFit: 'cover' },
  photoPlaceholder: { fontSize: '3rem', color: '#cbd5e1' },
  photoActions: { flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  uploadBtn: (disabled) => ({ padding: '0.75rem 1.5rem', backgroundColor: disabled ? '#cbd5e1' : '#667eea', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: '600', textAlign: 'center' }),
  photoHint: { color: '#64748b', fontSize: '0.75rem' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  label: { fontSize: '0.875rem', fontWeight: '600', color: '#334155' },
  required: { color: '#ef4444' },
  input: { padding: '0.75rem', border: '2px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.9375rem', outline: 'none' },
  textarea: { padding: '0.75rem', border: '2px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.9375rem', outline: 'none', fontFamily: 'inherit', resize: 'vertical' },
  charCount: { fontSize: '0.75rem', color: '#94a3b8', textAlign: 'right' },
  gridTwo: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', backgroundColor: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  certInputRow: { display: 'flex', gap: '0.75rem', marginBottom: '1rem' },
  addBtn: { padding: '0.75rem 1.5rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '600', whiteSpace: 'nowrap' },
  certList: { display: 'flex', flexWrap: 'wrap', gap: '0.75rem' },
  certChip: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#ede9fe', color: '#6d28d9', borderRadius: '2rem', fontSize: '0.875rem', fontWeight: '600' },
  removeBtn: { background: 'none', border: 'none', color: '#6d28d9', cursor: 'pointer', fontSize: '1rem', padding: '0 0.25rem', fontWeight: 'bold' },
  emptyText: { color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '1rem' },
  langGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' },
  langBtn: (selected) => ({ padding: '0.75rem', border: '2px solid', borderColor: selected ? '#6d28d9' : '#e2e8f0', backgroundColor: selected ? '#f5f3ff' : 'white', color: selected ? '#6d28d9' : '#64748b', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }),
  errorText: { color: '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem', display: 'block' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1rem' },
  cancelBtn: { padding: '0.875rem 2rem', backgroundColor: 'transparent', color: '#64748b', border: '2px solid #e2e8f0', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '600' },
  saveBtn: (disabled) => ({ padding: '0.875rem 2rem', backgroundColor: disabled ? '#cbd5e1' : '#667eea', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '1rem' })
};

export default TherapistProfile;