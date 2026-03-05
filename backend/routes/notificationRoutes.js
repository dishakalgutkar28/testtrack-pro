/**
 * Notification Routes
 * Handle in-app notifications - create, read, mark as read/unread
 */

const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { authMiddleware } = require("../middleware/authMiddleware");
const logger = require("../utils/logger");

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for the logged-in user
 * @access  Private
 */
router.get("/notifications", authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { unread_only } = req.query;
  
  let sql = `
    SELECT 
      n.*,
      u.email as sender_email
    FROM notifications n
    LEFT JOIN users u ON n.sender_id = u.id
    WHERE n.user_id = ?
  `;
  
  const params = [userId];
  
  if (unread_only === 'true') {
    sql += ` AND n.is_read = FALSE`;
  }
  
  sql += ` ORDER BY n.created_at DESC LIMIT 100`;
  
  db.query(sql, params, (err, results) => {
    if (err) {
      logger.error("Error fetching notifications", { error: err, userId });
      return res.status(500).json({ error: "Failed to fetch notifications" });
    }
    
    res.json({ success: true, notifications: results });
  });
});

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get count of unread notifications
 * @access  Private
 */
router.get("/notifications/unread-count", authMiddleware, (req, res) => {
  const userId = req.user.id;
  
  const sql = `
    SELECT COUNT(*) as unread_count
    FROM notifications
    WHERE user_id = ? AND is_read = FALSE
  `;
  
  db.query(sql, [userId], (err, results) => {
    if (err) {
      logger.error("Error fetching unread count", { error: err, userId });
      return res.status(500).json({ error: "Failed to fetch unread count" });
    }
    
    res.json({ success: true, unread_count: results[0].unread_count });
  });
});

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark a notification as read
 * @access  Private
 */
router.put("/notifications/:id/read", authMiddleware, (req, res) => {
  const notificationId = req.params.id;
  const userId = req.user.id;
  
  const sql = `
    UPDATE notifications
    SET is_read = TRUE, read_at = NOW()
    WHERE id = ? AND user_id = ?
  `;
  
  db.query(sql, [notificationId, userId], (err, result) => {
    if (err) {
      logger.error("Error marking notification as read", { error: err, notificationId });
      return res.status(500).json({ error: "Failed to mark notification as read" });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }
    
    res.json({ success: true, message: "Notification marked as read" });
  });
});

/**
 * @route   PUT /api/notifications/:id/unread
 * @desc    Mark a notification as unread
 * @access  Private
 */
router.put("/notifications/:id/unread", authMiddleware, (req, res) => {
  const notificationId = req.params.id;
  const userId = req.user.id;
  
  const sql = `
    UPDATE notifications
    SET is_read = FALSE, read_at = NULL
    WHERE id = ? AND user_id = ?
  `;
  
  db.query(sql, [notificationId, userId], (err, result) => {
    if (err) {
      logger.error("Error marking notification as unread", { error: err, notificationId });
      return res.status(500).json({ error: "Failed to mark notification as unread" });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }
    
    res.json({ success: true, message: "Notification marked as unread" });
  });
});

/**
 * @route   PUT /api/notifications/mark-all-read
 * @desc    Mark all notifications as read for the user
 * @access  Private
 */
router.put("/notifications/mark-all-read", authMiddleware, (req, res) => {
  const userId = req.user.id;
  
  const sql = `
    UPDATE notifications
    SET is_read = TRUE, read_at = NOW()
    WHERE user_id = ? AND is_read = FALSE
  `;
  
  db.query(sql, [userId], (err, result) => {
    if (err) {
      logger.error("Error marking all notifications as read", { error: err, userId });
      return res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
    
    res.json({ 
      success: true, 
      message: "All notifications marked as read",
      count: result.affectedRows
    });
  });
});

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a notification
 * @access  Private
 */
router.delete("/notifications/:id", authMiddleware, (req, res) => {
  const notificationId = req.params.id;
  const userId = req.user.id;
  
  const sql = `
    DELETE FROM notifications
    WHERE id = ? AND user_id = ?
  `;
  
  db.query(sql, [notificationId, userId], (err, result) => {
    if (err) {
      logger.error("Error deleting notification", { error: err, notificationId });
      return res.status(500).json({ error: "Failed to delete notification" });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }
    
    res.json({ success: true, message: "Notification deleted" });
  });
});

/**
 * @route   POST /api/notifications
 * @desc    Create a notification (used internally by the system)
 * @access  Private
 */
router.post("/notifications", authMiddleware, (req, res) => {
  const { user_id, type, title, message, link, sender_id } = req.body;
  
  if (!user_id || !type || !title || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  
  const sql = `
    INSERT INTO notifications (user_id, type, title, message, link, sender_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  db.query(sql, [user_id, type, title, message, link || null, sender_id || null], (err, result) => {
    if (err) {
      logger.error("Error creating notification", { error: err, user_id });
      return res.status(500).json({ error: "Failed to create notification" });
    }
    
    logger.info("Notification created", { notificationId: result.insertId, user_id, type });
    res.status(201).json({ 
      success: true, 
      message: "Notification created",
      notification_id: result.insertId
    });
  });
});

module.exports = router;
