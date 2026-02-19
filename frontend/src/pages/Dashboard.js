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
        api.get("/testcase"),
        api.get("/bugs"),
        api.get("/projects")
      ];

      const [testcasesRes, bugsRes, projectsRes] = await Promise.all(requests);

      setData(prev => ({
        ...prev,
        testcases: testcasesRes.data?.length || 0,
        bugs: bugsRes.data?.length || 0,
        executions: 0,
        projects: projectsRes.data?.length || 0
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
              <p className="dashboard-subtitle">
                Create test cases and report bugs to improve software quality
              </p>
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
              <div className="stat-card testcases-card"
                   onClick={() => navigate("/testcase")}>
                <div className="stat-icon">📋</div>
                <div className="stat-info">
                  <h3>Test Cases Created</h3>
                  <p className="stat-number">{data.testcases}</p>
                </div>
              </div>

              <div className="stat-card bugs-card"
                   onClick={() => navigate("/bug")}>
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
                <button className="action-btn testcase-btn"
                        onClick={() => navigate("/testcase")}>
                  ➕ Create Test Case
                </button>

                <button className="action-btn bug-btn"
                        onClick={() => navigate("/bug")}>
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
              <p className="dashboard-subtitle">
                Fix bugs, manage projects, and ensure code quality
              </p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="role-summary">
              <h2>Your Responsibilities</h2>
              <ul className="responsibilities-list">
                <li>🔧 Fix bugs reported by testers</li>
                <li>📁 Manage and oversee projects</li>
                <li>✅ Review test cases and execution results</li>
                <li>📈 Monitor project progress</li>
              </ul>
            </div>

            <div className="stats-grid">
              <div className="stat-card bugs-card"
                   onClick={() => navigate("/developer-bugs")}>
                <div className="stat-icon">🐛</div>
                <div className="stat-info">
                  <h3>Bugs to Fix</h3>
                  <p className="stat-number">{data.bugs}</p>
                </div>
              </div>

              <div className="stat-card testcases-card"
                   onClick={() => navigate("/testcase")}>
                <div className="stat-icon">📋</div>
                <div className="stat-info">
                  <h3>Test Cases</h3>
                  <p className="stat-number">{data.testcases}</p>
                </div>
              </div>

              <div className="stat-card projects-card"
                   onClick={() => navigate("/projects")}>
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
                <button className="action-btn bug-btn"
                        onClick={() => navigate("/developer-bugs")}>
                  🔧 Fix Bugs
                </button>

                <button className="action-btn testcase-btn"
                        onClick={() => navigate("/testcase")}>
                  ✅ Review Test Cases
                </button>
              </div>
            </div>
          </>
        )}

        {/* ADMIN DASHBOARD */}
        {role === "admin" && (
          <>
            <div className="dashboard-header">
              <h1>🔐 Admin Dashboard</h1>
              <p className="dashboard-subtitle">
                Manage users and oversee system activities
              </p>
            </div>

            <div className="stats-grid">
              <div className="stat-card users-card"
                   onClick={() => navigate("/admin/users")}>
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>Manage Users</h3>
                  <p className="stat-number">→</p>
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
