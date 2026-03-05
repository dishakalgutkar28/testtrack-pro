import { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import "./Attachments.css";

function Attachments({ entityType, entityId }) {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);

  const fetchAttachments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await api.get(`/attachments/${entityType}/${entityId}`);
      setAttachments(res.data || []);
    } catch (err) {
      setError("Failed to load attachments");
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    if (!entityType || !entityId) return;
    fetchAttachments();
  }, [entityType, entityId, fetchAttachments]);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      await api.post(`/attachments/${entityType}/${entityId}`, formData);
      setFile(null);
      fetchAttachments();
    } catch (err) {
      setError("Failed to upload attachment");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (attachment) => {
    try {
      const res = await api.get(`/attachments/${entityType}/file/${attachment.id}`, {
        responseType: "blob"
      });

      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.file_name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to download attachment");
    }
  };

  const handleDelete = async (attachmentId) => {
    try {
      await api.delete(`/attachments/${entityType}/${attachmentId}`);
      fetchAttachments();
    } catch (err) {
      setError("Failed to delete attachment");
    }
  };

  if (!entityId) return null;

  return (
    <div className="attachments-section">
      <div className="attachments-header">
        <h4>Attachments</h4>
        {error && <span className="attachments-error">{error}</span>}
      </div>

      <div className="attachments-upload">
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0] || null)}
        />
        <button
          className="attachments-upload-btn"
          onClick={handleUpload}
          disabled={!file || uploading}
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {loading ? (
        <p className="attachments-loading">Loading attachments...</p>
      ) : attachments.length === 0 ? (
        <p className="attachments-empty">No attachments yet.</p>
      ) : (
        <ul className="attachments-list">
          {attachments.map((item) => (
            <li key={item.id} className="attachments-item">
              <span className="attachments-name">{item.file_name}</span>
              <div className="attachments-actions">
                <button
                  className="attachments-action-btn"
                  onClick={() => handleDownload(item)}
                >
                  Download
                </button>
                <button
                  className="attachments-action-btn danger"
                  onClick={() => handleDelete(item.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Attachments;
