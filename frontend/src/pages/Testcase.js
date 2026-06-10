import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import { useTheme } from "../context/ThemeContext";
import TestCaseFormModal from "../components/TestCaseFormModal";
import CSVImport from "../components/CSVImport";
import BulkUpdate from "../components/BulkUpdate";
import VersionHistory from "../components/VersionHistory";
import LifecycleState from "../components/LifecycleState";
import ReopenTestcase from "../components/ReopenTestcase";
import EnhancedComments from "../components/EnhancedComments";
import Attachments from "../components/Attachments";
import CommitLinker from "../components/CommitLinker";
import "./Testcase.css";

function Testcase() {
  const { id } = useParams();
  const [testcases, setTestcases] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTestcase, setEditingTestcase] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [selectedTestcases, setSelectedTestcases] = useState([]);
  const [historyTestcase, setHistoryTestcase] = useState(null);
  const [detailTestcase, setDetailTestcase] = useState(null);
  const { theme } = useTheme();
  const role = localStorage.getItem("role");

  useEffect(() => {
    fetchTestcases();
    fetchProjects();
  }, []);

  // Auto-open test case detail if ID in URL
  useEffect(() => {
    if (id && testcases.length > 0) {
      const testcase = testcases.find(tc => tc.id === parseInt(id));
      if (testcase) {
        setDetailTestcase(testcase);
      }
    }
  }, [id, testcases]);

  const fetchProjects = () => {
    api.get('/projects')
      .then(r => {
        // Normalize response which may be { projects: [...] } or an array
        let list = [];
        if (Array.isArray(r.data)) list = r.data;
        else if (Array.isArray(r.data?.projects)) list = r.data.projects;
        else if (Array.isArray(r.data?.results)) list = r.data.results;

        setProjects(list);
        if (!selectedProjectId && list.length > 0) {
          setSelectedProjectId(list[0].id);
        }
      })
      .catch(() => console.log("Failed to load projects"));
  };

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

  const handleFormSuccess = () => {
    setSuccess(editingTestcase ? "Test case updated successfully!" : "Test case created successfully!");
    setIsFormOpen(false);
    setEditingTestcase(null);
    fetchTestcases();
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleEdit = (testcase) => {
    setEditingTestcase(testcase);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTestcase(null);
  };

  const handleClone = async (testcaseId) => {
    if (!window.confirm('Clone this test case?')) return;

    try {
      await api.post(`/testcase/${testcaseId}/clone`);
      setSuccess("Test case cloned successfully!");
      fetchTestcases();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error('Clone error:', error);
      setError(error.response?.data?.error || 'Failed to clone test case');
      setTimeout(() => setError(""), 3000);
    }
  };

  const toggleTestcaseSelection = (id) => {
    setSelectedTestcases(prev => 
      prev.includes(id) 
        ? prev.filter(tcId => tcId !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedTestcases.length === testcases.length) {
      setSelectedTestcases([]);
    } else {
      setSelectedTestcases(testcases.map(tc => tc.id));
    }
  };

  const handleBulkUpdateComplete = () => {
    setSelectedTestcases([]);
    fetchTestcases();
  };

  const showHistory = (testcase) => {
    setHistoryTestcase(testcase);
  };

  return (
    <div className={`testcase-container ${theme}`}>
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

        {/* Button to open form modal */}
        {(role === "tester" || role === "admin") && (
          <div className="action-buttons">
            <button 
              className="submit-btn" 
              onClick={() => {
                fetchProjects();
                setIsFormOpen(true);
              }}
            >
              <span className="btn-icon">+</span>
              Create New Test Case
            </button>
            
            <button 
              className="btn-csv-import"
              onClick={() => setShowCSVImport(!showCSVImport)}
            >
              <span className="btn-icon">{showCSVImport ? '×' : '↓'}</span>
              {showCSVImport ? 'Hide Import' : 'Import/Export CSV'}
            </button>

            {selectedTestcases.length > 0 && (
              <BulkUpdate 
                selectedIds={selectedTestcases}
                onUpdateComplete={handleBulkUpdateComplete}
              />
            )}
          </div>
        )}

        {/* CSV Import Section */}
        {showCSVImport && (role === "tester" || role === "admin") && (
          <>
            <div className="csv-project-select" style={{marginBottom: '12px'}}>
              <label style={{marginRight: '8px'}}>Project:</label>
              <select value={selectedProjectId || ''} onChange={(e) => setSelectedProjectId(e.target.value)}>
                <option value="">-- No project --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name || p.title || p.id}</option>
                ))}
              </select>
            </div>

            <CSVImport 
              projectId={selectedProjectId}
              onImportComplete={fetchTestcases}
            />
          </>
        )}

        <div className={`testcase-layout ${role === "developer" ? "full-width" : ""}`}>

          <div className="list-section">
            <div className="testcase-stats">
  <div className="stat-card">
    <h3>{testcases.length}</h3>
    <p>Total Cases</p>
  </div>

  <div className="stat-card">
    <h3>
      {testcases.filter(t=>t.priority==="high").length}
    </h3>
    <p>High Priority</p>
  </div>

  <div className="stat-card">
    <h3>
      {testcases.filter(t=>t.priority==="medium").length}
    </h3>
    <p>Medium</p>
  </div>

  <div className="stat-card">
    <h3>
      {testcases.filter(t=>t.priority==="low").length}
    </h3>
    <p>Low</p>
  </div>
</div>
            <div className="list-card">
              {role === "developer" && (
                <div className="info-banner">
                  <span className="info-icon">i</span>
                  You are viewing test cases as a <strong>Developer</strong>. Only Testers can create test cases.
                </div>
              )}
              
              <div className="list-header">
                <h2>Existing Testcases ({testcases.length})</h2>
                {(role === "tester" || role === "admin") && testcases.length > 0 && (
                  <label className="select-all-checkbox">
                    <input 
                      type="checkbox"
                      checked={selectedTestcases.length === testcases.length && testcases.length > 0}
                      onChange={toggleSelectAll}
                    />
                    Select All
                  </label>
                )}
              </div>
              
              {testcases.length === 0 ? (
                <p className="no-data">No testcases yet. Create one to get started!</p>
              ) : (
                <div className="testcase-list">
                  {testcases.map(tc => (
                    <div key={tc.id} className={`testcase-item ${selectedTestcases.includes(tc.id) ? 'selected' : ''}`}>
                      <div className="testcase-header">
                        {(role === "tester" || role === "admin") && (
                          <input 
                            type="checkbox"
                            checked={selectedTestcases.includes(tc.id)}
                            onChange={() => toggleTestcaseSelection(tc.id)}
                            className="testcase-checkbox"
                          />
                        )}
                        <div className="testcase-title-section">
                          <h3>{tc.title}</h3>
                          <div className="testcase-meta">
                            <span className={`priority-badge priority-${tc.priority || 'medium'}`}>
                              {(tc.priority || 'medium').toUpperCase()}
                            </span>
                            <span className="testcase-id">TC-{tc.id}</span>
                            {tc.version && tc.version > 1 && (
                              <span className="version-badge">v{tc.version}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="testcase-description">{tc.description}</p>
                      <p className="testcase-expected"><strong>Expected:</strong> {tc.expected_result}</p>
                      
                      <div className="testcase-actions">
                        <button 
                          className="btn-details"
                          onClick={() => setDetailTestcase(tc)}
                          title="View detailed test case"
                        >
                          👁️ View Details
                        </button>
                        {(role === "tester" || role === "admin") && (
                          <>
                            <button 
                              className="btn-edit"
                              onClick={() => handleEdit(tc)}
                              title="Edit this test case"
                            >
                              ✏️ Edit
                            </button>
                            <button 
                              className="btn-clone"
                              onClick={() => handleClone(tc.id)}
                              title="Clone this test case"
                            >
                              📋 Clone
                            </button>
                            <button 
                              className="btn-history"
                              onClick={() => showHistory(tc)}
                              title="View version history"
                            >
                              📜 History
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Test Case Form Modal */}
      <TestCaseFormModal 
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSuccess={handleFormSuccess}
        editingTestcase={editingTestcase}
        projects={projects}
      />

      {/* Version History Modal */}
      {historyTestcase && (
        <VersionHistory 
          testcaseId={historyTestcase.id}
          testcaseTitle={historyTestcase.title}
          onClose={() => setHistoryTestcase(null)}
        />
      )}

      {/* Test Case Detail Modal with Advanced Features */}
      {detailTestcase && (
        <div className="modal-overlay" onClick={() => setDetailTestcase(null)}>
          <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="detail-header">
              <h2>{detailTestcase.title}</h2>
              <button className="close-btn" onClick={() => setDetailTestcase(null)}>✕</button>
            </div>
            
            <div className="detail-content">
              <div className="detail-section">
                <h3>📋 Test Case Information</h3>
                <p><strong>ID:</strong> {detailTestcase.id}</p>
                <p><strong>Description:</strong> {detailTestcase.description}</p>
                <p><strong>Priority:</strong> <span className={`priority-badge priority-${detailTestcase.priority || 'medium'}`}>{(detailTestcase.priority || 'medium').toUpperCase()}</span></p>
                <p><strong>Expected Result:</strong> {detailTestcase.expected_result}</p>
              </div>

              <hr className="detail-divider" />

              {/* LIFECYCLE STATE */}
              <div className="detail-section advanced-feature">
                <h3>📊 Lifecycle State</h3>
                <LifecycleState 
                  testcaseId={detailTestcase.id}
                  onStateChange={() => {
                    fetchTestcases();
                  }}
                />
              </div>

              <hr className="detail-divider" />

              {/* REOPEN LOGIC */}
              {detailTestcase.lifecycle_state === "Closed" && (
                <>
                  <div className="detail-section advanced-feature">
                    <h3>🔓 Reopen Test Case</h3>
                    <ReopenTestcase
                      testcaseId={detailTestcase.id}
                      currentState={detailTestcase.lifecycle_state}
                      reopenCount={detailTestcase.reopen_count || 0}
                      onReopen={() => {
                        setDetailTestcase(null);
                        fetchTestcases();
                      }}
                    />
                  </div>
                  <hr className="detail-divider" />
                </>
              )}

              {/* COMMIT LINKING */}
              <div className="detail-section advanced-feature">
                <h3>🔗 Linked Commits</h3>
                <CommitLinker testcaseId={detailTestcase.id} />
              </div>

              <hr className="detail-divider" />

              <div className="detail-section advanced-feature">
                <h3>Attachments</h3>
                <Attachments entityType="testcase" entityId={detailTestcase.id} />
              </div>

              <hr className="detail-divider" />

              {/* ENHANCED COMMENTS */}
              <div className="detail-section advanced-feature">
                <h3>💬 Discussion & Comments</h3>
                <EnhancedComments testcaseId={detailTestcase.id} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Testcase;
