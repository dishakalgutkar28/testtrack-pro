/**
 * Database Abstraction Layer
 * Base Repository class for common database operations
 * Provides promise-based interface for MySQL queries
 */

const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

class BaseRepository {
  constructor(db, tableName) {
    this.db = db;
    this.tableName = tableName;
  }

  /**
   * Execute a query and return promise
   */
  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.query(sql, params, (err, results) => {
        if (err) {
          logger.error(`Database query error in ${this.tableName}`, {
            sql: sql.substring(0, 100),
            error: err.message
          });
          reject(this.handleDatabaseError(err));
          return;
        }
        resolve(results);
      });
    });
  }

  /**
   * Find all records
   */
  async findAll(conditions = {}, limit = null, offset = 0) {
    try {
      let sql = `SELECT * FROM ${this.tableName}`;
      const params = [];

      // Add WHERE clause if conditions provided
      if (Object.keys(conditions).length > 0) {
        const whereClauses = Object.keys(conditions).map(key => `${key} = ?`);
        sql += ` WHERE ${whereClauses.join(' AND ')}`;
        params.push(...Object.values(conditions));
      }

      // Add LIMIT and OFFSET
      if (limit) {
        sql += ` LIMIT ? OFFSET ?`;
        params.push(limit, offset);
      }

      return await this.query(sql, params);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find one record by ID
   */
  async findById(id) {
    try {
      const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
      const results = await this.query(sql, [id]);
      
      if (!results || results.length === 0) {
        return null;
      }
      
      return results[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find one record by conditions
   */
  async findOne(conditions) {
    try {
      const whereClauses = Object.keys(conditions).map(key => `${key} = ?`);
      const sql = `SELECT * FROM ${this.tableName} WHERE ${whereClauses.join(' AND ')} LIMIT 1`;
      const params = Object.values(conditions);
      
      const results = await this.query(sql, params);
      return results[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Insert a new record
   */
  async create(data) {
    try {
      const columns = Object.keys(data);
      const placeholders = columns.map(() => '?').join(', ');
      const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
      const params = Object.values(data);
      
      const result = await this.query(sql, params);
      
      // Return the newly created record
      return await this.findById(result.insertId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update a record by ID
   */
  async update(id, data) {
    try {
      const columns = Object.keys(data);
      const setClauses = columns.map(col => `${col} = ?`).join(', ');
      const sql = `UPDATE ${this.tableName} SET ${setClauses} WHERE id = ?`;
      const params = [...Object.values(data), id];
      
      await this.query(sql, params);
      
      // Return the updated record
      return await this.findById(id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a record by ID
   */
  async delete(id) {
    try {
      const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
      const result = await this.query(sql, [id]);
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Count records
   */
  async count(conditions = {}) {
    try {
      let sql = `SELECT COUNT(*) as total FROM ${this.tableName}`;
      const params = [];

      if (Object.keys(conditions).length > 0) {
        const whereClauses = Object.keys(conditions).map(key => `${key} = ?`);
        sql += ` WHERE ${whereClauses.join(' AND ')}`;
        params.push(...Object.values(conditions));
      }

      const results = await this.query(sql, params);
      return results[0].total;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if record exists
   */
  async exists(conditions) {
    try {
      const count = await this.count(conditions);
      return count > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Handle database errors
   */
  handleDatabaseError(err) {
    // Duplicate entry error
    if (err.code === 'ER_DUP_ENTRY') {
      return new AppError('DUPLICATE_ENTRY', 'A record with this data already exists');
    }
    
    // Foreign key constraint error
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return new AppError('INVALID_INPUT', 'Referenced record does not exist');
    }
    
    // Table doesn't exist
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return new AppError('DATABASE_ERROR', 'Database table not found');
    }
    
    // Generic database error
    return new AppError('DATABASE_ERROR', 'A database error occurred');
  }

  /**
   * Execute a transaction
   */
  async transaction(callback) {
    return new Promise((resolve, reject) => {
      this.db.beginTransaction(async (err) => {
        if (err) {
          logger.error('Failed to begin transaction', { error: err.message });
          reject(new AppError('DATABASE_ERROR', 'Failed to begin transaction'));
          return;
        }

        try {
          const result = await callback(this.db);
          
          this.db.commit((commitErr) => {
            if (commitErr) {
              logger.error('Failed to commit transaction', { error: commitErr.message });
              this.db.rollback(() => {
                reject(new AppError('DATABASE_ERROR', 'Failed to commit transaction'));
              });
              return;
            }
            
            resolve(result);
          });
        } catch (error) {
          logger.error('Transaction error, rolling back', { error: error.message });
          this.db.rollback(() => {
            reject(error);
          });
        }
      });
    });
  }
}

module.exports = BaseRepository;
