import { useEffect, useState } from "react";
import api from "../services/api";
import Navbar from "../components/Navbar";
import "./Bug.css";

function DeveloperBug() {
  const [bugs, setBugs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const role = localStorage.getItem("role");

  useEffect(() => {
    fetchBugs();
    fetchProjects();
    fetchDevelopers();
  }, []);

  const fetchBugs = async () => {
    try {
      const res = await api.get("/bugs");
      setBugs(res.data || []);
    } catch {
      setMessage({ text: "Failed to load bugs", type: "error" });
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await api.get("/projects");
      setProjects(res.data || []);
    } catch (err) {
      console.log("Failed to load projects");
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

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/bugs/${id}`, { status });
      setMessage({ text: "Bug status updated successfully!", type: "success" });
      fetchBugs();
    } catch {
      setMessage({ text: "Failed to update bug", type: "error" });
    }
  };

  const assignBug = async (bugId, developerId) => {
    try {
      await api.put(`/bugs/${bugId}`, { 
        assigned_to: developerId || null 
      });
      setMessage({ text: "Bug assigned successfully!", type: "success" });
      fetchBugs();
    } catch (err) {
      setMessage({ 
        text: err.response?.data?.error || "Failed to assign bug", 
        type: "error" 
      });
    }
  };

  const setDueDate = async (bugId, dueDate) => {
    try {
      await api.put(`/bugs/${bugId}`, { 
        due_date: dueDate || null 
      });
      setMessage({ text: "Due date updated!", type: "success" });
      fetchBugs();
    } catch (err) {
      setMessage({ 
        text: err.response?.data?.error || "Failed to update due date", 
        type: "error" 
      });
    }
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : "No Project";
  };

  const getDeveloperName = (devId) => {
    const dev = developers.find(d => d.id === devId);
    return dev ? dev.email : "Unassigned";
  };

  // Filter bugs
  const filteredBugs = bugs.filter(bug => {
    const matchesStatus = filterStatus === "all" || bug.status === filterStatus;
    const matchesSeverity = filterSeverity === "all" || bug.severity === filterSeverity;
    const matchesSearch = bug.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bug.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSeverity && matchesSearch;
  });

  // Statistics
  const stats = {
    total: bugs.length,
    open: bugs.filter(b => b.status === "open").length,
    inProgress: bugs.filter(b => b.status === "progress").length,
    closed: bugs.filter(b => b.status === "closed").length,
    high: bugs.filter(b => b.severity === "high").length,
  };

  return (
    <div className="bug-container">
      <Navbar />

      <div className="bug-content">
        <h1>👨‍💻 Developer Bug Dashboard</h1>
        <p className="subtitle">Manage and fix reported bugs</p>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Statistics */}
        <div className="stats-container">
          <div className="stat-card">
            <h3>Total Bugs</h3>
            <p className="stat-number">{stats.total}</p>
          </div>
          <div className="stat-card open-stat">
            <h3>Open</h3>
            <p className="stat-number">{stats.open}</p>
          </div>
          <div className="stat-card progress-stat">
            <h3>In Progress</h3>
            <p className="stat-number">{stats.inProgress}</p>
          </div>
          <div className="stat-card closed-stat">
            <h3>Closed</h3>
            <p className="stat-number">{stats.closed}</p>
          </div>
          <div className="stat-card high-stat">
            <h3>High Priority</h3>
            <p className="stat-number">{stats.high}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <input
            className="search-field"
            type="text"
            placeholder="🔍 Search bugs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="progress">In Progress</option>
            <option value="closed">Closed</option>
          </select>

          <select
            className="filter-select"
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
          >
            <option value="all">All Severity</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {/* Bugs List */}
        <div className="bugs-list-section">
          <h2>🐛 Bugs ({filteredBugs.length})</h2>

          {filteredBugs.length === 0 ? (
            <p className="empty-message">No bugs found</p>
          ) : (
            <div className="bugs-grid">
              {filteredBugs.map((bug) => (
                <div key={bug.id} className="bug-card">
                  <div className="bug-header">
                    <div className="bug-title-section">
                      <h3>#{bug.id} - {bug.title}</h3>
                      <span className={`severity-badge severity-${bug.severity || "medium"}`}>
                        {(bug.severity || "medium").toUpperCase()}
                      </span>
                    </div>
                    
                    <select
                      className={`status-dropdown status-${bug.status || "open"}`}
                      value={bug.status || "open"}
                      onChange={(e) => updateStatus(bug.id, e.target.value)}
                    >
                      <option value="open">OPEN</option>
                      <option value="progress">IN PROGRESS</option>
                      <option value="closed">CLOSED</option>
                    </select>
                  </div>

                  <p className="bug-description">
                    {bug.description || "No description provided"}
                  </p>

                  {/* Assignment Section - Admin can edit, Developer can only view */}
                  {role === "admin" ? (
                    <div className="bug-assignment">
                      <div className="form-group">
                        <label>👤 Assigned To:</label>
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

                      <div className="form-group">
                        <label>📅 Due Date:</label>
                        <input
                          type="date"
                          className="date-input"
                          value={bug.due_date?.split('T')[0] || ""}
                          onChange={(e) => setDueDate(bug.id, e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bug-info">
                      <div className="info-item">
                        <span className="info-label">👤 Assigned To:</span>
                        <span className="info-value">{getDeveloperName(bug.assigned_to)}</span>
                      </div>
                      {bug.due_date && (
                        <div className="info-item">
                          <span className="info-label">📅 Due Date:</span>
                          <span className="info-value">{new Date(bug.due_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="bug-footer">
                    {bug.project_id && (
                      <span className="project-tag">
                        📁 {getProjectName(bug.project_id)}
                      </span>
                    )}
                    <span className={`status-badge status-${bug.status || "open"}`}>
                      {(bug.status || "open").toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DeveloperBug;
