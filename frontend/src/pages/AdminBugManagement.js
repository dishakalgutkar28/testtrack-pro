import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import { useTheme } from "../context/ThemeContext";
import "./AdminDashboard.css";

function AdminBugManagement() {
  const [bugs, setBugs] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchBugs(),
        fetchDevelopers(),
        fetchProjects()
      ]);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  const fetchBugs = async () => {
    try {
      const res = await api.get("/bugs");
      setBugs(res.data || []);
      setLoading(false);
    } catch (err) {
      console.log("Error fetching bugs:", err);
      setMessage({ text: "Failed to load bugs", type: "error" });
      setLoading(false);
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

  const fetchProjects = async () => {
    try {
      const res = await api.get("/projects");
      setProjects(res.data?.projects || []);
    } catch (err) {
      console.log("Failed to load projects");
    }
  };

  const deleteBug = async (bugId) => {
    if (!window.confirm("Are you sure you want to delete this bug? This cannot be undone.")) return;

    try {
      await api.delete(`/bugs/${bugId}`);
      setMessage({ text: "Bug deleted successfully!", type: "success" });
      fetchBugs();
    } catch (err) {
      setMessage({ text: err.response?.data?.error || "Failed to delete bug", type: "error" });
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

  const getDeveloperName = (devId) => {
    const dev = developers.find(d => d.id === devId);
    return dev ? dev.email : "Unassigned";
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : "No Project";
  };

  if (loading) {
    return (
      <div className={`admin-dashboard-container ${theme}`}>
        <Navbar />
        <div className="admin-dashboard">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`admin-dashboard-container ${theme}`}>
      <Navbar />
      <div className="admin-dashboard">
        <div className="greeting-section">
          <h1>Bug Management 🐛</h1>
          <p>Assign bugs to developers and manage bug lifecycle</p>
          <button 
            className="back-to-dashboard-btn"
            onClick={() => navigate("/admin/users")}
            style={{ marginTop: "15px" }}
          >
            ← Back to Admin Dashboard
          </button>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="bug-management-section">
          <div className="section-header">
            <h2>All Bugs ({bugs.length})</h2>
          </div>

          {bugs.length === 0 ? (
            <p className="no-data">📭 No bugs found.</p>
          ) : (
            <div className="data-grid">
              {bugs.map(bug => (
                <div key={bug.id} className="data-card bug-card">
                  <div className="card-header">
                    <h3>#{bug.id} - {bug.title}</h3>
                    <span className={`status-badge status-${bug.status || 'open'}`}>
                      {(bug.status || 'open').toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="card-description">{bug.description || "No description"}</p>
                  
                  <div className="card-meta">
                    <p>
                      <strong>📂 Project:</strong> {getProjectName(bug.project_id)}
                    </p>
                    <p>
                      <strong>🔴 Severity:</strong>{' '}
                      <span className={`severity-badge severity-${bug.severity || 'medium'}`}>
                        {(bug.severity || 'medium').toUpperCase()}
                      </span>
                    </p>
                    <p>
                      <strong>⚡ Priority:</strong> {bug.priority || 'Medium'}
                    </p>
                  </div>

                  {/* Assignment Section */}
                  <div className="bug-assignment" style={{ marginTop: "15px", padding: "15px", background: "#f8fafc", borderRadius: "8px" }}>
                    <div className="form-group">
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                        👤 Assign To Developer:
                      </label>
                      <select
                        className="assign-dropdown"
                        value={bug.assigned_to || ""}
                        onChange={(e) => assignBug(bug.id, e.target.value)}
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "2px solid #cbd5e1" }}
                      >
                        <option value="">Unassigned</option>
                        {developers.map(dev => (
                          <option key={dev.id} value={dev.id}>{dev.email}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ marginTop: "12px" }}>
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                        📅 Due Date:
                      </label>
                      <input
                        type="date"
                        className="date-input"
                        value={bug.due_date?.split('T')[0] || ""}
                        onChange={(e) => setDueDate(bug.id, e.target.value)}
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "2px solid #cbd5e1" }}
                      />
                    </div>

                    {bug.assigned_to && (
                      <p style={{ marginTop: "10px", fontSize: "13px", color: "#059669" }}>
                        ✓ Assigned to: <strong>{getDeveloperName(bug.assigned_to)}</strong>
                      </p>
                    )}
                  </div>

                  <div className="card-actions" style={{ marginTop: "12px" }}>
                    <button 
                      className="btn-delete"
                      onClick={() => deleteBug(bug.id)}
                      title="Delete this bug"
                      style={{flex: 1, background: "#dc2626"}}
                    >
                      🗑️ DELETE
                    </button>
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

export default AdminBugManagement;
