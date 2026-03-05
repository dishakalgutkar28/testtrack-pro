import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import { useTheme } from "../context/ThemeContext";
import "./AdminDashboard.css";

function AdminTestcaseManagement() {
  const [testcases, setTestcases] = useState([]);
  const [testers, setTesters] = useState([]);
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
        fetchTestcases(),
        fetchTesters(),
        fetchProjects()
      ]);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  const fetchTestcases = async () => {
    try {
      const res = await api.get("/testcase");
      setTestcases(res.data || []);
      setLoading(false);
    } catch (err) {
      console.log("Error fetching testcases:", err);
      setMessage({ text: "Failed to load testcases", type: "error" });
      setLoading(false);
    }
  };

  const fetchTesters = async () => {
    try {
      const res = await api.get("/admin/users");
      // Filter only testers
      const testerUsers = res.data.filter(u => u.role === 'tester');
      setTesters(testerUsers || []);
    } catch (err) {
      console.log("Failed to load testers", err);
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

  const deleteTestcase = async (testcaseId) => {
    if (!window.confirm("Are you sure you want to delete this test case? This cannot be undone.")) return;

    try {
      await api.delete(`/testcase/${testcaseId}`);
      setMessage({ text: "Test case deleted successfully!", type: "success" });
      fetchTestcases();
    } catch (err) {
      setMessage({ text: err.response?.data?.error || "Failed to delete test case", type: "error" });
    }
  };

  const assignTestcase = async (testcaseId, testerId) => {
    try {
      await api.put(`/testcase/${testcaseId}`, {
        assigned_to: testerId || null
      });
      setMessage({ text: "Test case assigned successfully!", type: "success" });
      fetchTestcases();
    } catch (err) {
      setMessage({ 
        text: err.response?.data?.error || "Failed to assign test case", 
        type: "error" 
      });
    }
  };

  const getTesterName = (testerId) => {
    const tester = testers.find(t => t.id === testerId);
    return tester ? tester.email : "Unassigned";
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
          <h1>Test Case Management 📋</h1>
          <p>Assign test cases to testers and manage test execution</p>
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

        <div className="testcase-management-section">
          <div className="section-header">
            <h2>All Test Cases ({testcases.length})</h2>
          </div>

          {testcases.length === 0 ? (
            <p className="no-data">📭 No test cases found.</p>
          ) : (
            <div className="data-grid">
              {testcases.map(tc => (
                <div key={tc.id} className="data-card">
                  <div className="card-header">
                    <h3>TC-{tc.id} - {tc.title}</h3>
                    <span className={`priority-badge priority-${tc.priority || 'medium'}`}>
                      {(tc.priority || 'medium').toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="card-description">{tc.description || "No description"}</p>
                  
                  <div className="card-meta">
                    <p>
                      <strong>📂 Project:</strong> {getProjectName(tc.project_id)}
                    </p>
                    <p>
                      <strong>⚡ Priority:</strong> {tc.priority || 'Medium'}
                    </p>
                    <p>
                      <strong>📝 Type:</strong> {tc.type || 'Manual'}
                    </p>
                  </div>

                  {/* Assignment Section */}
                  <div className="bug-assignment" style={{ marginTop: "15px", padding: "15px", background: "#f8fafc", borderRadius: "8px" }}>
                    <div className="form-group">
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                        👤 Assign To Tester:
                      </label>
                      <select
                        className="assign-dropdown"
                        value={tc.assigned_to || ""}
                        onChange={(e) => assignTestcase(tc.id, e.target.value)}
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "2px solid #cbd5e1" }}
                      >
                        <option value="">Unassigned</option>
                        {testers.map(tester => (
                          <option key={tester.id} value={tester.id}>{tester.email}</option>
                        ))}
                      </select>
                    </div>

                    {tc.assigned_to && (
                      <p style={{ marginTop: "10px", fontSize: "13px", color: "#059669" }}>
                        ✓ Assigned to: <strong>{getTesterName(tc.assigned_to)}</strong>
                      </p>
                    )}
                  </div>

                  <div className="card-actions" style={{ marginTop: "12px" }}>
                    <button 
                      className="btn-delete"
                      onClick={() => deleteTestcase(tc.id)}
                      title="Delete this test case"
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

export default AdminTestcaseManagement;
