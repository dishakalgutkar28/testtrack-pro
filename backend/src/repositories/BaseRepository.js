const { DatabaseError, DuplicateError } = require('../utils/errors');

/**
 * Base Repository Class
 * All repositories should extend this class
 * Provides CRUD and common database operations
 */
class BaseRepository {
  /**
   * @param {string} tableName - Name of the database table
   * @param {Object} db - MySQL database connection
   */
  constructor(tableName, db) {
    this.tableName = tableName;
    this.db = db;
  }

  /**
   * Find all records with filters, ordering, and pagination
   * @param {Object} filters - WHERE clause filters {column: value}
   * @param {Object} options - {orderBy, limit, offset}
   * @returns {Promise<Array>} Array of records
   */
  async findAll(filters = {}, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        let query = `SELECT * FROM ${this.tableName}`;
        const values = [];

        // Build WHERE clause from filters
        const whereConditions = [];
        for (const [key, value] of Object.entries(filters)) {
          if (value !== null && value !== undefined) {
            whereConditions.push(`${key} = ?`);
            values.push(value);
          }
        }

        if (whereConditions.length > 0) {
          query += ` WHERE ${whereConditions.join(' AND ')}`;
        }

        // Add ordering
        if (options.orderBy) {
          query += ` ORDER BY ${options.orderBy}`;
        }

        // Add pagination
        if (options.limit) {
          query += ` LIMIT ${parseInt(options.limit)}`;
          if (options.offset) {
            query += ` OFFSET ${parseInt(options.offset)}`;
          }
        }

        this.db.query(query, values, (err, results) => {
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
   * Find single record by ID
   * @param {*} id - Record ID
   * @returns {Promise<Object|null>} Record or null
   */
  async findById(id) {
    return new Promise((resolve, reject) => {
      this.db.query(
        `SELECT * FROM ${this.tableName} WHERE id = ?`,
        [id],
        (err, results) => {
          if (err) {
            reject(new DatabaseError(err.message));
          } else {
            resolve(results?.[0] || null);
          }
        }
      );
    });
  }

  /**
   * Find one record matching criteria
   * @param {Object} criteria - WHERE clause {column: value}
   * @returns {Promise<Object|null>} Single record or null
   */
  async findOne(criteria) {
    return new Promise((resolve, reject) => {
      try {
        const columns = Object.keys(criteria);
        const values = Object.values(criteria);
        const whereClause = columns.map(col => `${col} = ?`).join(' AND ');

        this.db.query(
          `SELECT * FROM ${this.tableName} WHERE ${whereClause}`,
          values,
          (err, results) => {
            if (err) {
              reject(new DatabaseError(err.message));
            } else {
              resolve(results?.[0] || null);
            }
          }
        );
      } catch (error) {
        reject(new DatabaseError(error.message));
      }
    });
  }

  /**
   * Create new record
   * @param {Object} data - Record data {column: value}
   * @returns {Promise<Object>} Created record with inserted ID
   */
  async create(data) {
    return new Promise((resolve, reject) => {
      try {
        const columns = Object.keys(data);
        const placeholders = columns.map(() => '?').join(', ');
        const values = Object.values(data);

        this.db.query(
          `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
          values,
          (err, result) => {
            if (err) {
              if (err.code === 'ER_DUP_ENTRY') {
                reject(new DuplicateError('Record already exists'));
              } else {
                reject(new DatabaseError(err.message));
              }
            } else {
              resolve({ id: result.insertId, ...data });
            }
          }
        );
      } catch (error) {
        reject(new DatabaseError(error.message));
      }
    });
  }

  /**
   * Update record by ID
   * @param {*} id - Record ID
   * @param {Object} data - Updated fields {column: value}
   * @returns {Promise<boolean>} True if updated, false otherwise
   */
  async update(id, data) {
    return new Promise((resolve, reject) => {
      try {
        const columns = Object.keys(data);
        const updates = columns.map(col => `${col} = ?`).join(', ');
        const values = [...Object.values(data), id];

        this.db.query(
          `UPDATE ${this.tableName} SET ${updates} WHERE id = ?`,
          values,
          (err, result) => {
            if (err) {
              reject(new DatabaseError(err.message));
            } else {
              resolve(result.affectedRows > 0);
            }
          }
        );
      } catch (error) {
        reject(new DatabaseError(error.message));
      }
    });
  }

  /**
   * Soft delete - mark record as deleted without removing it
   * @param {*} id - Record ID
   * @returns {Promise<boolean>} True if updated, false otherwise
   */
  async softDelete(id) {
    return this.update(id, { deleted_at: new Date() });
  }

  /**
   * Hard delete - permanently remove record from database
   * @param {*} id - Record ID
   * @returns {Promise<boolean>} True if deleted, false otherwise
   */
  async delete(id) {
    return new Promise((resolve, reject) => {
      try {
        this.db.query(
          `DELETE FROM ${this.tableName} WHERE id = ?`,
          [id],
          (err, result) => {
            if (err) {
              reject(new DatabaseError(err.message));
            } else {
              resolve(result.affectedRows > 0);
            }
          }
        );
      } catch (error) {
        reject(new DatabaseError(error.message));
      }
    });
  }

  /**
   * Count records matching filters
   * @param {Object} filters - WHERE clause filters {column: value}
   * @returns {Promise<number>} Count of matching records
   */
  async count(filters = {}) {
    return new Promise((resolve, reject) => {
      try {
        let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
        const values = [];

        const whereConditions = [];
        for (const [key, value] of Object.entries(filters)) {
          if (value !== null && value !== undefined) {
            whereConditions.push(`${key} = ?`);
            values.push(value);
          }
        }

        if (whereConditions.length > 0) {
          query += ` WHERE ${whereConditions.join(' AND ')}`;
        }

        this.db.query(query, values, (err, results) => {
          if (err) {
            reject(new DatabaseError(err.message));
          } else {
            resolve(results?.[0]?.count || 0);
          }
        });
      } catch (error) {
        reject(new DatabaseError(error.message));
      }
    });
  }

  /**
   * Paginate results with automatic total count
   * @param {Object} filters - WHERE clause filters
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Records per page
   * @returns {Promise<Object>} {data: [], pagination: {...}}
   */
  async paginate(filters = {}, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      
      const [data, total] = await Promise.all([
        this.findAll(filters, { limit, offset, orderBy: 'id DESC' }),
        this.count(filters)
      ]);

      const pages = Math.ceil(total / limit);

      return {
        data,
        pagination: {
          total,
          page,
          limit,
          pages,
          hasNext: page < pages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw new DatabaseError(error.message);
    }
  }

  /**
   * Execute raw SQL query
   * @param {string} sql - SQL query
   * @param {Array} values - Query parameters
   * @returns {Promise<Array>} Query results
   */
  async query(sql, values = []) {
    return new Promise((resolve, reject) => {
      this.db.query(sql, values, (err, results) => {
        if (err) {
          reject(new DatabaseError(err.message));
        } else {
          resolve(results);
        }
      });
    });
  }
}

module.exports = BaseRepository;
