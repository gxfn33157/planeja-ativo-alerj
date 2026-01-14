/* =========================
   VARIÁVEIS GLOBAIS
========================= */
let questoes = [];
let questaoAtual = 0;
let respostas = [];

/* =========================
   CONTROLE DE TELAS
========================= */
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

/* =========================
   LOGIN / LOGOUT
========================= */
function login() {
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();
  const msg = document.getElementById("login-msg");

  if (!user || !pass) {
    msg.innerText = "Preencha usuário e senha.";
    return;
  }

  localStorage.setItem("planejaUser", user);
  showDashboard();
}

function register() {
  alert("Cadastro simplificado: use qualquer usuário e senha.");
}

function logout() {
  localStorage.removeItem("planejaUser");
  showScreen("login-screen");
}

function showDashboard() {
  const user = localStorage.getItem("planejaUser");
  if (!user) {
    showScreen("login-screen");
    return;
  }

  document.getElementById("user-display").innerText = user;
  showScreen("dashboard-screen");
}

/* =========================
   SIMULADO
========================= */
async function startSimulado() {
  try {
    const res = await fetch("/questoes.json");
    questoes = await res.json();

    embaralhar(questoes);
    questoes = questoes.slice(0, 80);

    questaoAtual = 0;
    respostas = new Array(questoes.length).fill(null);

    showScreen("simulado-screen");
    renderQuestao();
  } catch (e) {
    alert("Erro ao carregar questões.");
    console.error(e);
  }
}

function renderQuestao() {
  const q = questoes[questaoAtual];

  document.getElementById("q-number").innerText =
    `Questão ${questaoAtual + 1}/${questoes.length}`;

  document.getElementById("q-text").innerText = q.texto;

  const optionsDiv = document.getElementById("q-options");
  optionsDiv.innerHTML = "";

  const letras = ["A", "B", "C", "D", "E"];

  q.alts.forEach((alt, i) => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.innerText = `${letras[i]}) ${alt.l}`;

    if (respostas[questaoAtual] === letras[i]) {
      btn.classList.add("selected");
    }

    btn.onclick = () => {
      respostas[questaoAtual] = letras[i];
      renderQuestao();
    };

    optionsDiv.appendChild(btn);
  });

  document.getElementById("btn-next").style.display =
    questaoAtual === questoes.length - 1 ? "none" : "inline-block";

  document.getElementById("btn-finish").style.display =
    questaoAtual === questoes.length - 1 ? "inline-block" : "none";
}

function nextQuestion() {
  if (questaoAtual < questoes.length - 1) {
    questaoAtual++;
    renderQuestao();
  }
}

function prevQuestion() {
  if (questaoAtual > 0) {
    questaoAtual--;
    renderQuestao();
  }
}

function quitSimulado() {
  if (confirm("Deseja sair do simulado?")) {
    showDashboard();
  }
}

/* =========================
   FINALIZAÇÃO
========================= */
function finishSimulado() {
  let acertos = 0;
  const porMateria = {};

  questoes.forEach((q, i) => {
    if (!porMateria[q.materia]) {
      porMateria[q.materia] = { total: 0, acertos: 0 };
    }

    porMateria[q.materia].total++;

    if (respostas[i] === q.correta) {
      acertos++;
      porMateria[q.materia].acertos++;
    }
  });

  document.getElementById("score-val").innerText = acertos;
  document.getElementById("total-val").innerText = questoes.length;

  const list = document.getElementById("subject-list");
  list.innerHTML = "";

  Object.keys(porMateria).forEach(mat => {
    const li = document.createElement("li");
    li.innerText = `${mat}: ${porMateria[mat].acertos}/${porMateria[mat].total}`;
    list.appendChild(li);
  });

  showScreen("result-screen");
}

/* =========================
   UTIL
========================= */
function embaralhar(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/* =========================
   AUTO LOGIN
========================= */
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("planejaUser")) {
    showDashboard();
  } else {
    showScreen("login-screen");
  }
});
