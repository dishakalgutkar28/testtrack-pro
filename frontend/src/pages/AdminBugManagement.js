import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import { useTheme } from "../context/ThemeContext";
import "./AdminDashboard.css";
import "./AdminBugManagement.css";

function AdminBugManagement() {
  const [bugs, setBugs] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);
  const { theme } = useTheme();
  const navigate = useNavigate();

  const fetchBugs = useCallback(async () => {
    try {
      const res = await api.get("/bugs");
      setBugs(res.data || []);
      setLoading(false);
    } catch (err) {
      setMessage({ text: "Failed to load bugs", type: "error" });
      setLoading(false);
    }
  }, []);

  const fetchDevelopers = useCallback(async () => {
    try {
      const res = await api.get("/admin/users");
      // Show all developers AND testers so admin can assign either
      const assignable = res.data.filter(u => u.role === "developer" || u.role === "tester");
      setDevelopers(assignable || []);
    } catch (err) {
      console.log("Failed to load developers");
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await api.get("/projects");
      setProjects(res.data?.projects || []);
    } catch (err) {
      console.log("Failed to load projects");
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchBugs(), fetchDevelopers(), fetchProjects()]);
  }, [fetchBugs, fetchDevelopers, fetchProjects]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const deleteBug = async (bugId) => {
    if (!window.confirm("Are you sure you want to delete this bug?")) return;
    try {
      await api.delete(`/bugs/${bugId}`);
      setMessage({ text: "Bug deleted successfully!", type: "success" });
      fetchBugs();
    } catch (err) {
      setMessage({ text: err.response?.data?.error || "Failed to delete bug", type: "error" });
    }
  };

  const assignBug = async (bugId, devId) => {
    try {
      await api.put(`/bugs/${bugId}`, { assigned_to: devId || null });
      setMessage({ text: devId ? "Bug assigned successfully!" : "Bug unassigned!", type: "success" });
      setOpenDropdown(null);
      fetchBugs();
    } catch (err) {
      setMessage({ text: err.response?.data?.error || "Failed to assign bug", type: "error" });
    }
  };

  const setDueDate = async (bugId, dueDate) => {
    try {
      await api.put(`/bugs/${bugId}`, { due_date: dueDate || null });
      setMessage({ text: "Due date updated!", type: "success" });
      fetchBugs();
    } catch (err) {
      setMessage({ text: err.response?.data?.error || "Failed to update due date", type: "error" });
    }
  };

  const getAssignedDev = (devId) => developers.find(d => d.id === parseInt(devId));
  const getProjectName = (projectId) => projects.find(p => p.id === projectId)?.name || "No Project";

  if (loading) {
    return (
      <div className={`admin-dashboard-container ${theme}`}>
        <Navbar />
        <div className="admin-dashboard"><p>Loading...</p></div>
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
          <div className={`message ${message.type}`}>{message.text}</div>
        )}

        <div className="bug-management-section">
          <div className="section-header">
            <h2>All Bugs ({bugs.length})</h2>
          </div>

          {bugs.length === 0 ? (
            <p className="no-data">📭 No bugs found.</p>
          ) : (
            <div className="data-grid">
              {bugs.map(bug => {
                const assignedDev = getAssignedDev(bug.assigned_to);
                const isOpen = openDropdown === bug.id;

                return (
                  <div key={bug.id} className="data-card bug-card">
                    <div className="card-header">
                      <h3>#{bug.id} — {bug.title}</h3>
                      <span className={`status-badge status-${bug.status || "open"}`}>
                        {(bug.status || "open").toUpperCase()}
                      </span>
                    </div>

                    <p className="card-description">{bug.description || "No description"}</p>

                    <div className="card-meta">
                      <p><strong>📂 Project:</strong> {getProjectName(bug.project_id)}</p>
                      <p>
                        <strong>🔴 Severity:</strong>{" "}
                        <span className={`severity-badge severity-${bug.severity || "medium"}`}>
                          {(bug.severity || "medium").toUpperCase()}
                        </span>
                      </p>
                      <p><strong>⚡ Priority:</strong> {bug.priority || "Medium"}</p>
                    </div>

                    {/* Assignment Section */}
                    <div className="abm-assign-block">

                      {/* Custom Developer Dropdown */}
                      <div className="abm-assign-wrapper" ref={isOpen ? dropdownRef : null}>
                        <p className="abm-assign-label">👤 Assign To</p>

                        <button
                          className={`abm-assign-trigger ${assignedDev ? "abm-assigned" : "abm-unassigned"}`}
                          onClick={() => setOpenDropdown(isOpen ? null : bug.id)}
                        >
                          <span className="abm-trigger-left">
                            {assignedDev ? (
                              <>
                                <span className={`abm-role-dot abm-dot-${assignedDev.role}`} />
                                <span className="abm-trigger-email">{assignedDev.email}</span>
                                <span className={`abm-role-chip abm-chip-${assignedDev.role}`}>{assignedDev.role}</span>
                              </>
                            ) : (
                              <span className="abm-trigger-placeholder">Select developer...</span>
                            )}
                          </span>
                          <span className={`abm-chevron ${isOpen ? "abm-chevron-open" : ""}`}>▾</span>
                        </button>

                        {isOpen && (
                          <div className="abm-dropdown">
                            <div
                              className="abm-option abm-option-unassign"
                              onClick={() => assignBug(bug.id, null)}
                            >
                              <span className="abm-role-dot abm-dot-none" />
                              <span>Unassigned</span>
                            </div>

                            {["developer", "tester"].map(role => {
                              const group = developers.filter(d => d.role === role);
                              if (group.length === 0) return null;
                              return (
                                <div key={role}>
                                  <div className="abm-group-label">
                                    {role === "developer" ? "🧑‍💻 Developers" : "🧪 Testers"}
                                  </div>
                                  {group.map(dev => (
                                    <div
                                      key={dev.id}
                                      className={`abm-option ${bug.assigned_to === dev.id ? "abm-option-active" : ""}`}
                                      onClick={() => assignBug(bug.id, dev.id)}
                                    >
                                      <span className={`abm-role-dot abm-dot-${dev.role}`} />
                                      <span className="abm-option-email">{dev.email}</span>
                                      <span className={`abm-role-chip abm-chip-${dev.role}`}>{dev.role}</span>
                                      {bug.assigned_to === dev.id && <span className="abm-check">✓</span>}
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {assignedDev && (
                          <p className="abm-assigned-note">
                            ✓ Assigned to <strong>{assignedDev.email}</strong>
                            <span className={`abm-role-chip abm-chip-${assignedDev.role}`}>{assignedDev.role}</span>
                          </p>
                        )}
                      </div>

                      {/* Due Date */}
                      <div className="abm-due-wrapper">
                        <p className="abm-assign-label">📅 Due Date</p>
                        <input
                          type="date"
                          className="abm-date-input"
                          value={bug.due_date?.split("T")[0] || ""}
                          onChange={(e) => setDueDate(bug.id, e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="card-actions" style={{ marginTop: "12px" }}>
                      <button
                        className="btn-delete"
                        onClick={() => deleteBug(bug.id)}
                        style={{ flex: 1, background: "#dc2626" }}
                      >
                        🗑️ DELETE
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminBugManagement;