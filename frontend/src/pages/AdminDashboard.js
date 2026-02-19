import { useEffect, useState } from "react";
import api from "../services/api";
import Navbar from "../components/Navbar";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("tester");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data);
    } catch (err) {
      setMessage({ text: "Failed to fetch users", type: "error" });
    }
  };

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
    } catch (err) {
      setMessage({ text: "Failed to delete user", type: "error" });
    }
  };

  const updateRole = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}`, { role: newRole });
      setMessage({ text: "Role updated successfully!", type: "success" });
      fetchUsers();
    } catch (err) {
      setMessage({ text: "Failed to update role", type: "error" });
    }
  };

  const passwordErrors = password ? validatePassword(password) : [];

  return (
    <div className="admin-dashboard-container">
      <Navbar />
      <div className="admin-dashboard">
        <h1>👨‍💼 Admin Dashboard</h1>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

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
                      <span key={idx} className="error-item">❌ {err}</span>
                    ))}
                  </div>
                )}
                {password && passwordErrors.length === 0 && (
                  <span className="success-item">✅ Password is strong!</span>
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
          <h2>📋 All Users ({users.length})</h2>
          {users.length === 0 ? (
            <p className="no-users">No users found</p>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Role</th>
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
      </div>
    </div>
  );
}

export default AdminDashboard;
