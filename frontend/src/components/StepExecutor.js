import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './StepExecutor.css';

function StepExecutor({ testcaseId, onExecutionComplete }) {
  const [executionRunId, setExecutionRunId] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState([]);
  const [executionSteps, setExecutionSteps] = useState([]); // Store DB execution_steps with IDs
  const [loading, setLoading] = useState(false);
  const [stepResults, setStepResults] = useState({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [stepNotes, setStepNotes] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [executionOverallStatus, setExecutionOverallStatus] = useState('pending');

  // Start execution run
  const startExecution = async () => {
    setLoading(true);
    try {
      // Verify authentication
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Authentication required. Please log in again.");
        window.location.href = "/login";
        return;
      }

      const response = await api.post('/execution-run/start', {
        testcase_id: testcaseId
      });

      const runId = response.data.execution_run_id;
      setExecutionRunId(runId);
      setSteps(response.data.test_steps || []);
      setIsExecuting(true);
      setElapsedSeconds(0);

      // Fetch execution steps with their database IDs
      const runDetailsResponse = await api.get(`/execution-run/${runId}`);
      setExecutionSteps(runDetailsResponse.data.steps || []);
      
      console.log('✅ Execution started with', runDetailsResponse.data.steps?.length || 0, 'steps');

      // Initialize step results
      const initialResults = {};
      (response.data.test_steps || []).forEach((step, idx) => {
        initialResults[idx] = { status: 'pending', notes: '' };
      });
      setStepResults(initialResults);
    } catch (error) {
      console.error('Failed to start execution:', error.response?.status, error.response?.data || error.message);
      
      // Handle auth errors
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        alert("Your session has expired. Please log in again.");
        window.location.href = "/login";
        return;
      }
      
      // Handle other errors
      const errorMsg = error.response?.data?.error || error.message || 'Failed to start execution';
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Timer effect
  useEffect(() => {
    if (!isExecuting) return;

    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isExecuting]);

  // Get current step
  const currentStep = steps[currentStepIndex];

  // Handle step result
  const handleStepResult = async (status) => {
    try {
      // Get the execution_step ID from database
      const executionStep = executionSteps[currentStepIndex];
      
      if (!executionStep || !executionStep.id) {
        console.error('❌ No execution step found for index:', currentStepIndex);
        alert('Error: Step data not found. Please try again.');
        return;
      }

      console.log(`📝 Updating step ${currentStepIndex + 1} (ID: ${executionStep.id}) with status: ${status}`);

      // Update step in database via API
      await api.put(`/execution-step/${executionStep.id}`, {
        status: status,
        actual_result: stepNotes || null,
        notes: stepNotes || null
      });

      console.log(`✅ Step ${currentStepIndex + 1} updated successfully`);

      // Update step result locally
      const updatedResults = { ...stepResults };
      updatedResults[currentStepIndex] = {
        status,
        notes: stepNotes
      };
      setStepResults(updatedResults);

      // Move to next step or complete
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
        setStepNotes('');
      } else {
        // Last step completed
        await completeExecution();
      }
    } catch (error) {
      console.error('❌ Error updating step:', error);
      alert('Failed to save step result. Please try again.');
    }
  };

  // Complete execution
  const completeExecution = async () => {
    try {
      // Check all steps - if any failed, mark as fail
      const hasFailedStep = Object.values(stepResults).some(r => r.status === 'fail');
      const finalStatus = hasFailedStep ? 'fail' : 'pass';

      setExecutionOverallStatus(finalStatus);

      await api.post(`/execution-run/${executionRunId}/end`, {
        status: finalStatus
      });

      setIsExecuting(false);

      // Call completion callback
      if (onExecutionComplete) {
        onExecutionComplete({
          executionRunId,
          status: finalStatus,
          duration: elapsedSeconds,
          stepResults
        });
      }
    } catch (error) {
      console.error('Failed to complete execution:', error);
      alert('Failed to complete execution');
    }
  };

  // Format time
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  if (!isExecuting) {
    return (
      <div className="step-executor-container">
        <div className="start-execution">
          <h2>📋 Step-by-Step Execution</h2>
          <p>Execute this test case step by step with timing</p>
          <button 
            className="btn-start-execution"
            onClick={startExecution}
            disabled={loading}
          >
            {loading ? '⏳ Starting...' : '▶️ Start Step-by-Step Execution'}
          </button>
        </div>
      </div>
    );
  }

  if (!currentStep) {
    return <div className="executor-loading">Loading...</div>;
  }

  const passCount = Object.values(stepResults).filter(r => r.status === 'pass').length;
  const failCount = Object.values(stepResults).filter(r => r.status === 'fail').length;
  const progressPercent = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className="step-executor">
      {/* Header */}
      <div className="executor-header">
        <div className="timer-section">
          <span className="timer">⏱️ {formatTime(elapsedSeconds)}</span>
        </div>
        <div className="progress-section">
          <span>Step {currentStepIndex + 1} of {steps.length}</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>
        <div className="stats-section">
          <span className="pass-stat">✅ {passCount}</span>
          <span className="fail-stat">❌ {failCount}</span>
        </div>
      </div>

      {/* Current Step */}
      <div className="executor-content">
        <div className="step-card">
          <h3>Step {currentStepIndex + 1}</h3>
          
          <div className="step-detail">
            <label>Action:</label>
            <p className="step-text">{currentStep.action || currentStep.step_action || `Step ${currentStepIndex + 1}`}</p>
          </div>

          {(currentStep.expectedResult || currentStep.step_expected) && (
            <div className="step-detail">
              <label>Expected Result:</label>
              <p className="step-text">{currentStep.expectedResult || currentStep.step_expected}</p>
            </div>
          )}

          {(currentStep.testData || currentStep.test_data) && (
            <div className="step-detail">
              <label>Test Data:</label>
              <p className="step-text">{currentStep.testData || currentStep.test_data}</p>
            </div>
          )}

          {(currentStep.notes || currentStep.notes) && (
            <div className="step-detail">
              <label>Notes:</label>
              <p className="step-text">{currentStep.notes}</p>
            </div>
          )}
        </div>

        {/* Result Input */}
        <div className="executor-result">
          <label>Observation / Actual Result:</label>
          <textarea
            className="result-textarea"
            placeholder="Describe what you observed..."
            value={stepNotes}
            onChange={(e) => setStepNotes(e.target.value)}
            rows="4"
          />

          <div className="result-buttons">
            <button
              className="btn-pass"
              onClick={() => handleStepResult('pass')}
            >
              ✅ Pass
            </button>
            <button
              className="btn-fail"
              onClick={() => handleStepResult('fail')}
            >
              ❌ Fail
            </button>
            <button
              className="btn-skip"
              onClick={() => handleStepResult('skipped')}
            >
              ⏭️ Skip
            </button>
          </div>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="executor-navigation">
        <button
          className="btn-prev"
          onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
          disabled={currentStepIndex === 0}
        >
          ← Previous
        </button>

        <div className="step-indicators">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className={`step-indicator step-${stepResults[idx]?.status || 'pending'}`}
              onClick={() => setCurrentStepIndex(idx)}
              title={`Step ${idx + 1}`}
            >
              {idx + 1}
            </div>
          ))}
        </div>

        <button
          className="btn-next"
          onClick={() => handleStepResult('pending')}
          disabled={currentStepIndex === steps.length - 1}
        >
          Next →
        </button>
      </div>

      {/* Quick Summary */}
      <div className="executor-summary">
        <p>Passed: {passCount} | Failed: {failCount}</p>
      </div>
    </div>
  );
}

export default StepExecutor;
