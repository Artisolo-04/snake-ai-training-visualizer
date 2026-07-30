const express = require("express");
const router = express.Router();

// Simple route to prove frontend <-> backend automation works end to end
router.get("/hello", (req, res) => {
  res.json({ message: "Hello from your automatically generated backend!" });
});

// Example of a route ready to use Postgres once you set up .env
// const pool = require("../db");
// router.get("/items", async (req, res) => {
//   const result = await pool.query("SELECT * FROM items");
//   res.json(result.rows);
// });

module.exports = router;
