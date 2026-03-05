const BaseRepository = require('./BaseRepository');
const { DatabaseError } = require('../utils/errors');

/**
 * Test Case Repository
 * Specialized repository for test case operations
 * Extends BaseRepository with test-case-specific queries
 */
class TestCaseRepository extends BaseRepository {
  /**
   * @param {Object} db - MySQL database connection
   */
  constructor(db) {
    super('testcases', db);
  }

  /**
   * Find test cases by project with pagination
   * @param {number} projectId - Project ID
   * @param {Object} filters - Additional filters
   * @param {number} page - Page number
   * @param {number} limit - Records per page
   * @returns {Promise<Object>} Paginated results
   */
  async findByProject(projectId, filters = {}, page = 1, limit = 20) {
    return this.paginate(
      { project_id: projectId, deleted_at: null, ...filters },
      page,
      limit
    );
  }

  /**
   * Search test cases by title or description
   * @param {string} query - Search query
   * @param {number} projectId - Optional project filter
   * @returns {Promise<Array>} Matching test cases
   */
  async search(query, projectId = null) {
    return new Promise((resolve, reject) => {
      try {
        let sql = `
          SELECT * FROM testcases 
          WHERE (title LIKE ? OR description LIKE ?)
          AND deleted_at IS NULL
        `;
        const values = [`%${query}%`, `%${query}%`];

        if (projectId) {
          sql += ` AND project_id = ?`;
          values.push(projectId);
        }

        sql += ` ORDER BY created_at DESC LIMIT 50`;

        this.db.query(sql, values, (err, results) => {
          if (err) {
            reject(new DatabaseError(err.message));
          } else {
            resolve(results || []);
          }
        });
      } catch (error) {
        reject(new DatabaseError(error.message));
      }
    });
  }

  /**
   * Bulk update multiple test cases
   * @param {Array} ids - Array of test case IDs
   * @param {Object} data - Fields to update
   * @returns {Promise<number>} Number of affected rows
   */
  async bulkUpdate(ids, data) {
    return new Promise((resolve, reject) => {
      try {
        const updates = Object.keys(data)
          .map(key => `${key} = ?`)
          .join(', ');
        
        const placeholders = ids.map(() => '?').join(', ');
        const values = [...Object.values(data), ...ids];

        const sql = `UPDATE testcases SET ${updates} WHERE id IN (${placeholders})`;

        this.db.query(sql, values, (err, result) => {
          if (err) {
            reject(new DatabaseError(err.message));
          } else {
            resolve(result.affectedRows);
          }
        });
      } catch (error) {
        reject(new DatabaseError(error.message));
      }
    });
  }

  /**
   * Get test case with all associated test steps
   * @param {string} id - Test case ID
   * @returns {Promise<Object|null>} Test case with steps array
   */
  async findWithSteps(id) {
    return new Promise((resolve, reject) => {
      try {
        const sql = `
          SELECT tc.*, 
                 ts.id as step_id, ts.step_number, ts.action, 
                 ts.test_data, ts.expected_result
          FROM testcases tc
          LEFT JOIN test_steps ts ON ts.testcase_id = tc.id
          WHERE tc.id = ? AND tc.deleted_at IS NULL
          ORDER BY ts.step_number ASC
        `;

        this.db.query(sql, [id], (err, results) => {
          if (err) {
            reject(new DatabaseError(err.message));
          } else if (!results || results.length === 0) {
            resolve(null);
          } else {
            // First row contains test case data
            const testcase = results[0];
            
            // Remaining rows contain steps (filter out null step_ids)
            const steps = results
              .filter(r => r.step_id !== null)
              .map(r => ({
                step_id: r.step_id,
                step_number: r.step_number,
                action: r.action,
                test_data: r.test_data,
                expected_result: r.expected_result
              }));
            
            // Construct response object
            resolve({
              ...testcase,
              steps,
              step_count: steps.length
            });
          }
        });
      } catch (error) {
        reject(new DatabaseError(error.message));
      }
    });
  }

  /**
   * Get test cases with execution statistics
   * @param {number} projectId - Project ID
   * @param {number} limit - Records to return
   * @returns {Promise<Array>} Test cases with execution stats
   */
  async findWithExecutionStats(projectId, limit = 20) {
    return new Promise((resolve, reject) => {
      try {
        const sql = `
          SELECT 
            tc.*,
            COUNT(DISTINCT te.id) as execution_count,
            SUM(CASE WHEN te.status = 'pass' THEN 1 ELSE 0 END) as pass_count,
            SUM(CASE WHEN te.status = 'fail' THEN 1 ELSE 0 END) as fail_count,
            ROUND(
              SUM(CASE WHEN te.status = 'pass' THEN 1 ELSE 0 END) * 100.0 / 
              NULLIF(COUNT(DISTINCT te.id), 0), 2
            ) as pass_rate
          FROM testcases tc
          LEFT JOIN executions te ON te.testcase_id = tc.id
          WHERE tc.project_id = ? AND tc.deleted_at IS NULL
          GROUP BY tc.id
          ORDER BY tc.created_at DESC
          LIMIT ?
        `;

        this.db.query(sql, [projectId, limit], (err, results) => {
          if (err) {
            reject(new DatabaseError(err.message));
          } else {
            resolve(results || []);
          }
        });
      } catch (error) {
        reject(new DatabaseError(error.message));
      }
    });
  }

  /**
   * Clone a test case with all its steps
   * @param {string} originalId - Original test case ID
   * @param {string} cloneId - New test case ID
   * @returns {Promise<boolean>} Success status
   */
  async cloneWithSteps(originalId, cloneId) {
    return new Promise((resolve, reject) => {
      try {
        // Get original test case
        const sql1 = `SELECT * FROM testcases WHERE id = ?`;
        
        this.db.query(sql1, [originalId], (err1, testcases) => {
          if (err1) {
            return reject(new DatabaseError(err1.message));
          }

          if (!testcases || testcases.length === 0) {
            return reject(new DatabaseError('Original test case not found'));
          }

          const original = testcases[0];

          // Insert cloned test case
          const cloneData = {
            ...original,
            id: cloneId,
            version: 1
          };

          const columns = Object.keys(cloneData);
          const placeholders = columns.map(() => '?').join(', ');
          const values = Object.values(cloneData);

          const sql2 = `INSERT INTO testcases (${columns.join(', ')}) VALUES (${placeholders})`;

          this.db.query(sql2, values, (err2) => {
            if (err2) {
              return reject(new DatabaseError(err2.message));
            }

            // Clone steps
            const sql3 = `
              INSERT INTO test_steps (testcase_id, step_number, action, test_data, expected_result)
              SELECT ?, step_number, action, test_data, expected_result
              FROM test_steps
              WHERE testcase_id = ?
            `;

            this.db.query(sql3, [cloneId, originalId], (err3) => {
              if (err3) {
                return reject(new DatabaseError(err3.message));
              }
              resolve(true);
            });
          });
        });
      } catch (error) {
        reject(new DatabaseError(error.message));
      }
    });
  }

  /**
   * Get test cases by status
   * @param {string} status - Test case status
   * @param {number} projectId - Project ID
   * @returns {Promise<Array>} Test cases with given status
   */
  async findByStatus(status, projectId) {
    return this.findAll(
      { project_id: projectId, status, deleted_at: null },
      { orderBy: 'created_at DESC' }
    );
  }

  /**
   * Get recently updated test cases
   * @param {number} projectId - Project ID
   * @param {number} days - Number of days
   * @param {number} limit - Record limit
   * @returns {Promise<Array>} Recent test cases
   */
  async findRecent(projectId, days = 7, limit = 10) {
    return new Promise((resolve, reject) => {
      try {
        const sql = `
          SELECT * FROM testcases
          WHERE project_id = ? 
          AND deleted_at IS NULL
          AND updated_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
          ORDER BY updated_at DESC
          LIMIT ?
        `;

        this.db.query(sql, [projectId, days, limit], (err, results) => {
          if (err) {
            reject(new DatabaseError(err.message));
          } else {
            resolve(results || []);
          }
        });
      } catch (error) {
        reject(new DatabaseError(error.message));
      }
    });
  }
}

module.exports = TestCaseRepository;
