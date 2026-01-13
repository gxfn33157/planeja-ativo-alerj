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

// Middleware de log para depuração no Render
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

app.use(bodyParser.json());

// Forçar caminhos absolutos para evitar erros no Render
const publicPath = path.resolve(__dirname, 'public');
const dataPath = path.resolve(__dirname, 'data');

// Servir arquivos estáticos de forma explícita
app.use(express.static(publicPath));

// Inicialização do Banco de Dados
const dbPath = process.env.DATABASE_URL || path.resolve(__dirname, 'planeja.db');
const db = new Database(dbPath);

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

// Middleware de Autenticação
const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Rotas da API
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);
    try {
        const result = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run(username, hashedPassword);
        res.json({ success: true, id: result.lastInsertRowid });
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            res.status(400).json({ error: "Usuário já existe" });
        } else {
            res.status(500).json({ error: "Erro ao criar usuário" });
        }
    }
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: "Credenciais inválidas" });
    }
    const token = jwt.sign({ id: user.id, username: user.username }, SECRET);
    res.json({ token, username: user.username });
});

app.get('/api/questions', authenticate, (req, res) => {
    try {
        const fileContent = fs.readFileSync(path.join(dataPath, 'questoes.json'), 'utf8');
        res.json(JSON.parse(fileContent));
    } catch (err) {
        console.error("Erro ao ler questões:", err);
        res.status(500).json({ error: "Erro ao carregar questões" });
    }
});

app.post('/api/submit', authenticate, (req, res) => {
    const { score, total, subjects } = req.body;
    try {
        db.prepare("INSERT INTO results (user_id, score, total, subjects) VALUES (?, ?, ?, ?)").run(
            req.user.id, score, total, JSON.stringify(subjects)
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Erro ao salvar resultado" });
    }
});

app.get('/api/history', authenticate, (req, res) => {
    const history = db.prepare("SELECT * FROM results WHERE user_id = ? ORDER BY date DESC").all(req.user.id);
    res.json(history);
});

app.get('/api/ranking', authenticate, (req, res) => {
    const ranking = db.prepare(`
        SELECT u.username, MAX(r.score) as score, r.total, r.date 
        FROM results r 
        JOIN users u ON r.user_id = u.id 
        GROUP BY u.id
        ORDER BY score DESC 
        LIMIT 10
    `).all();
    res.json(ranking);
});

// Fallback explícito para o index.html
app.get('*', (req, res) => {
    const indexPath = path.join(publicPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Arquivo index.html não encontrado no servidor.');
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Caminho public: ${publicPath}`);
});
