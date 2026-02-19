import { useEffect, useState } from "react";
import api from "../services/api";
import Navbar from "../components/Navbar";
import "./Reports.css";

function Reports() {
  const [bugs, setBugs] = useState([]);
  const [testcases, setTestcases] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [bugsRes, testcasesRes, executionsRes, projectsRes] = await Promise.all([
        api.get("/bugs"),
        api.get("/testcase"),
        api.get("/executions"),
        api.get("/projects"),
      ]);
      setBugs(bugsRes.data || []);
      setTestcases(testcasesRes.data || []);
      setExecutions(executionsRes.data || []);
      setProjects(projectsRes.data || []);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Bug Statistics
  const bugStats = {
    total: bugs.length,
    open: bugs.filter(b => b.status === "open").length,
    inProgress: bugs.filter(b => b.status === "progress").length,
    closed: bugs.filter(b => b.status === "closed").length,
    high: bugs.filter(b => b.severity === "high").length,
    medium: bugs.filter(b => b.severity === "medium").length,
    low: bugs.filter(b => b.severity === "low").length,
  };

  // Test Execution Statistics
  const executionStats = {
    total: executions.length,
    passed: executions.filter(e => e.status === "pass").length,
    failed: executions.filter(e => e.status === "fail").length,
    pending: executions.filter(e => e.status === "pending").length,
  };
  executionStats.passRate = executionStats.total > 0
    ? ((executionStats.passed / executionStats.total) * 100).toFixed(1)
    : 0;

  // Test Case Statistics
  const testcaseStats = {
    total: testcases.length,
    high: testcases.filter(t => t.priority === "high").length,
    medium: testcases.filter(t => t.priority === "medium").length,
    low: testcases.filter(t => t.priority === "low").length,
  };

  // Project Statistics
  const projectStats = projects.map(project => {
    const projectBugs = bugs.filter(b => b.project_id === project.id);
    const projectTestcases = testcases.filter(t => t.project_id === project.id);
    const projectExecutions = executions.filter(e => e.project_id === project.id);
    
    return {
      name: project.name,
      bugs: projectBugs.length,
      openBugs: projectBugs.filter(b => b.status === "open").length,
      testcases: projectTestcases.length,
      executions: projectExecutions.length,
      passedTests: projectExecutions.filter(e => e.status === "pass").length,
    };
  });

  if (loading) {
    return (
      <div className="reports-container">
        <Navbar />
        <div className="reports-content">
          <div className="loading-message">Loading reports...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-container">
      <Navbar />
      
      <div className="reports-content">
        <div className="reports-header">
          <h1>📊 Analytics & Reports</h1>
          <p className="subtitle">Comprehensive overview of testing activities and bug tracking</p>
        </div>

        {/* Overview Cards */}
        <div className="overview-section">
          <div className="overview-card projects-card">
            <div className="card-icon">📁</div>
            <div className="card-info">
              <h3>{projects.length}</h3>
              <p>Total Projects</p>
            </div>
          </div>

          <div className="overview-card testcases-card">
            <div className="card-icon">📝</div>
            <div className="card-info">
              <h3>{testcaseStats.total}</h3>
              <p>Test Cases</p>
            </div>
          </div>

          <div className="overview-card executions-card">
            <div className="card-icon">▶️</div>
            <div className="card-info">
              <h3>{executionStats.total}</h3>
              <p>Executions</p>
            </div>
          </div>

          <div className="overview-card bugs-card">
            <div className="card-icon">🐛</div>
            <div className="card-info">
              <h3>{bugStats.total}</h3>
              <p>Total Bugs</p>
            </div>
          </div>
        </div>

        {/* Test Execution Analysis */}
        <div className="report-section">
          <h2>🎯 Test Execution Analysis</h2>
          <div className="stats-grid">
            <div className="stat-box pass-box">
              <h4>Passed</h4>
              <div className="stat-value">{executionStats.passed}</div>
              <div className="stat-percentage">{executionStats.passRate}% Pass Rate</div>
            </div>

            <div className="stat-box fail-box">
              <h4>Failed</h4>
              <div className="stat-value">{executionStats.failed}</div>
              <div className="stat-percentage">
                {executionStats.total > 0 
                  ? ((executionStats.failed / executionStats.total) * 100).toFixed(1) 
                  : 0}% Fail Rate
              </div>
            </div>

            <div className="stat-box pending-box">
              <h4>Pending</h4>
              <div className="stat-value">{executionStats.pending}</div>
              <div className="stat-percentage">
                {executionStats.total > 0 
                  ? ((executionStats.pending / executionStats.total) * 100).toFixed(1) 
                  : 0}%
              </div>
            </div>
          </div>
        </div>

        {/* Bug Analysis */}
        <div className="report-section">
          <h2>🐛 Bug Analysis</h2>
          
          <div className="analysis-row">
            <div className="analysis-section">
              <h3>By Status</h3>
              <div className="stats-grid">
                <div className="stat-box open-box">
                  <h4>Open</h4>
                  <div className="stat-value">{bugStats.open}</div>
                </div>
                <div className="stat-box progress-box">
                  <h4>In Progress</h4>
                  <div className="stat-value">{bugStats.inProgress}</div>
                </div>
                <div className="stat-box closed-box">
                  <h4>Closed</h4>
                  <div className="stat-value">{bugStats.closed}</div>
                </div>
              </div>
            </div>

            <div className="analysis-section">
              <h3>By Severity</h3>
              <div className="stats-grid">
                <div className="stat-box high-box">
                  <h4>High</h4>
                  <div className="stat-value">{bugStats.high}</div>
                </div>
                <div className="stat-box medium-box">
                  <h4>Medium</h4>
                  <div className="stat-value">{bugStats.medium}</div>
                </div>
                <div className="stat-box low-box">
                  <h4>Low</h4>
                  <div className="stat-value">{bugStats.low}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Test Case Priority Distribution */}
        <div className="report-section">
          <h2>📝 Test Case Priority Distribution</h2>
          <div className="stats-grid">
            <div className="stat-box high-priority-box">
              <h4>High Priority</h4>
              <div className="stat-value">{testcaseStats.high}</div>
              <div className="stat-percentage">
                {testcaseStats.total > 0 
                  ? ((testcaseStats.high / testcaseStats.total) * 100).toFixed(1) 
                  : 0}%
              </div>
            </div>

            <div className="stat-box medium-priority-box">
              <h4>Medium Priority</h4>
              <div className="stat-value">{testcaseStats.medium}</div>
              <div className="stat-percentage">
                {testcaseStats.total > 0 
                  ? ((testcaseStats.medium / testcaseStats.total) * 100).toFixed(1) 
                  : 0}%
              </div>
            </div>

            <div className="stat-box low-priority-box">
              <h4>Low Priority</h4>
              <div className="stat-value">{testcaseStats.low}</div>
              <div className="stat-percentage">
                {testcaseStats.total > 0 
                  ? ((testcaseStats.low / testcaseStats.total) * 100).toFixed(1) 
                  : 0}%
              </div>
            </div>
          </div>
        </div>

        {/* Project Overview */}
        {projectStats.length > 0 && (
          <div className="report-section">
            <h2>📁 Project Overview</h2>
            <div className="project-table-container">
              <table className="project-table">
                <thead>
                  <tr>
                    <th>Project Name</th>
                    <th>Test Cases</th>
                    <th>Executions</th>
                    <th>Passed Tests</th>
                    <th>Total Bugs</th>
                    <th>Open Bugs</th>
                  </tr>
                </thead>
                <tbody>
                  {projectStats.map((project, index) => (
                    <tr key={index}>
                      <td className="project-name">{project.name}</td>
                      <td>{project.testcases}</td>
                      <td>{project.executions}</td>
                      <td className="passed-count">{project.passedTests}</td>
                      <td>{project.bugs}</td>
                      <td className="open-count">{project.openBugs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary Insights */}
        <div className="report-section insights-section">
          <h2>💡 Key Insights</h2>
          <div className="insights-grid">
            <div className="insight-card">
              <div className="insight-icon">✅</div>
              <div className="insight-content">
                <h4>Test Quality</h4>
                <p>
                  {executionStats.passRate >= 80 
                    ? "Excellent pass rate! Keep up the good work." 
                    : executionStats.passRate >= 60 
                    ? "Good pass rate, but there's room for improvement." 
                    : "Pass rate needs attention. Review failed tests."}
                </p>
              </div>
            </div>

            <div className="insight-card">
              <div className="insight-icon">🐛</div>
              <div className="insight-content">
                <h4>Bug Status</h4>
                <p>
                  {bugStats.open > 0 
                    ? `${bugStats.open} bug${bugStats.open > 1 ? 's' : ''} need${bugStats.open === 1 ? 's' : ''} attention.` 
                    : "No open bugs! Great job!"}
                  {bugStats.high > 0 && ` ${bugStats.high} high severity.`}
                </p>
              </div>
            </div>

            <div className="insight-card">
              <div className="insight-icon">📊</div>
              <div className="insight-content">
                <h4>Test Coverage</h4>
                <p>
                  {testcaseStats.total > 0 
                    ? `${testcaseStats.total} test case${testcaseStats.total > 1 ? 's' : ''} across ${projects.length} project${projects.length > 1 ? 's' : ''}.` 
                    : "No test cases created yet."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;
