/**
 * PDF Export Utility
 * Generate PDF reports using PDFKit
 */

const PDFDocument = require('pdfkit');
const logger = require('./logger');

/**
 * Generate PDF report
 * @param {string} reportType - Type of report (bugs, testcases, executions)
 * @param {Array} data - Data to include in report
 * @param {Object} filters - Applied filters
 * @returns {Promise<Buffer>} - PDF buffer
 */
const generatePDFReport = (reportType, data, filters = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Header
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .text('TestTrack Pro', { align: 'center' });
      
      doc.fontSize(16)
         .font('Helvetica')
         .text(getReportTitle(reportType), { align: 'center' })
         .moveDown();

      // Report metadata
      doc.fontSize(10)
         .font('Helvetica')
         .text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' })
         .text(`Total Records: ${data.length}`, { align: 'right' })
         .moveDown();

      // Filters section
      if (Object.keys(filters).length > 0) {
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('Applied Filters:')
           .fontSize(10)
           .font('Helvetica');
        
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            doc.text(`  ${key.replace(/_/g, ' ')}: ${value}`);
          }
        });
        doc.moveDown();
      }

      // Line separator
      doc.moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .stroke()
         .moveDown();

      // Data table based on report type
      switch (reportType) {
        case 'bugs':
          generateBugsTable(doc, data);
          break;
        case 'testcases':
          generateTestcasesTable(doc, data);
          break;
        case 'executions':
          generateExecutionsTable(doc, data);
          break;
        default:
          doc.text('Unsupported report type');
      }

      // Footer
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8)
           .font('Helvetica')
           .text(
             `Page ${i + 1} of ${pages.count}`,
             50,
             doc.page.height - 50,
             { align: 'center' }
           );
      }

      doc.end();
    } catch (error) {
      logger.error('Error generating PDF report', { error, reportType });
      reject(error);
    }
  });
};

/**
 * Get report title based on type
 */
const getReportTitle = (reportType) => {
  const titles = {
    bugs: 'Bug Report',
    testcases: 'Test Case Report',
    executions: 'Execution Summary Report'
  };
  return titles[reportType] || 'Report';
};

/**
 * Generate bugs table in PDF
 */
const generateBugsTable = (doc, bugs) => {
  doc.fontSize(12).font('Helvetica-Bold').text('Bug Details:').moveDown(0.5);
  
  bugs.forEach((bug, index) => {
    if (doc.y > 700) {
      doc.addPage();
    }
    
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text(`#${bug.id} - ${bug.title}`, { continued: false })
       .font('Helvetica')
       .fontSize(9)
       .text(`Status: ${bug.status}  |  Severity: ${bug.severity}  |  Priority: ${bug.priority}`)
       .text(`Project: ${bug.project_name || 'N/A'}`)
       .text(`Reporter: ${bug.reporter_email || 'N/A'}  |  Assigned: ${bug.assigned_email || 'Unassigned'}`)
       .text(`Created: ${new Date(bug.created_at).toLocaleDateString()}`)
       .moveDown(0.5);
    
    if (index < bugs.length - 1) {
      doc.moveTo(70, doc.y)
         .lineTo(530, doc.y)
         .strokeOpacity(0.3)
         .stroke()
         .strokeOpacity(1)
         .moveDown(0.5);
    }
  });
};

/**
 * Generate test cases table in PDF
 */
const generateTestcasesTable = (doc, testcases) => {
  doc.fontSize(12).font('Helvetica-Bold').text('Test Case Details:').moveDown(0.5);
  
  testcases.forEach((tc, index) => {
    if (doc.y > 700) {
      doc.addPage();
    }
    
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text(`#${tc.id} - ${tc.title}`, { continued: false })
       .font('Helvetica')
       .fontSize(9)
       .text(`Status: ${tc.status}  |  Priority: ${tc.priority}  |  Automated: ${tc.automated ? 'Yes' : 'No'}`)
       .text(`Project: ${tc.project_name || 'N/A'}`)
       .text(`Created By: ${tc.created_by_email || 'N/A'}`)
       .text(`Created: ${new Date(tc.created_at).toLocaleDateString()}`)
       .moveDown(0.5);
    
    if (index < testcases.length - 1) {
      doc.moveTo(70, doc.y)
         .lineTo(530, doc.y)
         .strokeOpacity(0.3)
         .stroke()
         .strokeOpacity(1)
         .moveDown(0.5);
    }
  });
};

/**
 * Generate executions table in PDF
 */
const generateExecutionsTable = (doc, executions) => {
  doc.fontSize(12).font('Helvetica-Bold').text('Execution Details:').moveDown(0.5);
  
  // Summary statistics
  const passed = executions.filter(e => e.status === 'passed').length;
  const failed = executions.filter(e => e.status === 'failed').length;
  const blocked = executions.filter(e => e.status === 'blocked').length;
  const skipped = executions.filter(e => e.status === 'skipped').length;
  
  doc.fontSize(10)
     .font('Helvetica')
     .text(`Summary: Passed: ${passed}, Failed: ${failed}, Blocked: ${blocked}, Skipped: ${skipped}`)
     .moveDown();
  
  executions.forEach((exec, index) => {
    if (doc.y > 700) {
      doc.addPage();
    }
    
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text(exec.testcase_title, { continued: false })
       .font('Helvetica')
       .fontSize(9)
       .text(`Status: ${exec.status}`)
       .text(`Project: ${exec.project_name || 'N/A'}`)
       .text(`Executed By: ${exec.executed_by_email || 'N/A'}`)
       .text(`Executed At: ${new Date(exec.executed_at).toLocaleString()}`)
       .moveDown(0.5);
    
    if (index < executions.length - 1) {
      doc.moveTo(70, doc.y)
         .lineTo(530, doc.y)
         .strokeOpacity(0.3)
         .stroke()
         .strokeOpacity(1)
         .moveDown(0.5);
    }
  });
};

module.exports = {
  generatePDFReport
};
