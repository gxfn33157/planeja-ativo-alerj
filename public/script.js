/***********************
 * ESTADO GLOBAL
 ***********************/
let questoes = [];
let questoesEmUso = [];
let indiceAtual = 0;
let respostas = {};
let usuarioLogado = null;
let estatisticas = {};

/***********************
 * ELEMENTOS
 ***********************/
const telas = {
  login: document.getElementById("login-screen"),
  dashboard: document.getElementById("dashboard-screen"),
  simulado: document.getElementById("simulado-screen"),
  resultado: document.getElementById("result-screen")
};

const qText = document.getElementById("q-text");
const qOptions = document.getElementById("q-options");
const qNumber = document.getElementById("q-number");

/***********************
 * UTIL
 ***********************/
function mostrarTela(nome) {
  Object.values(telas).forEach(t => t.classList.remove("active"));
  telas[nome].classList.add("active");
}

function shuffle(array) {
  return array
    .map(v => ({ v, r: Math.random() }))
    .sort((a, b) => a.r - b.r)
    .map(o => o.v);
}

/***********************
 * LOGIN
 ***********************/
function login() {
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();
  const msg = document.getElementById("login-msg");

  const usuarios = JSON.parse(localStorage.getItem("usuarios") || "{}");

  if (!usuarios[user] || usuarios[user].senha !== pass) {
    msg.innerText = "Usuário ou senha inválidos.";
    return;
  }

  usuarioLogado = user;
  localStorage.setItem("usuarioLogado", user);
  document.getElementById("user-display").innerText = user;

  mostrarTela("dashboard");
}

function register() {
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();
  const msg = document.getElementById("login-msg");

  if (!user || !pass) {
    msg.innerText = "Preencha todos os campos.";
    return;
  }

  const usuarios = JSON.parse(localStorage.getItem("usuarios") || "{}");

  if (usuarios[user]) {
    msg.innerText = "Usuário já existe.";
    return;
  }

  usuarios[user] = { senha: pass, historico: [] };
  localStorage.setItem("usuarios", JSON.stringify(usuarios));

  msg.innerText = "Conta criada. Faça login.";
}

/***********************
 * SIMULADO
 ***********************/
async function startSimulado() {
  if (!usuarioLogado) return;

  const res = await fetch("/questoes.json");
  questoes = await res.json();

  // 🔀 SHUFFLE INTELIGENTE
  questoesEmUso = shuffle(questoes).slice(0, 80);

  respostas = {};
  indiceAtual = 0;
  mostrarTela("simulado");
  renderizarQuestao();
}

function renderizarQuestao() {
  const q = questoesEmUso[indiceAtual];
  if (!q) return;

  qNumber.innerText = `Questão ${indiceAtual + 1}/80`;
  qText.innerText = q.pergunta;
  qOptions.innerHTML = "";

  q.alternativas.forEach((alt, i) => {
    const letra = String.fromCharCode(65 + i);
    const btn = document.createElement("button");
    btn.className = "option";
    btn.innerText = `${letra}) ${alt}`;

    if (respostas[indiceAtual] === letra) {
      btn.classList.add("selected");
    }

    btn.onclick = () => {
      respostas[indiceAtual] = letra;
      renderizarQuestao();
    };

    qOptions.appendChild(btn);
  });
}

function nextQuestion() {
  if (indiceAtual < 79) indiceAtual++;
  renderizarQuestao();
}

function prevQuestion() {
  if (indiceAtual > 0) indiceAtual--;
  renderizarQuestao();
}

function irParaPendente() {
  const p = questoesEmUso.findIndex((_, i) => !respostas[i]);
  if (p !== -1) {
    indiceAtual = p;
    renderizarQuestao();
  } else {
    alert("Nenhuma pendente 🎉");
  }
}

/***********************
 * FINALIZAR
 ***********************/
function finishSimulado() {
  estatisticas = {};
  let acertos = 0;

  questoesEmUso.forEach((q, i) => {
    estatisticas[q.materia] ??= { total: 0, acertos: 0 };
    estatisticas[q.materia].total++;

    if (respostas[i] === q.correta) {
      acertos++;
      estatisticas[q.materia].acertos++;
    }
  });

  salvarResultado(acertos);
  mostrarResultado(acertos);
}

function salvarResultado(pontuacao) {
  const usuarios = JSON.parse(localStorage.getItem("usuarios"));
  usuarios[usuarioLogado].historico.push({
    data: new Date().toLocaleString(),
    nota: pontuacao
  });
  localStorage.setItem("usuarios", JSON.stringify(usuarios));
}

function mostrarResultado(acertos) {
  mostrarTela("resultado");

  document.getElementById("score-val").innerText = acertos;
  document.getElementById("total-val").innerText = 80;

  const lista = document.getElementById("subject-list");
  lista.innerHTML = "";

  Object.entries(estatisticas).forEach(([mat, v]) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${mat}</strong>:
      ${v.acertos}/${v.total}
      —
      <a target="_blank"
         href="https://www.youtube.com/results?search_query=${encodeURIComponent(mat)}">
         Revisar
      </a>
    `;
    lista.appendChild(li);
  });
}

/***********************
 * DASHBOARD
 ***********************/
function logout() {
  localStorage.removeItem("usuarioLogado");
  location.reload();
}

function showDashboard() {
  mostrarTela("dashboard");
}

/***********************
 * INIT
 ***********************/
window.onload = () => {
  const user = localStorage.getItem("usuarioLogado");
  if (user) {
    usuarioLogado = user;
    document.getElementById("user-display").innerText = user;
    mostrarTela("dashboard");
  } else {
    mostrarTela("login");
  }
};
