import { useState, useEffect } from "react";
import api from "../services/api";
import Navbar from "../components/Navbar";
import "./Bug.css";

function Bug() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [bugs, setBugs] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchBugs();
  }, []);

  const fetchBugs = async () => {
    try {
      const res = await api.get("/bugs");
      setBugs(res.data || []);
    } catch {
      setError("Failed to load bugs");
    }
  };

  const addBug = async () => {
    setError("");
    setSuccess("");

    if (!title.trim() || !desc.trim()) {
      setError("All fields required");
      return;
    }

    try {
      await api.post("/bugs", {
        title,
        description: desc
      });

      setSuccess("Bug added successfully!");
      setTitle("");
      setDesc("");
      fetchBugs();
    } catch (err) {
      console.log(err);
      setError("Failed to add bug");
    }
  };

  return (
    <div className="bug-container">
      <Navbar />

      <div className="bug-content">
        <h1>🐛 Bug Management</h1>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* Bug Form */}
        <div className="bug-form-section">
          <div className="form-group">
            <label>Bug Title</label>
            <input
              className="input-field"
              placeholder="Enter bug title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              className="input-field textarea"
              placeholder="Describe the bug"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>

          <button className="submit-btn" onClick={addBug}>
            Add Bug
          </button>
        </div>

        {/* Bug List */}
        <div className="bugs-list-section">
          <h2>Recent Bugs</h2>

          {bugs.length === 0 ? (
            <p className="empty-message">No bugs reported yet</p>
          ) : (
            <div className="bugs-grid">
              {bugs.map((bug) => (
                <div key={bug.id} className="bug-card">
                  <div className="bug-header">
                    <h3>{bug.title}</h3>
                    <span className={`status-badge status-${bug.status || "open"}`}>
                      {bug.status || "open"}
                    </span>
                  </div>

                  <p className="bug-description">
                    {bug.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Bug;
