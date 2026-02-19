import { useEffect, useState } from "react";
import api from "../services/api";
import Navbar from "../components/Navbar";
import "./Testcase.css";

function Testcase() {
  const [testcases, setTestcases] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expectedResult, setExpectedResult] = useState("");
  const [priority, setPriority] = useState("medium");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const role = localStorage.getItem("role");

  useEffect(() => {
    fetchTestcases();
    api.get('/api/projects').then(r => setProjects(r.data)).catch(()=>{});
  }, []);

  const fetchTestcases = () => {
    api.get("/testcase")
      .then(res => {
        console.log("Testcases:", res.data);
        setTestcases(res.data || []);
      })
      .catch(err => {
        console.log("Error fetching testcases:", err);
        setError("Failed to load testcases");
      });
  };

  const addTestcase = () => {
    setError("");
    setSuccess("");

    if (!title.trim() || !description.trim() || !expectedResult.trim()) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    api.post("/testcase", { title, description, expected_result: expectedResult, projectId, priority })
      .then(() => {
        setSuccess("Testcase added successfully!");
        setTitle("");
        setDescription("");
        setExpectedResult("");
        setPriority("medium");
        fetchTestcases();
        setTimeout(() => setSuccess(""), 3000);
      })
      .catch(() => {
        setError("Failed to add testcase. Please try again.");
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="testcase-container">
      <Navbar />
      <div className="testcase-content">
        <h1>Test Cases</h1>
        <p className="subtitle">
          {role === "developer" 
            ? "View test cases to understand testing requirements" 
            : "Manage and create test cases for your projects"}
        </p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className={`testcase-layout ${role === "developer" ? "full-width" : ""}`}>
          {/* Only show form to testers and admins */}
          {(role === "tester" || role === "admin") && (
            <div className="add-form-section">
              <div className="form-card">
                <h2>Add New Testcase</h2>

              <div className="form-group">
                <label>Title *</label>
                <input 
                  className="input-field"
                  placeholder="Enter test case title" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Project (optional)</label>
                <select className="input-field" value={projectId} onChange={e=>setProjectId(e.target.value)}>
                  <option value="">Select project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea 
                  className="input-field textarea"
                  placeholder="Describe the test case" 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>Expected Result *</label>
                <textarea 
                  className="input-field textarea"
                  placeholder="Enter expected result" 
                  value={expectedResult}
                  onChange={e => setExpectedResult(e.target.value)}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Priority *</label>
                <select 
                  className="input-field"
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <button 
                className="submit-btn" 
                onClick={addTestcase}
                disabled={loading}
              >
                {loading ? "Adding..." : "Add Testcase"}
              </button>
            </div>
          </div>
          )}

          <div className="list-section">
            <div className="list-card">
              {role === "developer" && (
                <div className="info-banner">
                  ℹ️ You are viewing test cases as a <strong>Developer</strong>. Only Testers can create test cases.
                </div>
              )}
              <h2>Existing Testcases ({testcases.length})</h2>
              
              {testcases.length === 0 ? (
                <p className="no-data">No testcases yet. Create one to get started!</p>
              ) : (
                <div className="testcase-list">
                  {testcases.map(tc => (
                    <div key={tc.id} className="testcase-item">
                      <div className="testcase-header">
                        <h3>{tc.title}</h3>
                        <div className="testcase-meta">
                          <span className={`priority-badge priority-${tc.priority || 'medium'}`}>
                            {(tc.priority || 'medium').toUpperCase()}
                          </span>
                          <span className="testcase-id">ID: {tc.id}</span>
                        </div>
                      </div>
                      <p className="testcase-description">{tc.description}</p>
                      <p className="testcase-expected"><strong>Expected:</strong> {tc.expected_result}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Testcase;
