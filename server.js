const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ======================
   LOGIN SIMPLES (LOCAL)
====================== */

let users = [];

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  const user = users.find(
    u => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: "Usuário ou senha inválidos" });
  }

  res.json({ success: true, username });
});

app.post("/api/register", (req, res) => {
  const { username, password } = req.body;

  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: "Usuário já existe" });
  }

  users.push({ username, password });
  res.json({ success: true });
});

/* ======================
   ROTA DAS QUESTÕES ✅
====================== */

app.get("/api/questoes", (req, res) => {
  try {
    const filePath = path.join(__dirname, "data", "questoes.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    const questoes = JSON.parse(raw);
    res.json(questoes);
  } catch (err) {
    console.error("Erro ao carregar questões:", err);
    res.status(500).json({ error: "Erro ao carregar questões" });
  }
});

/* ====================== */

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
