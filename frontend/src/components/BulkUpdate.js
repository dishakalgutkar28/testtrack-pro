import React, { useState } from 'react';
import api from '../services/api';
import './BulkUpdate.css';

function BulkUpdate({ selectedIds, onUpdateComplete }) {
  const [showModal, setShowModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updates, setUpdates] = useState({
    priority: '',
    automation_status: '',
    project_id: ''
  });

  const handleUpdate = async () => {
    if (selectedIds.length === 0) {
      alert('Please select test cases to update');
      return;
    }

    // Filter out empty values
    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (updates[key]) {
        filteredUpdates[key] = updates[key];
      }
    });

    if (Object.keys(filteredUpdates).length === 0) {
      alert('Please select at least one field to update');
      return;
    }

    setUpdating(true);

    try {
      const response = await api.put('/testcase/bulk-update', {
        ids: selectedIds,
        updates: filteredUpdates
      });

      alert(`✅ ${response.data.updatedCount} test cases updated successfully!`);
      setShowModal(false);
      setUpdates({ priority: '', automation_status: '', project_id: '' });
      
      if (onUpdateComplete) onUpdateComplete();
    } catch (error) {
      console.error('Bulk update error:', error);
      alert(error.response?.data?.error || 'Bulk update failed');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <button
        className="btn-bulk-update"
        onClick={() => setShowModal(true)}
        disabled={selectedIds.length === 0}
      >
        📝 Bulk Update ({selectedIds.length} selected)
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => !updating && setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Bulk Update Test Cases</h2>
            <p className="modal-subtitle">
              Updating {selectedIds.length} test case{selectedIds.length !== 1 ? 's' : ''}
            </p>

            <div className="form-group">
              <label>Priority</label>
              <select
                value={updates.priority}
                onChange={(e) => setUpdates({ ...updates, priority: e.target.value })}
                disabled={updating}
              >
                <option value="">-- No Change --</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="form-group">
              <label>Automation Status</label>
              <select
                value={updates.automation_status}
                onChange={(e) => setUpdates({ ...updates, automation_status: e.target.value })}
                disabled={updating}
              >
                <option value="">-- No Change --</option>
                <option value="Not Automated">Not Automated</option>
                <option value="In Progress">In Progress</option>
                <option value="Automated">Automated</option>
                <option value="Cannot Automate">Cannot Automate</option>
              </select>
            </div>

            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowModal(false)}
                disabled={updating}
              >
                Cancel
              </button>
              <button
                className="btn-confirm"
                onClick={handleUpdate}
                disabled={updating}
              >
                {updating ? 'Updating...' : 'Update All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default BulkUpdate;
