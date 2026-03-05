import React, { useState, useEffect } from "react";
import api from "../services/api";
import "./BugFormModal.css";

function BugFormModal({ isOpen, onClose, onSuccess, testcaseId, projectId }) {
  const [localProjects, setLocalProjects] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    severity: "medium",
    steps_to_reproduce: "",
    expected_behavior: "",
    actual_behavior: "",
    environment_affected: "",
    version: "",
    testcase_id: testcaseId || "",
    project_id: projectId || "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch projects when modal opens
  useEffect(() => {
    if (isOpen) {
      api.get("/projects")
        .then(res => {
          setLocalProjects(res.data.projects || []);
        })
        .catch(err => {
          console.error("Failed to fetch projects:", err);
          setLocalProjects([]);
        });
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!formData.title.trim()) {
      setError("Bug title is required");
      return;
    }

    setLoading(true);

    api
      .post("/bugs", formData)
      .then(() => {
        onSuccess();
        setFormData({
          title: "",
          description: "",
          severity: "medium",
          steps_to_reproduce: "",
          expected_behavior: "",
          actual_behavior: "",
          environment_affected: "",
          version: "",
          testcase_id: testcaseId || "",
          project_id: projectId || "",
        });
      })
      .catch((err) => {
        console.error("Bug creation error:", err);
        setError("Failed to create bug report");
      })
      .finally(() => setLoading(false));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🐛 Report Bug</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="bug-form">
          <div className="form-section">
            <h3>Bug Details</h3>

            <div className="form-group">
              <label>Bug Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Brief description of the bug"
                className="input-field"
              />
            </div>

            <div className="form-group">
              <label>Project</label>
              <select
                name="project_id"
                value={formData.project_id}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">No Project</option>
                {localProjects && localProjects.length > 0 ? (
                  localProjects.map(p => (
                    <option key={p.id} value={String(p.id)}>{p.name}</option>
                  ))
                ) : (
                  <option disabled>Loading projects...</option>
                )}
              </select>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Detailed description of the bug"
                className="input-field"
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Severity</label>
                <select
                  name="severity"
                  value={formData.severity}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="trivial">Trivial</option>
                  <option value="minor">Minor</option>
                  <option value="major">Major</option>
                  <option value="critical">Critical</option>
                  <option value="blocker">Blocker</option>
                </select>
              </div>
              <div className="form-group">
                <label>Version</label>
                <input
                  type="text"
                  name="version"
                  value={formData.version}
                  onChange={handleChange}
                  placeholder="e.g., v2.4.1"
                  className="input-field"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Reproduction Information</h3>

            <div className="form-group">
              <label>Steps to Reproduce</label>
              <textarea
                name="steps_to_reproduce"
                value={formData.steps_to_reproduce}
                onChange={handleChange}
                placeholder="1. Do this&#10;2. Then do that&#10;3. Observe the bug"
                className="input-field"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Expected Behavior</label>
              <textarea
                name="expected_behavior"
                value={formData.expected_behavior}
                onChange={handleChange}
                placeholder="What should happen"
                className="input-field"
                rows="2"
              />
            </div>

            <div className="form-group">
              <label>Actual Behavior</label>
              <textarea
                name="actual_behavior"
                value={formData.actual_behavior}
                onChange={handleChange}
                placeholder="What actually happens"
                className="input-field"
                rows="2"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Environment</h3>

            <div className="form-group">
              <label>Environment Affected</label>
              <input
                type="text"
                name="environment_affected"
                value={formData.environment_affected}
                onChange={handleChange}
                placeholder="e.g., Chrome 120.0, Windows 11, Production"
                className="input-field"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Creating..." : "Report Bug"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BugFormModal;
