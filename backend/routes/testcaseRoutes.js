const router = require("express").Router();
const db = require("../config/db");

const { authMiddleware } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");


// ================= CREATE TESTCASE =================
router.post(
  "/testcase",
  authMiddleware,
  requireRole("tester"),
  (req, res) => {
    const {
      title,
      description,
      expected_result,
      expectedResult,
      projectId,
    } = req.body;

    const finalExpected = expected_result || expectedResult;

    if (!title || !description || !finalExpected) {
      return res.status(400).json({
        error: "Title, Description & Expected Result required",
      });
    }

    const sql = `
      INSERT INTO testcases
      (title, description, expected_result, project_id)
      VALUES (?, ?, ?, ?)
    `;

    db.query(
      sql,
      [title, description, finalExpected, projectId || null],
      (err, result) => {
        if (err) {
          console.error("Add testcase error:", err);
          return res.status(500).json({
            error: "Failed to add testcase",
          });
        }

        res.status(201).json({
          message: "Testcase added successfully",
          id: result.insertId,
        });
      }
    );
  }
);


// ================= FETCH TESTCASES =================
router.get("/testcase", authMiddleware, (req, res) => {
  const projectId = req.query.projectId;

  let sql = "SELECT * FROM testcases";
  let params = [];

  if (projectId) {
    sql += " WHERE project_id=?";
    params.push(projectId);
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Fetch error:", err);
      return res.status(500).json({
        error: "Failed to fetch testcases",
      });
    }

    res.json(results);
  });
});


// ================= UPDATE TESTCASE =================
router.put(
  "/testcase/:id",
  authMiddleware,
  requireRole("tester", "admin"),
  (req, res) => {
    const { title, description, expected_result, expectedResult } =
      req.body;

    const finalExpected = expected_result || expectedResult;

    const sql =
      "UPDATE testcases SET title=?, description=?, expected_result=? WHERE id=?";

    db.query(
      sql,
      [title, description, finalExpected, req.params.id],
      (err, result) => {
        if (err) {
          console.error("Update error:", err);
          return res.status(500).json({
            error: "Failed to update testcase",
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            error: "Testcase not found",
          });
        }

        res.json({ message: "Updated successfully" });
      }
    );
  }
);


// ================= DELETE TESTCASE =================
router.delete(
  "/testcase/:id",
  authMiddleware,
  requireRole("admin"),
  (req, res) => {
    db.query(
      "DELETE FROM testcases WHERE id=?",
      [req.params.id],
      (err, result) => {
        if (err) {
          console.error("Delete error:", err);
          return res.status(500).json({
            error: "Failed to delete testcase",
          });
        }

        res.json({ message: "Deleted successfully" });
      }
    );
  }
);

module.exports = router;
