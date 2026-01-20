let questoes = [];
let questaoAtual = 0;
let respostas = [];
let usuario = null;

/* ================= UTIL ================= */

function mostrarTela(id) {
  document.querySelectorAll(".screen").forEach(tela => {
    tela.classList.remove("active");
  });
  document.getElementById(id).classList.add("active");
}

/* ================= LOGIN ================= */

async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const msg = document.getElementById("login-msg");

  msg.textContent = "";

  try {
    const res = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!data.success) {
      msg.textContent = data.error || "Erro ao entrar";
      return;
    }

    usuario = data.user;
    document.getElementById("user-display").textContent = usuario.username;
    mostrarTela("dashboard-screen");

  } catch {
    msg.textContent = "Erro de conexão.";
  }
}

function logout() {
  usuario = null;
  mostrarTela("login-screen");
}

/* ================= SIMULADO ================= */

async function startSimulado() {
  try {
    const res = await fetch("/questoes");
    questoes = await res.json();

    if (!Array.isArray(questoes) || questoes.length === 0) {
      alert("Erro ao carregar questões.");
      return;
    }

    // embaralhar e pegar 80
    questoes = questoes.sort(() => Math.random() - 0.5).slice(0, 80);

    respostas = new Array(questoes.length).fill(null);
    questaoAtual = 0;

    mostrarTela("simulado-screen");
    renderQuestao();

  } catch {
    alert("Erro ao carregar questões.");
  }
}

function renderQuestao() {
  const q = questoes[questaoAtual];

  document.getElementById("contador").textContent =
    `Questão ${questaoAtual + 1} / ${questoes.length}`;

  document.getElementById("pergunta").textContent = q.pergunta;

  const altDiv = document.getElementById("alternativas");
  altDiv.innerHTML = "";

  q.alternativas.forEach((texto, i) => {
    const btn = document.createElement("button");
    btn.className = "alternativa";
    btn.textContent = `${String.fromCharCode(65 + i)}) ${texto}`;

    if (respostas[questaoAtual] === i) {
      btn.classList.add("selecionada");
    }

    btn.onclick = () => {
      respostas[questaoAtual] = i;
      renderQuestao();
    };

    altDiv.appendChild(btn);
  });
}

function anterior() {
  if (questaoAtual > 0) {
    questaoAtual--;
    renderQuestao();
  }
}

function proxima() {
  if (questaoAtual < questoes.length - 1) {
    questaoAtual++;
    renderQuestao();
  }
}

function finalizar() {
  let acertos = 0;

  questoes.forEach((q, i) => {
    if (respostas[i] === q.correta) acertos++;
  });

  document.getElementById("pontuacao").textContent =
    `Você acertou ${acertos} de ${questoes.length} questões.`;

  mostrarTela("resultado-screen");
}

function voltarDashboard() {
  mostrarTela("dashboard-screen");
}

/* ================= INIT ================= */

window.onload = () => {
  mostrarTela("login-screen");
};
