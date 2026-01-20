// ================== VARIÁVEIS GLOBAIS ==================
let questoes = [];
let indiceAtual = 0;
let respostas = {};
let usuarioLogado = null;
let estatisticas = {};

const telas = {
  login: document.getElementById("login-screen"),
  dashboard: document.getElementById("dashboard-screen"),
  simulado: document.getElementById("simulado-screen"),
  resultado: document.getElementById("result-screen")
};

const qText = document.getElementById("q-text");
const qOptions = document.getElementById("q-options");
const qNumber = document.getElementById("q-number");

// ================== UTIL ==================
function mostrarTela(nome) {
  Object.values(telas).forEach(t => t.classList.remove("active"));
  telas[nome].classList.add("active");
}

function salvarProgresso() {
  localStorage.setItem(
    `progresso_${usuarioLogado}`,
    JSON.stringify({ indiceAtual, respostas })
  );
}

function carregarProgresso() {
  const salvo = localStorage.getItem(`progresso_${usuarioLogado}`);
  if (salvo) {
    const data = JSON.parse(salvo);
    indiceAtual = data.indiceAtual || 0;
    respostas = data.respostas || {};
  }
}

// ================== LOGIN ==================
function login() {
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();
  const msg = document.getElementById("login-msg");

  if (!user || !pass) {
    msg.innerText = "Informe usuário e senha.";
    return;
  }

  const usuarios = JSON.parse(localStorage.getItem("usuarios") || "{}");

  if (!usuarios[user]) {
    msg.innerText = "Usuário não encontrado.";
    return;
  }

  if (usuarios[user].senha !== pass) {
    msg.innerText = "Senha incorreta.";
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

  msg.innerText = "Conta criada! Faça login.";
}

// ================== SIMULADO ==================
async function startSimulado() {
  try {
    const res = await fetch("/questoes.json");
    questoes = await res.json();

    carregarProgresso();
    mostrarTela("simulado");
    renderizarQuestao();
  } catch (e) {
    alert("Erro ao carregar questões.");
  }
}

function renderizarQuestao() {
  const q = questoes[indiceAtual];
  if (!q) return finalizarSimulado();

  qNumber.innerText = `Questão ${indiceAtual + 1}/${questoes.length}`;
  qText.innerText = q.pergunta;
  qOptions.innerHTML = "";

  q.alternativas.forEach((alt, i) => {
    const letra = String.fromCharCode(65 + i);

    const btn = document.createElement("button");
    btn.className = "option";
    btn.innerHTML = `<strong>${letra})</strong> ${alt}`;

    if (respostas[indiceAtual] === letra) {
      btn.classList.add("selected");
    }

    btn.onclick = () => {
      respostas[indiceAtual] = letra;
      salvarProgresso();
      renderizarQuestao();
    };

    qOptions.appendChild(btn);
  });
}

function nextQuestion() {
  indiceAtual++;
  salvarProgresso();
  renderizarQuestao();
}

function prevQuestion() {
  if (indiceAtual > 0) indiceAtual--;
  renderizarQuestao();
}

// ================== PENDENTES ==================
function irParaPendente() {
  const pendente = questoes.findIndex((_, i) => !respostas[i]);
  if (pendente === -1) {
    alert("Nenhuma questão pendente 🎉");
    return;
  }
  indiceAtual = pendente;
  renderizarQuestao();
}

// ================== FINALIZAR ==================
function finishSimulado() {
  let acertos = 0;
  let pendentes = 0;
  estatisticas = {};

  questoes.forEach((q, i) => {
    estatisticas[q.materia] ??= { total: 0, acertos: 0 };
    estatisticas[q.materia].total++;

    if (!respostas[i]) {
      pendentes++;
      return;
    }

    if (respostas[i] === q.correta) {
      acertos++;
      estatisticas[q.materia].acertos++;
    }
  });

  if (pendentes > 0) {
    if (!confirm(`Você tem ${pendentes} pendente(s). Finalizar mesmo assim?`)) {
      return;
    }
  }

  salvarResultado(acertos);
  mostrarResultado(acertos, pendentes);
  localStorage.removeItem(`progresso_${usuarioLogado}`);
}

// ================== RESULTADO ==================
function salvarResultado(pontuacao) {
  const usuarios = JSON.parse(localStorage.getItem("usuarios"));
  usuarios[usuarioLogado].historico.push({
    data: new Date().toLocaleString(),
    nota: pontuacao
  });
  localStorage.setItem("usuarios", JSON.stringify(usuarios));
}

function mostrarResultado(acertos, pendentes) {
  mostrarTela("resultado");

  document.getElementById("score-val").innerText = acertos;
  document.getElementById("total-val").innerText = questoes.length;

  const lista = document.getElementById("subject-list");
  lista.innerHTML = "";

  Object.keys(estatisticas).forEach(mat => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${mat}</strong>:
      ${estatisticas[mat].acertos}/${estatisticas[mat].total}
      —
      <a target="_blank"
         href="https://www.youtube.com/results?search_query=${encodeURIComponent(mat)}">
         Revisar
      </a>
    `;
    lista.appendChild(li);
  });

  desenharGrafico();
}

// ================== GRÁFICO ==================
function desenharGrafico() {
  let canvas = document.getElementById("grafico");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "grafico";
    canvas.width = 400;
    canvas.height = 300;
    document.getElementById("recommendations").appendChild(canvas);
  }

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const materias = Object.keys(estatisticas);
  const largura = 300 / materias.length;
  const base = 250;

  materias.forEach((m, i) => {
    const taxa =
      estatisticas[m].acertos / estatisticas[m].total;
    const altura = taxa * 200;

    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(50 + i * largura, base - altura, 30, altura);

    ctx.fillStyle = "#fff";
    ctx.fillText(m.slice(0, 6), 50 + i * largura, base + 15);
  });
}

// ================== DASHBOARD ==================
function logout() {
  localStorage.removeItem("usuarioLogado");
  location.reload();
}

function showDashboard() {
  mostrarTela("dashboard");
}
