import React, { useState, useEffect } from "react";
import api from "../services/api";
import "./CommitLinker.css";

function CommitLinker({ testcaseId, onCommitLinked }) {
  const [commits, setCommits] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [commitSha, setCommitSha] = useState("");
  const [commitMessage, setCommitMessage] = useState("");
  const [commitAuthor, setCommitAuthor] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fetchLoading, setFetchLoading] = useState(false);

  useEffect(() => {
    fetchCommits();
  }, [testcaseId]);

  const fetchCommits = async () => {
    setFetchLoading(true);
    try {
      const res = await api.get(`/testcase/${testcaseId}/commits`);
      setCommits(res.data);
    } catch (err) {
      console.error("Failed to fetch commits:", err);
    } finally {
      setFetchLoading(false);
    }
  };

  const linkCommit = async () => {
    if (!commitSha.trim()) {
      setError("Commit SHA is required");
      return;
    }

    setLoading(true);
    try {
      await api.post(`/testcase/${testcaseId}/commits`, {
        commit_sha: commitSha,
        commit_message: commitMessage || null,
        commit_author: commitAuthor || null,
        repository_url: repositoryUrl || null
      });

      setCommitSha("");
      setCommitMessage("");
      setCommitAuthor("");
      setRepositoryUrl("");
      setError("");
      setShowForm(false);
      fetchCommits();
      if (onCommitLinked) onCommitLinked();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to link commit");
    } finally {
      setLoading(false);
    }
  };

  const unlinkCommit = async (commitId) => {
    if (!window.confirm("Are you sure you want to unlink this commit?")) {
      return;
    }

    try {
      await api.delete(`/testcase/${testcaseId}/commits/${commitId}`);
      fetchCommits();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to unlink commit");
    }
  };

  return (
    <div className="commit-linker-container">
      <div className="commit-header">
        <h3>🔗 Linked Commits</h3>
        <button 
          className="add-commit-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "+ Link Commit"}
        </button>
      </div>

      {showForm && (
        <div className="commit-form">
          <div className="form-group">
            <label>Commit SHA (required)*</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g., a1b2c3d or abcdef1234567890"
              value={commitSha}
              onChange={(e) => setCommitSha(e.target.value)}
            />
            <small>7-40 hexadecimal characters</small>
          </div>

          <div className="form-group">
            <label>Commit Message</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g., Fix login bug"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Author</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g., john@example.com"
              value={commitAuthor}
              onChange={(e) => setCommitAuthor(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Repository URL</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g., https://github.com/user/repo"
              value={repositoryUrl}
              onChange={(e) => setRepositoryUrl(e.target.value)}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            className="link-btn"
            onClick={linkCommit}
            disabled={loading || !commitSha.trim()}
          >
            {loading ? "Linking..." : "Link Commit"}
          </button>
        </div>
      )}

      <div className="commits-list">
        {fetchLoading ? (
          <p className="loading-text">Loading commits...</p>
        ) : commits.length === 0 ? (
          <p className="no-commits-text">No commits linked yet</p>
        ) : (
          commits.map(commit => (
            <div key={commit.id} className="commit-item">
              <div className="commit-sha-block">
                <code className="commit-sha">{commit.commit_sha}</code>
              </div>
              <div className="commit-details">
                {commit.commit_message && (
                  <p className="commit-message">{commit.commit_message}</p>
                )}
                <div className="commit-meta">
                  {commit.commit_author && (
                    <span className="meta-item">👤 {commit.commit_author}</span>
                  )}
                  {commit.commit_date && (
                    <span className="meta-item">📅 {new Date(commit.commit_date).toLocaleDateString()}</span>
                  )}
                  <span className="meta-item">🔗 {commit.linked_by_user}</span>
                  <span className="meta-item">⏰ {new Date(commit.linked_at).toLocaleString()}</span>
                </div>
                {commit.repository_url && (
                  <p className="repo-url">
                    <a href={commit.repository_url} target="_blank" rel="noopener noreferrer">
                      {commit.repository_url}
                    </a>
                  </p>
                )}
              </div>
              <button 
                className="unlink-btn"
                onClick={() => unlinkCommit(commit.id)}
                title="Unlink this commit"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CommitLinker;
