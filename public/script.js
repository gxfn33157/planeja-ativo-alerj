/* =========================
   VARIÁVEIS GLOBAIS
========================= */
let token = localStorage.getItem("token");
let usuario = JSON.parse(localStorage.getItem("user"));

let questoes = [];
let indiceAtual = 0;
let respostas = {};
let estatisticas = {};

/* =========================
   ELEMENTOS
========================= */
const telas = document.querySelectorAll(".screen");

const loginMsg = document.getElementById("login-msg");
const userDisplay = document.getElementById("user-display");

const qNumber = document.getElementById("q-number");
const qText = document.getElementById("q-text");
const qOptions = document.getElementById("q-options");

const btnNext = document.getElementById("btn-next");
const btnFinish = document.getElementById("btn-finish");

/* =========================
   CONTROLE DE TELAS
========================= */
function mostrarTela(id) {
  telas.forEach(t => t.classList.remove("active"));
  const tela = document.getElementById(id);
  if (tela) tela.classList.add("active");
}

/* =========================
   LOGIN / REGISTRO
========================= */
function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    loginMsg.innerText = "Preencha usuário e senha.";
    return;
  }

  fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  })
    .then(r => r.json())
    .then(data => {
      if (data.token) {
        token = data.token;
        usuario = { username: data.username };
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(usuario));
        iniciarDashboard();
      } else {
        // se não existir, cria
        registrar(username, password);
      }
    })
    .catch(() => {
      loginMsg.innerText = "Erro de conexão.";
    });
}

function registrar(username, password) {
  fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        loginMsg.innerText = "Conta criada! Entrando...";
        setTimeout(login, 800);
      } else {
        loginMsg.innerText = data.error || "Erro ao criar conta.";
      }
    });
}

function logout() {
  localStorage.clear();
  location.reload();
}

/* =========================
   DASHBOARD
========================= */
function iniciarDashboard() {
  userDisplay.innerText = usuario.username;
  mostrarTela("dashboard-screen");
  carregarHistorico();
  carregarRanking();
}

/* =========================
   SIMULADO
========================= */
function startSimulado() {
  fetch("/api/questions", {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(data => {
      questoes = shuffle(data).slice(0, 80);
      indiceAtual = 0;
      respostas = {};
      estatisticas = {};
      salvarProgresso();
      mostrarTela("simulado-screen");
      renderizarQuestao();
    })
    .catch(() => {
      alert("Erro ao carregar questões.");
    });
}

function renderizarQuestao() {
  const q = questoes[indiceAtual];
  if (!q) return;

  qNumber.innerText = `Questão ${indiceAtual + 1} / ${questoes.length}`;
  qText.innerText = q.texto;
  qOptions.innerHTML = "";

  Object.entries(q.alternativas).forEach(([letra, texto]) => {
    const label = document.createElement("label");
    label.className = "option";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "resposta";
    input.value = letra;

    if (respostas[q.id] === letra) input.checked = true;

    input.onchange = () => {
      respostas[q.id] = letra;
      salvarProgresso();
    };

    label.appendChild(input);
    label.append(` ${letra.toUpperCase()}) ${texto}`);
    qOptions.appendChild(label);
  });

  btnNext.style.display = indiceAtual === questoes.length - 1 ? "none" : "inline-block";
  btnFinish.style.display = indiceAtual === questoes.length - 1 ? "inline-block" : "none";
}

function nextQuestion() {
  indiceAtual++;
  salvarProgresso();
  renderizarQuestao();
}

function prevQuestion() {
  if (indiceAtual > 0) {
    indiceAtual--;
    salvarProgresso();
    renderizarQuestao();
  }
}

function quitSimulado() {
  salvarProgresso();
  mostrarTela("dashboard-screen");
}

/* =========================
   FINALIZAR
========================= */
function finishSimulado() {
  let acertos = 0;

  questoes.forEach(q => {
    if (!estatisticas[q.materia]) estatisticas[q.materia] = { total: 0, acertos: 0 };
    estatisticas[q.materia].total++;

    if (respostas[q.id] === q.correta) {
      acertos++;
      estatisticas[q.materia].acertos++;
    }
  });

  fetch("/api/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      score: acertos,
      total: questoes.length,
      subjects: estatisticas
    })
  });

  mostrarResultado(acertos);
  localStorage.removeItem("simuladoProgresso");
}

function mostrarResultado(acertos) {
  document.getElementById("score-val").innerText = acertos;
  document.getElementById("total-val").innerText = questoes.length;

  const ul = document.getElementById("subject-list");
  ul.innerHTML = "";

  Object.entries(estatisticas).forEach(([mat, dados]) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${mat}</strong>: ${dados.acertos}/${dados.total}`;
    ul.appendChild(li);
  });

  mostrarTela("result-screen");
}

function showDashboard() {
  mostrarTela("dashboard-screen");
  carregarHistorico();
}

/* =========================
   HISTÓRICO E RANKING
========================= */
function carregarHistorico() {
  fetch("/api/history", {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(data => {
      const ul = document.getElementById("history-list");
      ul.innerHTML = "";
      data.forEach(r => {
        const li = document.createElement("li");
        li.innerText = `${r.score}/${r.total} - ${new Date(r.date).toLocaleDateString()}`;
        ul.appendChild(li);
      });
    });
}

function carregarRanking() {
  fetch("/api/ranking", {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(data => {
      const ul = document.getElementById("ranking-list");
      ul.innerHTML = "";
      data.forEach((r, i) => {
        const li = document.createElement("li");
        li.innerText = `${i + 1}. ${r.username} - ${r.score}`;
        ul.appendChild(li);
      });
    });
}

/* =========================
   UTILIDADES
========================= */
function salvarProgresso() {
  localStorage.setItem(
    "simuladoProgresso",
    JSON.stringify({ indiceAtual, respostas })
  );
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

/* =========================
   AUTOLOGIN
========================= */
window.onload = () => {
  if (token && usuario) iniciarDashboard();
  else mostrarTela("login-screen");
};
