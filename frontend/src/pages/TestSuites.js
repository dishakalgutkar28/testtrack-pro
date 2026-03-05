import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useTheme } from '../context/ThemeContext';
import './TestSuites.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const TestSuites = () => {
  const [suites, setSuites] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');
  const [editingSuite, setEditingSuite] = useState(null);
  const navigate = useNavigate();
  const { theme } = useTheme();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_id: '',
    parent_suite_id: null
  });

  const token = localStorage.getItem('token');
  const userRole = (localStorage.getItem('role') || '').toLowerCase();
  const canEdit = userRole === 'admin' || userRole === 'tester';

  const fetchProjects = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(response.data.projects || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to fetch projects');
    }
  }, [token]);

  const fetchTestSuites = useCallback(async (projectId = '') => {
    setLoading(true);
    try {
      const url = projectId 
        ? `${API_BASE_URL}/test-suites?project_id=${projectId}`
        : `${API_BASE_URL}/test-suites`;
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuites(response.data.suites || []);
      setError('');
    } catch (err) {
      console.error('Error fetching test suites:', err);
      setError('Failed to fetch test suites');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    fetchProjects();
    fetchTestSuites();
  }, [token, navigate, fetchProjects, fetchTestSuites]);

  const handleProjectFilter = (e) => {
    const projectId = e.target.value;
    setSelectedProject(projectId);
    fetchTestSuites(projectId);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleOpenModal = (suite = null) => {
    // Prevent developers from opening edit modal
    if (!canEdit) {
      alert('You do not have permission to edit test suites');
      return;
    }

    if (suite) {
      setEditingSuite(suite);
      setFormData({
        name: suite.name,
        description: suite.description || '',
        project_id: suite.project_id || '',
        parent_suite_id: suite.parent_suite_id || null
      });
    } else {
      setEditingSuite(null);
      setFormData({
        name: '',
        description: '',
        project_id: selectedProject || '',
        parent_suite_id: null
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSuite(null);
    setFormData({
      name: '',
      description: '',
      project_id: '',
      parent_suite_id: null
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Suite name is required');
      return;
    }

    try {
      if (editingSuite) {
        // Update existing suite
        await axios.put(
          `${API_BASE_URL}/test-suites/${editingSuite.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Create new suite
        await axios.post(
          `${API_BASE_URL}/test-suites`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      
      handleCloseModal();
      fetchTestSuites(selectedProject);
      setError('');
    } catch (err) {
      console.error('Error saving test suite:', err);
      setError(err.response?.data?.error || 'Failed to save test suite');
    }
  };

  const handleDelete = async (suiteId) => {
    // Prevent developers from deleting
    if (!canEdit) {
      alert('You do not have permission to delete test suites');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this test suite?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/test-suites/${suiteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchTestSuites(selectedProject);
      setError('');
    } catch (err) {
      console.error('Error deleting test suite:', err);
      setError('Failed to delete test suite');
    }
  };

  const handleClone = async (suiteId) => {
    // Prevent developers from cloning
    if (!canEdit) {
      alert('You do not have permission to clone test suites');
      return;
    }

    try {
      await axios.post(
        `${API_BASE_URL}/test-suites/${suiteId}/clone`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      fetchTestSuites(selectedProject);
      setError('');
    } catch (err) {
      console.error('Error cloning test suite:', err);
      setError('Failed to clone test suite');
    }
  };

  const handleViewDetails = (suiteId) => {
    navigate(`/test-suites/${suiteId}`);
  };

  return (
    <div className={`test-suites-container ${theme}`}>
      <Navbar />
      <div className="test-suites-header">
        <div className="header-title">
          <h1>Test Suites</h1>
        </div>
        <div className="header-actions">
          <select 
            className="form-control project-filter"
            value={selectedProject}
            onChange={handleProjectFilter}
          >
            <option value="">All Projects</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          {canEdit && (
            <button 
              className="btn btn-primary"
              onClick={() => handleOpenModal()}
            >
              + Create Test Suite
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-spinner">Loading test suites...</div>
      ) : suites.length === 0 ? (
        <div className="empty-state">
          <p>No test suites found.</p>
          {canEdit && (
            <button 
              className="btn btn-primary"
              onClick={() => handleOpenModal()}
            >
              Create Your First Test Suite
            </button>
          )}
        </div>
      ) : (
        <div className="suites-grid">
          {suites.map(suite => (
            <div key={suite.id} className="suite-card">
              <div className="suite-card-header">
                <h3>{suite.name}</h3>
                <div className="suite-card-actions">
                  <button
                    className="btn-icon"
                    onClick={() => handleViewDetails(suite.id)}
                    title="View Details"
                  >
                    👁️
                  </button>
                  {canEdit && (
                    <>
                      <button
                        className="btn-icon"
                        onClick={() => handleOpenModal(suite)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleClone(suite.id)}
                        title="Clone"
                      >
                        📋
                      </button>
                      <button
                        className="btn-icon btn-danger"
                        onClick={() => handleDelete(suite.id)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="suite-card-body">
                {suite.description && (
                  <p className="suite-description">{suite.description}</p>
                )}
                
                <div className="suite-metadata">
                  <div className="metadata-item">
                    <span className="metadata-label">Test Cases:</span>
                    <span className="metadata-value">{suite.test_case_count || 0}</span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-label">Created:</span>
                    <span className="metadata-value">
                      {new Date(suite.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-label">Created By:</span>
                    <span className="metadata-value">{suite.created_by_email}</span>
                  </div>
                </div>
              </div>
              
              <div className="suite-card-footer">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleViewDetails(suite.id)}
                >
                  Manage Test Cases
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Create/Edit Suite */}
      {showModal && canEdit && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingSuite ? 'Edit Test Suite' : 'Create Test Suite'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Suite Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="form-control"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  className="form-control"
                  rows="4"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="project_id">Project</label>
                <select
                  id="project_id"
                  name="project_id"
                  className="form-control"
                  value={formData.project_id}
                  onChange={handleInputChange}
                >
                  <option value="">Select Project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="parent_suite_id">Parent Suite (Optional)</label>
                <select
                  id="parent_suite_id"
                  name="parent_suite_id"
                  className="form-control"
                  value={formData.parent_suite_id || ''}
                  onChange={handleInputChange}
                >
                  <option value="">None (Top Level Suite)</option>
                  {suites
                    .filter(s => !editingSuite || s.id !== editingSuite.id)
                    .map(suite => (
                      <option key={suite.id} value={suite.id}>
                        {suite.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSuite ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestSuites;
