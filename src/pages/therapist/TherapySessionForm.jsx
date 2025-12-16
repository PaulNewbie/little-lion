import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import activityService from '../../services/activityService';
import cloudinaryService from '../../services/cloudinaryService';

const TherapySessionForm = () => {
  const { studentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // Get student data passed from dashboard to avoid re-fetching
  const student = location.state?.student || { firstName: 'Student', lastName: '' };

  const [formData, setFormData] = useState({
    title: '',
    progressNotes: '',
    goals: '',
    visibleToParents: true
  });
  
  const [photoFiles, setPhotoFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setPhotoFiles(prev => [...prev, ...files]);
      const newPreviews = files.map(f => URL.createObjectURL(f));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      // 1. Find the service name this therapist provides for this child
      const myService = student.therapyServices?.find(s => s.therapistId === currentUser.uid);
      const serviceName = myService ? myService.serviceName : 'Therapy Session';

      // 2. Upload Photos
      const photoUrls = [];
      if (photoFiles.length > 0) {
        const uploadPromises = photoFiles.map(file => 
          cloudinaryService.uploadImage(file, `little-lions/therapy/${studentId}/${new Date().toISOString().split('T')[0]}`)
        );
        const results = await Promise.all(uploadPromises);
        photoUrls.push(...results);
      }

      // 3. Prepare Data
      const sessionData = {
        studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        
        authorId: currentUser.uid,
        authorName: `${currentUser.firstName} ${currentUser.lastName}`,
        authorRole: 'therapist',
        
        serviceType: serviceName,
        title: formData.title,
        description: formData.progressNotes, // Mapping to generic description field
        progressNotes: formData.progressNotes, // Specific field
        goalsAddressed: formData.goals.split('\n').filter(g => g.trim() !== ''),
        
        date: new Date().toISOString().split('T')[0],
        photoUrls,
        visibleToParents: formData.visibleToParents
      };

      // 4. Save
      await activityService.createTherapySession(sessionData);
      
      alert('Session Saved!');
      navigate('/therapist/dashboard');

    } catch (err) {
      console.error(err);
      alert('Failed to save session: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
      
      <h1 style={{ color: '#2c3e50' }}>📝 New Session Note</h1>
      <h3 style={{ color: '#666', marginTop: '-10px', marginBottom: '30px' }}>
        For: {student.firstName} {student.lastName}
      </h3>

      <form onSubmit={handleSubmit} style={styles.form}>
        
        {/* Title */}
        <div style={styles.group}>
          <label style={styles.label}>Session Title</label>
          <input 
            name="title" 
            placeholder="e.g. Articulation Progress - Week 6"
            value={formData.title} 
            onChange={handleChange} 
            required 
            style={styles.input}
          />
        </div>

        {/* Notes */}
        <div style={styles.group}>
          <label style={styles.label}>Progress Notes & Observations</label>
          <textarea 
            name="progressNotes" 
            placeholder="Detailed notes on what was worked on and how the student responded..."
            value={formData.progressNotes} 
            onChange={handleChange} 
            required 
            style={{...styles.input, height: '150px'}}
          />
        </div>

        {/* Goals */}
        <div style={styles.group}>
          <label style={styles.label}>Goals Addressed (One per line)</label>
          <textarea 
            name="goals" 
            placeholder="- Improve R sound articulation&#10;- Increase vocabulary"
            value={formData.goals} 
            onChange={handleChange} 
            style={{...styles.input, height: '100px'}}
          />
        </div>

        {/* Photos */}
        <div style={styles.group}>
          <label style={styles.label}>Progress Photos (Optional)</label>
          <input type="file" multiple accept="image/*" onChange={handlePhotoSelect} style={{ marginBottom: '10px' }} />
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {previews.map((src, i) => (
              <img key={i} src={src} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
            ))}
          </div>
        </div>

        {/* Visibility */}
        <div style={styles.group}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              name="visibleToParents" 
              checked={formData.visibleToParents} 
              onChange={handleChange}
              style={{ width: '20px', height: '20px' }}
            />
            <span>Visible to Parents? (Uncheck for private notes)</span>
          </label>
        </div>

        <button 
          type="submit" 
          disabled={uploading}
          style={{ ...styles.submitBtn, opacity: uploading ? 0.7 : 1 }}
        >
          {uploading ? 'Saving Session...' : 'Save Session Note'}
        </button>

      </form>
    </div>
  );
};

const styles = {
  container: { padding: '30px', maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
  backBtn: { background: 'none', border: 'none', color: '#666', cursor: 'pointer', marginBottom: '20px', fontSize: '16px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  group: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontWeight: '600', color: '#444' },
  input: { padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '15px' },
  submitBtn: { padding: '15px', backgroundColor: '#4a90e2', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }
};

export default TherapySessionForm;