import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import './VersionHistory.css';

function VersionHistory({ testcaseId, testcaseTitle, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await api.get(`/testcase/${testcaseId}/history`);
      setHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
      alert('Failed to load version history');
    } finally {
      setLoading(false);
    }
  }, [testcaseId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="version-history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📜 Version History</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <p className="test-case-title">{testcaseTitle}</p>

        {loading ? (
          <div className="loading">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="no-history">No version history available</div>
        ) : (
          <div className="history-list">
            {history.map((version, index) => (
              <div key={version.id} className="history-item">
                <div className="version-header">
                  <span className="version-badge">Version {version.version}</span>
                  <span className="version-date">{formatDate(version.modified_at)}</span>
                </div>

                <div className="version-meta">
                  <span>Modified by: {version.modified_by_email || 'Unknown'}</span>
                  {version.change_description && (
                    <span className="change-desc">"{version.change_description}"</span>
                  )}
                </div>

                <div className="version-details">
                  {version.title && (
                    <div className="detail-row">
                      <strong>Title:</strong> {version.title}
                    </div>
                  )}
                  {version.priority && (
                    <div className="detail-row">
                      <strong>Priority:</strong> 
                      <span className={`priority-badge ${version.priority}`}>
                        {version.priority}
                      </span>
                    </div>
                  )}
                  {version.automation_status && (
                    <div className="detail-row">
                      <strong>Automation:</strong> {version.automation_status}
                    </div>
                  )}
                  {version.description && (
                    <div className="detail-row">
                      <strong>Description:</strong>
                      <div className="detail-text">{version.description}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default VersionHistory;
