/* =====================
   VARIÁVEIS
===================== */
let usuario = JSON.parse(localStorage.getItem("user")) || null;
let questoes = [];
let indiceAtual = 0;
let respostas = {};

/* =====================
   ELEMENTOS
===================== */
const telas = document.querySelectorAll(".screen");

const loginMsg = document.getElementById("login-msg");
const userDisplay = document.getElementById("user-display");

const qNumber = document.getElementById("q-number");
const qText = document.getElementById("q-text");
const qOptions = document.getElementById("q-options");

const btnNext = document.getElementById("btn-next");
const btnFinish = document.getElementById("btn-finish");

/* =====================
   TELAS
===================== */
function mostrarTela(id) {
  telas.forEach(t => t.classList.remove("active"));
  const tela = document.getElementById(id);
  if (tela) tela.classList.add("active");
}

/* =====================
   LOGIN / REGISTRO
===================== */
function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    loginMsg.innerText = "Informe usuário e senha.";
    return;
  }

  fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        usuario = data.user;
        localStorage.setItem("user", JSON.stringify(usuario));
        iniciarDashboard();
      } else {
        criarConta(username, password);
      }
    })
    .catch(() => {
      loginMsg.innerText = "Erro ao conectar com o servidor.";
    });
}

function criarConta(username, password) {
  fetch("/register", {
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
  localStorage.removeItem("user");
  location.reload();
}

/* =====================
   DASHBOARD
===================== */
function iniciarDashboard() {
  userDisplay.innerText = usuario.username;
  mostrarTela("dashboard-screen");
}

/* =====================
   SIMULADO
===================== */
function startSimulado() {
  fetch("/questoes")
    .then(r => r.json())
    .then(data => {
      questoes = shuffle(data).slice(0, 80);
      indiceAtual = 0;
      respostas = {};
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
    };

    label.appendChild(input);
    label.append(` ${letra.toUpperCase()}) ${texto}`);
    qOptions.appendChild(label);
  });

  btnNext.style.display =
    indiceAtual < questoes.length - 1 ? "inline-block" : "none";
  btnFinish.style.display =
    indiceAtual === questoes.length - 1 ? "inline-block" : "none";
}

function nextQuestion() {
  indiceAtual++;
  renderizarQuestao();
}

function prevQuestion() {
  if (indiceAtual > 0) {
    indiceAtual--;
    renderizarQuestao();
  }
}

function finishSimulado() {
  let acertos = 0;

  questoes.forEach(q => {
    if (respostas[q.id] === q.correta) acertos++;
  });

  document.getElementById("score-val").innerText = acertos;
  document.getElementById("total-val").innerText = questoes.length;

  mostrarTela("result-screen");
}

function showDashboard() {
  mostrarTela("dashboard-screen");
}

/* =====================
   UTIL
===================== */
function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

/* =====================
   AUTOLOGIN
===================== */
window.onload = () => {
  if (usuario) iniciarDashboard();
  else mostrarTela("login-screen");
};
