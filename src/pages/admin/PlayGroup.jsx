import React, { useState, useEffect } from 'react';
import childService from '../../services/childService';
import activityService from '../../services/activityService';
import AdminSidebar from '../../components/sidebar/AdminSidebar';

const PlayGroup = () => {
  // Navigation State
  const [currentLevel, setCurrentLevel] = useState('child-list'); // child-list, date-list, photo-view
  
  // Data State
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childActivities, setChildActivities] = useState([]); // All activities for selected child
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(false);

  // 1. Load Children on Mount
  useEffect(() => {
    const fetchChildren = async () => {
      setLoading(true);
      try {
        const data = await childService.getAllChildren();
        setChildren(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchChildren();
  }, []);

  // 2. Handle Child Selection
  const handleChildSelect = async (child) => {
    setSelectedChild(child);
    setLoading(true);
    try {
      // Fetch all activities for this child to build the date list
      const activities = await activityService.getActivitiesByChild(child.id);
      setChildActivities(activities);
      setCurrentLevel('date-list');
    } catch (err) {
      alert("Error loading activities");
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Date Selection
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setCurrentLevel('photo-view');
  };

  // 4. Back Navigation
  const goBackToChildren = () => {
    setSelectedChild(null);
    setChildActivities([]);
    setCurrentLevel('child-list');
  };

  const goBackToDates = () => {
    setSelectedDate(null);
    setCurrentLevel('date-list');
  };

  // Helper: Get unique dates from activities
  const getUniqueDates = () => {
    const dates = childActivities.map(a => a.date);
    return [...new Set(dates)].sort((a, b) => b.localeCompare(a)); // Newest first
  };

  // Helper: Get photos for selected date
  const getPhotosForSelectedDate = () => {
    return childActivities
      .filter(a => a.date === selectedDate)
      .flatMap(a => a.photoUrls); // Combine all photos from multiple activities on same day if any
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar />
      <div style={{ flex: 1, padding: '20px' }}>
        
        {/* --- LEVEL 1: CHILD LIST --- */}
        {currentLevel === 'child-list' && (
          <div>
            <h1>Play Group - Select Child</h1>
            {loading ? <p>Loading...</p> : (
              <div style={styles.grid}>
                {children.map(child => (
                  <div key={child.id} style={styles.card} onClick={() => handleChildSelect(child)}>
                    {child.photoUrl ? (
                      <img src={child.photoUrl} alt="" style={styles.avatar} />
                    ) : (
                      <div style={styles.avatarPlaceholder}>👤</div>
                    )}
                    <h3>{child.firstName} {child.lastName}</h3>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- LEVEL 2: DATE LIST --- */}
        {currentLevel === 'date-list' && selectedChild && (
          <div>
            <button onClick={goBackToChildren} style={styles.backBtn}>← Back to Children</button>
            <h1>{selectedChild.firstName}'s Activities</h1>
            <h3>Select a Date Folder</h3>
            
            {getUniqueDates().length === 0 ? (
              <p>No activities found for this child.</p>
            ) : (
              <div style={styles.folderGrid}>
                {getUniqueDates().map(date => (
                  <div key={date} style={styles.folder} onClick={() => handleDateSelect(date)}>
                    <span style={{fontSize: '40px'}}>📁</span>
                    <p style={{fontWeight: 'bold'}}>{date}</p>
                    <small>
                      {childActivities.filter(a => a.date === date).length} Activity(s)
                    </small>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- LEVEL 3: PHOTO VIEW --- */}
        {currentLevel === 'photo-view' && (
          <div>
            <button onClick={goBackToDates} style={styles.backBtn}>← Back to Dates</button>
            <h1>{selectedChild.firstName}'s Photos</h1>
            <h3>Date: {selectedDate}</h3>
            
            <div style={styles.grid}>
              {getPhotosForSelectedDate().map((url, idx) => (
                <div key={idx} style={styles.photoCard}>
                  <img src={url} alt="Activity" style={styles.fullPhoto} />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// Simplified styles
const styles = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' },
  folderGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '20px', marginTop: '20px' },
  card: { padding: '20px', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', background: '#f9f9f9' },
  folder: { padding: '20px', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', background: '#fff9c4' }, // Yellow folder color
  photoCard: { border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', height: '200px' },
  fullPhoto: { width: '100%', height: '100%', objectFit: 'cover' },
  avatar: { width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', marginBottom: '10px' },
  avatarPlaceholder: { width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 10px' },
  backBtn: { marginBottom: '20px', padding: '8px 16px', cursor: 'pointer' }
};

export default PlayGroup;