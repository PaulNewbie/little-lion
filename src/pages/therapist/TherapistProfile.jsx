import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import userService from '../../services/userService';
import cloudinaryService from '../../services/cloudinaryService';
import Loading from '../../components/common/Loading';
import TherapistSidebar from '../../components/sidebar/TherapistSidebar';

const TherapistProfile = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    profilePhoto: '',
    bio: '',
    birthday: '',
    schoolGraduated: '',
    college: '',
    diplomaUrl: '',
    prcIdNumber: '',
    licenseNumber: '',
    licenseExpiry: '',
    education: [],
    certifications: []
  });

  const [newEdu, setNewEdu] = useState({ degree: '', school: '', year: '' });
  const [newCert, setNewCert] = useState({ name: '', issuer: '', date: '', file: null });
  const [isUploadingCert, setIsUploadingCert] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (currentUser?.uid) {
        try {
          const userData = await userService.getUserById(currentUser.uid);
          setFormData({
            profilePhoto: userData.profilePhoto || '',
            bio: userData.bio || '',
            birthday: userData.birthday || '',
            schoolGraduated: userData.schoolGraduated || '',
            college: userData.college || '',
            diplomaUrl: userData.diplomaUrl || '',
            prcIdNumber: userData.prcIdNumber || '',
            licenseNumber: userData.licenseNumber || '',
            licenseExpiry: userData.licenseExpiry || '',
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

  const handleAddEducation = () => {
    if (!newEdu.degree || !newEdu.school || !newEdu.year) {
      alert("Please fill in all education fields.");
      return;
    }
    const educationEntry = { ...newEdu, id: Date.now() };
    setFormData(prev => ({ ...prev, education: [...prev.education, educationEntry] }));
    setNewEdu({ degree: '', school: '', year: '' });
  };

  const handleRemoveEducation = (id) => {
    setFormData(prev => ({ ...prev, education: prev.education.filter(e => e.id !== id) }));
  };

  const handleAddCertification = async () => {
    if (!newCert.name || !newCert.issuer || !newCert.date || !newCert.file) {
      alert("Please fill in all certification fields and upload a proof document.");
      return;
    }
    setIsUploadingCert(true);
    try {
      const fileUrl = await cloudinaryService.uploadFile(newCert.file, 'little-lions/certificates');
      const certEntry = { id: Date.now(), name: newCert.name, issuer: newCert.issuer, date: newCert.date, fileUrl };
      setFormData(prev => ({ ...prev, certifications: [...prev.certifications, certEntry] }));
      setNewCert({ name: '', issuer: '', date: '', file: null });
    } catch (error) {
      alert("Failed to upload certificate document.");
    } finally {
      setIsUploadingCert(false);
    }
  };

  const handleRemoveCertification = (id) => {
    setFormData(prev => ({ ...prev, certifications: prev.certifications.filter(c => c.id !== id) }));
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
      alert('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  const fullName = `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <TherapistSidebar />
      
      <div style={styles.container}>
        <button onClick={() => navigate('/therapist/dashboard')} style={styles.backBtn}>
          ← Back to Dashboard
        </button>

        <div style={styles.pageHeader}>
          <h1 style={styles.title}>Therapist Profile</h1>
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
              <h2 style={styles.name}>{fullName || 'Therapist Name'}</h2>
              <p style={styles.role}>Therapist</p>
              <label style={styles.uploadBtn}>
                Change Photo
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleFileUpload(e, 'profilePhoto', 'little-lions/therapist-profiles')} 
                  style={{ display: 'none' }} 
                />
              </label>
            </div>
          </div>

          {/* 1. Personal Information */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>1. Personal Information</h3>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Full Name</label>
              <input type="text" value={fullName} disabled style={{ ...styles.input, ...styles.inputDisabled }} />
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

            <div style={styles.formGroup}>
              <label style={styles.label}>Professional Bio</label>
              <textarea 
                rows="3" 
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Describe your approach and experience..."
                maxLength={500}
                style={styles.textarea}
              />
              <span style={styles.hint}>{formData.bio.length}/500 characters</span>
            </div>
          </div>

          {/* 2. Educational Background */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>2. Educational Background</h3>
            
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

          {/* 3. Professional Credentials */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>3. Professional Credentials</h3>
            
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

            <div style={styles.row}>
              <div style={styles.formGroup}>
                <label style={styles.label}>License Number</label>
                <input 
                  type="text" 
                  value={formData.licenseNumber}
                  onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                  placeholder="License #"
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>License Expiry</label>
                <input 
                  type="date" 
                  value={formData.licenseExpiry}
                  onChange={(e) => handleInputChange('licenseExpiry', e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>
          </div>

          {/* 4. Education History */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>4. Education History</h3>
            
            {formData.education.length > 0 && (
              <div style={styles.listContainer}>
                {formData.education.map(edu => (
                  <div key={edu.id} style={styles.listItem}>
                    <div>
                      <strong>{edu.degree}</strong>
                      <p style={styles.listItemSub}>{edu.school} • {edu.year}</p>
                    </div>
                    <button type="button" onClick={() => handleRemoveEducation(edu.id)} style={styles.removeBtn}>×</button>
                  </div>
                ))}
              </div>
            )}

            <div style={styles.addBox}>
              <p style={styles.addBoxLabel}>Add Education</p>
              <div style={styles.addRow}>
                <input 
                  placeholder="Degree (e.g. BS OT)" 
                  value={newEdu.degree}
                  onChange={e => setNewEdu({...newEdu, degree: e.target.value})}
                  style={styles.inputSmall}
                />
                <input 
                  placeholder="School" 
                  value={newEdu.school}
                  onChange={e => setNewEdu({...newEdu, school: e.target.value})}
                  style={styles.inputSmall}
                />
                <input 
                  placeholder="Year" 
                  type="number" 
                  value={newEdu.year}
                  onChange={e => setNewEdu({...newEdu, year: e.target.value})}
                  style={{ ...styles.inputSmall, width: '80px' }}
                />
                <button type="button" onClick={handleAddEducation} style={styles.addBtn}>+ Add</button>
              </div>
            </div>
          </div>

          {/* 5. Certifications */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>5. Certifications</h3>
            
            {formData.certifications.length > 0 && (
              <div style={styles.listContainer}>
                {formData.certifications.map(cert => (
                  <div key={cert.id} style={styles.listItem}>
                    <div>
                      <strong>{cert.name}</strong>
                      <p style={styles.listItemSub}>{cert.issuer} • {cert.date}</p>
                      {cert.fileUrl && (
                        <a href={cert.fileUrl} target="_blank" rel="noreferrer" style={styles.certLink}>
                          View Certificate →
                        </a>
                      )}
                    </div>
                    <button type="button" onClick={() => handleRemoveCertification(cert.id)} style={styles.removeBtn}>×</button>
                  </div>
                ))}
              </div>
            )}

            <div style={styles.addBox}>
              <p style={styles.addBoxLabel}>Add Certification</p>
              <div style={styles.addRow}>
                <input 
                  placeholder="Certification Name" 
                  value={newCert.name}
                  onChange={e => setNewCert({...newCert, name: e.target.value})}
                  style={styles.inputSmall}
                />
                <input 
                  placeholder="Issuer" 
                  value={newCert.issuer}
                  onChange={e => setNewCert({...newCert, issuer: e.target.value})}
                  style={styles.inputSmall}
                />
                <input 
                  type="date" 
                  value={newCert.date}
                  onChange={e => setNewCert({...newCert, date: e.target.value})}
                  style={{ ...styles.inputSmall, width: '130px' }}
                />
                <input 
                  type="file"
                  accept="image/*,.pdf"
                  onChange={e => setNewCert({...newCert, file: e.target.files[0]})}
                  style={{ ...styles.inputSmall, width: '120px', padding: '6px' }}
                />
                <button 
                  type="button" 
                  onClick={handleAddCertification} 
                  disabled={isUploadingCert}
                  style={styles.addBtn}
                >
                  {isUploadingCert ? '...' : '+ Add'}
                </button>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div style={styles.actions}>
            <button type="submit" style={styles.saveBtn} disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '20px', maxWidth: '700px', margin: '0 auto', fontFamily: 'system-ui, sans-serif', flex: 1 },
  backBtn: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px', marginBottom: '20px', padding: 0, fontWeight: '500' },
  pageHeader: { marginBottom: '30px', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' },
  title: { fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: '0 0 5px 0' },
  subtitle: { fontSize: '14px', color: '#64748b', margin: 0 },
  
  profileHeader: { display: 'flex', alignItems: 'center', gap: '20px', padding: '20px', backgroundColor: '#fef3c7', borderRadius: '12px', marginBottom: '25px' },
  avatar: { width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarPlaceholder: { fontSize: '32px' },
  profileInfo: { flex: 1 },
  name: { fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px 0' },
  role: { fontSize: '14px', color: '#64748b', margin: '0 0 10px 0' },
  uploadBtn: { display: 'inline-block', padding: '6px 12px', backgroundColor: '#fbbf24', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: '#78350f', cursor: 'pointer' },

  section: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '20px' },
  sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: '0 0 20px 0', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' },
  
  formGroup: { marginBottom: '18px', flex: 1 },
  label: { display: 'block', fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '6px' },
  required: { color: '#ef4444' },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' },
  inputDisabled: { backgroundColor: '#f3f4f6', color: '#9ca3af', cursor: 'not-allowed' },
  textarea: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', outline: 'none' },
  fileInput: { fontSize: '14px' },
  fileLink: { display: 'block', marginTop: '8px', fontSize: '13px', color: '#22c55e', fontWeight: '600', textDecoration: 'none' },
  hint: { display: 'block', fontSize: '12px', color: '#94a3b8', marginTop: '4px' },
  row: { display: 'flex', gap: '15px' },

  listContainer: { marginBottom: '15px' },
  listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', marginBottom: '10px', border: '1px solid #e2e8f0' },
  listItemSub: { fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' },
  certLink: { fontSize: '12px', color: '#f59e0b', fontWeight: '600', textDecoration: 'none', marginTop: '5px', display: 'inline-block' },
  removeBtn: { background: '#fee2e2', color: '#ef4444', border: 'none', width: '26px', height: '26px', borderRadius: '50%', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', flexShrink: 0 },

  addBox: { backgroundColor: '#fffbeb', border: '1px dashed #fbbf24', borderRadius: '8px', padding: '15px' },
  addBoxLabel: { fontSize: '13px', fontWeight: '600', color: '#92400e', margin: '0 0 10px 0' },
  addRow: { display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' },
  inputSmall: { padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', flex: '1 1 120px', minWidth: '100px' },
  addBtn: { padding: '8px 16px', backgroundColor: '#fbbf24', color: '#78350f', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },

  actions: { display: 'flex', justifyContent: 'flex-end', marginTop: '10px', marginBottom: '30px' },
  saveBtn: { padding: '12px 30px', backgroundColor: '#f59e0b', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
};

export default TherapistProfile;