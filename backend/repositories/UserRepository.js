/**
 * User Repository
 * Extends BaseRepository with user-specific database operations
 */

const BaseRepository = require('./BaseRepository');

class UserRepository extends BaseRepository {
  constructor(db) {
    super(db, 'users');
  }

  /**
   * Find user by email
   */
  async findByEmail(email) {
    return await this.findOne({ email });
  }

  /**
   * Find users by role
   */
  async findByRole(role) {
    return await this.findAll({ role });
  }

  /**
   * Update user's email verification status
   */
  async verifyEmail(userId) {
    return await this.update(userId, {
      email_verified: true,
      email_verification_token: null
    });
  }

  /**
   * Set password reset token
   */
  async setPasswordResetToken(userId, token, expiresAt) {
    return await this.update(userId, {
      password_reset_token: token,
      password_reset_expires: expiresAt
    });
  }

  /**
   * Clear password reset token
   */
  async clearPasswordResetToken(userId) {
    return await this.update(userId, {
      password_reset_token: null,
      password_reset_expires: null
    });
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId) {
    const sql = `
      SELECT 
        (SELECT COUNT(*) FROM testcases WHERE created_by = ?) as testcases_created,
        (SELECT COUNT(*) FROM bugs WHERE assigned_to = ?) as bugs_assigned,
        (SELECT COUNT(*) FROM execution_runs WHERE executed_by = ?) as executions_performed
    `;
    
    const results = await this.query(sql, [userId, userId, userId]);
    return results[0];
  }
}

module.exports = UserRepository;
