const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/hello", (req, res) => {
  res.json({ message: "Hello from your automatically generated backend!" });
});

router.post("/runs", async (req, res) => {
  const { episodes, bestScore, finalEpsilon, qTable } = req.body;

  if (!episodes || bestScore === undefined || !qTable) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO training_runs (episodes, best_score, final_epsilon, q_table)
       VALUES ($1, $2, $3, $4)
       RETURNING id, episodes, best_score, final_epsilon, created_at`,
      [episodes, bestScore, finalEpsilon, JSON.stringify(qTable)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Failed to save run:", err.message);
    res.status(500).json({ error: "Failed to save training run" });
  }
});

router.get("/runs", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, episodes, best_score, final_epsilon, created_at
       FROM training_runs
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Failed to list runs:", err.message);
    res.status(500).json({ error: "Failed to list training runs" });
  }
});

router.get("/runs/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM training_runs WHERE id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Run not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Failed to load run:", err.message);
    res.status(500).json({ error: "Failed to load training run" });
  }
});

module.exports = router;
