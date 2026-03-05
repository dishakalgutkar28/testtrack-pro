import { useState, useEffect } from "react";
import api from "../services/api";
import Navbar from "../components/Navbar";
import { useTheme } from "../context/ThemeContext";
import BugFormModal from "../components/BugFormModal";
import StepExecutor from "../components/StepExecutor";
import ExecutionComparison from "../components/ExecutionComparison";
import "./Execute.css";

function Execute() {
  const [testcaseId, setTestcaseId] = useState("");
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [isBugFormOpen, setIsBugFormOpen] = useState(false);
  const [executionMode, setExecutionMode] = useState("basic"); // basic, steps, comparison
  const { theme } = useTheme();

  const submit = () => {
    setError("");
    setSuccess("");

    if (!testcaseId.trim() || !status.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    api.post("/execution", { 
      testcase_id: testcaseId, 
      status,
      notes,
      project_id: projectId
    })
      .then(() => {
        setSuccess("Execution saved successfully!");
        setTestcaseId("");
        setStatus("");
        setNotes("");
        setTimeout(() => setSuccess(""), 3000);
      })
      .catch(() => {
        setError("Failed to save execution. Please try again.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/projects').then(r=>setProjects(r.data.projects || [])).catch(()=>{});
  }, []);

  return (
    <div className={`execute-container ${theme}`}>
      <Navbar />
      <div className="execute-content">
        <h1>Execute Testcase</h1>
        <p className="subtitle">Record test case execution with advanced tracking options</p>

        {/* Execution Mode Tabs */}
        <div className="execution-tabs">
          <button
            className={`tab-button ${executionMode === "basic" ? "active" : ""}`}
            onClick={() => setExecutionMode("basic")}
          >
            📝 Basic Execution
          </button>
          <button
            className={`tab-button ${executionMode === "steps" ? "active" : ""}`}
            onClick={() => setExecutionMode("steps")}
          >
            📍 Step-by-Step
          </button>
          <button
            className={`tab-button ${executionMode === "comparison" ? "active" : ""}`}
            onClick={() => setExecutionMode("comparison")}
          >
            📊 Compare Runs
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* Basic Execution Mode */}
        {executionMode === "basic" && (
          <div className="execute-form-card">
            <div className="form-group">
              <label>Testcase ID *</label>
              <input 
                className="input-field"
                type="text"
                placeholder="Enter testcase ID" 
                value={testcaseId}
                onChange={e => setTestcaseId(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Execution Status *</label>
              <select 
                className="input-field select-field"
                value={status}
                onChange={e => setStatus(e.target.value)}
              >
                <option value="">Select Status</option>
                <option value="pass">Pass</option>
                <option value="fail">Fail</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div className="form-group">
              <label>Notes (Optional)</label>
              <textarea 
                className="input-field textarea"
                placeholder="Add any notes or observations"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows="4"
              />
            </div>

            <div className="form-group">
              <label>Project (optional)</label>
              <select className="input-field" value={projectId} onChange={e=>setProjectId(e.target.value)}>
                <option value="">Select project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <button 
              className="submit-btn" 
              onClick={submit}
              disabled={loading}
            >
              {loading ? "Saving..." : "Submit Execution"}
            </button>

            {status === "fail" && (
              <button 
                className="submit-btn" 
                onClick={() => setIsBugFormOpen(true)}
                style={{ background: "#d32f2f", marginLeft: "12px" }}
              >
                🐛 Fail & Report Bug
              </button>
            )}
          </div>
        )}

        {/* Step-by-Step Execution Mode */}
        {executionMode === "steps" && (
          <div className="step-execution-section">
            <div className="step-input-group">
              <input
                className="input-field"
                type="text"
                placeholder="Enter testcase ID to start step-by-step execution"
                value={testcaseId}
                onChange={e => setTestcaseId(e.target.value)}
              />
            </div>
            {testcaseId && testcaseId.trim().length >= 1 && <StepExecutor testcaseId={testcaseId} onExecutionComplete={(result) => {
              setSuccess(`Execution completed! Status: ${result.status}, Duration: ${result.duration}s`);
              setTimeout(() => setSuccess(""), 3000);
            }} />}
          </div>
        )}

        {/* Comparison Mode */}
        {executionMode === "comparison" && (
          <div className="comparison-section">
            <div className="step-input-group">
              <input
                className="input-field"
                type="text"
                placeholder="Enter testcase ID to compare previous executions"
                value={testcaseId}
                onChange={e => setTestcaseId(e.target.value)}
              />
            </div>
            {testcaseId && testcaseId.trim().length >= 2 && <ExecutionComparison testcaseId={testcaseId} />}
          </div>
        )}
      </div>

      {/* Bug Form Modal - for quick bug creation on test failure */}
      <BugFormModal 
        isOpen={isBugFormOpen}
        onClose={() => setIsBugFormOpen(false)}
        onSuccess={() => {
          setIsBugFormOpen(false);
          setSuccess("Bug reported! Test execution marked as failed.");
          setTimeout(() => setSuccess(""), 3000);
        }}
        testcaseId={testcaseId}
        projectId={projectId}
      />
    </div>
  );
}

export default Execute;
