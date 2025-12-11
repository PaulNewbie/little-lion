import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import childService from '../../services/childService';
import cloudinaryService from '../../services/cloudinaryService';
import { db } from '../../config/firebase';
import { collection, addDoc } from 'firebase/firestore';

const PlayGroupActivity = () => {
  const { currentUser } = useAuth();
  
  // --- STATE ---
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Form Data
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); 
  
  // Selection Data
  const [selectedImages, setSelectedImages] = useState([]); 
  const [previews, setPreviews] = useState([]); 
  const [taggedStudentIds, setTaggedStudentIds] = useState([]); 

  // --- 1. FETCH STUDENTS (OPTIMIZED) ---
  useEffect(() => {
    const fetchStudents = async () => {
      // Safety Check
      if (!currentUser) return;

      setLoadingStudents(true);
      try {
        let data = [];

        // LOGIC: If Admin -> Fetch All. If Teacher -> Fetch Assigned Only.
        if (currentUser.role === 'admin') {
          data = await childService.getAllChildren();
        } else {
          // Uses the optimized query we added to childService
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
  }, [currentUser]); // Re-run if user changes

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
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
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

      // Save to Firestore
      const activityData = {
        type: 'play_group',
        title,
        description,
        date,
        photoUrls: uploadedUrls,
        participatingStudentIds: taggedStudentIds,
        teacherId: currentUser.uid,
        teacherName: `${currentUser.firstName} ${currentUser.lastName}`,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'activities'), activityData);

      // Reset
      alert('Activity Uploaded Successfully!');
      setTitle('');
      setDescription('');
      setSelectedImages([]);
      setPreviews([]);
      setTaggedStudentIds([]);

    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload activity.");
    } finally {
      setUploading(false);
    }
  };

  // --- STYLES ---
  const styles = {
    container: { padding: '20px', maxWidth: '1000px', margin: '0 auto' },
    section: { marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' },
    label: { display: 'block', marginBottom: '5px', fontWeight: 'bold' },
    input: { width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '4px', border: '1px solid #ccc' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '15px' },
    card: (isSelected) => ({
      border: isSelected ? '3px solid #4ECDC4' : '1px solid #ddd',
      backgroundColor: isSelected ? '#e6fffa' : '#fff',
      borderRadius: '8px',
      padding: '10px',
      textAlign: 'center',
      cursor: 'pointer',
      opacity: isSelected ? 1 : 0.7,
      transition: 'all 0.2s'
    }),
    previewImg: { width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' },
    removeBtn: { background: 'red', color: 'white', border: 'none', cursor: 'pointer', padding: '2px 5px', fontSize: '10px', position: 'absolute', top: 0, right: 0 }
  };

  return (
    <div style={styles.container}>
      <h1>📸 New Play Group Activity</h1>
      
      <form onSubmit={handleSubmit}>
        
        {/* 1. Metadata */}
        <div style={styles.section}>
          <h3>1. Activity Details</h3>
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
            style={{...styles.input, height: '80px'}} 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
          />
        </div>

        {/* 2. Photos */}
        <div style={styles.section}>
          <h3>2. Select Photos</h3>
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            onChange={handleImageSelect} 
            style={{ marginBottom: '20px' }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {previews.map((src, idx) => (
              <div key={idx} style={{ position: 'relative' }}>
                <img src={src} alt="Preview" style={styles.previewImg} />
                <button type="button" onClick={() => removeImage(idx)} style={styles.removeBtn}>X</button>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Student Selection */}
        <div style={styles.section}>
          <h3>3. Who was present? ({taggedStudentIds.length})</h3>
          
          {loadingStudents ? <p>Loading your class list...</p> : (
            <>
              {students.length === 0 ? (
                <p style={{color: 'red'}}>No students found assigned to you.</p>
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
                        <div style={{ fontSize: '24px' }}>
                          {student.photoUrl ? (
                            <img 
                              src={student.photoUrl} 
                              alt="child" 
                              style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ) : '👤'}
                        </div>
                        <div style={{ fontWeight: 'bold', marginTop: '5px', fontSize: '13px' }}>{student.firstName}</div>
                        {isSelected && <div style={{ color: '#4ECDC4', fontWeight: 'bold', fontSize: '12px' }}>✓ Here</div>}
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
            padding: '15px',
            backgroundColor: uploading ? '#ccc' : '#2ecc71',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {uploading ? 'Uploading...' : '🚀 Upload Activity'}
        </button>

      </form>
    </div>
  );
};

export default PlayGroupActivity;