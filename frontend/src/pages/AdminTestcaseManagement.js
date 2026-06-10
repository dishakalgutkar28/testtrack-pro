import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import { useTheme } from "../context/ThemeContext";
import "./AdminDashboard.css";
import "./Admintestcasemanagement.css";

function AdminTestcaseManagement() {
  const [testcases, setTestcases] = useState([]);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);
  const { theme } = useTheme();
  const navigate = useNavigate();

  const fetchTestcases = useCallback(async () => {
    try {
      const res = await api.get("/testcase");
      setTestcases(res.data || []);
      setLoading(false);
    } catch (err) {
      setMessage({ text: "Failed to load testcases", type: "error" });
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get("/admin/users");
      const users = res.data.filter(u => u.role === "tester" || u.role === "developer");
      setAssignableUsers(users || []);
    } catch (err) {
      console.log("Failed to load users", err);
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
    Promise.all([fetchTestcases(), fetchUsers(), fetchProjects()]);
  }, [fetchTestcases, fetchUsers, fetchProjects]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const deleteTestcase = async (testcaseId) => {
    if (!window.confirm("Are you sure you want to delete this test case?")) return;
    try {
      await api.delete(`/testcase/${testcaseId}`);
      setMessage({ text: "Test case deleted successfully!", type: "success" });
      fetchTestcases();
    } catch (err) {
      setMessage({ text: err.response?.data?.error || "Failed to delete test case", type: "error" });
    }
  };

  const assignTestcase = async (testcaseId, userId) => {
    try {
      await api.put(`/testcase/${testcaseId}`, { assigned_to: userId || null });
      setMessage({ text: userId ? "Test case assigned successfully!" : "Test case unassigned!", type: "success" });
      setOpenDropdown(null);
      fetchTestcases();
    } catch (err) {
      setMessage({ text: err.response?.data?.error || "Failed to assign test case", type: "error" });
    }
  };

  const getAssignedUser = (assignedId) => assignableUsers.find(u => u.id === parseInt(assignedId));
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
          <h1>Test Case Management 📋</h1>
          <p>Assign test cases to testers and developers</p>
          <button className="back-to-dashboard-btn" onClick={() => navigate("/admin/users")} style={{ marginTop: "15px" }}>
            ← Back to Admin Dashboard
          </button>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}

        <div className="testcase-management-section">
          <div className="section-header">
            <h2>All Test Cases ({testcases.length})</h2>
          </div>

          {testcases.length === 0 ? (
            <p className="no-data">📭 No test cases found.</p>
          ) : (
            <div className="data-grid">
              {testcases.map(tc => {
                const assignedUser = getAssignedUser(tc.assigned_to);
                const isOpen = openDropdown === tc.id;

                return (
                  <div key={tc.id} className="data-card">
                    <div className="card-header">
                      <h3>{tc.test_case_id || `TC-${tc.id}`} — {tc.title}</h3>
                      <span className={`priority-badge priority-${tc.priority || "medium"}`}>
                        {(tc.priority || "medium").toUpperCase()}
                      </span>
                    </div>

                    <p className="card-description">{tc.description || "No description"}</p>

                    <div className="card-meta">
                      <p><strong>📂 Project:</strong> {getProjectName(tc.project_id)}</p>
                    </div>

                    <div className="atm-assign-wrapper" ref={isOpen ? dropdownRef : null}>
                      <p className="atm-assign-label">👤 Assign To</p>

                      <button
                        className={`atm-assign-trigger ${assignedUser ? "atm-assigned" : "atm-unassigned"}`}
                        onClick={() => setOpenDropdown(isOpen ? null : tc.id)}
                      >
                        <span className="atm-trigger-left">
                          {assignedUser ? (
                            <>
                              <span className={`atm-role-dot atm-dot-${assignedUser.role}`} />
                              <span className="atm-trigger-email">{assignedUser.email}</span>
                              <span className={`atm-role-chip atm-chip-${assignedUser.role}`}>{assignedUser.role}</span>
                            </>
                          ) : (
                            <span className="atm-trigger-placeholder">Select user to assign...</span>
                          )}
                        </span>
                        <span className={`atm-chevron ${isOpen ? "atm-chevron-open" : ""}`}>▾</span>
                      </button>

                      {isOpen && (
                        <div className="atm-dropdown">
                          <div
                            className="atm-option atm-option-unassign"
                            onClick={() => assignTestcase(tc.id, null)}
                          >
                            <span className="atm-role-dot atm-dot-none" />
                            <span>Unassigned</span>
                          </div>

                          {["developer", "tester"].map(role => {
                            const group = assignableUsers.filter(u => u.role === role);
                            if (group.length === 0) return null;
                            return (
                              <div key={role}>
                                <div className="atm-group-label">
                                  {role === "developer" ? "🧑‍💻 Developers" : "🧪 Testers"}
                                </div>
                                {group.map(user => (
                                  <div
                                    key={user.id}
                                    className={`atm-option ${tc.assigned_to === user.id ? "atm-option-active" : ""}`}
                                    onClick={() => assignTestcase(tc.id, user.id)}
                                  >
                                    <span className={`atm-role-dot atm-dot-${user.role}`} />
                                    <span className="atm-option-email">{user.email}</span>
                                    <span className={`atm-role-chip atm-chip-${user.role}`}>{user.role}</span>
                                    {tc.assigned_to === user.id && <span className="atm-check">✓</span>}
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {assignedUser && (
                        <p className="atm-assigned-note">
                          ✓ Assigned to <strong>{assignedUser.email}</strong>
                          <span className={`atm-role-chip atm-chip-${assignedUser.role}`}>{assignedUser.role}</span>
                        </p>
                      )}
                    </div>

                    <div className="card-actions" style={{ marginTop: "12px" }}>
                      <button
                        className="btn-delete"
                        onClick={() => deleteTestcase(tc.id)}
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

export default AdminTestcaseManagement;