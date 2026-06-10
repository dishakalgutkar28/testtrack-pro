import { useState, useEffect } from "react";
import api from "../services/api";
import Navbar from "../components/Navbar";
import Comments from "../components/Comments";
import Attachments from "../components/Attachments";
import BugFormModal from "../components/BugFormModal";
import { useTheme } from "../context/ThemeContext";
import "./Bug.css";

function Bug() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [bugs, setBugs] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [projects, setProjects] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { theme } = useTheme();
  const role = (localStorage.getItem("role") || "").toLowerCase();

  useEffect(() => {
    fetchBugs();
    fetchDevelopers();
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get("/projects");
      setProjects(res.data?.projects || []);
    } catch {
      console.log("Failed to load projects");
    }
  };

  const fetchBugs = async () => {
    try {
      const res = await api.get("/bugs");
      setBugs(res.data || []);
    } catch {
      setError("Failed to load bugs");
    }
  };

  const fetchDevelopers = async () => {
    try {
      const res = await api.get("/developers");
      setDevelopers(res.data || []);
    } catch (err) {
      console.log("Failed to load developers");
    }
  };

  const getDeveloperName = (devId) => {
    const dev = developers.find(d => d.id === devId);
    return dev ? dev.email : "Unassigned";
  };

  const handleFormSuccess = () => {
    setSuccess("Bug reported successfully!");
    setIsFormOpen(false);
    fetchBugs();
    setTimeout(() => setSuccess(""), 3000);
  };

  const assignBug = async (bugId, developerId) => {
    try {
      await api.put(`/bugs/${bugId}`, {
        assigned_to: developerId || null
      });
      setSuccess("Bug assigned successfully!");
      fetchBugs();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to assign bug");
    }
  };

  const setDueDate = async (bugId, dueDate) => {
    try {
      await api.put(`/bugs/${bugId}`, {
        due_date: dueDate || null
      });
      setSuccess("Due date updated!");
      fetchBugs();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update due date");
    }
  };

  const openCount = bugs.filter(b => (b.status || "open") === "open").length;
  const inProgressCount = bugs.filter(b => b.status === "in-progress" || b.status === "progress").length;
  const closedCount = bugs.filter(b => b.status === "closed").length;

  return (
    <div className={`bug-container ${theme}`}>
      <Navbar />

      <div className="bug-content">

        {/* Header */}
        <div className="page-header">
          <div className="header-left">
            <div className="header-eyebrow">
              <span className="eyebrow-dot"></span>
              <span>Bug Tracker</span>
            </div>
            <h1>Issue Management</h1>
            {role === "admin" && (
              <p className="subtitle">Track, assign and resolve software defects</p>
            )}
          </div>

          {(role === "tester" || role === "admin") && (
            <button
              className="report-btn"
              onClick={() => {
                fetchProjects();
                setIsFormOpen(true);
              }}
            >
              <svg className="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Report Bug
            </button>
          )}
        </div>

        {/* Alerts */}
        {error && (
          <div className="alert alert-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {success}
          </div>
        )}

        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-tile stat-total">
            <span className="stat-val">{bugs.length}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-tile stat-open">
            <span className="stat-val">{openCount}</span>
            <span className="stat-label">Open</span>
          </div>
          <div className="stat-tile stat-progress">
            <span className="stat-val">{inProgressCount}</span>
            <span className="stat-label">In Progress</span>
          </div>
          <div className="stat-tile stat-closed">
            <span className="stat-val">{closedCount}</span>
            <span className="stat-label">Resolved</span>
          </div>
        </div>

        {/* Bug List */}
        <div className="bugs-list-section">
          <div className="section-header">
            <h2>Recent Issues</h2>
            <span className="bug-count">{bugs.length} bugs</span>
          </div>

          {bugs.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="M9 9h.01M15 9h.01M9.5 14.5s.8 1.5 2.5 1.5 2.5-1.5 2.5-1.5" />
              </svg>
              <p>No bugs reported yet</p>
              <span>Clear skies — or nothing tracked yet.</span>
            </div>
          ) : (
            <div className="bugs-grid">
              {bugs.map((bug, idx) => (
                <div key={bug.id} className="bug-card" style={{ animationDelay: `${idx * 60}ms` }}>

                  <div className="bug-card-top">
                    <div className="bug-meta">
                      <span className={`status-chip status-${bug.status || "open"}`}>
                        <span className="status-dot"></span>
                        {bug.status || "open"}
                      </span>
                      {bug.severity && (
                        <span className={`severity-chip severity-${bug.severity}`}>
                          {bug.severity}
                        </span>
                      )}
                    </div>
                    <span className="bug-id">#{bug.id}</span>
                  </div>

                  <h3 className="bug-title">{bug.title}</h3>
                  <p className="bug-description">{bug.description}</p>

                  {/* Assignment Section */}
                  {(role === "admin" || role === "tester") ? (
                    <div className="bug-assignment">
                      <div className="assignment-field">
                        <label>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                          </svg>
                          Assignee
                        </label>
                        <select
                          className="assign-dropdown"
                          value={bug.assigned_to || ""}
                          onChange={(e) => assignBug(bug.id, e.target.value)}
                        >
                          <option value="">Unassigned</option>
                          {developers.map(dev => (
                            <option key={dev.id} value={dev.id}>{dev.email}</option>
                          ))}
                        </select>
                      </div>

                      {role === "admin" && (
                        <div className="assignment-field">
                          <label>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            Due Date
                          </label>
                          <input
                            type="date"
                            className="date-input"
                            value={bug.due_date?.split('T')[0] || ""}
                            onChange={(e) => setDueDate(bug.id, e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    (bug.assigned_to || bug.due_date) && (
                      <div className="bug-info-row">
                        {bug.assigned_to && (
                          <div className="info-pill">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                            </svg>
                            {getDeveloperName(bug.assigned_to)}
                          </div>
                        )}
                        {bug.due_date && (
                          <div className="info-pill">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            {new Date(bug.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </div>
                        )}
                      </div>
                    )
                  )}

                  <div className="bug-card-footer">
                    <Attachments entityType="bug" entityId={bug.id} />
                    <Comments bugId={bug.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BugFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}

export default Bug;