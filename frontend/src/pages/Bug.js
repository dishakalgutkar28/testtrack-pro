import { useState, useEffect } from "react";
import api from "../services/api";
import Navbar from "../components/Navbar";
import "./Bug.css";

function Bug() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [bugs, setBugs] = useState([]);
  const [role, setRole] = useState("");

  useEffect(() => {
    const userRole = localStorage.getItem("role") || "tester";
    setRole(userRole);

    if (userRole !== "tester") {
      setError("Only Testers can report bugs. You can view existing bugs below.");
    }

    fetchBugs();

    // Load projects (if you want to link bugs to projects later)
    api.get("/api/projects")
      .then(r => setProjects(r.data || []))
      .catch(() => {});
  }, []);

  const fetchBugs = () => {
    api.get("/api/bugs")
      .then(res => {
        console.log("Bugs:", res.data);
        setBugs(res.data || []);
      })
      .catch(err => {
        console.log("Error fetching bugs:", err);
        setError("Failed to load bugs");
      });
  };

  const addBug = () => {
    setError("");
    setSuccess("");

    if (role !== "tester") {
      setError("Only Testers can report bugs!");
      return;
    }

    if (!title.trim() || !desc.trim()) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);

    api.post("/api/bug", { 
      title, 
      description: desc, 
      projectId: projectId || null 
    })
      .then(() => {
        setSuccess("Bug reported successfully!");
        setTitle("");
        setDesc("");
        setProjectId("");
        fetchBugs(); // reload list
        setTimeout(() => setSuccess(""), 3000);
      })
      .catch((err) => {
        console.log("Add bug error:", err);
        setError(err.response?.data?.error || "Failed to submit bug. Please try again.");
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="bug-container">
      <Navbar />
      <div className="bug-content">
        <h1>🐛 Bug Management</h1>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* Only Tester can see the form */}
        {role === "tester" && (
          <div className="bug-form-section">
            <h2>Report a Bug</h2>
            <p className="subtitle">Help us identify and fix issues</p>

            <div className="form-group">
              <label>Bug Title *</label>
              <input
                className="input-field"
                type="text"
                placeholder="Brief title of the bug"
                value={title}
                onChange={e => setTitle(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                className="input-field textarea"
                placeholder="Detailed description of the bug"
                value={desc}
                onChange={e => setDesc(e.target.value)}
                rows="4"
                disabled={loading}
              />
            </div>

            <button
              className="submit-btn"
              onClick={addBug}
              disabled={loading}
            >
              {loading ? "Reporting..." : "Report Bug"}
            </button>
          </div>
        )}

        {/* Bug list for everyone */}
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
                  <p className="bug-description">{bug.description}</p>
                  {bug.project_id && (
                    <p className="bug-meta">Project ID: {bug.project_id}</p>
                  )}
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
