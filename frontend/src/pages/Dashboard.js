import { useEffect, useState } from "react";
import api from "../services/api";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

function Dashboard() {
  const [role, setRole] = useState("");
  const [data, setData] = useState({
    testcases: 0,
    bugs: 0,
    executions: 0,
    users: 0,
    projects: 0
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userRole = localStorage.getItem("role") || "tester";
    setRole(userRole);
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const requests = [
        api.get("/api/testcase"),
        api.get("/api/bugs")
      ];

      const [testcasesRes, bugsRes] = await Promise.all(requests);
      
      setData(prev => ({
        ...prev,
        testcases: testcasesRes.data?.length || 0,
        bugs: bugsRes.data?.length || 0,
        executions: 0,
        projects: 1
      }));

      setLoading(false);
    } catch (err) {
      console.log("Dashboard error:", err);
      setError("Failed to load dashboard data");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <Navbar />
        <div className="dashboard-content">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="dashboard-content">
        
        {/* TESTER DASHBOARD */}
        {role === "tester" && (
          <>
            <div className="dashboard-header">
              <h1>👤 Tester Dashboard</h1>
              <p className="dashboard-subtitle">Create test cases and report bugs to improve software quality</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="role-summary">
              <h2>Your Responsibilities</h2>
              <ul className="responsibilities-list">
                <li>✅ Create and manage test cases</li>
                <li>✅ Report bugs found during testing</li>
                <li>✅ Track test execution results</li>
                <li>✅ Collaborate with developers on bug fixes</li>
              </ul>
            </div>

            <div className="stats-grid">
              <div className="stat-card testcases-card" onClick={() => navigate("/testcase")}>
                <div className="stat-icon">📋</div>
                <div className="stat-info">
                  <h3>Test Cases Created</h3>
                  <p className="stat-number">{data.testcases}</p>
                </div>
              </div>
              
              <div className="stat-card bugs-card" onClick={() => navigate("/bug")}>
                <div className="stat-icon">🐛</div>
                <div className="stat-info">
                  <h3>Bugs Reported</h3>
                  <p className="stat-number">{data.bugs}</p>
                </div>
              </div>
            </div>

            <div className="quick-actions">
              <h2>Quick Actions</h2>
              <div className="actions-grid">
                <button className="action-btn testcase-btn" onClick={() => navigate("/testcase")}>
                  ➕ Create Test Case
                </button>
                <button className="action-btn bug-btn" onClick={() => navigate("/bug")}>
                  🐛 Report Bug
                </button>
              </div>
            </div>
          </>
        )}

        {/* DEVELOPER DASHBOARD */}
        {role === "developer" && (
          <>
            <div className="dashboard-header">
              <h1>👨‍💻 Developer Dashboard</h1>
              <p className="dashboard-subtitle">Fix bugs, manage projects, and ensure code quality</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="role-summary">
              <h2>Your Responsibilities</h2>
              <ul className="responsibilities-list">
                <li>🔧 Fix bugs reported by testers</li>
                <li>📁 Manage and oversee projects</li>
                <li>✅ Review test cases and execution results</li>
                <li>📈 Monitor project progress and quality metrics</li>
              </ul>
            </div>

            <div className="stats-grid">
              <div className="stat-card bugs-card" onClick={() => navigate("/bug")}>
                <div className="stat-icon">🐛</div>
                <div className="stat-info">
                  <h3>Bugs to Fix</h3>
                  <p className="stat-number">{data.bugs}</p>
                </div>
              </div>

              <div className="stat-card testcases-card" onClick={() => navigate("/testcase")}>
                <div className="stat-icon">📋</div>
                <div className="stat-info">
                  <h3>Test Cases</h3>
                  <p className="stat-number">{data.testcases}</p>
                </div>
              </div>

              <div className="stat-card projects-card">
                <div className="stat-icon">📁</div>
                <div className="stat-info">
                  <h3>Active Projects</h3>
                  <p className="stat-number">{data.projects}</p>
                </div>
              </div>
            </div>

            <div className="quick-actions">
              <h2>Quick Actions</h2>
              <div className="actions-grid">
                <button className="action-btn bug-btn" onClick={() => navigate("/bug")}>
                  🔧 Fix Bugs
                </button>
                <button className="action-btn testcase-btn" onClick={() => navigate("/testcase")}>
                  ✅ Review Test Cases
                </button>
              </div>
            </div>

            <div className="prioritized-bugs">
              <h2>Recent Bug Reports</h2>
              <p className="info-text">Review and fix bugs reported by testers to maintain code quality</p>
            </div>
          </>
        )}

        {/* ADMIN DASHBOARD */}
        {role === "admin" && (
          <>
            <div className="dashboard-header">
              <h1>🔐 Admin Dashboard</h1>
              <p className="dashboard-subtitle">Manage users, projects, and oversee all system activities</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="role-summary">
              <h2>Your Responsibilities</h2>
              <ul className="responsibilities-list">
                <li>👥 Manage user accounts and roles</li>
                <li>📊 Monitor overall system performance</li>
                <li>🔐 Control access and permissions</li>
                <li>⚙️ Manage projects and resources</li>
                <li>📈 Generate reports and analytics</li>
              </ul>
            </div>

            <div className="stats-grid">
              <div className="stat-card users-card" onClick={() => navigate("/admin/users")}>
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>Total Users</h3>
                  <p className="stat-number">Manage →</p>
                </div>
              </div>

              <div className="stat-card testcases-card">
                <div className="stat-icon">📋</div>
                <div className="stat-info">
                  <h3>Total Test Cases</h3>
                  <p className="stat-number">{data.testcases}</p>
                </div>
              </div>

              <div className="stat-card bugs-card">
                <div className="stat-icon">🐛</div>
                <div className="stat-info">
                  <h3>Total Bugs</h3>
                  <p className="stat-number">{data.bugs}</p>
                </div>
              </div>

              <div className="stat-card projects-card">
                <div className="stat-icon">📁</div>
                <div className="stat-info">
                  <h3>Active Projects</h3>
                  <p className="stat-number">{data.projects}</p>
                </div>
              </div>
            </div>

            <div className="quick-actions">
              <h2>Quick Actions</h2>
              <div className="actions-grid">
                <button className="action-btn users-btn" onClick={() => navigate("/admin/users")}>
                  👥 Manage Users
                </button>
                <button className="action-btn projects-btn" onClick={() => navigate("/projects")}>
                  📁 Manage Projects
                </button>
                <button className="action-btn stats-btn" onClick={() => navigate("/analytics")}>
                  📊 View Analytics
                </button>
              </div>
            </div>

            <div className="admin-features">
              <h2>System Management</h2>
              <div className="features-grid">
                <div className="feature-card">
                  <h3>🛡️ Security & Access</h3>
                  <p>Manage user roles, permissions, and security settings</p>
                </div>
                <div className="feature-card">
                  <h3>📊 Analytics & Reports</h3>
                  <p>View system statistics and generate detailed reports</p>
                </div>
                <div className="feature-card">
                  <h3>⚙️ Configuration</h3>
                  <p>Configure system settings and manage projects</p>
                </div>
                <div className="feature-card">
                  <h3>🔍 Audit Logs</h3>
                  <p>Track user activities and system changes</p>
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

export default Dashboard;