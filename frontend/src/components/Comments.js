import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import "./Comments.css";

function Comments({ bugId, testcaseId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const currentUserEmail = localStorage.getItem("email");

  const fetchComments = useCallback(async () => {
    try {
      const endpoint = bugId 
        ? `/bugs/${bugId}/comments`
        : `/testcases/${testcaseId}/comments`;
      const res = await api.get(endpoint);
      setComments(res.data || []);
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    }
  }, [bugId, testcaseId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

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

  const startEdit = (comment) => {
    setEditingId(comment.id);
    setEditText(comment.comment_text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const saveEdit = async (commentId) => {
    if (!editText.trim()) {
      setError("Comment cannot be empty");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.put(`/comments/${commentId}`, {
        comment_text: editText,
      });
      setEditingId(null);
      setEditText("");
      fetchComments();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update comment");
    } finally {
      setLoading(false);
    }
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.delete(`/comments/${commentId}`);
      fetchComments();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete comment");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const canEditOrDelete = (comment) => {
    const createdAt = new Date(comment.created_at);
    const now = new Date();
    const diffMinutes = (now - createdAt) / 1000 / 60;
    return comment.user_email === currentUserEmail && diffMinutes <= 5;
  };

  return (
    <div className="comments-section">
      <h3 className="comments-title">
        💬 Discussion ({comments.length})
      </h3>

      {error && <div className="comment-error">{error}</div>}

      {/* Add Comment */}
      <div className="add-comment">
        <textarea
          className="comment-textarea"
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows="3"
        />
        <button
          className="comment-btn"
          onClick={addComment}
          disabled={loading || !newComment.trim()}
        >
          {loading ? "Posting..." : "Post Comment"}
        </button>
      </div>

      {/* Comments List */}
      <div className="comments-list">
        {comments.length === 0 ? (
          <p className="no-comments">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-header">
                <div className="comment-author">
                  <span className="author-name">{comment.user_email}</span>
                  <span className={`author-role role-${comment.user_role}`}>
                    {comment.user_role}
                  </span>
                </div>
                <div className="comment-meta">
                  <span className="comment-time">{formatDate(comment.created_at)}</span>
                  {comment.created_at !== comment.updated_at && (
                    <span className="edited-tag">(edited)</span>
                  )}
                </div>
              </div>

              <div className="comment-body">
                {editingId === comment.id ? (
                  <div className="edit-comment">
                    <textarea
                      className="comment-textarea"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows="3"
                    />
                    <div className="edit-actions">
                      <button
                        className="save-btn"
                        onClick={() => saveEdit(comment.id)}
                        disabled={loading}
                      >
                        Save
                      </button>
                      <button
                        className="cancel-btn"
                        onClick={cancelEdit}
                        disabled={loading}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="comment-text">{comment.comment_text}</p>
                )}
              </div>

              {canEditOrDelete(comment) && editingId !== comment.id && (
                <div className="comment-actions">
                  <button
                    className="edit-link"
                    onClick={() => startEdit(comment)}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-link"
                    onClick={() => deleteComment(comment.id)}
                  >
                    Delete
                  </button>
                  <span className="action-note">(within 5 minutes)</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Comments;
