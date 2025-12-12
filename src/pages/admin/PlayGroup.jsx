import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import childService from '../../services/childService';
import activityService from '../../services/activityService';
import AdminSidebar from '../../components/sidebar/AdminSidebar';
import './css/PlayGroup.css';
import './css/OneOnOne.css'; // Reusing card styles

const PlayGroup = () => {
  // Navigation State: 'calendar-view' | 'child-list' | 'photo-view'
  const [currentLevel, setCurrentLevel] = useState('calendar-view');
  
  // Data State
  const [allChildren, setAllChildren] = useState([]); 
  const [allActivities, setAllActivities] = useState([]); 
  const [loading, setLoading] = useState(true);

  // Selection State
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);

  // --- 1. INITIAL LOAD ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [childrenData, activitiesData] = await Promise.all([
          childService.getAllChildren(),
          activityService.getAllPlayGroupActivities()
        ]);
        setAllChildren(childrenData);
        setAllActivities(activitiesData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- HELPER: Get Dates with Activities ---
  const getActivityDates = () => {
    return allActivities.map(a => a.date);
  };

  // --- LEVEL 1 -> 2: CALENDAR CLICK ---
  const handleCalendarClick = (dateObj) => {
    // Adjust for timezone offset to get YYYY-MM-DD
    const offset = dateObj.getTimezoneOffset();
    const localDate = new Date(dateObj.getTime() - (offset * 60 * 1000));
    const dateString = localDate.toISOString().split('T')[0];

    // Check if any activity exists on this date
    const activitiesOnDate = allActivities.filter(a => a.date === dateString);

    if (activitiesOnDate.length > 0) {
      setSelectedDate(dateString);
      setCurrentLevel('child-list');
    } else {
      alert("No playgroup activities recorded for this date.");
    }
  };

  // --- LEVEL 2 -> 3: CHILD SELECT ---
  const handleChildSelect = (child) => {
    setSelectedChild(child);
    setCurrentLevel('photo-view');
  };

  // --- NAVIGATION ---
  const goBackToCalendar = () => {
    setSelectedDate(null);
    setCurrentLevel('calendar-view');
  };

  const goBackToChildList = () => {
    setSelectedChild(null);
    setCurrentLevel('child-list');
  };

  // --- DATA DERIVATION ---
  
  // For Level 2: Get children present on selectedDate
  const getPresentChildren = () => {
    if (!selectedDate) return [];
    
    // 1. Find all activities for this date
    const activities = allActivities.filter(a => a.date === selectedDate);
    
    // 2. Collect all student IDs tagged in these activities
    const presentIds = new Set();
    activities.forEach(a => {
      if (a.participatingStudentIds) {
        a.participatingStudentIds.forEach(id => presentIds.add(id));
      }
    });

    // 3. Filter the master children list
    return allChildren.filter(c => presentIds.has(c.id));
  };

  // For Level 3: Get photos for specific child on specific date
  const getChildPhotos = () => {
    if (!selectedDate || !selectedChild) return [];

    // Find activities on this date where this child was present
    const relevantActivities = allActivities.filter(a => 
      a.date === selectedDate && 
      a.participatingStudentIds?.includes(selectedChild.id)
    );

    // Extract all photo URLs
    return relevantActivities.flatMap(a => a.photoUrls || []);
  };

  return (
    <div className="ooo-container">
      <AdminSidebar />
      <div className="ooo-main">
        
        {/* --- LEVEL 1: CALENDAR LANDING --- */}
        {currentLevel === 'calendar-view' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="ooo-header" style={{ width: '100%', marginBottom: '20px' }}>
              <h1>Play Group Calendar</h1>
            </div>
            
            {loading ? <p>Loading Calendar...</p> : (
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
                      
                      if (getActivityDates().includes(dStr)) {
                        return 'has-activity'; 
                      }
                    }
                  }}
                />
                <p style={{ marginTop: '15px', color: '#666', textAlign: 'center' }}>
                  * Green tiles indicate playgroup sessions. Click to view present students.
                </p>
              </div>
            )}
          </div>
        )}

        {/* --- LEVEL 2: PRESENT CHILDREN LIST --- */}
        {currentLevel === 'child-list' && (
          <>
            <div className="ooo-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button onClick={goBackToCalendar} style={styles.backBtn}>← Back</button>
                <h1>Children Present on {selectedDate}</h1>
              </div>
            </div>

            <div className="ooo-grid">
              {getPresentChildren().map(child => (
                <div 
                  key={child.id} 
                  className="ooo-card" 
                  onClick={() => handleChildSelect(child)}
                >
                  <div className="ooo-photo-area">
                    {child.photoUrl ? (
                      <img src={child.photoUrl} alt="" className="ooo-photo" />
                    ) : (
                      <span>📷</span>
                    )}
                  </div>
                  <div className="ooo-card-info">
                    <p className="ooo-name">
                      {child.lastName}, {child.firstName}
                    </p>
                    <span style={{ fontSize: '12px', color: '#2ecc71', fontWeight: 'bold' }}>
                      ✓ Present
                    </span>
                  </div>
                </div>
              ))}
              
              {getPresentChildren().length === 0 && (
                <p>No children were tagged in the activity for this date.</p>
              )}
            </div>
          </>
        )}

        {/* --- LEVEL 3: PHOTO GALLERY --- */}
        {currentLevel === 'photo-view' && selectedChild && (
          <div>
            <div className="ooo-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button onClick={goBackToChildList} style={styles.backBtn}>← Back</button>
                <div>
                  <h1 style={{ margin: 0 }}>{selectedChild.firstName}'s Photos</h1>
                  <span style={{ fontSize: '14px', color: '#666' }}>Date: {selectedDate}</span>
                </div>
              </div>
            </div>
            
            <div style={styles.grid}>
              {getChildPhotos().map((url, idx) => (
                <div key={idx} style={styles.photoCard}>
                  <img 
                    src={url} 
                    alt="Activity" 
                    style={styles.fullPhoto} 
                    onClick={() => window.open(url, '_blank')}
                  />
                </div>
              ))}
              {getChildPhotos().length === 0 && (
                <p>No photos found for this child on this date.</p>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

const styles = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' },
  calendarContainer: { 
    width: '100%', 
    maxWidth: '1000px',
    padding: '30px', 
    background: '#fff', 
    borderRadius: '15px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
  },
  photoCard: { 
    border: '1px solid #ddd', 
    borderRadius: '8px', 
    overflow: 'hidden', 
    height: '250px',
    cursor: 'pointer',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
  },
  fullPhoto: { width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.2s' },
  backBtn: { 
    padding: '8px 16px', 
    cursor: 'pointer', 
    background: '#fff', 
    border: '1px solid #ccc', 
    borderRadius: '6px',
    fontWeight: 'bold',
    color: '#555'
  }
};

export default PlayGroup;