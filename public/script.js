/* ===============================
   ESTADO GLOBAL
================================ */
let usuarioLogado = null;
let questoes = [];
let questaoAtual = 0;
let respostas = [];

/* ===============================
   TELAS
================================ */
function mostrarTela(id) {
  document.querySelectorAll(".screen").forEach(tela => {
    tela.classList.remove("active");
  });

  const tela = document.getElementById(id);
  if (tela) tela.classList.add("active");
}

/* ===============================
   LOGIN
================================ */
async function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const msg = document.getElementById("login-msg");

  msg.textContent = "";

  if (!username || !password) {
    msg.textContent = "Preencha usuário e senha.";
    return;
  }

  try {
    const res = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      msg.textContent = data.error || "Erro ao entrar.";
      return;
    }

    usuarioLogado = data.user;
    document.getElementById("user-display").textContent = usuarioLogado.username;
    mostrarTela("dashboard-screen");

  } catch (e) {
    msg.textContent = "Erro de conexão.";
  }
}

function logout() {
  usuarioLogado = null;
  mostrarTela("login-screen");
}

/* ===============================
   SIMULADO
================================ */
async function startSimulado() {
  try {
    const res = await fetch("/questoes");
    if (!res.ok) throw new Error("Falha ao carregar");

    questoes = await res.json();

    if (!Array.isArray(questoes) || questoes.length === 0) {
      throw new Error("Questões inválidas");
    }

    // embaralhar
    questoes = questoes.sort(() => Math.random() - 0.5);

    respostas = new Array(questoes.length).fill(null);
    questaoAtual = 0;

    mostrarTela("simulado-screen");
    renderQuestao();

  } catch (e) {
    alert("Erro ao carregar questões.");
    console.error(e);
  }
}

/* ===============================
   RENDER QUESTÃO
================================ */
function renderQuestao() {
  const q = questoes[questaoAtual];
  if (!q) return;

  document.getElementById("q-number").textContent =
    `Questão ${questaoAtual + 1}/${questoes.length}`;

  document.getElementById("q-text").textContent = q.pergunta;

  const box = document.getElementById("q-options");
  box.innerHTML = "";

  q.alternativas.forEach((alt, i) => {
    const btn = document.createElement("button");
    btn.textContent = `${String.fromCharCode(65 + i)}) ${alt}`;
    btn.className = "option-btn";

    if (respostas[questaoAtual] === i) {
      btn.classList.add("selected");
    }

    btn.onclick = () => {
      respostas[questaoAtual] = i;
      renderQuestao();
    };

    box.appendChild(btn);
  });

  document.getElementById("btn-finish").style.display =
    questaoAtual === questoes.length - 1 ? "inline-block" : "none";
}

/* ===============================
   NAVEGAÇÃO
================================ */
function prevQuestion() {
  if (questaoAtual > 0) {
    questaoAtual--;
    renderQuestao();
  }
}

function nextQuestion() {
  if (questaoAtual < questoes.length - 1) {
    questaoAtual++;
    renderQuestao();
  }
}

function finishSimulado() {
  let acertos = 0;

  questoes.forEach((q, i) => {
    if (respostas[i] === q.correta) acertos++;
  });

  document.getElementById("score-val").textContent = acertos;
  document.getElementById("total-val").textContent = questoes.length;

  mostrarTela("result-screen");
}

function quitSimulado() {
  mostrarTela("dashboard-screen");
}

function showDashboard() {
  mostrarTela("dashboard-screen");
}

/* ===============================
   INICIAL
================================ */
window.onload = () => {
  mostrarTela("login-screen");
};
