import React, { useState, useEffect } from "react";
import api from "../services/api";
import "./TestCaseFormModal.css";

function TestCaseFormModal({ isOpen, onClose, onSuccess, projectId, projects = [], editingTestcase = null }) {
  const [localProjects, setLocalProjects] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    expected_result: "",
    priority: "medium",
    lifecycle_state: "Draft",
    projectId: projectId || "",
    preconditions: "",
    postconditions: "",
    environmentRequirements: "",
    estimatedDuration: "",
    automationStatus: "Not Automated",
    automationScriptLink: "",
    tags: "",
  });

  const [testSteps, setTestSteps] = useState([
    { step_number: 1, action: "", testData: "", expectedResult: "", notes: "" },
  ]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Use projects from props or fetch locally
  useEffect(() => {
    if (projects && projects.length > 0) {
      setLocalProjects(projects);
    } else if (isOpen) {
      api.get("/projects")
        .then(res => {
          console.log("Projects fetched:", res.data);
          setLocalProjects(res.data.projects || []);
        })
        .catch(err => {
          console.error("Failed to fetch projects:", err);
          setLocalProjects([]);
        });
    }
  }, [isOpen, projects]);

  // Populate form when editing
  useEffect(() => {
    if (editingTestcase && isOpen) {
      setFormData({
        title: editingTestcase.title || "",
        description: editingTestcase.description || "",
        expected_result: editingTestcase.expected_result || "",
        priority: editingTestcase.priority || "medium",
        lifecycle_state: editingTestcase.lifecycle_state || "Draft",
        projectId: editingTestcase.project_id ? String(editingTestcase.project_id) : "",
        preconditions: editingTestcase.preconditions || "",
        postconditions: editingTestcase.postconditions || "",
        environmentRequirements: editingTestcase.environment_requirements || "",
        estimatedDuration: editingTestcase.estimated_duration || "",
        automationStatus: editingTestcase.automation_status || "Not Automated",
        automationScriptLink: editingTestcase.automation_script_link || "",
        tags: editingTestcase.tags ? (Array.isArray(editingTestcase.tags) ? editingTestcase.tags.join(", ") : editingTestcase.tags) : "",
      });

      // Parse test steps if they exist
      if (editingTestcase.test_steps) {
        try {
          const steps = typeof editingTestcase.test_steps === 'string' 
            ? JSON.parse(editingTestcase.test_steps)
            : editingTestcase.test_steps;
          setTestSteps(Array.isArray(steps) ? steps : [
            { step_number: 1, action: "", testData: "", expectedResult: "", notes: "" }
          ]);
        } catch (e) {
          setTestSteps([
            { step_number: 1, action: "", testData: "", expectedResult: "", notes: "" }
          ]);
        }
      }
    } else if (!editingTestcase && isOpen) {
      // Reset form when creating new
      setFormData({
        title: "",
        description: "",
        expected_result: "",
        priority: "medium",
        lifecycle_state: "Draft",
        projectId: projectId || "",
        preconditions: "",
        postconditions: "",
        environmentRequirements: "",
        estimatedDuration: "",
        automationStatus: "Not Automated",
        automationScriptLink: "",
        tags: "",
      });
      setTestSteps([
        { step_number: 1, action: "", testData: "", expectedResult: "", notes: "" }
      ]);
    }
  }, [editingTestcase, isOpen, projectId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStepChange = (index, field, value) => {
    const newSteps = [...testSteps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setTestSteps(newSteps);
  };

  const addStep = () => {
    setTestSteps((prev) => [
      ...prev,
      {
        step_number: prev.length + 1,
        action: "",
        testData: "",
        expectedResult: "",
        notes: "",
      },
    ]);
  };

  const removeStep = (index) => {
    if (testSteps.length > 1) {
      setTestSteps((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!formData.title.trim() || !formData.description.trim() || !formData.expected_result.trim()) {
      setError("Title, Description, and Expected Result are required");
      return;
    }

    setLoading(true);

    const payload = {
      ...formData,
      projectId: formData.projectId || null,
      testSteps: testSteps,
      tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()) : [],
    };

    const apiCall = editingTestcase
      ? api.put(`/testcase/${editingTestcase.id}`, payload)
      : api.post("/testcase", payload);

    apiCall
      .then(() => {
        onSuccess();
        if (!editingTestcase) {
          // Only reset form if creating new, not when editing
          setFormData({
            title: "",
            description: "",
            expected_result: "",
            priority: "medium",
            lifecycle_state: "Draft",
            projectId: "",
            preconditions: "",
            postconditions: "",
            environmentRequirements: "",
            estimatedDuration: "",
            automationStatus: "Not Automated",
            automationScriptLink: "",
            tags: "",
          });
          setTestSteps([
            { step_number: 1, action: "", testData: "", expectedResult: "", notes: "" },
          ]);
        }
      })
      .catch((err) => {
        setError(editingTestcase ? "Failed to update test case" : "Failed to create test case");
        console.error("Submit error:", err);
      })
      .finally(() => setLoading(false));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingTestcase ? "✏️ Edit Test Case" : "📋 Create New Test Case"}</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="test-case-form">
          <div className="form-section">
            <h3>Basic Information</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter test case title"
                  className="input-field"
                />
              </div>
              <div className="form-group">
                <label>Project</label>
                <select
                  name="projectId"
                  value={String(formData.projectId)}
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
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Priority</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="form-group">
                <label>Lifecycle State</label>
                <select
                  name="lifecycle_state"
                  value={formData.lifecycle_state}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="Draft">Draft</option>
                  <option value="Ready">Ready</option>
                  <option value="In Execution">In Execution</option>
                  <option value="Completed">Completed</option>
                  <option value="Closed">Closed</option>
                  <option value="Reopened">Reopened</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Detailed description of what is being tested"
                className="input-field"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Expected Result *</label>
              <textarea
                name="expected_result"
                value={formData.expected_result}
                onChange={handleChange}
                placeholder="What should happen when the test passes"
                className="input-field"
                rows="2"
              />
            </div>

            <div className="form-group">
              <label>Pre-conditions</label>
              <textarea
                name="preconditions"
                value={formData.preconditions}
                onChange={handleChange}
                placeholder="Conditions that must be true before execution"
                className="input-field"
                rows="2"
              />
            </div>

            <div className="form-group">
              <label>Post-conditions</label>
              <textarea
                name="postconditions"
                value={formData.postconditions}
                onChange={handleChange}
                placeholder="System state after test completion"
                className="input-field"
                rows="2"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Test Steps</h3>
            {testSteps.map((step, index) => (
              <div key={index} className="step-container">
                <h4>Step {step.step_number}</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Action</label>
                    <input
                      type="text"
                      value={step.action}
                      onChange={(e) => handleStepChange(index, "action", e.target.value)}
                      placeholder="What to do in this step"
                      className="input-field"
                    />
                  </div>
                  <div className="form-group">
                    <label>Test Data</label>
                    <input
                      type="text"
                      value={step.testData}
                      onChange={(e) => handleStepChange(index, "testData", e.target.value)}
                      placeholder="Data to use"
                      className="input-field"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Expected Result</label>
                  <input
                    type="text"
                    value={step.expectedResult}
                    onChange={(e) => handleStepChange(index, "expectedResult", e.target.value)}
                    placeholder="What should happen"
                    className="input-field"
                  />
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <input
                    type="text"
                    value={step.notes}
                    onChange={(e) => handleStepChange(index, "notes", e.target.value)}
                    placeholder="Optional notes"
                    className="input-field"
                  />
                </div>
                {testSteps.length > 1 && (
                  <button
                    type="button"
                    className="remove-step-btn"
                    onClick={() => removeStep(index)}
                  >
                    Remove Step
                  </button>
                )}
                <hr />
              </div>
            ))}
            <button type="button" className="add-step-btn" onClick={addStep}>
              + Add Step
            </button>
          </div>

          <div className="form-section">
            <h3>Additional Information</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Environment Requirements</label>
                <input
                  type="text"
                  name="environmentRequirements"
                  value={formData.environmentRequirements}
                  onChange={handleChange}
                  placeholder="e.g., Chrome 120+, Windows 10"
                  className="input-field"
                />
              </div>
              <div className="form-group">
                <label>Estimated Duration (minutes)</label>
                <input
                  type="number"
                  name="estimatedDuration"
                  value={formData.estimatedDuration}
                  onChange={handleChange}
                  placeholder="e.g., 5"
                  className="input-field"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Automation Status</label>
                <select
                  name="automationStatus"
                  value={formData.automationStatus}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="Not Automated">Not Automated</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Automated">Automated</option>
                  <option value="Cannot Automate">Cannot Automate</option>
                </select>
              </div>
              <div className="form-group">
                <label>Automation Script Link</label>
                <input
                  type="url"
                  name="automationScriptLink"
                  value={formData.automationScriptLink}
                  onChange={handleChange}
                  placeholder="Link to automation script"
                  className="input-field"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Tags (comma-separated)</label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="e.g., login, smoke-test, P1"
                className="input-field"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (editingTestcase ? "Updating..." : "Creating...") : (editingTestcase ? "Update Test Case" : "Create Test Case")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TestCaseFormModal;
