const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

let usuarios = [];
let ranking = [];

// ===== LOGIN =====
app.post("/login", (req, res) => {
  const { usuario, senha } = req.body;
  let user = usuarios.find(u => u.usuario === usuario);

  if (!user) {
    user = {
      usuario,
      senha,
      historico: [],
      desempenho: {}
    };
    usuarios.push(user);
  }

  if (user.senha !== senha) {
    return res.status(401).json({ erro: "Senha inválida" });
  }

  res.json({ sucesso: true, usuario });
});

// ===== SALVAR RESULTADO =====
app.post("/resultado", (req, res) => {
  const { usuario, resultado } = req.body;
  const user = usuarios.find(u => u.usuario === usuario);

  if (!user) return res.sendStatus(404);

  user.historico.push(resultado);

  ranking.push({
    usuario,
    nota: resultado.nota
  });

  ranking.sort((a, b) => b.nota - a.nota);

  res.json({ sucesso: true });
});

// ===== DADOS =====
app.get("/dados/:usuario", (req, res) => {
  const user = usuarios.find(u => u.usuario === req.params.usuario);
  if (!user) return res.sendStatus(404);

  res.json({
    historico: user.historico,
    ranking: ranking.slice(0, 10)
  });
});

// ===== SPA =====
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(3000, () => console.log("Servidor rodando"));
