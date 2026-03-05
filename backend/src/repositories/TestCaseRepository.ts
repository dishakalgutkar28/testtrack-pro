import BaseRepository from './BaseRepository';
import { TestCase, TestCaseWithStats, FilterCriteria, PaginatedResult } from '../types';
import { DatabaseError } from '../utils/errors';
import { DatabaseConnection } from '../types';

/**
 * Test Case Repository
 * Specialized repository for test case operations
 * Extends BaseRepository with test-case-specific queries
 */
class TestCaseRepository extends BaseRepository<TestCase> {
  constructor(db: DatabaseConnection) {
    super('testcases', db);
  }

  /**
   * Find test cases by project with pagination
   * @param projectId Project ID
   * @param filters Additional filters
   * @param page Page number
   * @param limit Records per page
   * @returns Paginated test cases
   */
  async findByProject(
    projectId: number,
    filters: FilterCriteria = {},
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResult<TestCase>> {
    return this.paginate(
      { project_id: projectId, deleted_at: null, ...filters },
      page,
      limit
    );
  }

  /**
   * Search test cases by title or description
   * @param query Search query
   * @param projectId Optional project filter
   * @returns Matching test cases
   */
  async search(query: string, projectId?: number | null): Promise<TestCase[]> {
    return new Promise((resolve, reject) => {
      try {
        let sql = `
          SELECT * FROM testcases 
          WHERE (title LIKE ? OR description LIKE ?)
          AND deleted_at IS NULL
        `;
        const values: any[] = [`%${query}%`, `%${query}%`];

        if (projectId) {
          sql += ` AND project_id = ?`;
          values.push(projectId);
        }

        sql += ` ORDER BY created_at DESC LIMIT 50`;

        this.db.query(sql, values, (err: any, results: any) => {
          if (err) {
            reject(new DatabaseError(err.message));
          } else {
            resolve(results || []);
          }
        });
      } catch (error: any) {
        reject(new DatabaseError(error.message));
      }
    });
  }

  /**
   * Bulk update multiple test cases
   * @param ids Array of test case IDs
   * @param data Fields to update
   * @returns Number of affected rows
   */
  async bulkUpdate(ids: string[], data: Partial<TestCase>): Promise<number> {
    return new Promise((resolve, reject) => {
      try {
        const updates = Object.keys(data)
          .map((key) => `${key} = ?`)
          .join(', ');

        const placeholders = ids.map(() => '?').join(', ');
        const values = [...Object.values(data), ...ids];

        const sql = `UPDATE testcases SET ${updates} WHERE id IN (${placeholders})`;

        this.db.query(sql, values, (err: any, result: any) => {
          if (err) {
            reject(new DatabaseError(err.message));
          } else {
            resolve(result.affectedRows);
          }
        });
      } catch (error: any) {
        reject(new DatabaseError(error.message));
      }
    });
  }

  /**
   * Get test case with all associated test steps
   * @param id Test case ID
   * @returns Test case with steps array or null
   */
  async findWithSteps(id: string): Promise<(TestCase & { steps: any[]; step_count: number }) | null> {
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

        this.db.query(sql, [id], (err: any, results: any) => {
          if (err) {
            reject(new DatabaseError(err.message));
          } else if (!results || results.length === 0) {
            resolve(null);
          } else {
            // First row contains test case data
            const testcase = results[0];

            // Remaining rows contain steps (filter out null step_ids)
            const steps = results
              .filter((r: any) => r.step_id !== null)
              .map((r: any) => ({
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
      } catch (error: any) {
        reject(new DatabaseError(error.message));
      }
    });
  }

  /**
   * Get test cases with execution statistics
   * @param projectId Project ID
   * @param limit Records to return
   * @returns Test cases with execution stats
   */
  async findWithExecutionStats(projectId: number, limit: number = 20): Promise<TestCaseWithStats[]> {
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

        this.db.query(sql, [projectId, limit], (err: any, results: any) => {
          if (err) {
            reject(new DatabaseError(err.message));
          } else {
            resolve(results || []);
          }
        });
      } catch (error: any) {
        reject(new DatabaseError(error.message));
      }
    });
  }

  /**
   * Clone a test case with all its steps
   * @param originalId Original test case ID
   * @param cloneId New test case ID
   * @returns Success status
   */
  async cloneWithSteps(originalId: string, cloneId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        // Get original test case
        const sql1 = `SELECT * FROM testcases WHERE id = ?`;

        this.db.query(sql1, [originalId], (err1: any, testcases: any) => {
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

          this.db.query(sql2, values, (err2: any) => {
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

            this.db.query(sql3, [cloneId, originalId], (err3: any) => {
              if (err3) {
                return reject(new DatabaseError(err3.message));
              }
              resolve(true);
            });
          });
        });
      } catch (error: any) {
        reject(new DatabaseError(error.message));
      }
    });
  }

  /**
   * Get test cases by status
   * @param status Test case status
   * @param projectId Project ID
   * @returns Test cases with given status
   */
  async findByStatus(status: string, projectId: number): Promise<TestCase[]> {
    return this.findAll(
      { project_id: projectId, status, deleted_at: null },
      { orderBy: 'created_at DESC' }
    );
  }

  /**
   * Get recently updated test cases
   * @param projectId Project ID
   * @param days Number of days
   * @param limit Record limit
   * @returns Recent test cases
   */
  async findRecent(projectId: number, days: number = 7, limit: number = 10): Promise<TestCase[]> {
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

        this.db.query(sql, [projectId, days, limit], (err: any, results: any) => {
          if (err) {
            reject(new DatabaseError(err.message));
          } else {
            resolve(results || []);
          }
        });
      } catch (error: any) {
        reject(new DatabaseError(error.message));
      }
    });
  }
}

export default TestCaseRepository;
