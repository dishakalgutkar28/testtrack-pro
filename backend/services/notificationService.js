/**
 * Notification Service
 * Handles creation of notifications across the system
 * Automatically triggers when bugs, projects, or comments are created/updated
 */

const db = require("../config/db");
const logger = require("../utils/logger");
const { sendEmail } = require("../utils/emailService");

function userExists(userId) {
  return new Promise(resolve => {
    if (!userId) {
      resolve(false);
      return;
    }
    db.query("SELECT id FROM users WHERE id = ? LIMIT 1", [userId], (err, results) => {
      resolve(!err && results.length > 0);
    });
  });
}

function getUserById(userId) {
  return new Promise((resolve, reject) => {
    db.query("SELECT id, email FROM users WHERE id = ? LIMIT 1", [userId], (err, results) => {
      if (err) return reject(err);
      resolve(results && results[0] ? results[0] : null);
    });
  });
}

class NotificationService {
  static async sendEmailNotification({ toEmail, title, message, link = null }) {
    try {
      if (!toEmail) return;

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const appLink = link ? `${frontendUrl}${link}` : `${frontendUrl}/notifications`;

      const subject = `[TestTrack Pro] ${title}`;
      const text = `${title}\n\n${message}\n\nOpen in TestTrack Pro: ${appLink}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; line-height: 1.5;">
          <h2 style="margin: 0 0 12px; color: #1f2937;">${title}</h2>
          <p style="margin: 0 0 16px; color: #374151;">${message}</p>
          <a href="${appLink}" style="display: inline-block; padding: 10px 16px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px;">
            Open in TestTrack Pro
          </a>
          <p style="margin-top: 16px; font-size: 12px; color: #6b7280;">You are receiving this email because notification alerts are enabled for your account.</p>
        </div>
      `;

      await sendEmail(toEmail, subject, html, text);
    } catch (error) {
      logger.error("Failed to send notification email", { error: error.message, toEmail, title });
    }
  }

  /**
   * Send a notification to a user
   * @param {Object} options - Notification options
   * @returns {Promise} - Resolves when notification is created
   */
  static async sendNotification(options) {
    const { userId, type, title, message, link = null, senderId = null } = options;

    // Validation
    if (!userId || !type || !title || !message) {
      throw new Error("Missing required notification fields");
    }

    return new Promise(async (resolve, reject) => {
      const recipient = await getUserById(userId);
      if (!recipient) {
        logger.warn("Recipient user not found, skipping notification", { userId, type });
        return resolve({ success: false, reason: "Recipient not found" });
      }

      const sql = `
        INSERT INTO notifications (user_id, sender_id, type, title, message, link)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      // Using NULL for senderId if not provided (handles foreign key constraint)
      let validatedSenderId = senderId || null;
      if (validatedSenderId) {
        const senderExists = await userExists(validatedSenderId);
        if (!senderExists) {
          logger.warn("Sender user not found, using NULL", { senderId: validatedSenderId, userId, type });
          validatedSenderId = null;
        }
      }

      db.query(sql, [userId, validatedSenderId, type, title, message, link], (err, result) => {
        if (err) {
          // If error is FK constraint on sender_id, retry with NULL sender_id
          if (err.code === "ER_NO_REFERENCED_ROW_2" && validatedSenderId) {
            logger.warn("Sender ID invalid, retrying with NULL sender_id", { senderId: validatedSenderId, userId, type });
            db.query(sql, [userId, null, type, title, message, link], (retryErr, retryResult) => {
              if (retryErr) {
                logger.error("Failed to create notification even with NULL sender", { error: retryErr, userId, type });
                return reject(retryErr);
              }
              logger.info("Notification sent (with NULL sender)", {
                notificationId: retryResult.insertId,
                userId,
                type,
                title
              });
              resolve({ success: true, notificationId: retryResult.insertId });

              this.sendEmailNotification({
                toEmail: recipient.email,
                title,
                message,
                link
              });
            });
          } else {
            logger.error("Failed to create notification", { error: err, userId, type });
            reject(err);
          }
          return;
        }

        logger.info("Notification sent", {
          notificationId: result.insertId,
          userId,
          type,
          title
        });

        resolve({ success: true, notificationId: result.insertId });

        this.sendEmailNotification({
          toEmail: recipient.email,
          title,
          message,
          link
        });
      });
    });
  }

  /**
   * Notify when a bug is assigned to someone
   * @param {number} bugId - Bug ID
   * @param {number} assigneeId - User ID of assignee
   * @param {number} assignedBy - User ID who assigned it
   * @param {string} bugTitle - Bug title
   */
  static async notifyBugAssignment(bugId, assigneeId, assignedBy, bugTitle) {
    try {
      await this.sendNotification({
        userId: assigneeId,
        senderId: assignedBy,
        type: "bug_assigned",
        title: "Bug Assigned to You",
        message: `You have been assigned bug: "${bugTitle}"`,
        link: `/bugs/${bugId}`
      });

      logger.info("Bug assignment notification sent", { bugId, assigneeId });
    } catch (error) {
      logger.error("Failed to send bug assignment notification", { error });
    }
  }

  /**
   * Notify when bug status changes
   * @param {number} bugId - Bug ID
   * @param {number} bugOwnerId - Original bug owner
   * @param {number} changedBy - User who changed status
   * @param {string} bugTitle - Bug title
   * @param {string} oldStatus - Previous status
   * @param {string} newStatus - New status
   */
  static async notifyBugStatusChange(bugId, bugOwnerId, changedBy, bugTitle, oldStatus, newStatus) {
    try {
      const message = `Bug status changed: "${bugTitle}" from ${oldStatus} to ${newStatus}`;

      await this.sendNotification({
        userId: bugOwnerId,
        senderId: changedBy,
        type: "bug_status_changed",
        title: "Bug Status Updated",
        message: message,
        link: `/bugs/${bugId}`
      });

      logger.info("Bug status change notification sent", { bugId, bugOwnerId, newStatus });
    } catch (error) {
      logger.error("Failed to send bug status notification", { error });
    }
  }

  /**
   * Notify when comment is added
   * @param {number} bugId - Bug ID (if comment on bug)
   * @param {number} commenterId - User who commented
   * @param {number} targetUserId - User to notify
   * @param {string} commentText - Comment content
   */
  static async notifyCommentAdded(entityId, commenterId, targetUserId, commentText, entityType = "bug") {
    try {
      const preview = commentText.substring(0, 100) + (commentText.length > 100 ? "..." : "");
      const normalizedType = entityType === "testcase" ? "testcase" : "bug";
      const link = normalizedType === "testcase" ? `/execute?testcaseId=${entityId}` : `/bugs/${entityId}`;
      const title = normalizedType === "testcase" ? "New Comment on Test Case" : "New Comment on Bug";

      await this.sendNotification({
        userId: targetUserId,
        senderId: commenterId,
        type: "comment_added",
        title,
        message: `Comment: "${preview}"`,
        link
      });

      logger.info("Comment notification sent", { entityId, entityType: normalizedType, targetUserId, commenterId });
    } catch (error) {
      logger.error("Failed to send comment notification", { error });
    }
  }

  /**
   * Notify when user is added to a project
   * @param {number} projectId - Project ID
   * @param {number} userId - User added to project
   * @param {number} addedBy - Admin who added them
   * @param {string} projectName - Project name
   */
  static async notifyProjectAssignment(projectId, userId, addedBy, projectName) {
    try {
      await this.sendNotification({
        userId: userId,
        senderId: addedBy,
        type: "testcase_assigned", // Using existing enum type
        title: "Added to Project",
        message: `You have been added to project: "${projectName}"`,
        link: `/projects/${projectId}`
      });

      logger.info("Project assignment notification sent", { projectId, userId });
    } catch (error) {
      logger.error("Failed to send project assignment notification", { error });
    }
  }

  /**
   * Notify when a test case is assigned
   * @param {number} testcaseId - Test case ID
   * @param {number} assigneeId - User assigned to test case
   * @param {number} assignedBy - User who assigned it
   * @param {string} testcaseTitle - Test case title
   */
  static async notifyTestcaseAssignment(testcaseId, assigneeId, assignedBy, testcaseTitle) {
    try {
      await this.sendNotification({
        userId: assigneeId,
        senderId: assignedBy,
        type: "testcase_assigned",
        title: "Test Case Assigned to You",
        message: `You have been assigned test case: "${testcaseTitle}"`,
        link: `/testcases/${testcaseId}`
      });

      logger.info("Test case assignment notification sent", { testcaseId, assigneeId });
    } catch (error) {
      logger.error("Failed to send test case assignment notification", { error });
    }
  }

  /**
   * Notify multiple users at once
   * @param {Array} userIds - Array of user IDs
   * @param {Object} options - Notification options
   */
  static async notifyMultiple(userIds, options) {
    try {
      const promises = userIds.map(userId =>
        this.sendNotification({
          ...options,
          userId
        })
      );

      await Promise.all(promises);
      logger.info("Bulk notifications sent", { userCount: userIds.length });
    } catch (error) {
      logger.error("Failed to send bulk notifications", { error });
    }
  }

  /**
   * Get unread notification count for user
   * @param {number} userId - User ID
   */
  static async getUnreadCount(userId) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE`;

      db.query(sql, [userId], (err, results) => {
        if (err) return reject(err);
        resolve(results[0].count);
      });
    });
  }
}

module.exports = NotificationService;
