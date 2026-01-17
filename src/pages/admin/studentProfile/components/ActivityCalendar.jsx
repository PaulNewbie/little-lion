import React, { useState, useEffect, useContext } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../StudentProfile.css"; 
import { AuthContext } from "../../../../context/AuthContext";
import activityService from "./activityService"; 

// ==========================================
// 1. Recursive Comment Item (Thread Node)
// ==========================================
const CommentNode = ({ comment, allComments, currentUser, onReplySubmit, onDelete }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReplies, setShowReplies] = useState(false);

  // 1. Find children (Replies)
  const replies = allComments.filter(c => c.parentId === comment.id);
  const replyCount = replies.length;

  // 2. Helper for Initials
  const getInitials = (name) => name ? name.charAt(0).toUpperCase() : "?";

  // 3. Helper for Time
  const getShortTime = (dateString) => {
    if (!dateString) return "";
    const now = new Date();
    const sent = new Date(dateString);
    const diffMs = now - sent;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHour < 24) return `${diffHour}h`;
    return `${diffDay}d`;
  };

  // 4. Handle Submitting a Reply
  const handleReply = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onReplySubmit(replyText, comment.id); 
    setReplyText("");
    setIsReplying(false);
    setShowReplies(true);
  };

  // 5. Check if user is Author (For Delete & Styling)
  const isAuthor = currentUser && currentUser.uid === comment.authorId;

  const handleDeleteClick = () => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      onDelete(comment.id);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", marginTop: "10px" }}>
      
      {/* --- THE COMMENT ROW --- */}
      <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
        
        {/* Avatar */}
        <div style={{
          width: "32px", height: "32px", borderRadius: "50%",
          backgroundColor: "#ddd", color: "#555",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.8rem", fontWeight: "bold", flexShrink: 0
        }}>
          {getInitials(comment.authorName)}
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: "85%" }}>
          
          {/* Bubble */}
          <div style={{
            // --- CONDITIONAL BACKGROUND COLOR HERE ---
            backgroundColor: isAuthor ? "#e7f3ff" : "#f0f2f5", // Blue if me, Gray if others
            borderRadius: "18px",
            padding: "8px 12px", 
            display: "inline-block"
          }}>
            <div style={{ fontWeight: "600", fontSize: "0.8rem", color: "#050505" }}>
              {comment.authorName}
            </div>
            <div style={{ fontSize: "0.9rem", color: "#050505", wordWrap: "break-word" }}>
              {comment.text}
            </div>
          </div>

          {/* Metadata Footer: Time | Reply | Delete */}
          <div style={{ 
            fontSize: "0.75rem", color: "#65676B", marginLeft: "10px", 
            marginTop: "2px", fontWeight: "600", display: "flex", gap: "10px", alignItems: "center"
          }}>
            <span>{getShortTime(comment.createdAt)}</span>
            
            {!comment.parentId && (
              <span 
                onClick={() => setIsReplying(!isReplying)}
                style={{ cursor: "pointer", color: "#65676B" }}
              >
                Reply
              </span>
            )}

            {isAuthor && (
              <span 
                onClick={handleDeleteClick}
                title="Delete comment"
                style={{ 
                  cursor: "pointer", color: "#dc3545", fontSize: "0.9rem",
                  marginLeft: "5px"
                }}
              >
                🗑️
              </span>
            )}
          </div>

          {/* --- VIEW / HIDE REPLIES TOGGLE BUTTON --- */}
          {replyCount > 0 && (
            <div 
              onClick={() => setShowReplies(!showReplies)}
              style={{ 
                marginTop: "5px", marginLeft: "10px", 
                fontSize: "0.8rem", fontWeight: "600", color: "#65676B",
                cursor: "pointer", display: "flex", alignItems: "center", gap: "5px"
              }}
            >
              {showReplies ? (
                <span>⬆ Hide replies</span>
              ) : (
                <span>↪ View {replyCount} {replyCount === 1 ? "reply" : "replies"}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* --- REPLY INPUT BOX --- */}
      {isReplying && !comment.parentId && (
        <form onSubmit={handleReply} style={{ display: "flex", gap: "5px", marginLeft: "40px", marginTop: "5px" }}>
          <div style={{
             width: "24px", height: "24px", borderRadius: "50%",
             backgroundColor: "#1877F2", color: "white", fontSize: "0.7rem",
             display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            {getInitials(currentUser?.firstName)}
          </div>
          <input 
            autoFocus
            type="text" 
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Reply to ${comment.authorName}...`}
            style={{
              borderRadius: "15px", border: "1px solid #ddd", 
              padding: "4px 10px", fontSize: "0.8rem", outline: "none", width: "200px"
            }}
          />
        </form>
      )}

      {/* --- RECURSIVE REPLIES --- */}
      {showReplies && replies.length > 0 && (
        <div style={{ marginLeft: "40px", borderLeft: "2px solid #f0f2f5", paddingLeft: "5px" }}>
          {replies.map(reply => (
            <CommentNode 
              key={reply.id} 
              comment={reply} 
              allComments={allComments} 
              currentUser={currentUser}
              onReplySubmit={onReplySubmit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ==========================================
// 2. Main Comment Section Container
// ==========================================
const CommentSection = ({ contextId, collectionName }) => {
  const { currentUser } = useContext(AuthContext);
  const [comments, setComments] = useState([]);
  const [mainCommentText, setMainCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [loading, setLoading] = useState(false);

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

const handleSendComment = async (text, parentId = null) => {
    if (!text.trim() || !currentUser) return;

    // 1. Try to find a valid name from multiple properties
    let displayName = "User";
    
    if (currentUser.firstName) {
      // Standard case: firstName + lastName
      displayName = `${currentUser.firstName} ${currentUser.lastName || ''}`;
    } else if (currentUser.displayName) {
      // Fallback 1: Firebase Auth 'displayName'
      displayName = currentUser.displayName;
    } else if (currentUser.name) {
      // Fallback 2: Generic 'name' field
      displayName = currentUser.name;
    } else if (currentUser.email) {
      // Fallback 3: Use the part of email before '@'
      displayName = currentUser.email.split('@')[0];
    }

    const commentData = {
      text: text,
      parentId: parentId, 
      authorId: currentUser.uid,
      authorName: displayName.trim(), // Use the calculated name
      authorRole: currentUser.role || 'user'
    };

    try {
      await activityService.addComment(contextId, collectionName, commentData);
      setMainCommentText(""); 
      loadComments(); 
    } catch (error) {
      alert(`Failed to send message: ${error.message}`);
    }
  };
  
  const handleDeleteComment = async (commentId) => {
    try {
      await activityService.deleteComment(contextId, collectionName, commentId);
      loadComments();
    } catch (error) {
      alert("Failed to delete comment: " + error.message);
    }
  };

  const rootComments = comments.filter(c => !c.parentId);

  return (
    <div style={{ marginTop: "15px", borderTop: "1px solid #eef0f2", paddingTop: "10px" }}>
      <button 
        onClick={() => setShowComments(!showComments)}
        style={{
          background: "transparent", border: "none", color: "#65676B",
          cursor: "pointer", fontSize: "0.9rem", display: "flex", alignItems: "center",
          gap: "5px", fontWeight: "600", padding: "5px 0"
        }}
      >
        💬 {showComments ? "Hide Comments" : "Comment"}
      </button>

      {showComments && (
        <div className="comments-container" style={{ marginTop: "10px" }}>
          
          <div className="comments-list" style={{ marginBottom: "15px" }}>
            {loading ? (
              <p style={{ fontSize: "0.8rem", color: "#888" }}>Loading...</p>
            ) : comments.length === 0 ? (
              <p style={{ fontSize: "0.8rem", color: "#888", fontStyle: "italic" }}>
                No comments yet.
              </p>
            ) : (
              rootComments.map((comment) => (
                <CommentNode 
                  key={comment.id}
                  comment={comment}
                  allComments={comments}
                  currentUser={currentUser}
                  onReplySubmit={handleSendComment}
                  onDelete={handleDeleteComment}
                />
              ))
            )}
          </div>

          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendComment(mainCommentText, null); }} 
            style={{ display: "flex", gap: "8px", alignItems: "center" }}
          >
            <div style={{
              width: "32px", height: "32px", borderRadius: "50%",
              backgroundColor: "#1877F2", color: "white", display: "flex",
              alignItems: "center", justifyContent: "center", fontSize: "0.8rem",
              fontWeight: "bold", flexShrink: 0
            }}>
              {currentUser?.firstName?.charAt(0) || "?"}
            </div>

            <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
              <input
                type="text"
                value={mainCommentText}
                onChange={(e) => setMainCommentText(e.target.value)}
                placeholder="Write a comment..."
                style={{
                  width: "100%", padding: "8px 12px", paddingRight: "35px",
                  borderRadius: "20px", border: "none", backgroundColor: "#f0f2f5",
                  fontSize: "0.9rem", outline: "none", color: "#050505"
                }}
              />
              <button 
                type="submit" 
                disabled={!mainCommentText.trim()}
                style={{
                  position: "absolute", right: "5px", background: "transparent",
                  color: mainCommentText.trim() ? "#1877F2" : "#ccc",
                  border: "none", cursor: mainCommentText.trim() ? "pointer" : "default",
                  fontSize: "1.2rem", padding: "0 5px"
                }}
              >
                ➤
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 3. Main Calendar Component
// ==========================================
const ActivityCalendar = ({ activities, teachers, selectedServiceName }) => {
  const [date, setDate] = useState(new Date());

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