import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import "./LifecycleState.css";

function LifecycleState({ testcaseId, onStateChange }) {
  const [currentState, setCurrentState] = useState("");
  const [availableStates, setAvailableStates] = useState([]);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [changeReason, setChangeReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newState, setNewState] = useState("");

  const validateTransition = useCallback(async (state) => {
    try {
      const res = await api.post(`/testcase/${testcaseId}/lifecycle-validate`, {
        proposedState: state
      });
      setAvailableStates(res.data.availableStates);
    } catch (err) {
      console.error("Failed to validate transition:", err);
    }
  }, [testcaseId]);

  const fetchLifecycleState = useCallback(async () => {
    try {
      const res = await api.get(`/testcase/${testcaseId}/lifecycle`);
      setCurrentState(res.data.lifecycle_state);
      validateTransition(res.data.lifecycle_state);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch lifecycle state");
    }
  }, [testcaseId, validateTransition]);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await api.get(`/testcase/${testcaseId}/lifecycle-history`);
      setHistory(res.data);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  }, [testcaseId]);

  useEffect(() => {
    fetchLifecycleState();
    fetchHistory();
  }, [fetchLifecycleState, fetchHistory]);

  const changeState = async () => {
    if (!newState || !changeReason) {
      setError("Please select a state and provide a reason");
      return;
    }

    setLoading(true);
    try {
      await api.put(`/testcase/${testcaseId}/lifecycle`, {
        newState,
        reason: changeReason
      });
      setCurrentState(newState);
      setError("");
      setChangeReason("");
      setNewState("");
      fetchHistory();
      if (onStateChange) onStateChange(newState);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to change state");
    } finally {
      setLoading(false);
    }
  };

  const getStateColor = (state) => {
    const colors = {
      "Draft": "#ffc107",
      "Ready": "#17a2b8",
      "In Execution": "#0275d8",
      "Completed": "#28a745",
      "Closed": "#6c757d",
      "Reopened": "#fd7e14"
    };
    return colors[state] || "#666";
  };

  return (
    <div className="lifecycle-container">
      <div className="lifecycle-header">
        <h3>📋 Test Case Lifecycle</h3>
        <button 
          className="history-toggle-btn"
          onClick={() => setShowHistory(!showHistory)}
        >
          {showHistory ? "Hide History" : "Show History"}
        </button>
      </div>

      <div className="lifecycle-current">
        <div className="current-state">
          <span className="state-label">Current State:</span>
          <span 
            className="state-badge" 
            style={{ backgroundColor: getStateColor(currentState) }}
          >
            {currentState}
          </span>
        </div>
      </div>

      {availableStates.length > 0 && (
        <div className="lifecycle-transition">
          <h4>Change State</h4>
          <div className="state-selector">
            <select 
              value={newState} 
              onChange={(e) => setNewState(e.target.value)}
              className="state-select"
            >
              <option value="">Select new state...</option>
              {availableStates.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            <span className="arrow">→</span>
          </div>

          <textarea
            className="reason-input"
            placeholder="Reason for state change (required)"
            value={changeReason}
            onChange={(e) => setChangeReason(e.target.value)}
          />

          <button 
            className="change-btn"
            onClick={changeState}
            disabled={loading || !newState || !changeReason}
          >
            {loading ? "Changing..." : "Change State"}
          </button>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {showHistory && (
        <div className="lifecycle-history">
          <h4>State Change History</h4>
          {history.length === 0 ? (
            <p className="no-history">No state changes yet</p>
          ) : (
            <div className="history-list">
              {history.map((entry, idx) => (
                <div key={idx} className="history-item">
                  <div className="history-state">
                    <span 
                      className="state-badge-small"
                      style={{ backgroundColor: getStateColor(entry.state) }}
                    >
                      {entry.state}
                    </span>
                  </div>
                  <div className="history-details">
                    <p><strong>{entry.changed_by_user}</strong> changed state</p>
                    {entry.reason && <p className="reason-text">{entry.reason}</p>}
                    <p className="timestamp">{new Date(entry.changed_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LifecycleState;
