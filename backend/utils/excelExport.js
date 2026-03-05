/**
 * Excel Export Utility
 * Generate Excel reports using ExcelJS
 */

const ExcelJS = require('exceljs');
const logger = require('./logger');

/**
 * Generate Excel report
 * @param {string} reportType - Type of report (bugs, testcases, executions)
 * @param {Array} data - Data to include in report
 * @returns {Promise<Buffer>} - Excel buffer
 */
const generateExcelReport = async (reportType, data) => {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'TestTrack Pro';
    workbook.created = new Date();
    
    const worksheet = workbook.addWorksheet(getSheetName(reportType));
    
    // Style for header row
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0070C0' } },
      alignment: { vertical: 'middle', horizontal: 'center' },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    };
    
    // Generate columns and rows based on report type
    switch (reportType) {
      case 'bugs':
        setupBugsWorksheet(worksheet, data, headerStyle);
        break;
      case 'testcases':
        setupTestcasesWorksheet(worksheet, data, headerStyle);
        break;
      case 'executions':
        setupExecutionsWorksheet(worksheet, data, headerStyle);
        break;
      default:
        throw new Error('Unsupported report type');
    }
    
    // Auto-fit columns
    worksheet.columns.forEach(column => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: false }, cell => {
        const cellLength = cell.value ? cell.value.toString().length : 10;
        if (cellLength > maxLength) {
          maxLength = Math.min(cellLength, 50);
        }
      });
      column.width = maxLength + 2;
    });
    
    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  } catch (error) {
    logger.error('Error generating Excel report', { error, reportType });
    throw error;
  }
};

/**
 * Get sheet name based on report type
 */
const getSheetName = (reportType) => {
  const names = {
    bugs: 'Bug Report',
    testcases: 'Test Cases',
    executions: 'Execution Summary'
  };
  return names[reportType] || 'Report';
};

/**
 * Setup bugs worksheet
 */
const setupBugsWorksheet = (worksheet, bugs, headerStyle) => {
  // Define columns
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 8 },
    { header: 'Title', key: 'title', width: 30 },
    { header: 'Description', key: 'description', width: 40 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Severity', key: 'severity', width: 12 },
    { header: 'Priority', key: 'priority', width: 12 },
    { header: 'Project', key: 'project_name', width: 20 },
    { header: 'Reporter', key: 'reporter_email', width: 25 },
    { header: 'Assigned To', key: 'assigned_email', width: 25 },
    { header: 'Created At', key: 'created_at', width: 18 },
    { header: 'Updated At', key: 'updated_at', width: 18 }
  ];
  
  // Apply header style
  worksheet.getRow(1).eachCell(cell => {
    cell.style = headerStyle;
  });
  
  // Add data
  bugs.forEach(bug => {
    worksheet.addRow({
      id: bug.id,
      title: bug.title,
      description: bug.description || '',
      status: bug.status,
      severity: bug.severity,
      priority: bug.priority,
      project_name: bug.project_name || 'N/A',
      reporter_email: bug.reporter_email || 'N/A',
      assigned_email: bug.assigned_email || 'Unassigned',
      created_at: bug.created_at ? new Date(bug.created_at).toLocaleString() : '',
      updated_at: bug.updated_at ? new Date(bug.updated_at).toLocaleString() : ''
    });
  });
  
  // Add alternating row colors
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1 && rowNumber % 2 === 0) {
      row.eachCell(cell => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF0F0F0' }
        };
      });
    }
  });
};

/**
 * Setup test cases worksheet
 */
const setupTestcasesWorksheet = (worksheet, testcases, headerStyle) => {
  // Define columns
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 8 },
    { header: 'Title', key: 'title', width: 30 },
    { header: 'Description', key: 'description', width: 40 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Priority', key: 'priority', width: 12 },
    { header: 'Automated', key: 'automated', width: 12 },
    { header: 'Project', key: 'project_name', width: 20 },
    { header: 'Created By', key: 'created_by_email', width: 25 },
    { header: 'Created At', key: 'created_at', width: 18 }
  ];
  
  // Apply header style
  worksheet.getRow(1).eachCell(cell => {
    cell.style = headerStyle;
  });
  
  // Add data
  testcases.forEach(tc => {
    worksheet.addRow({
      id: tc.id,
      title: tc.title,
      description: tc.description || '',
      status: tc.status,
      priority: tc.priority,
      automated: tc.automated ? 'Yes' : 'No',
      project_name: tc.project_name || 'N/A',
      created_by_email: tc.created_by_email || 'N/A',
      created_at: tc.created_at ? new Date(tc.created_at).toLocaleString() : ''
    });
  });
  
  // Add alternating row colors
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1 && rowNumber % 2 === 0) {
      row.eachCell(cell => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF0F0F0' }
        };
      });
    }
  });
};

/**
 * Setup executions worksheet
 */
const setupExecutionsWorksheet = (worksheet, executions, headerStyle) => {
  // Define columns
  worksheet.columns = [
    { header: 'Test Case', key: 'testcase_title', width: 30 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Project', key: 'project_name', width: 20 },
    { header: 'Executed By', key: 'executed_by_email', width: 25 },
    { header: 'Executed At', key: 'executed_at', width: 18 },
    { header: 'Notes', key: 'notes', width: 40 }
  ];
  
  // Apply header style
  worksheet.getRow(1).eachCell(cell => {
    cell.style = headerStyle;
  });
  
  // Add data
  executions.forEach(exec => {
    const row = worksheet.addRow({
      testcase_title: exec.testcase_title,
      status: exec.status,
      project_name: exec.project_name || 'N/A',
      executed_by_email: exec.executed_by_email || 'N/A',
      executed_at: exec.executed_at ? new Date(exec.executed_at).toLocaleString() : '',
      notes: exec.notes || ''
    });
    
    // Color code status
    const statusCell = row.getCell('status');
    switch (exec.status) {
      case 'passed':
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF00B050' }
        };
        statusCell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        break;
      case 'failed':
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFF0000' }
        };
        statusCell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        break;
      case 'blocked':
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFC000' }
        };
        statusCell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        break;
    }
  });
  
  // Add summary at the top
  worksheet.insertRow(1, ['Execution Summary Report']);
  worksheet.getRow(1).font = { size: 14, bold: true };
  worksheet.mergeCells('A1:F1');
  worksheet.getRow(1).alignment = { horizontal: 'center' };
  
  const passed = executions.filter(e => e.status === 'passed').length;
  const failed = executions.filter(e => e.status === 'failed').length;
  const blocked = executions.filter(e => e.status === 'blocked').length;
  const skipped = executions.filter(e => e.status === 'skipped').length;
  
  worksheet.insertRow(2, ['']);
  worksheet.insertRow(3, ['Summary:', `Passed: ${passed}, Failed: ${failed}, Blocked: ${blocked}, Skipped: ${skipped}`]);
  worksheet.mergeCells('B3:F3');
  worksheet.insertRow(4, ['']);
};

module.exports = {
  generateExcelReport
};
