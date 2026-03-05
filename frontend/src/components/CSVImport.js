import React, { useState } from 'react';
import api from '../services/api';
import './CSVImport.css';

function CSVImport({ projectId, onImportComplete }) {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
  };

  const parseCSV = (text) => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const values = [];
      let currentValue = '';
      let inQuotes = false;

      for (let char of lines[i]) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue.trim().replace(/^"|"$/g, ''));
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim().replace(/^"|"$/g, ''));

      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }

    return data;
  };

  const handleImport = async () => {
    if (!file) {
      alert('Please select a CSV file');
      return;
    }

    // Check if token exists
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Session expired. Please login again.');
      window.location.href = '/login';
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const text = await file.text();
      const csvData = parseCSV(text);

      console.log(`[CSV] Importing ${csvData.length} test cases with token present:`, !!token);

      const response = await api.post('/import/testcases', {
        csvData,
        projectId
      });

      console.log('[CSV] Import successful:', response.data);
      setResult(response.data);
      
      if (response.data.imported > 0) {
        setTimeout(() => {
          if (onImportComplete) onImportComplete();
        }, 2000);
      }
    } catch (error) {
      console.error('[CSV] Import error:', error);
      
      if (error.response?.status === 401) {
        alert('Authentication failed. Please login again.');
        window.location.href = '/login';
      } else {
        alert(error.response?.data?.error || 'Import failed');
      }
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/export/testcases', {
        params: { projectId },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'testcases.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed');
    }
  };

  const downloadTemplate = () => {
    const template = `title,description,expected_result,priority,preconditions,postconditions,test_steps,environment_requirements,estimated_duration,tags,automation_status
"Sample Test Case","Test the login functionality","User should be logged in successfully","high","User has valid credentials","User is on login page","1. Enter username\\n2. Enter password\\n3. Click login","Chrome, Firefox","5","login,authentication","Not Automated"`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'testcase_template.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="csv-import-container">
      <div className="csv-actions">
        <button className="btn-template" onClick={downloadTemplate}>
          📄 Download Template
        </button>
        <button className="btn-export" onClick={handleExport}>
          📥 Export to CSV
        </button>
      </div>

      <div className="csv-import-section">
        <h3>Import Test Cases from CSV</h3>
        <div className="file-input-group">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={importing}
          />
          <button
            className="btn-import"
            onClick={handleImport}
            disabled={!file || importing}
          >
            {importing ? '⏳ Importing...' : '📤 Import CSV'}
          </button>
        </div>

        {result && (
          <div className={`import-result ${result.errors > 0 ? 'has-errors' : 'success'}`}>
            <h4>Import Complete</h4>
            <p>✅ Successfully imported: {result.imported} test cases</p>
            {result.errors > 0 && (
              <>
                <p>❌ Failed: {result.errors} rows</p>
                <div className="error-details">
                  <h5>Errors:</h5>
                  {result.details.errors.map((err, idx) => (
                    <div key={idx} className="error-item">
                      Row {err.row}: {err.error}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CSVImport;
