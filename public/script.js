let questoes = [];
let questaoAtual = 0;
let respostas = [];
let usuario = null;

/* ================= TELAS ================= */

function mostrarTela(id) {
  document.querySelectorAll(".screen").forEach(t => t.classList.remove("active"));
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
      msg.textContent = data.error;
      return;
    }

    usuario = data.user;
    document.getElementById("user-display").textContent = usuario.username;

    carregarProgresso();
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
  if (questoes.length === 0) {
    const res = await fetch("/questoes");
    const todas = await res.json();

    // 🔥 Sorteio aleatório SEM REPETIR
    questoes = todas
      .sort(() => Math.random() - 0.5)
      .slice(0, 80);

    respostas = new Array(questoes.length).fill(null);
    questaoAtual = 0;
  }

  mostrarTela("simulado-screen");
  renderQuestao();
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
      salvarProgresso();
      renderQuestao();
    };

    altDiv.appendChild(btn);
  });
}

function anterior() {
  if (questaoAtual > 0) {
    questaoAtual--;
    salvarProgresso();
    renderQuestao();
  }
}

function proxima() {
  if (questaoAtual < questoes.length - 1) {
    questaoAtual++;
    salvarProgresso();
    renderQuestao();
  }
}

function finalizar() {
  localStorage.removeItem("simulado_" + usuario.id);

  let acertos = 0;
  const materias = {};

  questoes.forEach((q, i) => {
    if (!materias[q.materia]) {
      materias[q.materia] = { total: 0, acertos: 0 };
    }

    materias[q.materia].total++;

    if (respostas[i] === q.correta) {
      acertos++;
      materias[q.materia].acertos++;
    }
  });

  document.getElementById("pontuacao").textContent =
    `Você acertou ${acertos} de ${questoes.length} questões`;

  const detalhe = document.getElementById("resultado-detalhado");
  detalhe.innerHTML = "<h3>Análise por Matéria</h3>";

  for (let m in materias) {
    detalhe.innerHTML += `
      <p>
        <strong>${m}</strong> — ${materias[m].acertos}/${materias[m].total}<br>
        <a target="_blank"
          href="https://www.youtube.com/results?search_query=${encodeURIComponent(m)}">
          📚 Revisar matéria
        </a>
      </p>
    `;
  }

  mostrarTela("resultado-screen");
}

function voltarDashboard() {
  mostrarTela("dashboard-screen");
}

/* ================= PROGRESSO ================= */

function salvarProgresso() {
  localStorage.setItem(
    "simulado_" + usuario.id,
    JSON.stringify({ questoes, respostas, questaoAtual })
  );
}

function carregarProgresso() {
  const salvo = localStorage.getItem("simulado_" + usuario.id);
  if (salvo) {
    const dados = JSON.parse(salvo);
    questoes = dados.questoes;
    respostas = dados.respostas;
    questaoAtual = dados.questaoAtual;
  }
}

window.onload = () => mostrarTela("login-screen");
