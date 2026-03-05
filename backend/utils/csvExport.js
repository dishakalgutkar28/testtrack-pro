/**
 * CSV Export Utility
 * Generate CSV reports
 */

const logger = require('./logger');

/**
 * Convert array of objects to CSV format
 * @param {Array} data - Array of objects to convert
 * @param {Array} headers - Array of header names
 * @param {Array} keys - Array of object keys corresponding to headers
 * @returns {string} - CSV formatted string
 */
const arrayToCSV = (data, headers, keys) => {
  try {
    // Escape CSV values
    const escapeCSV = (value) => {
      if (value === null || value === undefined) {
        return '';
      }
      
      const stringValue = String(value);
      // Escape double quotes by doubling them
      const escaped = stringValue.replace(/"/g, '""');
      
      // Wrap in quotes if contains comma, newline, or quote
      if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
        return `"${escaped}"`;
      }
      
      return escaped;
    };
    
    // Create header row
    const headerRow = headers.map(escapeCSV).join(',');
    
    // Create data rows
    const dataRows = data.map(row => {
      return keys.map(key => escapeCSV(row[key])).join(',');
    });
    
    // Combine header and data
    return [headerRow, ...dataRows].join('\n');
  } catch (error) {
    logger.error('Error converting array to CSV', { error });
    throw error;
  }
};

/**
 * Generate CSV report
 * @param {string} reportType - Type of report (bugs, testcases, executions)
 * @param {Array} data - Data to include in report
 * @returns {string} - CSV formatted string
 */
const generateCSVReport = (reportType, data) => {
  try {
    let csvContent;
    
    switch (reportType) {
      case 'bugs':
        csvContent = generateBugsCSV(data);
        break;
      case 'testcases':
        csvContent = generateTestcasesCSV(data);
        break;
      case 'executions':
        csvContent = generateExecutionsCSV(data);
        break;
      default:
        throw new Error('Unsupported report type');
    }
    
    return csvContent;
  } catch (error) {
    logger.error('Error generating CSV report', { error, reportType });
    throw error;
  }
};

/**
 * Generate bugs CSV
 */
const generateBugsCSV = (bugs) => {
  const headers = [
    'ID',
    'Title',
    'Description',
    'Status',
    'Severity',
    'Priority',
    'Project',
    'Reporter',
    'Assigned To',
    'Created At',
    'Updated At'
  ];
  
  const keys = [
    'id',
    'title',
    'description',
    'status',
    'severity',
    'priority',
    'project_name',
    'reporter_email',
    'assigned_email',
    'created_at',
    'updated_at'
  ];
  
  // Format data
  const formattedData = bugs.map(bug => ({
    ...bug,
    project_name: bug.project_name || 'N/A',
    reporter_email: bug.reporter_email || 'N/A',
    assigned_email: bug.assigned_email || 'Unassigned',
    created_at: bug.created_at ? new Date(bug.created_at).toLocaleString() : '',
    updated_at: bug.updated_at ? new Date(bug.updated_at).toLocaleString() : ''
  }));
  
  return arrayToCSV(formattedData, headers, keys);
};

/**
 * Generate test cases CSV
 */
const generateTestcasesCSV = (testcases) => {
  const headers = [
    'ID',
    'Title',
    'Description',
    'Status',
    'Priority',
    'Automated',
    'Project',
    'Created By',
    'Created At'
  ];
  
  const keys = [
    'id',
    'title',
    'description',
    'status',
    'priority',
    'automated',
    'project_name',
    'created_by_email',
    'created_at'
  ];
  
  // Format data
  const formattedData = testcases.map(tc => ({
    ...tc,
    automated: tc.automated ? 'Yes' : 'No',
    project_name: tc.project_name || 'N/A',
    created_by_email: tc.created_by_email || 'N/A',
    created_at: tc.created_at ? new Date(tc.created_at).toLocaleString() : ''
  }));
  
  return arrayToCSV(formattedData, headers, keys);
};

/**
 * Generate executions CSV
 */
const generateExecutionsCSV = (executions) => {
  const headers = [
    'Test Case',
    'Status',
    'Project',
    'Executed By',
    'Executed At',
    'Notes'
  ];
  
  const keys = [
    'testcase_title',
    'status',
    'project_name',
    'executed_by_email',
    'executed_at',
    'notes'
  ];
  
  // Format data
  const formattedData = executions.map(exec => ({
    ...exec,
    project_name: exec.project_name || 'N/A',
    executed_by_email: exec.executed_by_email || 'N/A',
    executed_at: exec.executed_at ? new Date(exec.executed_at).toLocaleString() : '',
    notes: exec.notes || ''
  }));
  
  return arrayToCSV(formattedData, headers, keys);
};

module.exports = {
  generateCSVReport,
  arrayToCSV
};
