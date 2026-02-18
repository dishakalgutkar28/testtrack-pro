import { useState, useEffect } from "react";
import api from "../services/api";
import Navbar from "../components/Navbar";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Create user form
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("tester");
  const [passwordErrors, setPasswordErrors] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get("/api/admin/users");
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      setMessage("Failed to fetch users");
      setLoading(false);
    }
  };

  const validatePassword = (pwd) => {
    const errors = [];
    if (pwd.length < 8) errors.push("At least 8 characters");
    if (!/[A-Z]/.test(pwd)) errors.push("One uppercase letter");
    if (!/[a-z]/.test(pwd)) errors.push("One lowercase letter");
    if (!/[0-9]/.test(pwd)) errors.push("One number");
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) 
      errors.push("One special character");
    return errors;
  };

  const handlePasswordChange = (e) => {
    const pwd = e.target.value;
    setNewUserPassword(pwd);
    if (pwd.length > 0) {
      setPasswordErrors(validatePassword(pwd));
    } else {
      setPasswordErrors([]);
    }
  };

  const createUser = async () => {
    const errors = validatePassword(newUserPassword);
    if (errors.length > 0) {
      setMessage("Password does not meet requirements");
      return;
    }

    try {
      await api.post("/api/admin/users", {
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole
      });
      setMessage(`✅ User created successfully as ${newUserRole}`);
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("tester");
      setPasswordErrors([]);
      setShowCreateForm(false);
      fetchUsers();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to create user");
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      await api.put(`/api/admin/users/${userId}/role`, { role: newRole });
      setMessage("✅ User role updated successfully");
      fetchUsers();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to update role");
    }
  };

  const deleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await api.delete(`/api/admin/users/${userId}`);
        setMessage("✅ User deleted successfully");
        fetchUsers();
      } catch (error) {
        setMessage(error.response?.data?.message || "Failed to delete user");
      }
    }
  };

  if (loading) return (
    <div className="admin-dashboard-container">
      <Navbar />
      <div className="admin-dashboard">
        <p>Loading...</p>
      </div>
    </div>
  );

  return (
    <div className="admin-dashboard-container">
      <Navbar />
      <div className="admin-dashboard">
        <h1>👥 User Management</h1>
        
        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <div className="create-user-section">
          <button 
            className="create-btn"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? "Cancel" : "➕ Create New User"}
          </button>

          {showCreateForm && (
            <div className="create-form">
              <h2>Create New User</h2>
              
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  placeholder="Password"
                  value={newUserPassword}
                  onChange={handlePasswordChange}
                  className="input-field"
                />
                {passwordErrors.length > 0 && (
                  <div className="password-errors">
                    <p>Password must contain:</p>
                    {passwordErrors.map((error, idx) => (
                      <span key={idx} className="error-item">❌ {error}</span>
                    ))}
                  </div>
                )}
                {newUserPassword.length > 0 && passwordErrors.length === 0 && (
                  <span className="success-item">✅ Password is valid</span>
                )}
              </div>

              <div className="form-group">
                <label>Role *</label>
                <select 
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="input-field"
                >
                  <option value="tester">Tester</option>
                  <option value="developer">Developer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <button 
                className="submit-btn"
                onClick={createUser}
                disabled={!newUserEmail || !newUserPassword || passwordErrors.length > 0}
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
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.email}</td>
                    <td>
                      <select 
                        value={user.role}
                        onChange={(e) => updateUserRole(user.id, e.target.value)}
                        className="role-select"
                      >
                        <option value="tester">Tester</option>
                        <option value="developer">Developer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                      <button 
                        className="delete-btn"
                        onClick={() => deleteUser(user.id)}
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
      </div>
    </div>
  );
}

export default AdminDashboard;