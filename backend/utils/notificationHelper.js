/**
 * Notification Helper
 * Utility functions for creating and managing notifications
 */

const db = require('../config/db');
const logger = require('./logger');

/**
 * Notification types
 */
const NotificationTypes = {
  BUG_ASSIGNED: 'bug_assigned',
  BUG_STATUS_CHANGED: 'bug_status_changed',
  TESTCASE_ASSIGNED: 'testcase_assigned',
  COMMENT_ADDED: 'comment_added',
  EXECUTION_COMPLETED: 'execution_completed',
  MENTION: 'mention',
  SYSTEM: 'system'
};

/**
 * Create a notification
 * @param {Object} params - Notification parameters
 * @param {number} params.user_id - User ID to send notification to
 * @param {string} params.type - Notification type
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification message
 * @param {string} params.link - Link to related resource (optional)
 * @param {number} params.sender_id - ID of user who triggered the notification (optional)
 * @returns {Promise<number>} - Returns notification ID
 */
const createNotification = ({ user_id, type, title, message, link = null, sender_id = null }) => {
  return new Promise((resolve, reject) => {
    // Validate required fields
    if (!user_id || !type || !title || !message) {
      return reject(new Error('Missing required notification fields'));
    }

    // Validate notification type
    if (!Object.values(NotificationTypes).includes(type)) {
      return reject(new Error(`Invalid notification type: ${type}`));
    }

    const sql = `
      INSERT INTO notifications (user_id, type, title, message, link, sender_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [user_id, type, title, message, link, sender_id], (err, result) => {
      if (err) {
        logger.error('Error creating notification', { error: err, user_id, type });
        return reject(err);
      }

      logger.info('Notification created', { notificationId: result.insertId, user_id, type });
      resolve(result.insertId);
    });
  });
};

/**
 * Create multiple notifications
 * @param {Array<Object>} notifications - Array of notification objects
 * @returns {Promise<Array<number>>} - Returns array of notification IDs
 */
const createBulkNotifications = async (notifications) => {
  try {
    const promises = notifications.map(notif => createNotification(notif));
    return await Promise.all(promises);
  } catch (error) {
    logger.error('Error creating bulk notifications', { error });
    throw error;
  }
};

/**
 * Notify when a bug is assigned
 * @param {number} assignedUserId - User ID of assignee
 * @param {number} bugId - Bug ID
 * @param {string} bugTitle - Bug title
 * @param {number} assignedBy - User ID who assigned the bug
 */
const notifyBugAssigned = async (assignedUserId, bugId, bugTitle, assignedBy) => {
  return await createNotification({
    user_id: assignedUserId,
    type: NotificationTypes.BUG_ASSIGNED,
    title: 'Bug Assigned to You',
    message: `Bug #${bugId} "${bugTitle}" has been assigned to you`,
    link: `/bugs/${bugId}`,
    sender_id: assignedBy
  });
};

/**
 * Notify when bug status changes
 * @param {number} userId - User ID to notify
 * @param {number} bugId - Bug ID
 * @param {string} bugTitle - Bug title
 * @param {string} newStatus - New bug status
 * @param {number} changedBy - User ID who changed the status
 */
const notifyBugStatusChanged = async (userId, bugId, bugTitle, newStatus, changedBy) => {
  return await createNotification({
    user_id: userId,
    type: NotificationTypes.BUG_STATUS_CHANGED,
    title: 'Bug Status Updated',
    message: `Bug #${bugId} "${bugTitle}" status changed to ${newStatus}`,
    link: `/bugs/${bugId}`,
    sender_id: changedBy
  });
};

/**
 * Notify when a test case is assigned
 * @param {number} assignedUserId - User ID of assignee
 * @param {number} testcaseId - Test case ID
 * @param {string} testcaseTitle - Test case title
 * @param {number} assignedBy - User ID who assigned the test case
 */
const notifyTestcaseAssigned = async (assignedUserId, testcaseId, testcaseTitle, assignedBy) => {
  return await createNotification({
    user_id: assignedUserId,
    type: NotificationTypes.TESTCASE_ASSIGNED,
    title: 'Test Case Assigned',
    message: `Test case "${testcaseTitle}" has been assigned to you`,
    link: `/testcases/${testcaseId}`,
    sender_id: assignedBy
  });
};

/**
 * Notify when a comment is added
 * @param {number} userId - User ID to notify
 * @param {string} entityType - Type of entity (bug, testcase)
 * @param {number} entityId - Entity ID
 * @param {string} commenterName - Name of commenter
 * @param {number} commenterId - User ID of commenter
 */
const notifyCommentAdded = async (userId, entityType, entityId, commenterName, commenterId) => {
  return await createNotification({
    user_id: userId,
    type: NotificationTypes.COMMENT_ADDED,
    title: 'New Comment',
    message: `${commenterName} commented on ${entityType} #${entityId}`,
    link: `/${entityType}s/${entityId}`,
    sender_id: commenterId
  });
};

/**
 * Notify when test execution is completed
 * @param {number} userId - User ID to notify
 * @param {number} executionId - Execution ID
 * @param {number} totalTests - Total tests executed
 * @param {number} passedTests - Number of passed tests
 */
const notifyExecutionCompleted = async (userId, executionId, totalTests, passedTests) => {
  const failedTests = totalTests - passedTests;
  return await createNotification({
    user_id: userId,
    type: NotificationTypes.EXECUTION_COMPLETED,
    title: 'Test Execution Completed',
    message: `Execution completed: ${passedTests} passed, ${failedTests} failed out of ${totalTests} tests`,
    link: `/execution-history`,
    sender_id: null
  });
};

/**
 * Notify users when mentioned in comments
 * @param {Array<number>} userIds - Array of user IDs mentioned
 * @param {string} mentionedBy - Name of user who mentioned
 * @param {number} mentionerId - User ID of mentioner
 * @param {string} context - Context where mentioned
 * @param {string} link - Link to the content
 */
const notifyMention = async (userIds, mentionedBy, mentionerId, context, link) => {
  const notifications = userIds.map(userId => ({
    user_id: userId,
    type: NotificationTypes.MENTION,
    title: 'You Were Mentioned',
    message: `${mentionedBy} mentioned you in ${context}`,
    link: link,
    sender_id: mentionerId
  }));
  return await createBulkNotifications(notifications);
};

/**
 * Send system notification to user(s)
 * @param {number|Array<number>} userIds - User ID or array of user IDs
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} link - Optional link
 */
const notifySystem = async (userIds, title, message, link = null) => {
  const users = Array.isArray(userIds) ? userIds : [userIds];
  const notifications = users.map(userId => ({
    user_id: userId,
    type: NotificationTypes.SYSTEM,
    title: title,
    message: message,
    link: link,
    sender_id: null
  }));
  return await createBulkNotifications(notifications);
};

module.exports = {
  NotificationTypes,
  createNotification,
  createBulkNotifications,
  notifyBugAssigned,
  notifyBugStatusChanged,
  notifyTestcaseAssigned,
  notifyCommentAdded,
  notifyExecutionCompleted,
  notifyMention,
  notifySystem
};
