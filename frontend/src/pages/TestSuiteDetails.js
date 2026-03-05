import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import './TestSuiteDetails.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const TestSuiteDetails = () => {
  const { suiteId } = useParams();
  const navigate = useNavigate();
  const [suite, setSuite] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [availableTestCases, setAvailableTestCases] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTestCases, setSelectedTestCases] = useState([]);

  const token = localStorage.getItem('token');

  const fetchSuiteDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/test-suites/${suiteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuite(response.data.suite);
      setTestCases(response.data.suite.testcases || []);
      setError('');
    } catch (err) {
      console.error('Error fetching suite details:', err);
      setError('Failed to fetch test suite details');
    } finally {
      setLoading(false);
    }
  }, [suiteId, token]);

  const fetchExecutions = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/test-suites/${suiteId}/executions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExecutions(response.data.executions || []);
    } catch (err) {
      console.error('Error fetching executions:', err);
    }
  }, [suiteId, token]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchSuiteDetails();
    fetchExecutions();
  }, [token, navigate, suiteId, fetchSuiteDetails, fetchExecutions]);

  const fetchAvailableTestCases = async () => {
    try {
      // Fetch all test cases from the project
      const projectId = suite?.project_id;
      if (!projectId) return;

      const response = await axios.get(`${API_BASE_URL}/testcase?projectId=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter out test cases already in the suite
      const existingIds = testCases.map(tc => tc.id);
      const available = response.data.filter(tc => !existingIds.includes(tc.id));
      setAvailableTestCases(available);
    } catch (err) {
      console.error('Error fetching available test cases:', err);
      setError('Failed to fetch available test cases');
    }
  };

  const handleOpenAddModal = () => {
    fetchAvailableTestCases();
    setShowAddModal(true);
    setSelectedTestCases([]);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setSelectedTestCases([]);
  };

  const handleTestCaseSelection = (testCaseId) => {
    setSelectedTestCases(prev => {
      if (prev.includes(testCaseId)) {
        return prev.filter(id => id !== testCaseId);
      } else {
        return [...prev, testCaseId];
      }
    });
  };

  const handleAddTestCases = async () => {
    if (selectedTestCases.length === 0) {
      setError('Please select at least one test case');
      return;
    }

    try {
      await axios.post(
        `${API_BASE_URL}/test-suites/${suiteId}/testcases`,
        { testcase_ids: selectedTestCases },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      handleCloseAddModal();
      fetchSuiteDetails();
      setError('');
    } catch (err) {
      console.error('Error adding test cases:', err);
      setError('Failed to add test cases to suite');
    }
  };

  const handleExecuteSuite = async () => {
    if (testCases.length === 0) {
      setError('Cannot execute suite with no test cases');
      return;
    }

    if (!window.confirm(`Execute suite with ${testCases.length} test case(s)?`)) {
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/test-suites/${suiteId}/execute`,
        { 
          notes: 'Manual execution from UI',
          environment: 'development'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setError('');
      // Refresh execution history
      fetchExecutions();
      
      // Navigate to execution mode
      const executionId = response.data.execution_id;
      navigate(`/test-suites/${suiteId}/execution/${executionId}`);
    } catch (err) {
      console.error('Error executing suite:', err);
      setError('Failed to execute suite');
    }
  };

  const handleRemoveTestCase = async (testCaseId) => {
    if (!window.confirm('Remove this test case from the suite?')) {
      return;
    }

    try {
      await axios.delete(
        `${API_BASE_URL}/test-suites/${suiteId}/testcases/${testCaseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      fetchSuiteDetails();
      setError('');
    } catch (err) {
      console.error('Error removing test case:', err);
      setError('Failed to remove test case from suite');
    }
  };

  const handleReorderTestCase = async (testCaseId, direction) => {
    const currentIndex = testCases.findIndex(tc => tc.id === testCaseId);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= testCases.length) return;

    // Create new order array
    const reorderedTestCases = [...testCases];
    const [movedItem] = reorderedTestCases.splice(currentIndex, 1);
    reorderedTestCases.splice(newIndex, 0, movedItem);

    // Update order indexes
    const orderUpdates = reorderedTestCases.map((tc, idx) => ({
      testcase_id: tc.id,
      order_index: idx
    }));

    try {
      await axios.put(
        `${API_BASE_URL}/test-suites/${suiteId}/reorder`,
        { test_cases: orderUpdates },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      fetchSuiteDetails();
      setError('');
    } catch (err) {
      console.error('Error reordering test cases:', err);
      setError('Failed to reorder test cases');
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading suite details...</div>;
  }

  if (!suite) {
    return <div className="error-message">Test suite not found</div>;
  }

  return (
    <div className="suite-details-container">
      <div className="suite-details-header">
        <button className="btn-back" onClick={() => navigate('/test-suites')}>
          ← Back to Test Suites
        </button>
        <h1>{suite.name}</h1>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="suite-info-card">
        <div className="suite-info-row">
          <div className="suite-info-item">
            <span className="info-label">Description:</span>
            <span className="info-value">{suite.description || 'No description'}</span>
          </div>
        </div>
        <div className="suite-info-row">
          <div className="suite-info-item">
            <span className="info-label">Test Cases:</span>
            <span className="info-value">{testCases.length}</span>
          </div>
          <div className="suite-info-item">
            <span className="info-label">Created:</span>
            <span className="info-value">
              {new Date(suite.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="suite-info-item">
            <span className="info-label">Created By:</span>
            <span className="info-value">{suite.created_by_email}</span>
          </div>
        </div>
      </div>

      <div className="test-cases-section">
        <div className="section-header">
          <h2>Test Cases in Suite</h2>
          <div className="section-actions">
            <button 
              className="btn btn-success" 
              onClick={handleExecuteSuite}
              disabled={testCases.length === 0}
            >
              ▶️ Execute Suite
            </button>
            <button className="btn btn-primary" onClick={handleOpenAddModal}>
              + Add Test Cases
            </button>
          </div>
        </div>

        {testCases.length === 0 ? (
          <div className="empty-state">
            <p>No test cases in this suite yet.</p>
            <button className="btn btn-primary" onClick={handleOpenAddModal}>
              Add Test Cases
            </button>
          </div>
        ) : (
          <div className="test-cases-list">
            {testCases.map((testCase, index) => (
              <div key={testCase.id} className="test-case-item">
                <div className="test-case-order">
                  <button
                    className="btn-reorder"
                    onClick={() => handleReorderTestCase(testCase.id, 'up')}
                    disabled={index === 0}
                    title="Move Up"
                  >
                    ↑
                  </button>
                  <span className="order-number">{index + 1}</span>
                  <button
                    className="btn-reorder"
                    onClick={() => handleReorderTestCase(testCase.id, 'down')}
                    disabled={index === testCases.length - 1}
                    title="Move Down"
                  >
                    ↓
                  </button>
                </div>

                <div className="test-case-info">
                  <h4>{testCase.title}</h4>
                  <div className="test-case-meta">
                    <span className="badge badge-priority">{testCase.priority}</span>
                    <span className="badge badge-status">{testCase.status}</span>
                    {testCase.automated && <span className="badge badge-automated">Automated</span>}
                  </div>
                </div>

                <div className="test-case-actions">
                  <button
                    className="btn-icon"
                    onClick={() => navigate(`/testcases/${testCase.id}`)}
                    title="View Details"
                  >
                    👁️
                  </button>
                  <button
                    className="btn-icon btn-danger"
                    onClick={() => handleRemoveTestCase(testCase.id)}
                    title="Remove from Suite"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Execution History Section */}
      <div className="execution-history-section">
        <div className="section-header">
          <h2>Execution History</h2>
        </div>

        {executions.length === 0 ? (
          <div className="empty-state">
            <p>No execution history yet. Click "Execute Suite" to run the test suite.</p>
          </div>
        ) : (
          <div className="execution-history-table">
            <table>
              <thead>
                <tr>
                  <th>Execution ID</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Total Cases</th>
                  <th>Passed</th>
                  <th>Failed</th>
                  <th>Executed By</th>
                  <th>Environment</th>
                </tr>
              </thead>
              <tbody>
                {executions.map(execution => (
                  <tr key={execution.id}>
                    <td>#{execution.id}</td>
                    <td>{new Date(execution.start_time).toLocaleString()}</td>
                    <td>
                      <span className={`badge badge-status-${execution.status}`}>
                        {execution.status}
                      </span>
                    </td>
                    <td>{execution.total_testcases}</td>
                    <td className="text-success">{execution.passed_testcases || 0}</td>
                    <td className="text-danger">{execution.failed_testcases || 0}</td>
                    <td>{execution.executed_by_name || 'Unknown'}</td>
                    <td>{execution.environment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Test Cases Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={handleCloseAddModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Test Cases to Suite</h2>
              <button className="modal-close" onClick={handleCloseAddModal}>
                &times;
              </button>
            </div>

            <div className="modal-body">
              {availableTestCases.length === 0 ? (
                <p className="no-test-cases">
                  No available test cases to add. All test cases from this project are already in the suite.
                </p>
              ) : (
                <div className="test-cases-selection">
                  {availableTestCases.map(testCase => (
                    <div key={testCase.id} className="test-case-checkbox">
                      <input
                        type="checkbox"
                        id={`tc-${testCase.id}`}
                        checked={selectedTestCases.includes(testCase.id)}
                        onChange={() => handleTestCaseSelection(testCase.id)}
                      />
                      <label htmlFor={`tc-${testCase.id}`}>
                        <span className="test-case-title">{testCase.title}</span>
                        <div className="test-case-badges">
                          <span className="badge badge-priority">{testCase.priority}</span>
                          <span className="badge badge-status">{testCase.status}</span>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCloseAddModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAddTestCases}
                disabled={selectedTestCases.length === 0}
              >
                Add Selected ({selectedTestCases.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestSuiteDetails;
