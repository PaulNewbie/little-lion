import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar'; // Import Calendar
import 'react-calendar/dist/Calendar.css'; // Import default styles
import childService from '../../services/childService';
import activityService from '../../services/activityService';
import AdminSidebar from '../../components/sidebar/AdminSidebar';
import './css/PlayGroup.css'; // You'll need to create this for custom highlights

const PlayGroup = () => {
  // Navigation State
  const [currentLevel, setCurrentLevel] = useState('child-list'); 
  
  // Data State
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childActivities, setChildActivities] = useState([]); 
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(false);

  // 1. Load Children on Mount (Same as before)
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

  // 2. Handle Child Select (Same as before)
  const handleChildSelect = async (child) => {
    setSelectedChild(child);
    setLoading(true);
    try {
      const activities = await activityService.getActivitiesByChild(child.id);
      setChildActivities(activities);
      setCurrentLevel('date-list');
    } catch (err) {
      alert("Error loading activities");
    } finally {
      setLoading(false);
    }
  };

  // 3. CALENDAR HANDLER
  const handleCalendarClick = (dateObj) => {
    // Convert the calendar date object to YYYY-MM-DD string to match Firestore
    // Note: This handles timezone offset to ensure correct date string
    const offset = dateObj.getTimezoneOffset();
    const localDate = new Date(dateObj.getTime() - (offset * 60 * 1000));
    const dateString = localDate.toISOString().split('T')[0];

    // Check if we actually have photos for this date
    const hasPhotos = childActivities.some(a => a.date === dateString);

    if (hasPhotos) {
      setSelectedDate(dateString);
      setCurrentLevel('photo-view');
    } else {
      alert("No activities found for this date.");
    }
  };

  // 4. Back Navigation (Same as before)
  const goBackToChildren = () => {
    setSelectedChild(null);
    setChildActivities([]);
    setCurrentLevel('child-list');
  };

  const goBackToDates = () => {
    setSelectedDate(null);
    setCurrentLevel('date-list');
  };

  // Helper: Get photos for selected date
  const getPhotosForSelectedDate = () => {
    return childActivities
      .filter(a => a.date === selectedDate)
      .flatMap(a => a.photoUrls); 
  };

  // Helper: For Calendar highlighting
  const getUniqueDates = () => {
    return childActivities.map(a => a.date);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar />
      <div style={{ flex: 1, padding: '20px' }}>
        
        {/* --- LEVEL 1: CHILD LIST (Unchanged) --- */}
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

        {/* --- LEVEL 2: CALENDAR VIEW (REPLACED FOLDERS) --- */}
        {currentLevel === 'date-list' && selectedChild && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', maxWidth: '800px', marginBottom: '20px' }}>
              <button onClick={goBackToChildren} style={styles.backBtn}>← Back to Children</button>
              <h1>{selectedChild.firstName}'s Activity Calendar</h1>
            </div>
            
            {/* THE CALENDAR COMPONENT */}
            <div style={styles.calendarContainer}>
                <Calendar 
                onClickDay={handleCalendarClick}
                
                // 1. Force the Headers to be SUN, MON, TUE...
                formatShortWeekday={(locale, date) => 
                    date.toLocaleDateString(locale, { weekday: 'short' }).toUpperCase().replace('.', '')
                }

                // 2. Highlight days that have activities
                tileClassName={({ date, view }) => {
                    if (view === 'month') {
                    // Adjust for timezone to match your Firestore "YYYY-MM-DD" strings
                    const offset = date.getTimezoneOffset();
                    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
                    const dStr = localDate.toISOString().split('T')[0];
                    
                    // Check if this date exists in your activity list
                    if (getUniqueDates().includes(dStr)) {
                        return 'has-activity'; 
                    }
                    }
                }}
                />
            </div>
          </div>
        )}

        {/* --- LEVEL 3: PHOTO VIEW (Unchanged) --- */}
        {currentLevel === 'photo-view' && (
          <div>
            <button onClick={goBackToDates} style={styles.backBtn}>← Back to Calendar</button>
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

const styles = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' },
  calendarContainer: { 
    width: '100%', 
    maxWidth: '1200px',
    padding: '20px', 
    background: '#fff', 
    borderRadius: '15px', 
  },
  card: { padding: '20px', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', background: '#f9f9f9' },
  photoCard: { border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', height: '200px' },
  fullPhoto: { width: '100%', height: '100%', objectFit: 'cover' },
  avatar: { width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', marginBottom: '10px' },
  avatarPlaceholder: { width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 10px' },
  backBtn: { marginBottom: '20px', padding: '8px 16px', cursor: 'pointer', background: 'none', border: '1px solid #ccc', borderRadius: '4px' }
};

export default PlayGroup;