import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const app = express();
const PORT = process.env.PORT || 3000;

// Allow CORS from your IONOS domain (replace with your real domain)
app.use(cors({
  origin: "https://dragonmun.cl"
}));

app.use(express.json());

// Open SQLite database
let db;
(async () => {
  db = await open({
    filename: './registrations.db',
    driver: sqlite3.Database
  });

  // Create table if not exists
  await db.run(`
    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      school TEXT NOT NULL,
      grade TEXT NOT NULL,
      numberOfConferences INTEGER,
      committeePreferences TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
})();

// Registration endpoint
app.post("/register", async (req, res) => {
  const { name, email, school, grade, numberOfConferences, committeePreferences } = req.body;
  if (!name || !email || !school || !grade) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    await db.run(
      `INSERT INTO registrations (name, email, school, grade, numberOfConferences, committeePreferences) VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, school, grade, numberOfConferences, committeePreferences]
    );
    res.json({ success: true });
  } catch (err) {
    if (err.message.includes("UNIQUE constraint failed")) {
      res.status(400).json({ error: "A registration with this email already exists." });
    } else {
      res.status(500).json({ error: "Registration failed." });
    }
  }
});

// (Optional) Admin endpoint to list registrations
app.get("/registrations", async (req, res) => {
  const rows = await db.all("SELECT * FROM registrations ORDER BY createdAt DESC");
  res.json(rows);
});

app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
