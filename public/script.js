let questoes = [];
let currentIndex = 0;
let respostas = [];

/* ======================
   TELAS
====================== */

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => {
    s.classList.remove("active");
  });
  document.getElementById(id).classList.add("active");
}

/* ======================
   LOGIN / REGISTRO
====================== */

function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        document.getElementById("login-msg").innerText = data.error;
        return;
      }
      localStorage.setItem("user", data.username);
      document.getElementById("user-display").innerText = data.username;
      showScreen("dashboard-screen");
    });
}

function register() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  })
    .then(res => res.json())
    .then(data => {
      document.getElementById("login-msg").innerText =
        data.error || "Conta criada! Faça login.";
    });
}

function logout() {
  localStorage.removeItem("user");
  showScreen("login-screen");
}

/* ======================
   SIMULADO
====================== */

function startSimulado() {
  fetch("/questoes.json")
    .then(res => {
      if (!res.ok) throw new Error("Erro ao carregar JSON");
      return res.json();
    })
    .then(data => {
      questoes = data;
      respostas = new Array(questoes.length).fill(null);
      currentIndex = 0;
      showScreen("simulado-screen");
      renderQuestao();
    })
    .catch(err => {
      console.error(err);
      alert("Erro ao carregar questões.");
    });
}

function renderQuestao() {
  const q = questoes[currentIndex];

  document.getElementById("q-number").innerText =
    `Questão ${currentIndex + 1}/${questoes.length}`;

  document.getElementById("q-text").innerText = q.texto;

  const optionsDiv = document.getElementById("q-options");
  optionsDiv.innerHTML = "";

  const letras = ["A", "B", "C", "D", "E"];

  q.alts.forEach((alt, i) => {
    const letra = letras[i];

    const label = document.createElement("label");
    label.className = "option";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "option";
    input.value = letra;

    if (respostas[currentIndex] === letra) {
      input.checked = true;
    }

    input.addEventListener("change", () => {
      respostas[currentIndex] = letra;
    });

    label.appendChild(input);
    label.append(` ${letra}) ${alt.l}`);

    optionsDiv.appendChild(label);
  });

  document.getElementById("btn-next").style.display =
    currentIndex === questoes.length - 1 ? "none" : "inline-block";

  document.getElementById("btn-finish").style.display =
    currentIndex === questoes.length - 1 ? "inline-block" : "none";
}

function nextQuestion() {
  if (!respostas[currentIndex]) {
    alert("Selecione uma alternativa antes de continuar.");
    return;
  }
  currentIndex++;
  renderQuestao();
}

function prevQuestion() {
  if (currentIndex > 0) {
    currentIndex--;
    renderQuestao();
  }
}

function quitSimulado() {
  showScreen("dashboard-screen");
}

/* ======================
   FINALIZAR
====================== */

function finishSimulado() {
  let acertos = 0;

  questoes.forEach((q, i) => {
    if (respostas[i] === q.correta) acertos++;
  });

  document.getElementById("score-val").innerText = acertos;
  document.getElementById("total-val").innerText = questoes.length;

  showScreen("result-screen");
}

function showDashboard() {
  showScreen("dashboard-screen");
}

/* ======================
   AUTOLOGIN
====================== */

const savedUser = localStorage.getItem("user");
if (savedUser) {
  document.getElementById("user-display").innerText = savedUser;
  showScreen("dashboard-screen");
}
