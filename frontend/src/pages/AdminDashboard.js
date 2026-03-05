import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import { useTheme } from "../context/ThemeContext";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [testcases, setTestcases] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [backups, setBackups] = useState([]);
  const [settings, setSettings] = useState({});
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("tester");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const { theme } = useTheme();

  // Project form states
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [showProjectForm, setShowProjectForm] = useState(false);

  const navigate = useNavigate();

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data);
    } catch (err) {
      setMessage({ text: "Failed to fetch users", type: "error" });
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await api.get("/projects");
      setProjects(res.data?.projects || []);
    } catch (err) {
      setMessage({ text: "Failed to fetch projects", type: "error" });
    }
  }, []);

  const fetchBugs = useCallback(async () => {
    try {
      const res = await api.get("/bugs");
      setBugs(res.data || []);
    } catch (err) {
      setMessage({ text: "Failed to fetch bugs", type: "error" });
    }
  }, []);

  const fetchTestcases = useCallback(async () => {
    try {
      const res = await api.get("/testcase");
      setTestcases(res.data || []);
    } catch (err) {
      setMessage({ text: "Failed to fetch testcases", type: "error" });
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const res = await api.get("/audit-logs");
      setAuditLogs(res.data || []);
    } catch (err) {
      setMessage({ text: "Failed to fetch audit logs", type: "error" });
    }
  }, []);

  const fetchBackups = useCallback(async () => {
    try {
      const res = await api.get("/admin/backups");
      setBackups(res.data || []);
    } catch (err) {
      setMessage({ text: "Failed to fetch backups", type: "error" });
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get("/admin/settings");
      setSettings(res.data || {});
    } catch (err) {
      setMessage({ text: "Failed to fetch settings", type: "error" });
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    try {
      await Promise.all([
        fetchUsers(),
        fetchProjects(),
        fetchBugs(),
        fetchTestcases(),
        fetchAuditLogs(),
        fetchBackups(),
        fetchSettings()
      ]);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  }, [fetchUsers, fetchProjects, fetchBugs, fetchTestcases, fetchAuditLogs, fetchBackups, fetchSettings]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const validatePassword = (pwd) => {
    const errors = [];
    if (pwd.length < 6) errors.push("Password must be at least 6 characters");
    if (!/[A-Z]/.test(pwd)) errors.push("Include at least one uppercase letter");
    if (!/[a-z]/.test(pwd)) errors.push("Include at least one lowercase letter");
    if (!/[0-9]/.test(pwd)) errors.push("Include at least one number");
    return errors;
  };

  const createUser = async () => {
    if (!email || !password) {
      setMessage({ text: "Email and password are required", type: "error" });
      return;
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setMessage({ text: passwordErrors.join(", "), type: "error" });
      return;
    }

    try {
      await api.post("/admin/users", { email, password, role });
      setMessage({ text: "User created successfully!", type: "success" });
      setEmail("");
      setPassword("");
      setRole("tester");
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      setMessage({ 
        text: err.response?.data?.error || "Failed to create user", 
        type: "error" 
      });
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await api.delete(`/admin/users/${userId}`);
      setMessage({ text: "User deleted successfully!", type: "success" });
      fetchUsers();
      fetchAuditLogs();
    } catch (err) {
      setMessage({ text: "Failed to delete user", type: "error" });
    }
  };

  const deactivateUser = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/deactivate`);
      setMessage({ text: "User deactivated successfully!", type: "success" });
      fetchUsers();
      fetchAuditLogs();
    } catch (err) {
      setMessage({ text: "Failed to deactivate user", type: "error" });
    }
  };

  const reactivateUser = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/reactivate`);
      setMessage({ text: "User reactivated successfully!", type: "success" });
      fetchUsers();
      fetchAuditLogs();
    } catch (err) {
      setMessage({ text: "Failed to reactivate user", type: "error" });
    }
  };

  const updateRole = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}`, { role: newRole });
      setMessage({ text: "Role updated successfully!", type: "success" });
      fetchUsers();
      fetchAuditLogs();
    } catch (err) {
      setMessage({ text: "Failed to update role", type: "error" });
    }
  };

  // Project management
  const createProject = async () => {
    if (!projectName) {
      setMessage({ text: "Project name required", type: "error" });
      return;
    }

    try {
      await api.post("/admin/projects", { name: projectName, description: projectDesc });
      setMessage({ text: "Project created successfully!", type: "success" });
      setProjectName("");
      setProjectDesc("");
      setShowProjectForm(false);
      fetchProjects();
      fetchAuditLogs();
    } catch (err) {
      setMessage({ text: "Failed to create project", type: "error" });
    }
  };

  const deleteProject = async (projectId) => {
    if (!window.confirm("Are you sure? This will delete all related data.")) return;

    try {
      await api.delete(`/admin/projects/${projectId}`);
      setMessage({ text: "Project deleted successfully!", type: "success" });
      fetchProjects();
      fetchAuditLogs();
    } catch (err) {
      setMessage({ 
        text: err.response?.data?.error || "Failed to delete project", 
        type: "error" 
      });
    }
  };

  // Backup management
  const triggerBackup = async () => {
    try {
      const res = await api.post("/admin/backup");
      setMessage({ text: `Backup initiated: ${res.data.name}`, type: "success" });
      fetchBackups();
      fetchAuditLogs();
    } catch (err) {
      setMessage({ text: "Failed to trigger backup", type: "error" });
    }
  };

  const deleteBackup = async (backupId) => {
    if (!window.confirm("Are you sure you want to delete this backup?")) return;

    try {
      await api.delete(`/admin/backups/${backupId}`);
      setMessage({ text: "Backup deleted successfully!", type: "success" });
      fetchBackups();
      fetchAuditLogs();
    } catch (err) {
      setMessage({ text: "Failed to delete backup", type: "error" });
    }
  };

  const passwordErrors = password ? validatePassword(password) : [];

  // Get current user's name for greeting
  const currentUser = users.find(u => u.email === localStorage.getItem("email"));
  const userName = currentUser?.email?.split("@")[0] || "Admin";

  return (
    <div className={`admin-dashboard-container ${theme}`}>
      <Navbar />
      <div className="admin-dashboard">
        {/* GREETING SECTION */}
        <div className="greeting-section">
          <h1>Hello, {userName.charAt(0).toUpperCase() + userName.slice(1)}! 👋</h1>
          <p>Welcome to the comprehensive admin dashboard</p>
        </div>

        {/* STAT CARDS */}
        <div className="stat-cards-grid">
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-label">Total Users</div>
            </div>
            <div className="stat-value">{users.length}</div>
            <div className="stat-description">Active & Inactive</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-label">Total Projects</div>
            </div>
            <div className="stat-value">{projects.length}</div>
            <div className="stat-description">Active projects</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-label">Audit Logs</div>
            </div>
            <div className="stat-value">{auditLogs.length}</div>
            <div className="stat-description">Recent actions</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-label">Backups</div>
            </div>
            <div className="stat-value">{backups.length}</div>
            <div className="stat-description">Data backups</div>
          </div>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* ADMIN DASHBOARD VIEW - only show when no tab is selected */}
        {activeTab === null && (
          <>
            {/* QUICK ACTIONS */}
            <div className="quick-actions-section">
              <h2>Management Sections</h2>
              <div className="quick-actions-grid">
                <div 
                  className="quick-action-card users-card" 
                  onClick={() => setActiveTab("users")}
                >
                  <div className="action-icon">👥</div>
                  <div className="action-title">Manage Users</div>
                  <div className="action-subtitle">Create & manage accounts</div>
                  <div className="action-count">{users.length} Users</div>
                  <div className="action-arrow">→</div>
                </div>

                <div 
                  className="quick-action-card projects-card" 
                  onClick={() => setActiveTab("projects")}
                >
                  <div className="action-icon">📁</div>
                  <div className="action-title">Manage Projects</div>
                  <div className="action-subtitle">Create & configure</div>
                  <div className="action-count">{projects.length} Projects</div>
                  <div className="action-arrow">→</div>
                </div>

                <div 
                  className="quick-action-card logs-card" 
                  onClick={() => setActiveTab("audit-logs")}
                >
                  <div className="action-icon">📋</div>
                  <div className="action-title">Audit Logs</div>
                  <div className="action-subtitle">System audit trail</div>
                  <div className="action-count">{auditLogs.length} Logs</div>
                  <div className="action-arrow">→</div>
                </div>

                <div 
                  className="quick-action-card backup-card" 
                  onClick={() => setActiveTab("backups")}
                >
                  <div className="action-icon">💾</div>
                  <div className="action-title">Backup Management</div>
                  <div className="action-subtitle">Trigger & manage</div>
                  <div className="action-count">{backups.length} Backups</div>
                  <div className="action-arrow">→</div>
                </div>

                <div 
                  className="quick-action-card bugs-card" 
                  onClick={() => navigate("/admin/bug")}
                >
                  <div className="action-icon">🐛</div>
                  <div className="action-title">Manage Bugs</div>
                  <div className="action-subtitle">View & assign bugs</div>
                  <div className="action-count">{bugs.length} Bugs</div>
                  <div className="action-arrow">→</div>
                </div>

                <div 
                  className="quick-action-card testcases-card" 
                  onClick={() => navigate("/admin/testcase")}
                >
                  <div className="action-icon">📋</div>
                  <div className="action-title">Manage Test Cases</div>
                  <div className="action-subtitle">Assign & configure</div>
                  <div className="action-count">{testcases.length} Test Cases</div>
                  <div className="action-arrow">→</div>
                </div>

                <div 
                  className="quick-action-card settings-card" 
                  onClick={() => setActiveTab("settings")}
                >
                  <div className="action-icon">⚙️</div>
                  <div className="action-title">System Settings</div>
                  <div className="action-subtitle">Configure system</div>
                  <div className="action-count">Config</div>
                  <div className="action-arrow">→</div>
                </div>

                <div 
                  className="quick-action-card roles-card" 
                  onClick={() => setActiveTab("roles")}
                >
                  <div className="action-icon">🔐</div>
                  <div className="action-title">Role Management</div>
                  <div className="action-subtitle">View permissions</div>
                  <div className="action-count">3 Roles</div>
                  <div className="action-arrow">→</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* MANAGEMENT SECTIONS - only show when a tab is selected */}
        {activeTab !== null && (
          <>
            {/* BACK TO DASHBOARD BUTTON */}
            <button 
              className="back-to-dashboard-btn"
              onClick={() => setActiveTab(null)}
            >
              ← Back to Dashboard
            </button>



        {/* USERS TAB */}
        {activeTab === "users" && (
          <>
        <div className="create-user-section">
          <button className="create-btn" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "+ Create New User"}
          </button>

          {showForm && (
            <div className="create-form">
              <h2>Create New User</h2>

              <div className="form-group">
                <label>Email:</label>
                <input
                  className="input-field"
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Password:</label>
                <input
                  className="input-field"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                {password && passwordErrors.length > 0 && (
                  <div className="password-errors">
                    <p>Password requirements:</p>
                    {passwordErrors.map((err, idx) => (
                      <span key={idx} className="error-item">✗ {err}</span>
                    ))}
                  </div>
                )}
                {password && passwordErrors.length === 0 && (
                  <span className="success-item">✓ Password is strong!</span>
                )}
              </div>

              <div className="form-group">
                <label>Role:</label>
                <select 
                  className="input-field" 
                  value={role} 
                  onChange={e => setRole(e.target.value)}
                >
                  <option value="tester">Tester</option>
                  <option value="developer">Developer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <button 
                className="submit-btn" 
                onClick={createUser}
                disabled={passwordErrors.length > 0}
              >
                Create User
              </button>
            </div>
          )}
        </div>

        <div className="users-table-section">
          <h2>All Users ({users.length})</h2>
          {users.length === 0 ? (
            <p className="no-users">No users found</p>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.email}</td>
                    <td>
                      <select
                        className="role-select"
                        value={u.role}
                        onChange={e => updateRole(u.id, e.target.value)}
                      >
                        <option value="tester">Tester</option>
                        <option value="developer">Developer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <span className={`status-badge ${u.is_active ? 'status-active' : 'status-inactive'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: '8px' }}>
                      {u.is_active ? (
                        <button 
                          className="deactivate-btn" 
                          onClick={() => deactivateUser(u.id)}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button 
                          className="reactivate-btn" 
                          onClick={() => reactivateUser(u.id)}
                        >
                          Reactivate
                        </button>
                      )}
                      <button 
                        className="delete-btn" 
                        onClick={() => deleteUser(u.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
          </>
        )}

        {/* PROJECTS TAB */}
        {activeTab === "projects" && (
          <>
            <div className="create-project-section">
              <button className="create-btn" onClick={() => setShowProjectForm(!showProjectForm)}>
                {showProjectForm ? "Cancel" : "+ Create New Project"}
              </button>

              {showProjectForm && (
                <div className="create-form">
                  <h2>Create New Project</h2>

                  <div className="form-group">
                    <label>Project Name:</label>
                    <input
                      className="input-field"
                      type="text"
                      placeholder="Enter project name"
                      value={projectName}
                      onChange={e => setProjectName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Description:</label>
                    <textarea
                      className="input-field"
                      placeholder="Enter project description"
                      value={projectDesc}
                      onChange={e => setProjectDesc(e.target.value)}
                      rows="4"
                    />
                  </div>

                  <button 
                    className="submit-btn" 
                    onClick={createProject}
                  >
                    Create Project
                  </button>
                </div>
              )}
            </div>

            <div className="projects-table-section">
              <h2>All Projects ({projects.length})</h2>
              {projects.length === 0 ? (
                <p className="no-data">No projects found</p>
              ) : (
                <table className="projects-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Project Name</th>
                      <th>Description</th>
                      <th>Test Cases</th>
                      <th>Bugs</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map(p => (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td><strong>{p.name}</strong></td>
                        <td>{p.description || "N/A"}</td>
                        <td>{p.testcase_count || 0}</td>
                        <td>{p.bug_count || 0}</td>
                        <td>
                          <button 
                            className="delete-btn" 
                            onClick={() => deleteProject(p.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* AUDIT LOGS TAB */}
        {activeTab === "audit-logs" && (
          <div className="audit-logs-section">
            <h2>System Audit Logs</h2>
            {auditLogs.length === 0 ? (
              <p className="no-data">No audit logs found</p>
            ) : (
              <table className="audit-logs-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Target Type</th>
                    <th>Details</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(log => (
                    <tr key={log.id}>
                      <td>{log.id}</td>
                      <td>{log.email || "System"}</td>
                      <td><span className="action-badge">{log.action}</span></td>
                      <td>{log.target_type}</td>
                      <td>{log.details ? JSON.stringify(log.details).substring(0, 50) : "N/A"}</td>
                      <td>{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* BACKUPS TAB */}
        {activeTab === "backups" && (
          <>
            <div className="backup-section">
              <button className="create-btn" onClick={triggerBackup}>
                💾 Trigger New Backup
              </button>

              <h2>Backup History</h2>
              {backups.length === 0 ? (
                <p className="no-data">No backups found</p>
              ) : (
                <table className="backups-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Backup Name</th>
                      <th>Status</th>
                      <th>Created By</th>
                      <th>Created At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.map(b => (
                      <tr key={b.id}>
                        <td>{b.id}</td>
                        <td>{b.name}</td>
                        <td>
                          <span className={`status-badge backup-${b.status}`}>
                            {b.status}
                          </span>
                        </td>
                        <td>{b.email || "System"}</td>
                        <td>{new Date(b.created_at).toLocaleString()}</td>
                        <td>
                          <button 
                            className="delete-btn" 
                            onClick={() => deleteBackup(b.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <div className="settings-section">
            <h2>System Configuration</h2>
            <div className="settings-grid">
              {Object.entries(settings).length === 0 ? (
                <p className="no-data">No settings found</p>
              ) : (
                Object.entries(settings).map(([key, value]) => (
                  <div key={key} className="setting-item">
                    <label>{key.replace(/_/g, ' ').toUpperCase()}</label>
                    <input 
                      type="text" 
                      value={value || ''} 
                      readOnly 
                      className="setting-value"
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ROLES TAB */}
        {activeTab === "roles" && (
          <div className="roles-section">
            <h2>Role Management</h2>
            <div className="roles-grid">
              {["tester", "developer", "admin"].map(roleType => (
                <div key={roleType} className="role-card">
                  <h3>{roleType.charAt(0).toUpperCase() + roleType.slice(1)}</h3>
                  <p>Permissions are managed by the system.</p>
                  <p className="role-desc">
                    {roleType === "tester" && "Can create test cases, execute tests, and report bugs."}
                    {roleType === "developer" && "Can view bugs, update bug status, and manage team."}
                    {roleType === "admin" && "Full system access including user, project, and system management."}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}


        </>
        )}


      </div>
    </div>
  );
}

export default AdminDashboard;
