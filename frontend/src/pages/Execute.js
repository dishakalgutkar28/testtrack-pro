import { useState, useEffect } from "react";
import api from "../services/api";
import Navbar from "../components/Navbar";
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
    api.get('/api/projects').then(r=>setProjects(r.data)).catch(()=>{});
  }, []);

  return (
    <div className="execute-container">
      <Navbar />
      <div className="execute-content">
        <h1>Execute Testcase</h1>
        <p className="subtitle">Record the execution result of a testcase</p>

        <div className="execute-form-card">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

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
        </div>
      </div>
    </div>
  );
}

export default Execute;
