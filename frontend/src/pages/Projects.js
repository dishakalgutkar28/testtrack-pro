import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import { useTheme } from "../context/ThemeContext";
import "./Projects.css";

function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showForm, setShowForm] = useState(false);
  const role = localStorage.getItem("role");
  const { theme } = useTheme();
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterByTestCases, setFilterByTestCases] = useState("all"); // all, hasTests, noTests
  const [sortBy, setSortBy] = useState("testcases"); // testcases, name

  useEffect(() => {
    fetchProjects();
  }, []);

  // Apply filters whenever projects or filter state changes
  useEffect(() => {
    applyFilters();
  }, [projects, searchTerm, filterByTestCases, sortBy]);

  const fetchProjects = async () => {
    try {
      const res = await api.get("/projects/with-stats");
      setProjects(res.data);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setMessage({ text: "Failed to fetch projects", type: "error" });
    }
  };

  const applyFilters = () => {
    let filtered = [...projects];

    // Filter by test case presence
    if (filterByTestCases === "hasTests") {
      filtered = filtered.filter(p => p.testcase_count > 0);
    } else if (filterByTestCases === "noTests") {
      filtered = filtered.filter(p => p.testcase_count === 0);
    }

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term) || 
        (p.description && p.description.toLowerCase().includes(term))
      );
    }

    // Sort
    if (sortBy === "testcases") {
      filtered.sort((a, b) => b.testcase_count - a.testcase_count);
    } else if (sortBy === "name") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    setFilteredProjects(filtered);
  };

  const createProject = async () => {
    if (!name) {
      setMessage({ text: "Project name is required", type: "error" });
      return;
    }

    try {
      await api.post("/projects", { name, description });
      setMessage({ text: "Project created successfully!", type: "success" });
      setName("");
      setDescription("");
      setShowForm(false);
      fetchProjects();
    } catch (err) {
      setMessage({ 
        text: err.response?.data?.error || "Failed to create project", 
        type: "error" 
      });
    }
  };

  return (
    <div className={`projects-container ${theme}`}>
      <Navbar />
      <div className="projects-page">
        <h1>📁 Project Management</h1>
        <p className="subtitle">Organize your test cases and bugs by projects</p>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        {role === "admin" && (
          <div className="create-project-section">
            <button className="create-btn" onClick={() => setShowForm(!showForm)}>
              {showForm ? "Cancel" : "+ Create New Project"}
            </button>

            {showForm && (
              <div className="create-form">
                <h2>Create New Project</h2>

                <div className="form-group">
                  <label>Project Name *</label>
                  <input
                    className="input-field"
                    type="text"
                    placeholder="Enter project name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    className="input-field textarea-field"
                    placeholder="Enter project description (optional)"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows="4"
                  />
                </div>

                <button 
                  className="submit-btn" 
                  onClick={createProject}
                >
                  Create Project
                </button>
              </div>
            )}
          </div>
        )}

        {/* Filter and Search Section */}
        <div className="filter-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Search projects by name or description..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-controls">
            <div className="filter-group">
              <label>Filter by Test Cases:</label>
              <select 
                value={filterByTestCases} 
                onChange={e => setFilterByTestCases(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Projects ({projects.length})</option>
                <option value="hasTests">Has Test Cases ({projects.filter(p => p.testcase_count > 0).length})</option>
                <option value="noTests">No Test Cases ({projects.filter(p => p.testcase_count === 0).length})</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Sort by:</label>
              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="testcases">Test Cases Count (High to Low)</option>
                <option value="name">Project Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="projects-list-section">
          <h2>📋 Projects ({filteredProjects.length})</h2>
          {filteredProjects.length === 0 ? (
            <div className="no-projects">
              <p>No projects found</p>
              {role === "admin" && <p className="hint">Create your first project to get started!</p>}
            </div>
          ) : (
            <div className="projects-grid">
              {filteredProjects.map(project => (
                <div 
                  key={project.id} 
                  className="project-card"
                  onClick={() => navigate(`/projects/${project.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="project-header">
                    <h3>{project.name}</h3>
                    <span className="project-id">ID: {project.id}</span>
                  </div>
                  {project.description && (
                    <p className="project-description">{project.description}</p>
                  )}
                  
                  {/* Test Case Statistics */}
                  <div className="project-stats">
                    <div className="stat-item">
                      <span className="stat-label">📋 Test Cases</span>
                      <span className="stat-value">{project.testcase_count}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">🐛 Bugs</span>
                      <span className="stat-value">{project.bug_count}</span>
                    </div>
                  </div>

                  {/* Quick Status View - Priority Breakdown */}
                  {project.testcase_count > 0 && (
                    <div className="testcase-status">
                      {project.high_priority_count > 0 && <span className="status-badge high">🔴 High: {project.high_priority_count}</span>}
                      {project.medium_priority_count > 0 && <span className="status-badge medium">🟡 Medium: {project.medium_priority_count}</span>}
                      {project.low_priority_count > 0 && <span className="status-badge low">🟢 Low: {project.low_priority_count}</span>}
                    </div>
                  )}

                  {/* Execution Summary */}
                  {project.execution_count > 0 && (
                    <div className="execution-summary">
                      <span className="execution-badge pass">✅ Passed: {project.passed_executions}</span>
                      <span className="execution-badge fail">❌ Failed: {project.failed_executions}</span>
                    </div>
                  )}

                  <div className="project-footer">
                    <span className="project-badge">Active</span>
                    <span className="view-details">Click to view →</span>
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

export default Projects;
