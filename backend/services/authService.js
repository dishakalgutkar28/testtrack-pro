/**
 * Authentication Service
 * Business logic for authentication operations
 * Separates business logic from route handlers
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { config } = require('../config/env');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class AuthService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Register a new user
   */
  async register(userData) {
    const { name, email, password, role = 'tester' } = userData;

    try {
      // Validate input
      if (!name || !email || !password) {
        throw new AppError('MISSING_REQUIRED_FIELD', 'Name, email, and password are required');
      }

      if (password.length < 8) {
        throw new AppError('PASSWORD_TOO_WEAK');
      }

      // Check if user already exists
      const existingUser = await this.findUserByEmail(email);
      if (existingUser) {
        throw new AppError('EMAIL_ALREADY_EXISTS');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into database
      const query = `
        INSERT INTO users (name, email, password, role) 
        VALUES (?, ?, ?, ?)
      `;

      return new Promise((resolve, reject) => {
        this.db.query(query, [name, email, hashedPassword, role], (err, result) => {
          if (err) {
            logger.error('Registration failed', { email, error: err.message });
            if (err.code === 'ER_DUP_ENTRY') {
              reject(new AppError('EMAIL_ALREADY_EXISTS'));
            } else {
              reject(new AppError('DATABASE_ERROR', 'Failed to create user'));
            }
            return;
          }

          logger.info('User registered successfully', { userId: result.insertId, email });
          resolve({
            id: result.insertId,
            name,
            email,
            role
          });
        });
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Unexpected error in register', { error: error.message });
      throw new AppError('INTERNAL_SERVER_ERROR');
    }
  }

  /**
   * Login user
   */
  async login(email, password) {
    try {
      // Validate input
      if (!email || !password) {
        throw new AppError('MISSING_REQUIRED_FIELD', 'Email and password are required');
      }

      // Find user
      const user = await this.findUserByEmail(email);
      if (!user) {
        throw new AppError('INVALID_CREDENTIALS');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new AppError('INVALID_CREDENTIALS');
      }

      // Check if email is verified (optional)
      if (user.email_verified === 0) {
        logger.warn('Login attempt with unverified email', { email });
        // Uncomment to enforce email verification
        // throw new AppError('EMAIL_NOT_VERIFIED');
      }

      // Generate JWT token
      const token = this.generateToken(user);
      const refreshToken = this.generateRefreshToken(user);

      logger.info('User logged in successfully', { userId: user.id, email });

      return {
        success: true,
        token,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Unexpected error in login', { email, error: error.message });
      throw new AppError('INTERNAL_SERVER_ERROR');
    }
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM users WHERE email = ?';
      this.db.query(query, [email], (err, results) => {
        if (err) {
          logger.error('Database error in findUserByEmail', { email, error: err.message });
          reject(new AppError('DATABASE_ERROR'));
          return;
        }
        resolve(results[0] || null);
      });
    });
  }

  /**
   * Find user by ID
   */
  async findUserById(id) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT id, name, email, role, email_verified FROM users WHERE id = ?';
      this.db.query(query, [id], (err, results) => {
        if (err) {
          logger.error('Database error in findUserById', { id, error: err.message });
          reject(new AppError('DATABASE_ERROR'));
          return;
        }
        
        if (!results[0]) {
          reject(new AppError('USER_NOT_FOUND'));
          return;
        }
        
        resolve(results[0]);
      });
    });
  }

  /**
   * Generate JWT access token
   */
  generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiry }
    );
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiry }
    );
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AppError('TOKEN_EXPIRED');
      }
      throw new AppError('TOKEN_INVALID');
    }
  }
}

module.exports = AuthService;
