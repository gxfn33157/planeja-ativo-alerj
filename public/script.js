// =================== VARIÁVEIS GLOBAIS ===================
let questoes = [];
let respostas = {};
let indiceAtual = 0;
let token = localStorage.getItem("token");

// =================== ELEMENTOS ===================
const screens = document.querySelectorAll(".screen");

const loginScreen = document.getElementById("login-screen");
const dashboardScreen = document.getElementById("dashboard-screen");
const simuladoScreen = document.getElementById("simulado-screen");
const resultScreen = document.getElementById("result-screen");

const perguntaEl = document.getElementById("q-text");
const opcoesEl = document.getElementById("q-options");
const progressoEl = document.getElementById("q-number");

const btnNext = document.getElementById("btn-next");
const btnFinish = document.getElementById("btn-finish");

const userDisplay = document.getElementById("user-display");

// =================== CONTROLE DE TELAS ===================
function showScreen(screen) {
  screens.forEach(s => s.classList.remove("active"));
  screen.classList.add("active");
}

// =================== LOGIN / LOGOUT ===================
async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const msg = document.getElementById("login-msg");

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      msg.innerText = data.error || "Erro no login";
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("username", data.username);
    token = data.token;

    userDisplay.innerText = data.username;
    showScreen(dashboardScreen);
  } catch (err) {
    msg.innerText = "Erro de conexão com o servidor";
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  token = null;
  showScreen(loginScreen);
}

// =================== INICIAR SIMULADO ===================
async function startSimulado() {
  try {
    const res = await fetch("/api/simulado", {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    const data = await res.json();

    questoes = data.questions;
    respostas = data.answers || {};
    indiceAtual = data.currentIndex || 0;

    showScreen(simuladoScreen);
    renderizarQuestao();
  } catch (err) {
    alert("Erro ao carregar simulado");
  }
}

// =================== RENDERIZAR QUESTÃO ===================
function renderizarQuestao() {
  const questao = questoes[indiceAtual];

  if (!questao) {
    finalizarSimulado();
    return;
  }

  perguntaEl.innerText = questao.texto;
  opcoesEl.innerHTML = "";

  const letras = ["A", "B", "C", "D", "E"];

  questao.alts.forEach((alt, i) => {
    const letra = letras[i];

    const label = document.createElement("label");
    label.className = "option";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "alternativa";
    input.value = letra;

    if (respostas[indiceAtual] === letra) {
      input.checked = true;
    }

    input.addEventListener("change", () => {
      respostas[indiceAtual] = letra;
      salvarProgresso();
    });

    label.appendChild(input);
    label.append(` ${letra}) ${alt.l}`);
    opcoesEl.appendChild(label);
  });

  progressoEl.innerText = `Questão ${indiceAtual + 1}/${questoes.length}`;

  btnNext.style.display = indiceAtual === questoes.length - 1 ? "none" : "inline-block";
  btnFinish.style.display = indiceAtual === questoes.length - 1 ? "inline-block" : "none";
}

// =================== SALVAR PROGRESSO (API) ===================
function salvarProgresso() {
  fetch("/api/progress", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify({
      currentIndex: indiceAtual,
      answers: respostas
    })
  });
}

// =================== NAVEGAÇÃO ===================
function nextQuestion() {
  if (!respostas[indiceAtual]) {
    alert("Selecione uma alternativa antes de continuar.");
    return;
  }

  indiceAtual++;
  salvarProgresso();
  renderizarQuestao();
}

function prevQuestion() {
  if (indiceAtual > 0) {
    indiceAtual--;
    renderizarQuestao();
  }
}

function quitSimulado() {
  if (confirm("Deseja sair? Seu progresso ficará salvo.")) {
    showScreen(dashboardScreen);
  }
}

// =================== FINALIZAR SIMULADO ===================
async function finalizarSimulado() {
  let acertos = 0;

  questoes.forEach((q, i) => {
    if (respostas[i] === q.correta) acertos++;
  });

  document.getElementById("score-val").innerText = acertos;
  document.getElementById("total-val").innerText = questoes.length;

  await fetch("/api/finish", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + token
    }
  });

  showScreen(resultScreen);
}

// =================== DASHBOARD ===================
function showDashboard() {
  showScreen(dashboardScreen);
}

// =================== AUTO LOGIN ===================
if (token) {
  const username = localStorage.getItem("username");
  if (username) {
    userDisplay.innerText = username;
    showScreen(dashboardScreen);
  } else {
    showScreen(loginScreen);
  }
} else {
  showScreen(loginScreen);
}
