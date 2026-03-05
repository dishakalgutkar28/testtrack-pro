const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const router = express.Router();
const db = require("../config/db");
const { authMiddleware } = require("../middleware/authMiddleware");
const { uploadLimiter } = require("../middleware/rateLimiter");

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

const resolveAttachmentConfig = (type) => {
  if (type === "testcase") {
    return { table: "testcase_attachments", column: "testcase_id" };
  }
  if (type === "bug") {
    return { table: "bug_attachments", column: "bug_id" };
  }
  return null;
};

router.post(
  "/attachments/:type/:id",
  authMiddleware,
  uploadLimiter,
  upload.single("file"),
  (req, res) => {
    const { type, id } = req.params;
    const config = resolveAttachmentConfig(type);

    if (!config) {
      return res.status(400).json({ error: "Invalid attachment type" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "File is required" });
    }

    const filePath = path.join("uploads", req.file.filename).replace(/\\/g, "/");
    const sql = `
      INSERT INTO ${config.table}
      (${config.column}, file_name, file_path, file_size, mime_type, uploaded_by, uploaded_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;

    db.query(
      sql,
      [id, req.file.originalname, filePath, req.file.size, req.file.mimetype, req.user.id],
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: "Failed to upload attachment" });
        }

        res.status(201).json({
          message: "Attachment uploaded successfully",
          id: result.insertId
        });
      }
    );
  }
);

router.get("/attachments/:type/:id", authMiddleware, (req, res) => {
  const { type, id } = req.params;
  const config = resolveAttachmentConfig(type);

  if (!config) {
    return res.status(400).json({ error: "Invalid attachment type" });
  }

  const sql = `
    SELECT id, file_name, file_path, file_size, mime_type, uploaded_by, uploaded_at
    FROM ${config.table}
    WHERE ${config.column} = ?
    ORDER BY uploaded_at DESC
  `;

  db.query(sql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Failed to fetch attachments" });
    }

    res.json(results || []);
  });
});

router.get("/attachments/:type/file/:attachmentId", authMiddleware, (req, res) => {
  const { type, attachmentId } = req.params;
  const config = resolveAttachmentConfig(type);

  if (!config) {
    return res.status(400).json({ error: "Invalid attachment type" });
  }

  const sql = `
    SELECT file_name, file_path, mime_type
    FROM ${config.table}
    WHERE id = ?
  `;

  db.query(sql, [attachmentId], (err, results) => {
    if (err || !results || results.length === 0) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    const attachment = results[0];
    const absolutePath = path.join(__dirname, "..", attachment.file_path);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: "File not found on disk" });
    }

    res.setHeader("Content-Type", attachment.mime_type || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${attachment.file_name}"`);
    res.sendFile(absolutePath);
  });
});

router.delete("/attachments/:type/:attachmentId", authMiddleware, (req, res) => {
  const { type, attachmentId } = req.params;
  const config = resolveAttachmentConfig(type);

  if (!config) {
    return res.status(400).json({ error: "Invalid attachment type" });
  }

  const fetchSql = `
    SELECT id, file_path, uploaded_by
    FROM ${config.table}
    WHERE id = ?
  `;

  db.query(fetchSql, [attachmentId], (err, results) => {
    if (err || !results || results.length === 0) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    const attachment = results[0];
    const isOwner = attachment.uploaded_by === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }

    const deleteSql = `DELETE FROM ${config.table} WHERE id = ?`;

    db.query(deleteSql, [attachmentId], (deleteErr) => {
      if (deleteErr) {
        return res.status(500).json({ error: "Failed to delete attachment" });
      }

      const absolutePath = path.join(__dirname, "..", attachment.file_path);
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }

      res.json({ message: "Attachment deleted successfully" });
    });
  });
});

module.exports = router;
