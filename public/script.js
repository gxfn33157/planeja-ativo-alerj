let questoes = [];
let questaoAtual = 0;
let respostas = [];
let usuarioLogado = null;

/* ================= LOGIN ================= */

async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (!data.success) {
    alert(data.error || "Erro ao logar");
    return;
  }

  usuarioLogado = data.user;
  document.getElementById("login").style.display = "none";
  document.getElementById("home").style.display = "block";
  document.getElementById("bemVindo").textContent =
    `Bem-vindo, ${usuarioLogado.username}`;
}

/* ================= SIMULADO ================= */

async function iniciarSimulado() {
  const res = await fetch("/questoes");
  questoes = await res.json();

  if (!questoes || questoes.length === 0) {
    alert("Erro ao carregar questões.");
    return;
  }

  respostas = new Array(questoes.length).fill(null);
  questaoAtual = 0;

  document.getElementById("home").style.display = "none";
  document.getElementById("simulado").style.display = "block";

  renderQuestao();
}

function renderQuestao() {
  const q = questoes[questaoAtual];

  document.getElementById("contador").textContent =
    `Questão ${questaoAtual + 1} / ${questoes.length}`;

  document.getElementById("textoQuestao").textContent = q.pergunta;

  const container = document.getElementById("alternativas");
  container.innerHTML = "";

  q.alternativas.forEach((alt, i) => {
    const btn = document.createElement("button");
    btn.className = "alternativa";
    btn.textContent = `${String.fromCharCode(65 + i)}) ${alt}`;
    btn.onclick = () => {
      respostas[questaoAtual] = i;
      renderQuestao();
    };

    if (respostas[questaoAtual] === i) {
      btn.classList.add("selecionada");
    }

    container.appendChild(btn);
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

  document.getElementById("simulado").style.display = "none";
  document.getElementById("resultado").style.display = "block";

  document.getElementById("pontuacao").textContent =
    `${acertos} / ${questoes.length}`;
}
