import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import childService from '../../services/childService';
import activityService from '../../services/activityService';
import cloudinaryService from '../../services/cloudinaryService';

const PlayGroupActivity = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve passed data from Dashboard (if any)
  const { preSelectedClassName, preSelectedStudents } = location.state || {};

  // --- STATE ---
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Form Data
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // Pre-fill Class Name if passed, otherwise empty
  const [className, setClassName] = useState(preSelectedClassName || ''); 
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); 
  
  // Selection Data
  const [selectedImages, setSelectedImages] = useState([]); 
  const [previews, setPreviews] = useState([]); 
  const [taggedStudentIds, setTaggedStudentIds] = useState([]); 

  // --- 1. FETCH STUDENTS ---
  useEffect(() => {
    const fetchStudents = async () => {
      // OPTIMIZATION: If data was passed from Dashboard, use it directly!
      if (preSelectedStudents && preSelectedStudents.length > 0) {
        setStudents(preSelectedStudents);
        setLoadingStudents(false);
        return;
      }

      // Fallback: Fetch from DB if page accessed directly (not via Dashboard card)
      if (!currentUser) return;
      setLoadingStudents(true);
      try {
        let data = [];
        if (currentUser.role === 'admin') {
          data = await childService.getAllChildren();
        } else {
          // Fetch all students assigned to me (mixed classes)
          data = await childService.getChildrenByTeacherId(currentUser.uid);
        }
        setStudents(data);
      } catch (error) {
        console.error("Error fetching students:", error);
        alert("Failed to load student list");
      } finally {
        setLoadingStudents(false);
      }
    };
    fetchStudents();
  }, [currentUser, preSelectedStudents]);

  // --- 2. IMAGE HANDLING ---
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setSelectedImages(prev => [...prev, ...files]);
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // --- 3. TAGGING LOGIC ---
  const toggleStudent = (studentId) => {
    setTaggedStudentIds(prev => {
      if (prev.includes(studentId)) return prev.filter(id => id !== studentId);
      return [...prev, studentId];
    });
  };

  const selectAll = () => {
    if (taggedStudentIds.length === students.length) {
      setTaggedStudentIds([]);
    } else {
      setTaggedStudentIds(students.map(s => s.id));
    }
  };

  // --- 4. UPLOAD & SAVE ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedImages.length === 0) return alert("Please select at least one photo.");
    if (taggedStudentIds.length === 0) return alert("Please tag at least one student.");

    setUploading(true);

    try {
      const folderPath = `little-lions/group-images/${date}`;

      // Upload Images
      const uploadPromises = selectedImages.map(file => 
        cloudinaryService.uploadImage(file, folderPath)
      );
      const uploadedUrls = await Promise.all(uploadPromises);

      // Prepare Data
      const activityData = {
        title,
        description,
        date,
        className, // "Art Class" etc.
        photoUrls: uploadedUrls,
        participatingStudentIds: taggedStudentIds,
        
        teacherId: currentUser.uid,
        teacherName: `${currentUser.firstName} ${currentUser.lastName}`,
        authorRole: 'teacher'
      };

      // Save using Activity Service (type: group_activity)
      await activityService.createGroupActivity(activityData);

      // Success & Navigate Back
      alert('Activity Uploaded Successfully!');
      
      // If we came from a specific class view, go back there. Otherwise go to dashboard.
      navigate(-1);

    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload activity.");
      setUploading(false);
    }
  };

  // --- STYLES ---
  const styles = {
    container: { padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' },
    backBtn: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '20px', fontSize: '15px', fontWeight: '600' },
    section: { marginBottom: '30px', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    label: { display: 'block', marginBottom: '8px', fontWeight: '600', color: '#334155' },
    input: { width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '15px' },
    card: (isSelected) => ({
      border: isSelected ? '2px solid #2ecc71' : '1px solid #e2e8f0',
      backgroundColor: isSelected ? '#f0fdf4' : '#fff',
      borderRadius: '8px',
      padding: '10px',
      textAlign: 'center',
      cursor: 'pointer',
      opacity: isSelected ? 1 : 0.8,
      transition: 'all 0.2s',
      boxShadow: isSelected ? '0 2px 4px rgba(46, 204, 113, 0.2)' : 'none'
    }),
    previewImg: { width: '100px', height: '100px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' },
    removeBtn: { background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '50%', width: '20px', height: '20px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'absolute', top: '-5px', right: '-5px' }
  };

  return (
    <div style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
      
      <h1 style={{ color: '#0f172a', marginBottom: '25px' }}>📸 New Group Activity</h1>
      
      <form onSubmit={handleSubmit}>
        
        {/* 1. Metadata */}
        <div style={styles.section}>
          <h3 style={{ marginTop: 0, color: '#475569' }}>1. Activity Details</h3>
          
          <label style={styles.label}>Class Name</label>
          <input 
            style={{...styles.input, backgroundColor: preSelectedClassName ? '#f1f5f9' : 'white'}} 
            placeholder="e.g. Art Class"
            value={className} 
            onChange={e => setClassName(e.target.value)} 
            // If pre-selected, we might want to make it read-only, or leave editable.
            // Leaving editable is safer in case they want to fix a typo.
          />

          <label style={styles.label}>Activity Title</label>
          <input 
            style={styles.input} 
            placeholder="e.g. Outdoor Building Blocks"
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            required 
          />
          
          <label style={styles.label}>Date</label>
          <input 
            style={styles.input} 
            type="date" 
            value={date} 
            onChange={e => setDate(e.target.value)} 
            required 
          />

          <label style={styles.label}>Description</label>
          <textarea 
            style={{...styles.input, height: '80px', fontFamily: 'inherit'}} 
            value={description} 
            onChange={e => setDescription(e.target.value)}
            placeholder="What did the children do today?"
          />
        </div>

        {/* 2. Photos */}
        <div style={styles.section}>
          <h3 style={{ marginTop: 0, color: '#475569' }}>2. Select Photos</h3>
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            onChange={handleImageSelect} 
            style={{ marginBottom: '20px' }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
            {previews.map((src, idx) => (
              <div key={idx} style={{ position: 'relative' }}>
                <img src={src} alt="Preview" style={styles.previewImg} />
                <button type="button" onClick={() => removeImage(idx)} style={styles.removeBtn}>✕</button>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Student Selection */}
        <div style={styles.section}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
            <h3 style={{ margin: 0, color: '#475569' }}>
              3. Who was present? <span style={{fontSize: '14px', color: '#64748b', fontWeight: 'normal'}}>({taggedStudentIds.length} selected)</span>
            </h3>
            <button 
              type="button" 
              onClick={selectAll} 
              style={{
                padding: '6px 12px', cursor: 'pointer', backgroundColor: '#e2e8f0', 
                border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: '600', color: '#475569'
              }}
            >
              {taggedStudentIds.length === students.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          
          {loadingStudents ? <p>Loading your class list...</p> : (
            <>
              {students.length === 0 ? (
                <p style={{color: '#ef4444', fontStyle: 'italic'}}>No students found assigned to this class.</p>
              ) : (
                <div style={styles.grid}>
                  {students.map(student => {
                    const isSelected = taggedStudentIds.includes(student.id);
                    return (
                      <div 
                        key={student.id} 
                        style={styles.card(isSelected)}
                        onClick={() => toggleStudent(student.id)}
                      >
                        <div style={{ fontSize: '24px', marginBottom: '5px' }}>
                          {student.photoUrl ? (
                            <img 
                              src={student.photoUrl} 
                              alt="child" 
                              style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ) : '👤'}
                        </div>
                        <div style={{ fontWeight: '600', fontSize: '13px', color: '#334155' }}>{student.firstName}</div>
                        {isSelected && <div style={{ color: '#2ecc71', fontWeight: 'bold', fontSize: '12px', marginTop: '4px' }}>✓ Here</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <button 
          type="submit" 
          disabled={uploading}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: uploading ? '#94a3b8' : '#2ecc71',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 4px 6px rgba(46, 204, 113, 0.25)',
            transition: 'background-color 0.2s'
          }}
        >
          {uploading ? 'Uploading...' : '🚀 Upload Group Activity'}
        </button>

      </form>
    </div>
  );
};

export default PlayGroupActivity;