import { useEffect, useState } from "react";
import api from "../services/api";
import Navbar from "../components/Navbar";
import "./ExecutionHistory.css";

function ExecutionHistory() {
  const [executions, setExecutions] = useState([]);
  const [testcases, setTestcases] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterProject, setFilterProject] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [execRes, tcRes, projRes] = await Promise.all([
        api.get("/execution"),
        api.get("/testcase"),
        api.get("/projects")
      ]);
      
      setExecutions(execRes.data || []);
      setTestcases(tcRes.data || []);
      setProjects(projRes.data || []);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  const getTestcaseTitle = (tcId) => {
    const tc = testcases.find(t => t.id === tcId);
    return tc ? tc.title : `TC #${tcId}`;
  };

  const getProjectName = (projId) => {
    const proj = projects.find(p => p.id === projId);
    return proj ? proj.name : "No Project";
  };

  // Filter executions
  const filteredExecutions = executions.filter(exec => {
    const matchesStatus = filterStatus === "all" || exec.status === filterStatus;
    const matchesProject = filterProject === "all" || exec.project_id == filterProject;
    return matchesStatus && matchesProject;
  });

  // Statistics
  const stats = {
    total: executions.length,
    pass: executions.filter(e => e.status === "pass").length,
    fail: executions.filter(e => e.status === "fail").length,
    pending: executions.filter(e => e.status === "pending").length,
  };

  const passRate = stats.total > 0 ? ((stats.pass / stats.total) * 100).toFixed(1) : 0;

  if (loading) {
    return (
      <div className="execution-history-container">
        <Navbar />
        <div className="loading">Loading execution history...</div>
      </div>
    );
  }

  return (
    <div className="execution-history-container">
      <Navbar />
      <div className="execution-history-content">
        <h1>📊 Execution History</h1>
        <p className="subtitle">View all test case execution results</p>

        {/* Statistics */}
        <div className="stats-grid">
          <div className="stat-card total">
            <h3>Total Executions</h3>
            <p className="stat-number">{stats.total}</p>
          </div>
          <div className="stat-card pass">
            <h3>Passed</h3>
            <p className="stat-number">{stats.pass}</p>
          </div>
          <div className="stat-card fail">
            <h3>Failed</h3>
            <p className="stat-number">{stats.fail}</p>
          </div>
          <div className="stat-card pending">
            <h3>Pending</h3>
            <p className="stat-number">{stats.pending}</p>
          </div>
          <div className="stat-card rate">
            <h3>Pass Rate</h3>
            <p className="stat-number">{passRate}%</p>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
            <option value="pending">Pending</option>
          </select>

          <select
            className="filter-select"
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
          >
            <option value="all">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Executions List */}
        <div className="executions-section">
          <h2>📋 Execution Results ({filteredExecutions.length})</h2>
          
          {filteredExecutions.length === 0 ? (
            <p className="empty-message">No execution results found</p>
          ) : (
            <div className="executions-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Test Case</th>
                    <th>Status</th>
                    <th>Project</th>
                    <th>Notes</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExecutions.map((exec) => (
                    <tr key={exec.id}>
                      <td>#{exec.id}</td>
                      <td>{getTestcaseTitle(exec.testcase_id)}</td>
                      <td>
                        <span className={`status-badge status-${exec.status}`}>
                          {exec.status === "pass" && "✅ PASS"}
                          {exec.status === "fail" && "❌ FAIL"}
                          {exec.status === "pending" && "⏳ PENDING"}
                        </span>
                      </td>
                      <td>{exec.project_id ? getProjectName(exec.project_id) : "-"}</td>
                      <td className="notes-cell">{exec.notes || "-"}</td>
                      <td>{exec.executed_at ? new Date(exec.executed_at).toLocaleString() : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExecutionHistory;
