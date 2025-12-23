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
  
  // State for calculated fields
  const [yearsOfExperience, setYearsOfExperience] = useState(0);

  // Form State
  const [formData, setFormData] = useState({
    profilePhoto: '',
    bio: '',
    licenseNumber: '',
    licenseExpiry: '',
    practiceStartYear: new Date().getFullYear(), // New field
    languagesSpoken: [],
    // Complex fields
    education: [], // Array of { degree, school, year, id }
    certifications: [] // Array of { name, issuer, date, fileUrl, id }
  });

  // Temporary state for "Add New" modals/forms
  const [newEdu, setNewEdu] = useState({ degree: '', school: '', year: '' });
  const [newCert, setNewCert] = useState({ name: '', issuer: '', date: '', file: null });
  const [isUploadingCert, setIsUploadingCert] = useState(false);

  // Constants
  const LANGUAGE_OPTIONS = [
    'English', 'Tagalog', 'Bisaya', 'Ilocano', 'Cebuano', 
    'Spanish', 'Mandarin', 'Fukien', 'Japanese', 'Korean', 'Other'
  ];

  useEffect(() => {
    const loadProfile = async () => {
      if (currentUser?.uid) {
        try {
          const userData = await userService.getUserById(currentUser.uid);
          
          // Calculate years of experience if start year exists
          const currentYear = new Date().getFullYear();
          const startYear = userData.practiceStartYear || currentYear;
          setYearsOfExperience(currentYear - startYear);

          setFormData({
            profilePhoto: userData.profilePhoto || '',
            bio: userData.bio || '',
            licenseNumber: userData.licenseNumber || '',
            licenseExpiry: userData.licenseExpiry || '',
            practiceStartYear: startYear,
            languagesSpoken: userData.languagesSpoken || [],
            // Ensure these are arrays even if DB has old format
            education: Array.isArray(userData.education) ? userData.education : [], 
            certifications: Array.isArray(userData.certifications) ? userData.certifications : []
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

  // --- Handlers ---

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Use existing service
      const photoUrl = await cloudinaryService.uploadImage(file, 'little-lions/therapist-profiles');
      handleInputChange('profilePhoto', photoUrl);
    } catch (error) {
      alert('Failed to upload photo.');
    }
  };

  // --- Education Handlers ---
  const handleAddEducation = () => {
    if (!newEdu.degree || !newEdu.school || !newEdu.year) {
      alert("Please fill in all education fields.");
      return;
    }
    const educationEntry = { ...newEdu, id: Date.now() };
    setFormData(prev => ({ ...prev, education: [...prev.education, educationEntry] }));
    setNewEdu({ degree: '', school: '', year: '' }); // Reset
  };

  const handleRemoveEducation = (id) => {
    setFormData(prev => ({ ...prev, education: prev.education.filter(e => e.id !== id) }));
  };

  // --- Certification Handlers (With File Upload) ---
  const handleAddCertification = async () => {
    if (!newCert.name || !newCert.issuer || !newCert.date || !newCert.file) {
      alert("Please fill in all certification fields and upload a proof document.");
      return;
    }

    setIsUploadingCert(true);
    try {
      // Upload the proof document
      const fileUrl = await cloudinaryService.uploadFile(newCert.file, 'little-lions/certificates');
      
      const certEntry = {
        id: Date.now(),
        name: newCert.name,
        issuer: newCert.issuer,
        date: newCert.date,
        fileUrl: fileUrl
      };

      setFormData(prev => ({ ...prev, certifications: [...prev.certifications, certEntry] }));
      setNewCert({ name: '', issuer: '', date: '', file: null }); // Reset
    } catch (error) {
      alert("Failed to upload certificate document.");
    } finally {
      setIsUploadingCert(false);
    }
  };

  const handleRemoveCertification = (id) => {
    setFormData(prev => ({ ...prev, certifications: prev.certifications.filter(c => c.id !== id) }));
  };

  const handleLanguageToggle = (lang) => {
    setFormData(prev => {
      const current = prev.languagesSpoken;
      if (current.includes(lang)) {
        return { ...prev, languagesSpoken: current.filter(l => l !== lang) };
      } else {
        return { ...prev, languagesSpoken: [...current, lang] };
      }
    });
  };

  // --- Save Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const currentYear = new Date().getFullYear();
      const calculatedYears = currentYear - formData.practiceStartYear;

      await userService.updateUser(currentUser.uid, {
        ...formData,
        yearsOfExperience: calculatedYears, // Save derived value for easy query
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
        <button onClick={() => navigate('/therapist/dashboard')} style={styles.backBtn}>← Back to Dashboard</button>
        <h1 style={styles.title}>Professional Profile</h1>
        <p style={styles.subtitle}>Build trust with parents by verifying your credentials.</p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        
        {/* 1. Basic Info & Photo */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>1. Basic Information</h2>
          <div style={styles.photoContainer}>
            <div style={styles.avatarPreview}>
              {formData.profilePhoto ? <img src={formData.profilePhoto} alt="Profile" style={styles.avatarImg} /> : '📷'}
            </div>
            <div>
              <label style={styles.uploadBtn}>
                Change Photo
                <input type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display: 'none' }} />
              </label>
              <p style={styles.hint}>Professional headshot recommended</p>
            </div>
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Professional Bio</label>
            <textarea 
              style={styles.textarea} 
              rows="4" 
              maxLength="500"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Describe your approach and experience..."
              required 
            />
          </div>

          <div style={styles.gridTwo}>
            <div style={styles.formGroup}>
              <label style={styles.label}>License Number</label>
              <input 
                type="text" 
                style={styles.input} 
                value={formData.licenseNumber}
                onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                required 
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Expiry Date</label>
              <input 
                type="date" 
                style={styles.input} 
                value={formData.licenseExpiry}
                onChange={(e) => handleInputChange('licenseExpiry', e.target.value)}
                required 
              />
            </div>
          </div>
        </div>

        {/* 2. Experience & Languages */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>2. Experience & Skills</h2>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>When did you start practicing?</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input 
                type="number" 
                style={{ ...styles.input, width: '120px' }}
                min="1970" 
                max={new Date().getFullYear()}
                value={formData.practiceStartYear}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  handleInputChange('practiceStartYear', val);
                  setYearsOfExperience(new Date().getFullYear() - val);
                }}
              />
              <span style={{ fontWeight: 'bold', color: '#059669' }}>
                = {yearsOfExperience} Years of Experience
              </span>
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Languages Spoken</label>
            <div style={styles.checkboxGrid}>
              {LANGUAGE_OPTIONS.map(lang => (
                <label key={lang} style={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    checked={formData.languagesSpoken.includes(lang)}
                    onChange={() => handleLanguageToggle(lang)}
                  />
                  {lang}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Education (Structured) */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>3. Education History</h2>
          
          {/* List existing */}
          <div style={styles.listContainer}>
            {formData.education.map(edu => (
              <div key={edu.id} style={styles.listItem}>
                <div>
                  <strong>{edu.degree}</strong>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{edu.school} • {edu.year}</div>
                </div>
                <button type="button" onClick={() => handleRemoveEducation(edu.id)} style={styles.deleteBtn}>×</button>
              </div>
            ))}
          </div>

          {/* Add New */}
          <div style={styles.addBox}>
            <input 
              placeholder="Degree (e.g. BS OT)" 
              style={styles.inputSmall} 
              value={newEdu.degree}
              onChange={e => setNewEdu({...newEdu, degree: e.target.value})}
            />
            <input 
              placeholder="University / School" 
              style={styles.inputSmall}
              value={newEdu.school}
              onChange={e => setNewEdu({...newEdu, school: e.target.value})}
            />
            <input 
              placeholder="Year" 
              type="number" 
              style={{ ...styles.inputSmall, width: '80px' }}
              value={newEdu.year}
              onChange={e => setNewEdu({...newEdu, year: e.target.value})}
            />
            <button type="button" onClick={handleAddEducation} style={styles.addBtn}>Add</button>
          </div>
        </div>

        {/* 4. Certifications (With File Upload) */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>4. Certifications & Training</h2>
          
          <div style={styles.listContainer}>
            {formData.certifications.map(cert => (
              <div key={cert.id} style={styles.listItem}>
                <div>
                  <strong>{cert.name}</strong>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                    {cert.issuer} • {cert.date}
                  </div>
                  <a href={cert.fileUrl} target="_blank" rel="noreferrer" style={styles.link}>View Proof 📎</a>
                </div>
                <button type="button" onClick={() => handleRemoveCertification(cert.id)} style={styles.deleteBtn}>×</button>
              </div>
            ))}
          </div>

          {/* Add New Cert Form */}
          <div style={styles.addBox}>
            <div style={styles.gridTwo}>
              <input 
                placeholder="Certificate Name" 
                style={styles.inputSmall}
                value={newCert.name}
                onChange={e => setNewCert({...newCert, name: e.target.value})}
              />
              <input 
                placeholder="Issuing Org" 
                style={styles.inputSmall}
                value={newCert.issuer}
                onChange={e => setNewCert({...newCert, issuer: e.target.value})}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input 
                type="date" 
                style={styles.inputSmall}
                value={newCert.date}
                onChange={e => setNewCert({...newCert, date: e.target.value})}
              />
              <input 
                type="file"
                style={styles.inputSmall}
                accept="application/pdf,image/*"
                onChange={e => setNewCert({...newCert, file: e.target.files[0]})}
              />
            </div>
            <button 
              type="button" 
              onClick={handleAddCertification} 
              disabled={isUploadingCert}
              style={{ ...styles.addBtn, marginTop: '0.5rem', width: '100%' }}
            >
              {isUploadingCert ? 'Uploading...' : '+ Upload & Add Certificate'}
            </button>
          </div>
        </div>

        <div style={styles.actions}>
          <button type="submit" style={styles.saveBtn} disabled={saving}>
            {saving ? 'Saving Profile...' : 'Save Complete Profile'}
          </button>
        </div>

      </form>
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f1f5f9', padding: '2rem' },
  header: { maxWidth: '800px', margin: '0 auto 2rem' },
  backBtn: { border: 'none', background: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '1rem' },
  title: { fontSize: '2rem', fontWeight: '800', color: '#1e293b', margin: 0 },
  subtitle: { color: '#64748b', marginTop: '0.5rem' },
  form: { maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' },
  section: { backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  sectionTitle: { fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1.5rem' },
  photoContainer: { display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' },
  avatarPreview: { width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontSize: '2rem' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  uploadBtn: { backgroundColor: '#e2e8f0', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', display: 'inline-block' },
  hint: { fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' },
  formGroup: { marginBottom: '1.5rem' },
  label: { display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' },
  input: { width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box', fontFamily: 'inherit' },
  gridTwo: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  checkboxGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem' },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#334155', cursor: 'pointer' },
  listContainer: { display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' },
  listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' },
  deleteBtn: { background: 'none', border: 'none', color: '#ef4444', fontSize: '1.25rem', cursor: 'pointer', padding: '0 0.5rem' },
  addBox: { backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: '0.5rem', border: '1px dashed #22c55e' },
  inputSmall: { padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1', fontSize: '0.875rem', marginRight: '0.5rem', flex: 1 },
  addBtn: { backgroundColor: '#22c55e', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.25rem', fontWeight: '600', cursor: 'pointer' },
  link: { fontSize: '0.75rem', color: '#2563eb', textDecoration: 'none', display: 'inline-block', marginTop: '0.25rem' },
  actions: { display: 'flex', justifyContent: 'flex-end' },
  saveBtn: { backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '0.5rem', fontWeight: '700', fontSize: '1rem', cursor: 'pointer' }
};

export default TherapistProfile;