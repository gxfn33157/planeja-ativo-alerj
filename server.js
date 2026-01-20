const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Database = require("better-sqlite3");

const app = express();
const db = new Database("db.sqlite");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ---------- BANCO ---------- */
db.prepare(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT
)
`).run();

/* ---------- ROTAS ---------- */
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  try {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare(
      "INSERT INTO users (username, password) VALUES (?, ?)"
    ).run(username, hash);
    res.json({ success: true });
  } catch {
    res.status(400).json({ error: "Usuário já existe" });
  }
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = db
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Usuário ou senha inválidos" });
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username
    }
  });
});

/* ---------- QUESTÕES ---------- */
app.get("/questoes", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "questoes.json"));
});

/* ---------- FRONT ---------- */
app.get("*", (_, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log("Servidor rodando na porta " + PORT)
);
