const express = require('express');
const bodyParser = require('body-parser');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();

const SECRET = process.env.SESSION_SECRET || 'planeja-ativo-secret';
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Caminho absoluto para arquivos estáticos
const publicPath = path.resolve(__dirname, 'public');
app.use(express.static(publicPath));

// Banco de dados (SQLite)
const dbPath = process.env.DATABASE_URL || path.resolve(__dirname, 'planeja.db');
const db = new Database(dbPath);

// Criação das tabelas
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    score INTEGER,
    total INTEGER,
    subjects TEXT,
    date DATETIME DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Middleware de autenticação
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// =======================
// ROTAS DE API
// =======================

app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 8);

  try {
    const result = db
      .prepare('INSERT INTO users (username, password) VALUES (?, ?)')
      .run(username, hashedPassword);

    res.json({ success: true, id: result.lastInsertRowid });
  } catch {
    res.status(400).json({ error: 'Usuário já existe ou erro no cadastro' });
  }
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  const user = db
    .prepare('SELECT * FROM users WHERE username = ?')
    .get(username);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    SECRET
  );

  res.json({ token, username: user.username });
});

app.get('/api/questions', authenticate, (req, res) => {
  try {
    const filePath = path.resolve(__dirname, 'data', 'questoes.json');
    const data = fs.readFileSync(filePath, 'utf8');
    res.json(JSON.parse(data));
  } catch {
    res.status(500).json({ error: 'Erro ao carregar questões' });
  }
});

app.post('/api/submit', authenticate, (req, res) => {
  const { score, total, subjects } = req.body;

  try {
    db.prepare(`
      INSERT INTO results (user_id, score, total, subjects)
      VALUES (?, ?, ?, ?)
    `).run(req.user.id, score, total, JSON.stringify(subjects));

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Erro ao salvar resultado' });
  }
});

app.get('/api/history', authenticate, (req, res) => {
  const history = db
    .prepare('SELECT * FROM results WHERE user_id = ? ORDER BY date DESC')
    .all(req.user.id);

  res.json(history);
});

app.get('/api/ranking', authenticate, (req, res) => {
  const ranking = db.prepare(`
    SELECT u.username, MAX(r.score) AS score, r.total, r.date
    FROM results r
    JOIN users u ON r.user_id = u.id
    GROUP BY u.id
    ORDER BY score DESC
    LIMIT 10
  `).all();

  res.json(ranking);
});

// =======================
// SPA FALLBACK (CRÍTICO)
// =======================

app.get('*', (req, res) => {
  // Evita capturar rotas de API
  if (req.url.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint não encontrado' });
  }

  const indexPath = path.join(publicPath, 'index.html');

  if (!fs.existsSync(indexPath)) {
    return res
      .status(500)
      .send('Front-end não encontrado. Verifique a pasta public/');
  }

  res.sendFile(indexPath);
});

// Start
app.listen(PORT, '0.0.0.0', () =>
  console.log(`Servidor rodando na porta ${PORT}`)
);
