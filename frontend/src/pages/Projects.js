import { useEffect, useState } from "react";
import api from "../services/api";
import Navbar from "../components/Navbar";
import "./Projects.css";

function Projects() {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showForm, setShowForm] = useState(false);
  const role = localStorage.getItem("role");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get("/projects");
      setProjects(res.data);
    } catch (err) {
      setMessage({ text: "Failed to fetch projects", type: "error" });
    }
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
    <div className="projects-container">
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

        <div className="projects-list-section">
          <h2>📋 All Projects ({projects.length})</h2>
          {projects.length === 0 ? (
            <div className="no-projects">
              <p>No projects found</p>
              {role === "admin" && <p className="hint">Create your first project to get started!</p>}
            </div>
          ) : (
            <div className="projects-grid">
              {projects.map(project => (
                <div key={project.id} className="project-card">
                  <div className="project-header">
                    <h3>{project.name}</h3>
                    <span className="project-id">ID: {project.id}</span>
                  </div>
                  {project.description && (
                    <p className="project-description">{project.description}</p>
                  )}
                  <div className="project-footer">
                    <span className="project-badge">Active</span>
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
