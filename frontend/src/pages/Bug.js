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

  return (
    <div className={`bug-container ${theme}`}>
      <Navbar />

      <div className="bug-content">
        <h1>Bug Management</h1>
        {role === "admin" && (
          <p className="subtitle">Create and manage bug assignments</p>
        )}

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* Button to open bug form modal */}
        {(role === "tester" || role === "admin") && (
          <div style={{ marginBottom: "20px" }}>
            <button 
              className="submit-btn" 
              onClick={() => {
                fetchProjects();  // Refresh projects when form opens
                setIsFormOpen(true);
              }}
              style={{ fontSize: "16px", padding: "12px 24px" }}
            >
              <span className="btn-icon">+</span>
              Report New Bug
            </button>
          </div>
        )}

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

                  {/* Assignment Section */}
                  {(role === "admin" || role === "tester") ? (
                    <div className="bug-assignment">
                      <div className="form-group">
                        <label>Assigned To:</label>
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
                        <div className="form-group">
                          <label>Due Date:</label>
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
                      <div className="bug-info">
                        {bug.assigned_to && (
                          <div className="info-item">
                            <span className="info-label">Assigned To:</span>
                            <span className="info-value">{getDeveloperName(bug.assigned_to)}</span>
                          </div>
                        )}
                        {bug.due_date && (
                          <div className="info-item">
                            <span className="info-label">Due Date:</span>
                            <span className="info-value">{new Date(bug.due_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    )
                  )}

                  <Attachments entityType="bug" entityId={bug.id} />

                  {/* Bug Comments */}
                  <Comments bugId={bug.id} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bug Form Modal */}
      <BugFormModal 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}

export default Bug;
