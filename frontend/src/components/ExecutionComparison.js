import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './ExecutionComparison.css';

function ExecutionComparison({ testcaseId }) {
  const [executionRuns, setExecutionRuns] = useState([]);
  const [selectedRun1, setSelectedRun1] = useState(null);
  const [selectedRun2, setSelectedRun2] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);

  // Fetch all execution runs for this testcase (with debouncing)
  useEffect(() => {
    // Reset state when testcaseId changes
    setExecutionRuns([]);
    setComparison(null);
    setSelectedRun1(null);
    setSelectedRun2(null);
    
    // Don't fetch if testcaseId is too short or empty
    if (!testcaseId || testcaseId.trim().length < 2) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Debounce: wait 500ms after user stops typing before fetching
    const timeoutId = setTimeout(async () => {
      try {
        console.log('🔍 Fetching execution runs for testcase:', testcaseId);
        const response = await api.get(`/execution-runs/testcase/${testcaseId}`);
        console.log('✅ Received execution runs:', response.data);
        console.log('📊 Number of runs:', response.data?.length || 0);
        setExecutionRuns(response.data || []);
      } catch (error) {
        console.error('❌ Failed to fetch execution runs:', error);
        console.error('Error details:', error.response?.data || error.message);
        setExecutionRuns([]);
      } finally {
        setLoading(false);
      }
    }, 500); // Wait 500ms after user stops typing

    // Cleanup: cancel the timeout if user keeps typing
    return () => clearTimeout(timeoutId);
  }, [testcaseId]);

  // Handle comparison
  const handleCompare = async () => {
    if (!selectedRun1 || !selectedRun2) {
      alert('Please select two execution runs to compare');
      return;
    }

    setComparing(true);
    try {
      const response = await api.get(`/execution-runs/compare/${selectedRun1}/${selectedRun2}`);
      setComparison(response.data);
    } catch (error) {
      console.error('Failed to compare runs:', error);
      alert('Failed to compare execution runs');
    } finally {
      setComparing(false);
    }
  };

  // Format time
  const formatTime = (seconds) => {
    if (!seconds) return '-';
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

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <div className="comparison-loading">Loading execution runs...</div>;
  }

  return (
    <div className="execution-comparison">
      <h2>📊 Re-execution Comparison</h2>

      {/* Selection */}
      <div className="comparison-selection">
        <div className="select-group">
          <label>First Execution Run:</label>
          <select
            value={selectedRun1 || ''}
            onChange={(e) => setSelectedRun1(e.target.value ? parseInt(e.target.value) : null)}
          >
            <option value="">Select first run...</option>
            {executionRuns.map((run) => (
              <option key={run.id} value={run.id}>
                Run #{run.id} - {run.status.toUpperCase()} - {formatDate(run.created_at)}
              </option>
            ))}
          </select>
        </div>

        <div className="select-group">
          <label>Second Execution Run:</label>
          <select
            value={selectedRun2 || ''}
            onChange={(e) => setSelectedRun2(e.target.value ? parseInt(e.target.value) : null)}
          >
            <option value="">Select second run...</option>
            {executionRuns.map((run) => (
              <option key={run.id} value={run.id}>
                Run #{run.id} - {run.status.toUpperCase()} - {formatDate(run.created_at)}
              </option>
            ))}
          </select>
        </div>

        <button
          className="btn-compare"
          onClick={handleCompare}
          disabled={!selectedRun1 || !selectedRun2 || comparing}
        >
          {comparing ? '⏳ Comparing...' : '🔍 Compare'}
        </button>
      </div>

      {/* Comparison Results */}
      {comparison && (
        <div className="comparison-results">
          {/* Summary */}
          <div className="comparison-summary">
            <div className="summary-item">
              <h4>Status</h4>
              <div className={`status-badge status-${comparison.run1.status}`}>
                Run 1: {comparison.run1.status.toUpperCase()}
              </div>
              <span className="vs">vs</span>
              <div className={`status-badge status-${comparison.run2.status}`}>
                Run 2: {comparison.run2.status.toUpperCase()}
              </div>
              {comparison.comparison.statusChanged && (
                <div className="alert alert-info">⚠️ Status changed!</div>
              )}
            </div>

            <div className="summary-item">
              <h4>Duration</h4>
              <div className="duration">
                <span>{formatTime(comparison.run1.duration_seconds)}</span>
                <span className="vs">vs</span>
                <span>{formatTime(comparison.run2.duration_seconds)}</span>
              </div>
              {comparison.comparison.durationDiff !== 0 && (
                <div className={`duration-diff ${comparison.comparison.durationDiff > 0 ? 'slower' : 'faster'}`}>
                  {Math.abs(comparison.comparison.durationDiff)}s {comparison.comparison.durationDiff > 0 ? 'slower' : 'faster'}
                </div>
              )}
            </div>

            <div className="summary-item">
              <h4>Steps Count</h4>
              <div className="steps-count">
                <span>{comparison.run1.steps.length} steps</span>
                <span className="vs">vs</span>
                <span>{comparison.run2.steps.length} steps</span>
              </div>
            </div>
          </div>

          {/* Steps Comparison */}
          <div className="steps-comparison">
            <h3>Step-by-Step Comparison</h3>
            <div className="steps-table">
              <div className="steps-header">
                <div className="step-col">Step</div>
                <div className="step-col">Action</div>
                <div className="step-col run1-col">Run 1 Result</div>
                <div className="step-col run2-col">Run 2 Result</div>
              </div>

              {comparison.run1.steps.map((step1, idx) => {
                const step2 = comparison.run2.steps[idx];
                const statusChanged = step1.status !== (step2?.status || 'N/A');

                return (
                  <div key={idx} className={`steps-row ${statusChanged ? 'changed' : ''}`}>
                    <div className="step-col step-number">{step1.step_number}</div>
                    <div className="step-col step-action">{step1.step_action}</div>
                    <div className="step-col run1-col">
                      <span className={`result-badge result-${step1.status}`}>
                        {step1.status.toUpperCase()}
                      </span>
                      {step1.actual_result && (
                        <span className="actual-result">{step1.actual_result.substring(0, 50)}...</span>
                      )}
                    </div>
                    <div className="step-col run2-col">
                      {step2 ? (
                        <>
                          <span className={`result-badge result-${step2.status}`}>
                            {step2.status.toUpperCase()}
                          </span>
                          {step2.actual_result && (
                            <span className="actual-result">{step2.actual_result.substring(0, 50)}...</span>
                          )}
                        </>
                      ) : (
                        <span className="not-available">N/A</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Analysis */}
          <div className="detailed-analysis">
            <h3>📈 Detailed Analysis</h3>
            <div className="analysis-grid">
              <div className="analysis-card">
                <h4>Pass Rate</h4>
                <div className="stat-value">
                  {comparison.run1.steps.filter(s => s.status === 'pass').length}/{comparison.run1.steps.length}
                  <span className="vs">vs</span>
                  {comparison.run2.steps.filter(s => s.status === 'pass').length}/{comparison.run2.steps.length}
                </div>
              </div>

              <div className="analysis-card">
                <h4>Failed Steps</h4>
                <div className="stat-value">
                  {comparison.run1.steps.filter(s => s.status === 'fail').length}
                  <span className="vs">vs</span>
                  {comparison.run2.steps.filter(s => s.status === 'fail').length}
                </div>
              </div>

              <div className="analysis-card">
                <h4>Regression</h4>
                <div className="stat-value">
                  {(() => {
                    const failedRun1 = comparison.run1.steps.filter(s => s.status === 'fail').length;
                    const failedRun2 = comparison.run2.steps.filter(s => s.status === 'fail').length;
                    const regression = failedRun2 - failedRun1;
                    if (regression > 0) {
                      return <span className="alert-text">+{regression} issues</span>;
                    } else if (regression < 0) {
                      return <span className="success-text">{regression} improvements</span>;
                    } else {
                      return <span>No change</span>;
                    }
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {executionRuns.length === 0 && (
        <div className="no-runs-message">
          <p>No execution runs found for this test case.</p>
          <p>Execute the test using step-by-step execution to see comparisons.</p>
        </div>
      )}
    </div>
  );
}

export default ExecutionComparison;
