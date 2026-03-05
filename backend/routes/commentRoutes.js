const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { authMiddleware } = require("../middleware/authMiddleware");
const NotificationService = require("../services/notificationService");
const logger = require("../utils/logger");

// ================= CREATE COMMENT =================
router.post("/comments", authMiddleware, (req, res) => {
  const { bug_id, testcase_id, comment_text } = req.body;
  const user_id = req.user.id;

  if (!comment_text || comment_text.trim().length === 0) {
    return res.status(400).json({ error: "Comment text is required" });
  }

  if (!bug_id && !testcase_id) {
    return res.status(400).json({ error: "Either bug_id or testcase_id is required" });
  }

  const sql = `
    INSERT INTO comments (bug_id, testcase_id, user_id, comment_text)
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    sql,
    [bug_id || null, testcase_id || null, user_id, comment_text],
    (err, result) => {
      if (err) {
        console.error("Create comment error:", err);
        return res.status(500).json({ error: "Failed to create comment" });
      }

      // Send notifications asynchronously
      (async () => {
        try {
          if (bug_id) {
            // Get bug details including reporter and assignee
            db.query("SELECT title, assigned_to, created_by FROM bugs WHERE id = ?", [bug_id], async (err, bugResults) => {
              if (!err && bugResults.length > 0) {
                const bug = bugResults[0];
                const usersToNotify = new Set();
                
                // Add bug assignee to notification list
                if (bug.assigned_to && bug.assigned_to !== user_id) {
                  usersToNotify.add(bug.assigned_to);
                }
                
                // Add bug reporter to notification list
                if (bug.created_by && bug.created_by !== user_id) {
                  usersToNotify.add(bug.created_by);
                }
                
                // Get all previous commenters on this bug
                db.query(
                  "SELECT DISTINCT user_id FROM comments WHERE bug_id = ? AND user_id != ?",
                  [bug_id, user_id],
                  async (err, commenters) => {
                    if (!err && commenters && commenters.length > 0) {
                      commenters.forEach(c => usersToNotify.add(c.user_id));
                    }
                    
                    // Send notifications to all relevant users
                    for (const targetUserId of usersToNotify) {
                      try {
                        await NotificationService.notifyCommentAdded(
                          bug_id,
                          user_id,
                          targetUserId,
                          comment_text
                        );
                      } catch (notifyErr) {
                        logger.error("Failed to send notification to user", { targetUserId, error: notifyErr });
                      }
                    }
                  }
                );
              }
            });
          } else if (testcase_id) {
            // Get testcase details including assignee and creator
            db.query("SELECT title, assigned_to, created_by FROM testcases WHERE id = ?", [testcase_id], async (err, testcaseResults) => {
              if (!err && testcaseResults.length > 0) {
                const testcase = testcaseResults[0];
                const usersToNotify = new Set();
                
                // Add testcase assignee to notification list
                if (testcase.assigned_to && testcase.assigned_to !== user_id) {
                  usersToNotify.add(testcase.assigned_to);
                }
                
                // Add testcase creator to notification list
                if (testcase.created_by && testcase.created_by !== user_id) {
                  usersToNotify.add(testcase.created_by);
                }
                
                // Get all previous commenters on this testcase
                db.query(
                  "SELECT DISTINCT user_id FROM comments WHERE testcase_id = ? AND user_id != ?",
                  [testcase_id, user_id],
                  async (err, commenters) => {
                    if (!err && commenters && commenters.length > 0) {
                      commenters.forEach(c => usersToNotify.add(c.user_id));
                    }
                    
                    // Send notifications to all relevant users
                    for (const targetUserId of usersToNotify) {
                      try {
                        await NotificationService.notifyCommentAdded(
                          testcase_id,
                          user_id,
                          targetUserId,
                          comment_text
                        );
                      } catch (notifyErr) {
                        logger.error("Failed to send notification to user", { targetUserId, error: notifyErr });
                      }
                    }
                  }
                );
              }
            });
          }
        } catch (notifyError) {
          logger.error("Error sending comment notifications", { error: notifyError });
        }
      })();

      res.status(201).json({
        message: "Comment created successfully",
        id: result.insertId,
      });
    }
  );
});

// ================= GET COMMENTS FOR BUG =================
router.get("/bugs/:bugId/comments", authMiddleware, (req, res) => {
  const { bugId } = req.params;

  const sql = `
    SELECT 
      c.id,
      c.comment_text,
      c.created_at,
      c.updated_at,
      u.id as user_id,
      u.email as user_email,
      u.role as user_role
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.bug_id = ?
    ORDER BY c.created_at ASC
  `;

  db.query(sql, [bugId], (err, results) => {
    if (err) {
      console.error("Get comments error:", err);
      return res.status(500).json({ error: "Failed to fetch comments" });
    }
    res.json(results);
  });
});

// ================= GET COMMENTS FOR TEST CASE =================
router.get("/testcases/:testcaseId/comments", authMiddleware, (req, res) => {
  const { testcaseId } = req.params;

  const sql = `
    SELECT 
      c.id,
      c.comment_text,
      c.created_at,
      c.updated_at,
      u.id as user_id,
      u.email as user_email,
      u.role as user_role
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.testcase_id = ?
    ORDER BY c.created_at ASC
  `;

  db.query(sql, [testcaseId], (err, results) => {
    if (err) {
      console.error("Get comments error:", err);
      return res.status(500).json({ error: "Failed to fetch comments" });
    }
    res.json(results);
  });
});

// ================= UPDATE COMMENT =================
router.put("/comments/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const { comment_text } = req.body;
  const user_id = req.user.id;

  if (!comment_text || comment_text.trim().length === 0) {
    return res.status(400).json({ error: "Comment text is required" });
  }

  // Check if comment belongs to user and is within 5 minutes
  const checkSql = `
    SELECT created_at, user_id 
    FROM comments 
    WHERE id = ?
  `;

  db.query(checkSql, [id], (err, results) => {
    if (err) {
      console.error("Check comment error:", err);
      return res.status(500).json({ error: "Failed to check comment" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const comment = results[0];

    // Check ownership
    if (comment.user_id !== user_id) {
      return res.status(403).json({ error: "You can only edit your own comments" });
    }

    // Check if within 5 minutes
    const createdAt = new Date(comment.created_at);
    const now = new Date();
    const diffMinutes = (now - createdAt) / 1000 / 60;

    if (diffMinutes > 5) {
      return res.status(403).json({ 
        error: "Comments can only be edited within 5 minutes of creation" 
      });
    }

    // Update comment
    const updateSql = `
      UPDATE comments 
      SET comment_text = ?
      WHERE id = ?
    `;

    db.query(updateSql, [comment_text, id], (err, result) => {
      if (err) {
        console.error("Update comment error:", err);
        return res.status(500).json({ error: "Failed to update comment" });
      }

      res.json({ message: "Comment updated successfully" });
    });
  });
});

// ================= DELETE COMMENT =================
router.delete("/comments/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  // Check if comment belongs to user and is within 5 minutes
  const checkSql = `
    SELECT created_at, user_id 
    FROM comments 
    WHERE id = ?
  `;

  db.query(checkSql, [id], (err, results) => {
    if (err) {
      console.error("Check comment error:", err);
      return res.status(500).json({ error: "Failed to check comment" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const comment = results[0];

    // Check ownership
    if (comment.user_id !== user_id) {
      return res.status(403).json({ error: "You can only delete your own comments" });
    }

    // Check if within 5 minutes
    const createdAt = new Date(comment.created_at);
    const now = new Date();
    const diffMinutes = (now - createdAt) / 1000 / 60;

    if (diffMinutes > 5) {
      return res.status(403).json({ 
        error: "Comments can only be deleted within 5 minutes of creation" 
      });
    }

    // Delete comment
    const deleteSql = `DELETE FROM comments WHERE id = ?`;

    db.query(deleteSql, [id], (err, result) => {
      if (err) {
        console.error("Delete comment error:", err);
        return res.status(500).json({ error: "Failed to delete comment" });
      }

      res.json({ message: "Comment deleted successfully" });
    });
  });
});

// ================= ADD REPLY TO COMMENT (THREADING) =================
router.post("/comments/:id/reply", authMiddleware, (req, res) => {
  const parentCommentId = req.params.id;
  const { comment_text } = req.body;
  const user_id = req.user.id;

  if (!comment_text || comment_text.trim().length === 0) {
    return res.status(400).json({ error: "Reply text is required" });
  }

  // Get parent comment to determine bug_id or testcase_id
  const getParentSql = `SELECT bug_id, testcase_id FROM comments WHERE id = ?`;

  db.query(getParentSql, [parentCommentId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Failed to fetch parent comment" });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({ error: "Parent comment not found" });
    }

    const { bug_id, testcase_id } = results[0];

    // Insert reply with parent_comment_id
    const insertSql = `
      INSERT INTO comments (bug_id, testcase_id, user_id, comment_text, parent_comment_id)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
      insertSql,
      [bug_id || null, testcase_id || null, user_id, comment_text, parentCommentId],
      (err, result) => {
        if (err) {
          console.error("Create reply error:", err);
          return res.status(500).json({ error: "Failed to create reply" });
        }

        res.status(201).json({
          message: "Reply created successfully",
          id: result.insertId,
          parentCommentId
        });
      }
    );
  });
});

// ================= GET COMMENT THREAD =================
router.get("/comments/:id/thread", authMiddleware, (req, res) => {
  const commentId = req.params.id;

  const sql = `
    SELECT 
      c.id,
      c.comment_text,
      c.created_at,
      c.updated_at,
      c.parent_comment_id,
      c.is_pinned,
      u.id as user_id,
      u.email as user_email,
      u.role as user_role
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.id = ? OR c.parent_comment_id = ?
    ORDER BY c.parent_comment_id ASC, c.created_at ASC
  `;

  db.query(sql, [commentId, commentId], (err, results) => {
    if (err) {
      console.error("Get thread error:", err);
      return res.status(500).json({ error: "Failed to fetch thread" });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({ error: "Comment not found" });
    }

    res.json(results);
  });
});

// ================= PIN/UNPIN COMMENT =================
router.post("/comments/:id/pin", authMiddleware, (req, res) => {
  const commentId = req.params.id;

  // Get current pinned state
  const getSql = `SELECT is_pinned FROM comments WHERE id = ?`;

  db.query(getSql, [commentId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const newPinnedState = !results[0].is_pinned;

    // Toggle pin status
    const updateSql = `UPDATE comments SET is_pinned = ? WHERE id = ?`;

    db.query(updateSql, [newPinnedState, commentId], (err, result) => {
      if (err) {
        console.error("Pin comment error:", err);
        return res.status(500).json({ error: "Failed to pin/unpin comment" });
      }

      res.json({
        message: newPinnedState ? "Comment pinned" : "Comment unpinned",
        isPinned: newPinnedState
      });
    });
  });
});

// ================= ADD MENTION TO COMMENT =================
router.post("/comments/:id/mentions", authMiddleware, (req, res) => {
  const commentId = req.params.id;
  const { mentioned_user_id } = req.body;

  if (!mentioned_user_id) {
    return res.status(400).json({ error: "User ID to mention is required" });
  }

  const sql = `
    INSERT INTO comment_mentions (comment_id, mentioned_user_id)
    VALUES (?, ?)
  `;

  db.query(sql, [commentId, mentioned_user_id], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: "User already mentioned in this comment" });
      }
      console.error("Add mention error:", err);
      return res.status(500).json({ error: "Failed to add mention" });
    }

    res.status(201).json({
      message: "User mentioned successfully",
      id: result.insertId
    });
  });
});

// ================= GET COMMENT MENTIONS =================
router.get("/comments/:id/mentions", authMiddleware, (req, res) => {
  const commentId = req.params.id;

  const sql = `
    SELECT 
      cm.id,
      cm.mentioned_user_id,
      u.email,
      u.role,
      cm.notified
    FROM comment_mentions cm
    LEFT JOIN users u ON cm.mentioned_user_id = u.id
    WHERE cm.comment_id = ?
  `;

  db.query(sql, [commentId], (err, results) => {
    if (err) {
      console.error("Get mentions error:", err);
      return res.status(500).json({ error: "Failed to fetch mentions" });
    }

    res.json(results || []);
  });
});

// ================= ADD REACTION TO COMMENT =================
router.post("/comments/:id/reactions", authMiddleware, (req, res) => {
  const commentId = req.params.id;
  const { reaction } = req.body;
  const userId = req.user.id;

  if (!reaction || reaction.trim().length === 0) {
    return res.status(400).json({ error: "Reaction is required (e.g., :thumbsup:, :heart:)" });
  }

  const sql = `
    INSERT INTO comment_reactions (comment_id, user_id, reaction)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE reaction = VALUES(reaction)
  `;

  db.query(sql, [commentId, userId, reaction], (err, result) => {
    if (err) {
      console.error("Add reaction error:", err);
      return res.status(500).json({ error: "Failed to add reaction" });
    }

    res.status(201).json({
      message: "Reaction added successfully"
    });
  });
});

// ================= GET COMMENT REACTIONS =================
router.get("/comments/:id/reactions", authMiddleware, (req, res) => {
  const commentId = req.params.id;

  const sql = `
    SELECT 
      reaction,
      COUNT(*) as count,
      GROUP_CONCAT(u.email) as users
    FROM comment_reactions cr
    LEFT JOIN users u ON cr.user_id = u.id
    WHERE cr.comment_id = ?
    GROUP BY reaction
  `;

  db.query(sql, [commentId], (err, results) => {
    if (err) {
      console.error("Get reactions error:", err);
      return res.status(500).json({ error: "Failed to fetch reactions" });
    }

    res.json(results || []);
  });
});

// ================= REMOVE REACTION FROM COMMENT =================
router.delete("/comments/:id/reactions/:reaction", authMiddleware, (req, res) => {
  const commentId = req.params.id;
  const reaction = req.params.reaction;
  const userId = req.user.id;

  const sql = `DELETE FROM comment_reactions WHERE comment_id = ? AND user_id = ? AND reaction = ?`;

  db.query(sql, [commentId, userId, reaction], (err, result) => {
    if (err) {
      console.error("Remove reaction error:", err);
      return res.status(500).json({ error: "Failed to remove reaction" });
    }

    res.json({ message: "Reaction removed successfully" });
  });
});

module.exports = router;

