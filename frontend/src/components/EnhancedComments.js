import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import "./EnhancedComments.css";

function EnhancedComments({ bugId, testcaseId }) {
  const [comments, setComments] = useState([]);
  const [threads, setThreads] = useState({});
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showReactions, setShowReactions] = useState({});
  const [expandedThreads, setExpandedThreads] = useState({});
  const currentUserEmail = localStorage.getItem("email");

  const reactionOptions = ["👍", "❤️", "😂", "🎉", "🚀", "✨"];

  const fetchComments = useCallback(async () => {
    try {
      const endpoint = bugId 
        ? `/bugs/${bugId}/comments`
        : `/testcases/${testcaseId}/comments`;
      const res = await api.get(endpoint);
      const topLevelComments = res.data?.filter(c => !c.parent_comment_id) || [];
      setComments(topLevelComments);
      
      // Fetch threads for each comment
      topLevelComments.forEach(comment => {
        fetchThread(comment.id);
      });
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    }
  }, [bugId, testcaseId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const fetchThread = async (commentId) => {
    try {
      const res = await api.get(`/comments/${commentId}/thread`);
      setThreads(prev => ({
        ...prev,
        [commentId]: res.data || []
      }));
    } catch (err) {
      console.error("Failed to fetch thread:", err);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) {
      setError("Comment cannot be empty");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post("/comments", {
        bug_id: bugId || null,
        testcase_id: testcaseId || null,
        comment_text: newComment,
      });
      setNewComment("");
      fetchComments();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add comment");
    } finally {
      setLoading(false);
    }
  };

  const addReply = async (parentCommentId) => {
    if (!replyText.trim()) {
      setError("Reply cannot be empty");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post(`/comments/${parentCommentId}/reply`, {
        comment_text: replyText
      });
      setReplyText("");
      setReplyingTo(null);
      fetchThread(parentCommentId);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add reply");
    } finally {
      setLoading(false);
    }
  };

  const updateComment = async (commentId) => {
    if (!editText.trim()) {
      setError("Comment cannot be empty");
      return;
    }

    try {
      await api.put(`/comments/${commentId}`, {
        comment_text: editText
      });
      setEditingId(null);
      setEditText("");
      fetchComments();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update comment");
    }
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;

    try {
      await api.delete(`/comments/${commentId}`);
      fetchComments();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete comment");
    }
  };

  const pinComment = async (commentId) => {
    try {
      await api.post(`/comments/${commentId}/pin`);
      fetchComments();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to pin comment");
    }
  };

  const addReaction = async (commentId, reaction) => {
    try {
      await api.post(`/comments/${commentId}/reactions`, { reaction });
      fetchThread(commentId);
      setShowReactions(prev => ({ ...prev, [commentId]: false }));
    } catch (err) {
      console.error("Failed to add reaction:", err);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const removeReaction = async (commentId, reaction) => {
    try {
      await api.delete(`/comments/${commentId}/reactions/${encodeURIComponent(reaction)}`);
      fetchThread(commentId);
    } catch (err) {
      console.error("Failed to remove reaction:", err);
    }
  };

  const renderComment = (comment, isReply = false) => {
    const isOwnComment = currentUserEmail === comment.user_email;
    const threadComments = threads[comment.id] || [];
    const replies = threadComments.filter(c => c.parent_comment_id === comment.id);

    return (
      <div key={comment.id} className={`comment-item ${isReply ? "reply" : "top-level"} ${comment.is_pinned ? "pinned" : ""}`}>
        {comment.is_pinned && <div className="pinned-badge">📌 Pinned</div>}
        
        <div className="comment-header">
          <span className="user-email">{comment.user_email}</span>
          <span className="user-role">({comment.user_role})</span>
          <span className="timestamp">{new Date(comment.created_at).toLocaleString()}</span>
        </div>

        {editingId === comment.id ? (
          <div className="comment-edit">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="edit-textarea"
            />
            <div className="edit-actions">
              <button onClick={() => updateComment(comment.id)} className="save-btn">Save</button>
              <button onClick={() => setEditingId(null)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="comment-text">{comment.comment_text}</div>
        )}

        <div className="comment-actions">
          {!isReply && <button onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)} className="reply-btn">💬 Reply</button>}
          {isOwnComment && editingId !== comment.id && (
            <>
              <button onClick={() => { setEditingId(comment.id); setEditText(comment.comment_text); }} className="edit-btn">✏️ Edit</button>
              <button onClick={() => deleteComment(comment.id)} className="delete-btn">🗑️ Delete</button>
            </>
          )}
          <button onClick={() => pinComment(comment.id)} className="pin-btn">{comment.is_pinned ? "📌 Unpin" : "📌 Pin"}</button>
          <button onClick={() => setShowReactions(prev => ({ ...prev, [comment.id]: !prev[comment.id] }))} className="react-btn">😊 React</button>
        </div>

        {showReactions[comment.id] && (
          <div className="reactions-picker">
            {reactionOptions.map(reaction => (
              <button key={reaction} onClick={() => addReaction(comment.id, reaction)} className="reaction-option">
                {reaction}
              </button>
            ))}
          </div>
        )}

        {replyingTo === comment.id && !isReply && (
          <div className="reply-form">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="reply-textarea"
              placeholder="Write your reply..."
            />
            <div className="reply-actions">
              <button onClick={() => addReply(comment.id)} className="submit-reply-btn" disabled={loading}>
                {loading ? "Sending..." : "Send Reply"}
              </button>
              <button onClick={() => setReplyingTo(null)} className="cancel-reply-btn">Cancel</button>
            </div>
          </div>
        )}

        {!isReply && replies.length > 0 && (
          <div className="thread-section">
            <button onClick={() => setExpandedThreads(prev => ({ ...prev, [comment.id]: !prev[comment.id] }))} className="expand-thread-btn">
              {expandedThreads[comment.id] ? "▼" : "▶"} {replies.length} {replies.length === 1 ? "reply" : "replies"}
            </button>
            {expandedThreads[comment.id] && (
              <div className="replies-container">
                {replies.map(reply => renderComment(reply, true))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="enhanced-comments-container">
      <h3>💬 Comments</h3>

      <div className="new-comment-form">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="comment-textarea"
        />
        {error && <div className="error-message">{error}</div>}
        <button 
          onClick={addComment} 
          className="submit-comment-btn"
          disabled={loading}
        >
          {loading ? "Posting..." : "Post Comment"}
        </button>
      </div>

      <div className="comments-list">
        {comments.length === 0 ? (
          <p className="no-comments">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map(comment => renderComment(comment))
        )}
      </div>
    </div>
  );
}

export default EnhancedComments;
