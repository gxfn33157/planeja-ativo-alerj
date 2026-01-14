// ==============================
// CONFIG / ESTADO GLOBAL
// ==============================

const API_URL = '/api';

let token = localStorage.getItem('token');
let currentUser = localStorage.getItem('username');

let questions = [];
let currentQuestion = 0;
let answers = {};
let subjectsStats = {};


// ==============================
// UTILIDADES
// ==============================

function getProgressKey() {
  return `simulado_progress_${currentUser}`;
}

function saveProgress() {
  const progress = {
    currentQuestion,
    answers,
    questions
  };
  localStorage.setItem(getProgressKey(), JSON.stringify(progress));
}

function clearProgress() {
  localStorage.removeItem(getProgressKey());
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}


// ==============================
// LOGIN / REGISTRO
// ==============================

async function login() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (!res.ok) {
    document.getElementById('login-msg').innerText = data.error;
    return;
  }

  token = data.token;
  currentUser = data.username;

  localStorage.setItem('token', token);
  localStorage.setItem('username', currentUser);

  initDashboard();
}

async function register() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  const res = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  if (res.ok) {
    alert('Conta criada! Faça login.');
  } else {
    alert('Erro ao criar conta.');
  }
}

function logout() {
  localStorage.clear();
  location.reload();
}


// ==============================
// DASHBOARD
// ==============================

async function initDashboard() {
  document.getElementById('user-display').innerText = currentUser;
  showScreen('dashboard-screen');
  loadHistory();
  loadRanking();
}

async function loadHistory() {
  const res = await fetch(`${API_URL}/history`, { headers: authHeaders() });
  const data = await res.json();

  const list = document.getElementById('history-list');
  list.innerHTML = '';

  if (!data.length) {
    list.innerHTML = '<li>Nenhum histórico.</li>';
    return;
  }

  data.forEach(r => {
    const li = document.createElement('li');
    li.innerText = `${r.score}/${r.total} - ${new Date(r.date).toLocaleString()}`;
    list.appendChild(li);
  });
}

async function loadRanking() {
  const res = await fetch(`${API_URL}/ranking`, { headers: authHeaders() });
  const data = await res.json();

  const list = document.getElementById('ranking-list');
  list.innerHTML = '';

  data.forEach((r, i) => {
    const li = document.createElement('li');
    li.innerText = `${i + 1}º ${r.username} — ${r.score}/${r.total}`;
    list.appendChild(li);
  });
}


// ==============================
// SIMULADO
// ==============================

async function startSimulado() {
  const saved = localStorage.getItem(getProgressKey());

  if (saved) {
    const resume = confirm('Existe um simulado em andamento. Deseja continuar?');
    if (resume) {
      const progress = JSON.parse(saved);
      questions = progress.questions;
      answers = progress.answers;
      currentQuestion = progress.currentQuestion;
      showScreen('simulado-screen');
      renderQuestion();
      return;
    } else {
      clearProgress();
    }
  }

  const res = await fetch(`${API_URL}/questions`, { headers: authHeaders() });
  questions = await res.json();

  answers = {};
  currentQuestion = 0;
  subjectsStats = {};

  showScreen('simulado-screen');
  renderQuestion();
}

function renderQuestion() {
  const q = questions[currentQuestion];

  document.getElementById('q-number').innerText =
    `Questão ${currentQuestion + 1}/${questions.length}`;

  document.getElementById('q-text').innerText = q.question;

  const optionsDiv = document.getElementById('q-options');
  optionsDiv.innerHTML = '';

  q.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.innerText = opt;
    btn.className = 'option-btn';

    if (answers[currentQuestion] === opt) {
      btn.classList.add('selected');
    }

    btn.onclick = () => selectOption(opt);
    optionsDiv.appendChild(btn);
  });

  document.getElementById('btn-next').style.display =
    currentQuestion === questions.length - 1 ? 'none' : 'inline-block';

  document.getElementById('btn-finish').style.display =
    currentQuestion === questions.length - 1 ? 'inline-block' : 'none';

  saveProgress();
}

function selectOption(option) {
  answers[currentQuestion] = option;
  saveProgress();
  renderQuestion();
}

function nextQuestion() {
  if (currentQuestion < questions.length - 1) {
    currentQuestion++;
    renderQuestion();
  }
}

function prevQuestion() {
  if (currentQuestion > 0) {
    currentQuestion--;
    renderQuestion();
  }
}

function quitSimulado() {
  saveProgress();
  showScreen('dashboard-screen');
}

async function finishSimulado() {
  let score = 0;

  questions.forEach((q, i) => {
    if (answers[i] === q.correct) {
      score++;
      subjectsStats[q.subject] = (subjectsStats[q.subject] || 0) + 1;
    }
  });

  await fetch(`${API_URL}/submit`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      score,
      total: questions.length,
      subjects: subjectsStats
    })
  });

  clearProgress();
  showResult(score);
}

function showResult(score) {
  document.getElementById('score-val').innerText = score;
  document.getElementById('total-val').innerText = questions.length;

  const list = document.getElementById('subject-list');
  list.innerHTML = '';

  Object.entries(subjectsStats).forEach(([s, v]) => {
    const li = document.createElement('li');
    li.innerText = `${s}: ${v} acertos`;
    list.appendChild(li);
  });

  showScreen('result-screen');
}

function showDashboard() {
  showScreen('dashboard-screen');
  loadHistory();
}


// ==============================
// AUTO INIT
// ==============================

if (token && currentUser) {
  initDashboard();
} else {
  showScreen('login-screen');
}
