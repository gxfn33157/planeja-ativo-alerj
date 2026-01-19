let currentUser = null;
let questoes = [];
let currentIndex = 0;
let respostas = [];

/* ======================
   TELAS
====================== */

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s =>
    s.classList.remove("active")
  );
  document.getElementById(id).classList.add("active");
}

/* ======================
   LOGIN / REGISTRO
====================== */

function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const msg = document.getElementById("login-msg");

  fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  })
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(data => {
      currentUser = data.username;
      document.getElementById("user-display").innerText = currentUser;
      showScreen("dashboard-screen");
    })
    .catch(() => {
      msg.innerText = "Usuário ou senha inválidos.";
    });
}

function register() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const msg = document.getElementById("login-msg");

  fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  })
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(() => {
      msg.innerText = "Conta criada! Agora faça login.";
    })
    .catch(() => {
      msg.innerText = "Erro ao criar conta.";
    });
}

function logout() {
  currentUser = null;
  showScreen("login-screen");
}

/* ======================
   SIMULADO
====================== */

function startSimulado() {
  fetch("/questoes.json")
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(data => {
      questoes = data;
      respostas = new Array(questoes.length).fill(null);
      currentIndex = 0;
      showScreen("simulado-screen");
      renderQuestao();
    })
    .catch(() => {
      alert("Erro ao carregar questões.");
    });
}

function renderQuestao() {
  const q = questoes[currentIndex];

  document.getElementById("q-number").innerText =
    `Questão ${currentIndex + 1}/${questoes.length}`;

  document.getElementById("q-text").innerText = q.pergunta;

  const optionsDiv = document.getElementById("q-options");
  optionsDiv.innerHTML = "";

  q.opcoes.forEach((opt, i) => {
    const label = document.createElement("label");
    label.innerHTML = `
      <input type="radio" name="option" value="${i}"
        ${respostas[currentIndex] === i ? "checked" : ""}>
      ${opt}
    `;
    optionsDiv.appendChild(label);
  });

  document.getElementById("btn-next").style.display =
    currentIndex === questoes.length - 1 ? "none" : "inline-block";

  document.getElementById("btn-finish").style.display =
    currentIndex === questoes.length - 1 ? "inline-block" : "none";
}

function salvarResposta() {
  const checked = document.querySelector('input[name="option"]:checked');
  if (checked) respostas[currentIndex] = Number(checked.value);
}

function nextQuestion() {
  salvarResposta();
  if (currentIndex < questoes.length - 1) {
    currentIndex++;
    renderQuestao();
  }
}

function prevQuestion() {
  salvarResposta();
  if (currentIndex > 0) {
    currentIndex--;
    renderQuestao();
  }
}

function finishSimulado() {
  salvarResposta();

  let score = 0;
  questoes.forEach((q, i) => {
    if (respostas[i] === q.correta) score++;
  });

  document.getElementById("score-val").innerText = score;
  document.getElementById("total-val").innerText = questoes.length;

  showScreen("result-screen");
}

function quitSimulado() {
  showScreen("dashboard-screen");
}

function showDashboard() {
  showScreen("dashboard-screen");
}
