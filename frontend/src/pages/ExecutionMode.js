import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './ExecutionMode.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ExecutionMode = () => {
  const { suiteId, executionId } = useParams();
  const navigate = useNavigate();
  const [execution, setExecution] = useState(null);
  const [testcases, setTestcases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTestcaseIndex, setCurrentTestcaseIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepResults, setStepResults] = useState({});
  const [actualResults, setActualResults] = useState({});
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchExecutionData();
  }, [token, suiteId, executionId]);

  const fetchExecutionData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/test-suites/${suiteId}/execution/${executionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setExecution(response.data.execution);
      setTestcases(response.data.testcases);
      setError('');
    } catch (err) {
      console.error('Error fetching execution data:', err);
      setError('Failed to load execution. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentTestcase = () => testcases[currentTestcaseIndex];
  const getCurrentStep = () => {
    const tc = getCurrentTestcase();
    return tc?.steps[currentStepIndex];
  };

  const handleStepStatus = async (status) => {
    const tc = getCurrentTestcase();
    const step = getCurrentStep();
    const key = `${tc.id}-${step.step_number}`;

    setSaving(true);
    try {
      await axios.post(
        `${API_BASE_URL}/test-suites/${suiteId}/execute-step`,
        {
          executionId,
          stepNumber: step.step_number,
          testcaseId: tc.id,
          status,
          actualResult: actualResults[key] || '',
          notes: ''
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setStepResults(prev => ({
        ...prev,
        [key]: status
      }));

      // Move to next step
      moveToNextStep();
    } catch (err) {
      console.error('Error saving step result:', err);
      setError('Failed to save step result');
    } finally {
      setSaving(false);
    }
  };

  const moveToNextStep = () => {
    const tc = getCurrentTestcase();
    if (currentStepIndex < tc.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else if (currentTestcaseIndex < testcases.length - 1) {
      setCurrentTestcaseIndex(prev => prev + 1);
      setCurrentStepIndex(0);
    } else {
      // Execution complete
      handleExecutionComplete();
    }
  };

  const handleExecutionComplete = () => {
    alert('Execution completed! Your results have been saved.');
    navigate(`/test-suites/${suiteId}`);
  };

  if (loading) {
    return (
      <div className="execution-mode-container">
        <div className="loading-spinner">Loading execution mode...</div>
      </div>
    );
  }

  if (!execution || testcases.length === 0) {
    return (
      <div className="execution-mode-container">
        <div className="error-message">No test cases to execute</div>
      </div>
    );
  }

  const tc = getCurrentTestcase();
  const step = getCurrentStep();
  const totalSteps = testcases.reduce((sum, t) => sum + t.steps.length, 0);
  const completedSteps = Object.keys(stepResults).length;
  const progressPercent = (completedSteps / totalSteps) * 100;

  return (
    <div className="execution-mode-container">
      {/* Header */}
      <div className="execution-header">
        <button className="btn-back" onClick={() => navigate(`/test-suites/${suiteId}`)}>
          ← Back to Suite
        </button>
        <h1>{execution.suite_name} - Execution Mode</h1>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
        <p className="progress-text">
          Step {completedSteps + 1} of {totalSteps}
        </p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Execution Interface */}
      <div className="execution-interface">
        {/* Left Panel: Testcases List */}
        <div className="testcases-list">
          <h3>Test Cases</h3>
          <div className="testcases-scroll">
            {testcases.map((tc, idx) => (
              <div
                key={tc.id}
                className={`testcase-item ${idx === currentTestcaseIndex ? 'active' : ''}`}
                onClick={() => {
                  setCurrentTestcaseIndex(idx);
                  setCurrentStepIndex(0);
                }}
              >
                <div className="testcase-number">{idx + 1}</div>
                <div className="testcase-info">
                  <div className="testcase-title">{tc.title}</div>
                  <div className="testcase-steps">{tc.steps.length} steps</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center Panel: Step Execution */}
        <div className="step-execution">
          <div className="step-card">
            {/* Step Header */}
            <div className="step-header">
              <h2>
                Step {step?.step_number || 1}: {tc?.title}
              </h2>
              <div className="step-counter">
                {currentStepIndex + 1} / {tc?.steps.length || 0}
              </div>
            </div>

            {/* Action */}
            <div className="step-section">
              <label className="step-label">Action:</label>
              <div className="step-content">{step?.action || 'No action'}</div>
            </div>

            {/* Test Data */}
            {step?.test_data && (
              <div className="step-section">
                <label className="step-label">Test Data:</label>
                <div className="step-content">{step.test_data}</div>
              </div>
            )}

            {/* Expected Result */}
            <div className="step-section">
              <label className="step-label">Expected Result:</label>
              <div className="step-content">{step?.expected_result || 'No expected result'}</div>
            </div>

            {/* Actual Result */}
            <div className="step-section">
              <label className="step-label">Actual Result:</label>
              <textarea
                className="actual-result-input"
                placeholder="What actually happened? (optional)"
                value={actualResults[`${tc.id}-${step?.step_number}`] || ''}
                onChange={(e) => {
                  const key = `${tc.id}-${step.step_number}`;
                  setActualResults(prev => ({
                    ...prev,
                    [key]: e.target.value
                  }));
                }}
              />
            </div>

            {/* Action Buttons */}
            <div className="step-actions">
              <button
                className="btn btn-success"
                onClick={() => handleStepStatus('pass')}
                disabled={saving}
              >
                ✓ Pass
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleStepStatus('fail')}
                disabled={saving}
              >
                ✗ Fail
              </button>
              <button
                className="btn btn-warning"
                onClick={() => handleStepStatus('blocked')}
                disabled={saving}
              >
                ⊘ Blocked
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => handleStepStatus('skipped')}
                disabled={saving}
              >
                ⊙ Skip
              </button>
            </div>

            {saving && <p className="saving-indicator">Saving...</p>}
          </div>
        </div>

        {/* Right Panel: Summary */}
        <div className="execution-summary">
          <h3>Summary</h3>
          <div className="summary-stats">
            <div className="stat">
              <span className="stat-label">Total Steps:</span>
              <span className="stat-value">{totalSteps}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Completed:</span>
              <span className="stat-value">{completedSteps}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Passed:</span>
              <span className="stat-value stat-pass">
                {Object.values(stepResults).filter(s => s === 'pass').length}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Failed:</span>
              <span className="stat-value stat-fail">
                {Object.values(stepResults).filter(s => s === 'fail').length}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Blocked:</span>
              <span className="stat-value stat-blocked">
                {Object.values(stepResults).filter(s => s === 'blocked').length}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Skipped:</span>
              <span className="stat-value stat-skipped">
                {Object.values(stepResults).filter(s => s === 'skipped').length}
              </span>
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleExecutionComplete}
            style={{ marginTop: '20px', width: '100%' }}
          >
            Complete Execution
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExecutionMode;
