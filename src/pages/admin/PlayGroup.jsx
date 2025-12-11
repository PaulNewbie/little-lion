import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import childService from '../../services/childService';
import activityService from '../../services/activityService';
import AdminSidebar from '../../components/sidebar/AdminSidebar';
import './css/PlayGroup.css';
import './css/OneOnOne.css'; // Imported to use 1:1 profile card styles

const PlayGroup = () => {
  // Navigation State
  const [currentLevel, setCurrentLevel] = useState('child-list'); 
  
  // Data State
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childActivities, setChildActivities] = useState([]); 
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

  // 2. Handle Child Select
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
    const offset = dateObj.getTimezoneOffset();
    const localDate = new Date(dateObj.getTime() - (offset * 60 * 1000));
    const dateString = localDate.toISOString().split('T')[0];

    const hasPhotos = childActivities.some(a => a.date === dateString);

    if (hasPhotos) {
      setSelectedDate(dateString);
      setCurrentLevel('photo-view');
    } else {
      alert("No activities found for this date.");
    }
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
    <div className="ooo-container">
      <AdminSidebar />
      <div className="ooo-main">
        
        {/* --- LEVEL 1: CHILD LIST (UPDATED UI) --- */}
        {currentLevel === 'child-list' && (
          <>
            <div className="ooo-header">
              <h1>Play Group - Select Child</h1>
            </div>

            {loading ? <p>Loading...</p> : (
              <div className="ooo-grid">
                {children.map(child => (
                  <div 
                    key={child.id} 
                    className="ooo-card" 
                    onClick={() => handleChildSelect(child)}
                  >
                    <div className="ooo-photo-area">
                      {child.photoUrl ? (
                        <img 
                          src={child.photoUrl} 
                          alt="" 
                          className="ooo-photo" 
                        />
                      ) : (
                        <span>📷</span>
                      )}
                    </div>

                    <div className="ooo-card-info">
                      <p className="ooo-name">
                        {child.lastName}, {child.firstName}
                      </p>
                      {/* <span className="ooo-see">See More ›</span> */}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* --- LEVEL 2: CALENDAR VIEW --- */}
        {currentLevel === 'date-list' && selectedChild && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', maxWidth: '800px', marginBottom: '20px' }}>
              <button onClick={goBackToChildren} style={styles.backBtn}>← Back to Children</button>
              <h1>{selectedChild.firstName}'s Activity Calendar</h1>
            </div>
            
            <div style={styles.calendarContainer}>
                <Calendar 
                onClickDay={handleCalendarClick}
                formatShortWeekday={(locale, date) => 
                    date.toLocaleDateString(locale, { weekday: 'short' }).toUpperCase().replace('.', '')
                }
                tileClassName={({ date, view }) => {
                    if (view === 'month') {
                    const offset = date.getTimezoneOffset();
                    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
                    const dStr = localDate.toISOString().split('T')[0];
                    
                    if (getUniqueDates().includes(dStr)) {
                        return 'has-activity'; 
                    }
                    }
                }}
                />
            </div>
          </div>
        )}

        {/* --- LEVEL 3: PHOTO VIEW --- */}
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
  photoCard: { border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', height: '200px' },
  fullPhoto: { width: '100%', height: '100%', objectFit: 'cover' },
  backBtn: { marginBottom: '20px', padding: '8px 16px', cursor: 'pointer', background: 'none', border: '1px solid #ccc', borderRadius: '4px' }
};

export default PlayGroup;