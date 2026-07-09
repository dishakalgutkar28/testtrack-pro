import { useEffect, useState } from "react";
import api from "../services/api";
import Navbar from "../components/Navbar";
import { useTheme } from "../context/ThemeContext";
import "./Reports.css";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Pie, Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function Reports() {
  const [selectedProject, setSelectedProject] = useState("");
  const [projects, setProjects] = useState([]);
  const [testcaseStats, setTestcaseStats] = useState(null);
  const [executionStats, setExecutionStats] = useState(null);
  const [bugStats, setBugStats] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [performanceData, setPerformanceData] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [priorityData, setPriorityData] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [automationData, setAutomationData] = useState([]);
  const [loading, setLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Load projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await api.get("/projects");
        const projectsArray = res.data.projects || [];
        setProjects(projectsArray);
        // Auto-select first project
        if (projectsArray && projectsArray.length > 0) {
          setSelectedProject(projectsArray[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch projects:", err);
      }
    };
    loadProjects();
  }, []);

  // Fetch analytics data when project or date range changes
  useEffect(() => {
    if (!selectedProject) return;

    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const params = { projectId: selectedProject, days: 30 };
        
        console.log('📊 Fetching analytics for project:', selectedProject, 'Days:', 30);
        
        const [
          testcasesRes,
          bugsRes,
          executionsRes,
          performanceRes,
          priorityRes,
          automationRes
        ] = await Promise.all([
          api.get("/analytics/testcases", { params }),
          api.get("/analytics/bugs", { params }),
          api.get("/analytics/executions", { params }),
          api.get("/analytics/performance", { params }),
          api.get("/analytics/priority-breakdown", { params }),
          api.get("/analytics/automation-status", { params }),
        ]);

        console.log('📝 Testcase Stats:', testcasesRes.data);
        console.log('🐛 Bug Stats:', bugsRes.data);
        console.log('▶️ Execution Stats:', executionsRes.data);
        console.log('📊 Priority Data:', priorityRes.data);
        console.log('🤖 Automation Data:', automationRes.data);

        setTestcaseStats(testcasesRes.data || {});
        setBugStats(bugsRes.data || {});
        setExecutionStats(executionsRes.data || {});
        setPerformanceData(performanceRes.data || []);
        setPriorityData(priorityRes.data || []);
        setAutomationData(automationRes.data || []);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedProject]);

  // Export to CSV
  // eslint-disable-next-line no-unused-vars
  const exportToCSV = () => {
    if (!selectedProject) {
      alert("Please select a project first");
      return;
    }

    const project = projects.find(p => p.id === selectedProject);
    const headers = ["Test Track Pro - Analytics Report", "", `Project: ${project?.name}`, `Generated: ${new Date().toLocaleString()}`, ""];
    const rows = [
      ["TEST CASE STATISTICS"],
      ["Total Test Cases", testcaseStats?.total_testcases || 0],
      ["Draft", testcaseStats?.draft_count || 0],
      ["Ready", testcaseStats?.ready_count || 0],
      ["Executing", testcaseStats?.executing_count || 0],
      ["Completed", testcaseStats?.completed_count || 0],
      ["Closed", testcaseStats?.closed_count || 0],
      [""],
      ["BUG STATISTICS"],
      ["Total Bugs", bugStats?.total_bugs || 0],
      ["Open", bugStats?.open_count || 0],
      ["In Progress", bugStats?.progress_count || 0],
      ["Closed", bugStats?.closed_count || 0],
      ["Critical", bugStats?.critical_count || 0],
      ["High", bugStats?.high_count || 0],
      ["Medium", bugStats?.medium_count || 0],
      ["Low", bugStats?.low_count || 0],
      [""],
      ["EXECUTION STATISTICS"],
      ["Total Executions", executionStats?.total_executions || 0],
      ["Passed", executionStats?.pass_count || 0],
      ["Failed", executionStats?.fail_count || 0],
      ["Pending", executionStats?.pending_count || 0],
      ["Pass Rate (%)", executionStats?.pass_percentage || 0],
      ["Avg Duration (min)", executionStats?.avg_duration_minutes || 0],
    ];

    const csv = [...headers, ...rows].map(row => 
      Array.isArray(row) ? row.map(cell => `"${cell}"`).join(",") : row
    ).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `testtrack-report-${new Date().getTime()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Generate a plain-text version of the report for sharing via email or chat
  const generateReportText = () => {
    const project = projects.find(p => p.id === selectedProject);
    const lines = [];
    lines.push("Test Track Pro - Analytics Report");
    lines.push("");
    lines.push(`Project: ${project?.name || "-"}`);
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push("");

    lines.push("TEST CASE STATISTICS:");
    lines.push(`- Total Test Cases: ${testcaseStats?.total_testcases || 0}`);
    lines.push(`- Draft: ${testcaseStats?.draft_count || 0}`);
    lines.push(`- Ready: ${testcaseStats?.ready_count || 0}`);
    lines.push(`- Executing: ${testcaseStats?.executing_count || 0}`);
    lines.push(`- Completed: ${testcaseStats?.completed_count || 0}`);
    lines.push(`- Closed: ${testcaseStats?.closed_count || 0}`);
    lines.push("");

    lines.push("BUG STATISTICS:");
    lines.push(`- Total Bugs: ${bugStats?.total_bugs || 0}`);
    lines.push(`- Open: ${bugStats?.open_count || 0}`);
    lines.push(`- In Progress: ${bugStats?.progress_count || 0}`);
    lines.push(`- Closed: ${bugStats?.closed_count || 0}`);
    lines.push(`- Critical: ${bugStats?.critical_count || 0}`);
    lines.push(`- High: ${bugStats?.high_count || 0}`);
    lines.push(`- Medium: ${bugStats?.medium_count || 0}`);
    lines.push(`- Low: ${bugStats?.low_count || 0}`);
    lines.push("");

    lines.push("EXECUTION STATISTICS:");
    lines.push(`- Total Executions: ${executionStats?.total_executions || 0}`);
    lines.push(`- Passed: ${executionStats?.pass_count || 0}`);
    lines.push(`- Failed: ${executionStats?.fail_count || 0}`);
    lines.push(`- Pending: ${executionStats?.pending_count || 0}`);
    lines.push(`- Pass Rate (%): ${(executionStats?.pass_percentage || 0)}`);
    lines.push(`- Avg Duration (min): ${(executionStats?.avg_duration_minutes || 0)}`);
    lines.push("");

    // Optional breakdowns if available
    if (priorityData && priorityData.length) {
      lines.push("PRIORITY BREAKDOWN:");
      priorityData.forEach(item => {
        lines.push(`- ${item.name || item.label || "Unknown"}: ${item.count || item.value || 0}`);
      });
      lines.push("");
    }

    if (automationData && automationData.length) {
      lines.push("AUTOMATION STATUS:");
      automationData.forEach(item => {
        lines.push(`- ${item.name || item.label || "Unknown"}: ${item.count || item.value || 0}`);
      });
      lines.push("");
    }

    return lines.join("\n");
  };

  const [reportText, setReportText] = useState("");
  const [showReportText, setShowReportText] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");

  const copyReportText = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      alert("Report text copied to clipboard");
    } catch (err) {
      console.error("Clipboard write failed:", err);
      alert("Failed to copy report text. You can manually select and copy it.");
    }
  };

  const emailReportText = () => {
    // Fallback: open mail client if backend sending is not desired
    const project = projects.find(p => p.id === selectedProject) || {};
    const subject = `TestTrack Pro Report - ${project.name || 'Project'}`;
    const body = reportText;
    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  const sendReportToBackend = async () => {
    if (!selectedProject) { alert('Please select a project first'); return; }
    // Basic email validation if provided
    if (recipientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      alert('Please enter a valid email address');
      return;
    }
    try {
      const payload = {
        project_id: selectedProject,
        subject: `TestTrack Pro Report - ${projects.find(p => p.id === selectedProject)?.name || ''}`,
        text: reportText
      };
      if (recipientEmail) payload.to = recipientEmail;

      const res = await api.post('/reports/send', payload);
      if (res.data && res.data.success) {
        alert('Report sent successfully');
        setShowReportText(false);
      } else {
        alert('Failed to send report');
      }
    } catch (err) {
      console.error('Send report error:', err?.response?.data || err.message);
      const serverError = err?.response?.data?.error;
      const serverDetails = err?.response?.data?.details;
      const message = [serverError, serverDetails].filter(Boolean).join(': ') || err?.message || 'Failed to send report';
      const isAuthError = /authentication|invalid login|smtp|credentials|535/i.test(message);
      if (isAuthError) {
        alert('Tip: Click "Open Mail Client" to send manually, or update backend SMTP credentials.');
      } else {
        alert(message);
      }
    }
  };

  // Chart configurations
  const executionChartData = {
    labels: ["Passed", "Failed", "Pending"],
    datasets: [
      {
        data: [
          executionStats?.pass_count || 0,
          executionStats?.fail_count || 0,
          executionStats?.pending_count || 0
        ],
        backgroundColor: (context) => {
          const { chart, dataIndex } = context;
          const { ctx, chartArea } = chart;

          // Initial render fallback (chartArea not ready yet)
          if (!chartArea) {
            return ["#22c55e", "#ef4444", "#f59e0b"][dataIndex];
          }

          const gradient = ctx.createLinearGradient(
            chartArea.left,
            chartArea.top,
            chartArea.right,
            chartArea.bottom
          );

          // Passed
          if (dataIndex === 0) {
            gradient.addColorStop(0, "#86efac");
            gradient.addColorStop(1, "#16a34a");
          }
          // Failed
          else if (dataIndex === 1) {
            gradient.addColorStop(0, "#fda4af");
            gradient.addColorStop(1, "#dc2626");
          }
          // Pending
          else {
            gradient.addColorStop(0, "#fde68a");
            gradient.addColorStop(1, "#d97706");
          }

          return gradient;
        },
        borderColor: ["#14532d", "#7f1d1d", "#78350f"],
        borderWidth: 2,
        hoverOffset: 12
      }
    ]
  };

  const bugStatusChartData = {
    labels: ["Open", "In Progress", "Closed"],
    datasets: [{
      label: "Bug Count",
      data: [
        bugStats?.open_count || 0,
        bugStats?.progress_count || 0,
        bugStats?.closed_count || 0
      ],
      backgroundColor: [
        "rgba(255, 99, 132, 0.88)",  // Open
        "rgba(255, 159, 64, 0.88)",  // In Progress
        "rgba(75, 192, 192, 0.88)"   // Closed
      ],
      borderColor: [
        "rgba(239, 68, 68, 1)",
        "rgba(245, 124, 0, 1)",
        "rgba(13, 148, 136, 1)"
      ],
      borderWidth: 2,
      borderRadius: 10,
      borderSkipped: false,
      barPercentage: 0.62,
      categoryPercentage: 0.72
    }]
  };

  const bugSeverityChartData = {
    labels: ["Critical", "High", "Medium", "Low"],
    datasets: [{
      label: "Bug Count",
      data: [
        bugStats?.critical_count || 0,
        bugStats?.high_count || 0,
        bugStats?.medium_count || 0,
        bugStats?.low_count || 0
      ],
      backgroundColor: [
        "rgba(220, 38, 38, 0.9)",   // Critical
        "rgba(249, 115, 22, 0.88)", // High
        "rgba(59, 130, 246, 0.86)", // Medium
        "rgba(139, 92, 246, 0.86)"  // Low
      ],
      borderColor: [
        "rgba(185, 28, 28, 1)",
        "rgba(234, 88, 12, 1)",
        "rgba(37, 99, 235, 1)",
        "rgba(124, 58, 237, 1)"
      ],
      borderWidth: 2,
      borderRadius: 10,
      borderSkipped: false,
      barPercentage: 0.62,
      categoryPercentage: 0.72
    }]
  };

  const testcaseChartData = {
    labels: ['Draft', 'Ready', 'Executing', 'Deprecated'],
    datasets: [{
      data: [
        testcaseStats?.draft_count || 0,
        testcaseStats?.ready_count || 0,
        testcaseStats?.executing_count || 0,
        testcaseStats?.deprecated_count || 0
      ],
      backgroundColor: [
        'rgba(156, 163, 175, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ],
      borderColor: [
        'rgba(156, 163, 175, 1)',
        'rgba(34, 197, 94, 1)',
        'rgba(59, 130, 246, 1)',
        'rgba(239, 68, 68, 1)'
      ],
      borderWidth: 2
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: theme === 'dark-theme' ? '#e5e7eb' : '#1f2937',
          padding: 15,
          font: {
            size: 12,
            weight: 500
          }
        }
      },
      tooltip: {
        backgroundColor: theme === 'dark-theme' ? '#1f2937' : 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: theme === 'dark-theme' ? '#4b5563' : '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || context.raw;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    elements: {
      arc: {
        borderJoinStyle: "round"
      }
    }
  };

  const barChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: {
        ...chartOptions.plugins.legend,
        usePointStyle: true,
        pointStyle: "circle"
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: theme === "dark-theme" ? "#d1d5db" : "#374151",
          stepSize: 1
        },
        grid: {
          color: theme === "dark-theme" ? "rgba(148, 163, 184, 0.18)" : "rgba(99, 102, 241, 0.12)"
        }
      },
      x: {
        ticks: {
          color: theme === "dark-theme" ? "#d1d5db" : "#374151"
        },
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className={`reports-container ${theme === "dark-theme" ? "dark-theme" : ""}`}>
      <Navbar />
      
      {/* Theme Toggle Button */}
      <button 
        className="theme-toggle-btn"
        onClick={toggleTheme}
        aria-label="Toggle theme"
        title={theme === "dark-theme" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        <span className="theme-icon">{theme === "dark-theme" ? "☀️" : "🌙"}</span>
      </button>

      <div className="reports-content">
        <div className="reports-header">
          <h1>Reports & Analytics</h1>
          <div className="project-selector">
            <label htmlFor="project-select">Select Project:</label>
            <select
              id="project-select"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <option value="">-- Select a Project --</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div className="report-actions">
  <button
    className="export-btn export-csv"
    onClick={exportToCSV}
  >
    📊 Export CSV
  </button>

  <button
    className="export-btn export-text"
    onClick={() => {
      if (!selectedProject) {
        alert('Please select a project first');
        return;
      }

      const text = generateReportText();
      setReportText(text);
      setShowReportText(true);
    }}
  >
    📄 Export Report
  </button>
</div>
        </div>

        {!selectedProject ? (
          <div className="report-section" style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ fontSize: "18px", color: "#666" }}>Please select a project to view analytics</p>
          </div>
        ) : loading ? (
          <div className="report-section" style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ fontSize: "18px", color: "#666" }}>Loading analytics...</p>
          </div>
        ) : (
          <>
            {/* Overview Cards */}
            <div className="overview-section">
              <div className="overview-card testcases-card">
                <div className="card-icon">TC</div>
                <div className="card-info">
                  <h3>{testcaseStats?.total_testcases || 0}</h3>
                  <p>Test Cases</p>
                </div>
              </div>

              <div className="overview-card executions-card">
                <div className="card-icon">EX</div>
                <div className="card-info">
                  <h3>{executionStats?.total_executions || 0}</h3>
                  <p>Executions</p>
                </div>
              </div>

              <div className="overview-card bugs-card">
                <div className="card-icon">BG</div>
                <div className="card-info">
                  <h3>{bugStats?.total_bugs || 0}</h3>
                  <p>Total Bugs</p>
                </div>
              </div>

              <div className="overview-card pass-box">
                <div className="card-icon">PR</div>
                <div className="card-info">
                  <h3>{(executionStats?.pass_percentage || 0).toFixed(1)}%</h3>
                  <p>Pass Rate</p>
                </div>
              </div>
            </div>

            {/* Test Execution Analysis with Chart */}
            <div className="report-section">
              <h2>Test Execution Analysis</h2>
              <div className="chart-container-wrapper">
                <div className="chart-container">
                  <Pie data={executionChartData} options={chartOptions} />
                </div>
                <div className="stats-summary">
                  <div className="stat-item">
                    <span className="stat-label">Passed:</span>
                    <span className="stat-number">{executionStats?.pass_count || 0}</span>
                    <span className="stat-percent">({(executionStats?.pass_percentage || 0).toFixed(1)}%)</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Failed:</span>
                    <span className="stat-number">{executionStats?.fail_count || 0}</span>
                    <span className="stat-percent">
                      ({executionStats?.total_executions > 0 
                        ? (((executionStats.fail_count) / executionStats.total_executions) * 100).toFixed(1) 
                        : 0}%)
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Pending:</span>
                    <span className="stat-number">{executionStats?.pending_count || 0}</span>
                    <span className="stat-percent">
                      ({executionStats?.total_executions > 0 
                        ? ((executionStats.pending_count / executionStats.total_executions) * 100).toFixed(1) 
                        : 0}%)
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Avg Duration:</span>
                    <span className="stat-number">{(executionStats?.avg_duration_minutes || 0).toFixed(1)}</span>
                    <span className="stat-percent">minutes</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bug Analysis with Charts */}
            <div className="report-section">
              <h2>Bug Analysis</h2>
              <div className="charts-row">
                <div className="chart-box">
                  <h3>By Status</h3>
                  <div className="chart-container">
                    <Bar data={bugStatusChartData} options={barChartOptions} />
                  </div>
                </div>
                <div className="chart-box">
                  <h3>By Severity</h3>
                  <div className="chart-container">
                    <Bar data={bugSeverityChartData} options={barChartOptions} />
                  </div>
                </div>
              </div>
            </div>

            {/* Test Case Distribution with Chart */}
            <div className="report-section">
              <h2>Test Case Distribution</h2>
              <div className="chart-container-wrapper">
                <div className="chart-container">
                  <Doughnut data={testcaseChartData} options={chartOptions} />
                </div>
                <div className="stats-summary">
                  <div className="stat-item">
                    <span className="stat-label">Draft:</span>
                    <span className="stat-number">{testcaseStats?.draft_count || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Ready:</span>
                    <span className="stat-number">{testcaseStats?.ready_count || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Executing:</span>
                    <span className="stat-number">{testcaseStats?.executing_count || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Deprecated:</span>
                    <span className="stat-number">{testcaseStats?.deprecated_count || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      {showReportText && (
        <div className="report-text-modal" style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ width: '90%', maxWidth: 900, background: '#fff', padding: 20, borderRadius: 8 }}>
            <h3>Report Text</h3>
            <textarea readOnly value={reportText} style={{ width: '100%', height: 280, padding: 8, fontFamily: 'monospace', fontSize: 13 }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
              <label style={{ whiteSpace: 'nowrap' }}>Recipient email (optional):</label>
              <input
                type="email"
                placeholder="developer@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                style={{ flex: 1, padding: '6px 8px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
              <button onClick={copyReportText}>Copy to Clipboard</button>
              <button onClick={sendReportToBackend}>Send to Developer</button>
              <button onClick={emailReportText}>Open Mail Client</button>
              <button onClick={() => setShowReportText(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;