import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../StudentProfile.css"; // Shared CSS

const ActivityCalendar = ({ activities, teachers, selectedServiceName }) => {
  const [date, setDate] = useState(new Date());

  // Reset date to today when switching services
  useEffect(() => {
    setDate(new Date());
  }, [selectedServiceName]);

  const getActivitiesForDate = (selectedDate) => {
    return activities.filter((act) => {
      const actDate = new Date(act.date);
      return (
        actDate.getDate() === selectedDate.getDate() &&
        actDate.getMonth() === selectedDate.getMonth() &&
        actDate.getFullYear() === selectedDate.getFullYear()
      );
    });
  };

  const selectedActivities = getActivitiesForDate(date);

  const tileContent = ({ date, view }) => {
    if (view === "month") {
      const hasActivity = getActivitiesForDate(date).length > 0;
      return hasActivity ? <div className="calendar-dot"></div> : null;
    }
    return null;
  };

  const getTeacherName = (id) => {
    const staff = teachers.find((t) => t.id === id || t.uid === id);
    return staff ? `${staff.firstName} ${staff.lastName}` : "—";
  };

  const getEmojiForMood = (mood) => {
    const map = {
      Happy: "😊", Focused: "🧐", Active: "⚡",
      Tired: "🥱", Upset: "😢", Social: "👋",
    };
    return map[mood] || "•";
  };

  return (
    <div className="calendar-view-container">
      <div className="day-details-section">
        <h3 className="date-heading">
          {date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </h3>

        {selectedActivities.length === 0 ? (
          <div className="no-activity-msg">
            <p>No activities recorded for this date.</p>
          </div>
        ) : (
          <div className="daily-records-list">
            {selectedActivities.map((rec, i) => {
              const isTherapy = rec.type === "therapy_session" || rec._collection === "therapy_sessions";
              return (
                <div key={i} className="record-card">
                  <div className="record-header">
                    <span className="record-type">{rec.serviceName || rec.serviceType || "Activity"}</span>
                    <span style={{ fontSize: "0.8rem", color: "#666", float: "right" }}>
                      {new Date(rec.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p>
                    <span className="label">Staff:</span>{" "}
                    {rec.authorName || rec.teacherName || getTeacherName(rec.teacherId || rec.authorId)}
                  </p>

                  {rec.studentReaction?.length > 0 && (
                    <div style={{ margin: "8px 0" }}>
                      {rec.studentReaction.map((m, idx) => (
                        <span key={idx} className="reaction-tag">
                          {getEmojiForMood(m)} {m}
                        </span>
                      ))}
                    </div>
                  )}

                  <p><span className="label">Title:</span> {rec.title || "—"}</p>

                  {isTherapy ? (
                    <>
                      {rec.sessionNotes && <p><span className="label">Notes:</span> {rec.sessionNotes}</p>}
                      <div style={{ display: 'grid', gap: '8px', marginTop: '8px' }}>
                        {rec.strengths && (
                          <div className="therapy-strength">
                             <strong>💪 Strengths:</strong> {rec.strengths}
                          </div>
                        )}
                        {rec.weaknesses && (
                          <div className="therapy-weakness">
                            <strong>🔻 Improvements:</strong> {rec.weaknesses}
                          </div>
                        )}
                      </div>
                      {rec.homeActivities && (
                        <div style={{ marginTop: '8px' }}>
                           <span className="label">🏠 Home Plan:</span> {rec.homeActivities}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <p><span className="label">Description:</span> {rec.progressNotes || rec.description || "—"}</p>
                      {rec.goalsAddressed && (
                        <p><span className="label">Goals:</span> {rec.goalsAddressed.join(", ")}</p>
                      )}
                    </>
                  )}

                  {rec.photoUrls?.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      {rec.photoUrls.map((url, imgIdx) => (
                         <img key={imgIdx} className="activity-image-preview" src={url} alt="activity" onClick={() => window.open(url, "_blank")} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="calendar-section">
        <Calendar onChange={setDate} value={date} tileContent={tileContent} className="custom-calendar" />
      </div>
    </div>
  );
};

export default ActivityCalendar;