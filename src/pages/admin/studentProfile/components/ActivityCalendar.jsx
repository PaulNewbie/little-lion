import React, { useState, useEffect, useContext } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../StudentProfile.css"; 
import { AuthContext } from "../../../../context/AuthContext";
import activityService from "./activityService"; 

// ==========================================
// 1. Internal Comment Section Component
// ==========================================
const CommentSection = ({ contextId, collectionName }) => {
  const { currentUser } = useContext(AuthContext);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load comments only when the user expands the section
  useEffect(() => {
    if (showComments && contextId && collectionName) {
      loadComments();
    }
  }, [showComments, contextId, collectionName]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const fetchedComments = await activityService.getComments(contextId, collectionName);
      setComments(fetchedComments);
    } catch (error) {
      console.error("Failed to load comments", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    const commentData = {
      text: newComment,
      authorId: currentUser.uid,
      authorName: `${currentUser.firstName || 'User'} ${currentUser.lastName || ''}`.trim() || currentUser.email,
      authorRole: currentUser.role || 'user'
    };

    try {
      await activityService.addComment(contextId, collectionName, commentData);
      setNewComment("");
      loadComments(); // Refresh to show the new message
    } catch (error) {
      console.error("Full error object:", error);
      alert(`Failed to send message: ${error.message}`);
    }
  };

  return (
    <div style={{ marginTop: "15px", borderTop: "1px dashed #eee", paddingTop: "10px" }}>
      <button 
        onClick={() => setShowComments(!showComments)}
        style={{
          background: "transparent",
          border: "none",
          color: "#0056b3",
          cursor: "pointer",
          fontSize: "0.85rem",
          display: "flex",
          alignItems: "center",
          gap: "5px",
          fontWeight: "600",
          padding: "5px 0"
        }}
      >
        💬 {showComments ? "Hide Comments" : "Discuss this Activity"}
      </button>

      {showComments && (
        <div className="comments-container" style={{ marginTop: "10px" }}>
          {/* Messages List */}
          <div className="comments-list" style={{ 
            maxHeight: "200px", 
            overflowY: "auto", 
            marginBottom: "10px", 
            display: "flex", 
            flexDirection: "column", 
            gap: "8px",
            background: "#f9f9f9",
            padding: "10px",
            borderRadius: "8px",
          }}>
            {loading ? (
              <p style={{ fontSize: "0.8rem", color: "#888" }}>Loading messages...</p>
            ) : comments.length === 0 ? (
              <p style={{ fontSize: "0.8rem", color: "#888", fontStyle: "italic", textAlign: "center" }}>
                No messages yet.
              </p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} style={{ 
                  background: comment.authorId === currentUser?.uid ? "#e3f2fd" : "#fff", 
                  padding: "8px 10px", 
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  alignSelf: comment.authorId === currentUser?.uid ? "flex-end" : "flex-start",
                  maxWidth: "90%",
                  border: "1px solid #eee"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px", gap: "8px" }}>
                    <span style={{ fontWeight: "bold", fontSize: "0.75rem", color: "#444" }}>{comment.authorName}</span>
                    <span style={{ fontSize: "0.7rem", color: "#888" }}>
                      {new Date(comment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <div style={{ color: "#333" }}>{comment.text}</div>
                </div>
              ))
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendComment} style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a message..."
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: "15px",
                border: "1px solid #ddd",
                fontSize: "0.85rem",
                outline: "none"
              }}
            />
            <button 
              type="submit" 
              disabled={!newComment.trim()}
              style={{
                backgroundColor: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "15px",
                padding: "5px 15px",
                cursor: newComment.trim() ? "pointer" : "default",
                opacity: newComment.trim() ? 1 : 0.6,
                fontSize: "0.8rem",
                fontWeight: "bold"
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 2. Main Calendar Component
// ==========================================
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

  // Helper to get staff name
  const getTeacherName = (id) => {
    const staff = teachers.find((t) => t.id === id || t.uid === id);
    return staff ? `${staff.firstName} ${staff.lastName}` : "—";
  };

  // Helper to map mood to emoji
  const getEmojiForMood = (mood) => {
    const map = {
      Happy: "😊", Focused: "🧐", Active: "⚡",
      Tired: "🥱", Upset: "😢", Social: "👋",
    };
    return map[mood] || "•";
  };

  // Helper to determine collection name for comments
  const getCollectionName = (rec) => {
    if (rec.type === 'therapy_session' || rec._collection === 'therapy_sessions') {
      return 'therapy_sessions';
    }
    return 'activities';
  };

  const tileContent = ({ date, view }) => {
    if (view === "month") {
      const hasActivity = getActivitiesForDate(date).length > 0;
      return hasActivity ? <div className="calendar-dot"></div> : null;
    }
    return null;
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
              const targetCollection = getCollectionName(rec);

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

                  {/* === COMMENTS SPECIFIC TO THIS ACTIVITY === */}
                  <CommentSection 
                    contextId={rec.id} 
                    collectionName={targetCollection} 
                  />
                  
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