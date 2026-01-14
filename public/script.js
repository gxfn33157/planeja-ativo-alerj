/*************************************************
 * AUTENTICAÇÃO
 *************************************************/
const token = localStorage.getItem("token");
const username = localStorage.getItem("username");

const loginScreen = document.getElementById("login-screen");
const dashboardScreen = document.getElementById("dashboard-screen");
const simuladoScreen = document.getElementById("simulado-screen");
const resultScreen = document.getElementById("result-screen");

function showScreen(screen) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  screen.classList.add("active");
}

// Se NÃO estiver logado → fica no login
if (!token) {
  showScreen(loginScreen);
} else {
  document.getElementById("user-display").innerText = username;
  showScreen(dashboardScreen);
  carregarDashboard();
}

/*************************************************
 * LOGIN / LOGOUT
 *************************************************/
async function login() {
  const usernameInput = document.getElementById("username").value.trim();
  const passwordInput = document.getElementById("password").value;

  if (!usernameInput || !passwordInput) {
    document.getElementById("login-msg").innerText = "Preencha usuário e senha.";
    return;
  }

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: usernameInput,
        password: passwordInput
      })
    });

    const data = await res.json();

    if (!res.ok) {
      document.getElementById("login-msg").innerText = data.error || "Erro no login.";
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("username", data.username);
    location.reload();

  } catch (err) {
    console.error(err);
    document.getElementById("login-msg").innerText = "Erro ao conectar ao servidor.";
  }
}

async function register() {
  const usernameInput = document.getElementById("username").value.trim();
  const passwordInput = document.getElementById("password").value;

  if (!usernameInput || !passwordInput) {
    document.getElementById("login-msg").innerText = "Preencha usuário e senha.";
    return;
  }

  try {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: usernameInput,
        password: passwordInput
      })
    });

    const data = await res.json();

    if (!res.ok) {
      document.getElementById("login-msg").innerText = data.error || "Erro no cadastro.";
      return;
    }

    document.getElementById("login-msg").innerText = "Conta criada! Faça login.";

  } catch (err) {
    console.error(err);
    document.getElementById("login-msg").innerText = "Erro ao conectar ao servidor.";
  }
}

function logout() {
  localStorage.clear();
  location.reload();
}

/*************************************************
 * SIMULADO
 *************************************************/
let questoes = [];
let indiceAtual = 0;
let respostas = {};

function startSimulado() {
  showScreen(simuladoScreen);
  carregarQuestoes();
}

function quitSimulado() {
  showScreen(dashboardScreen);
}

async function carregarQuestoes() {
  try {
    const res = await fetch("/api/questions", {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    if (!res.ok) {
      alert("Sessão expirada. Faça login novamente.");
      logout();
      return;
    }

    questoes = await res.json();

    // Recuperar progresso salvo
    const salvo = JSON.parse(localStorage.getItem("simuladoProgresso"));
    if (salvo) {
      indiceAtual = salvo.indice;
      respostas = salvo.respostas || {};
    }

    renderizarQuestao();

  } catch (err) {
    console.error(err);
    alert("Erro ao carregar questões.");
  }
}

function renderizarQuestao() {
  const questao = questoes[indiceAtual];
  if (!questao) {
    finalizarSimulado();
    return;
  }

  document.getElementById("q-number").innerText =
    `Questão ${indiceAtual + 1}/${questoes.length}`;
  document.getElementById("q-text").innerText = questao.texto;

  const opcoesEl = document.getElementById("q-options");
  opcoesEl.innerHTML = "";

  const letras = ["A", "B", "C", "D", "E"];

  questao.alternativas.forEach((alt, i) => {
    const label = document.createElement("label");
    label.className = "option";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "opcao";
    input.value = letras[i];

    if (respostas[indiceAtual] === letras[i]) {
      input.checked = true;
    }

    input.addEventListener("change", () => {
      respostas[indiceAtual] = letras[i];
      salvarProgresso();
    });

    label.appendChild(input);
    label.append(` ${letras[i]}) ${alt}`);
    opcoesEl.appendChild(label);
  });

  document.getElementById("btn-next").style.display =
    indiceAtual === questoes.length - 1 ? "none" : "inline-block";
  document.getElementById("btn-finish").style.display =
    indiceAtual === questoes.length - 1 ? "inline-block" : "none";
}

function salvarProgresso() {
  localStorage.setItem("simuladoProgresso", JSON.stringify({
    indice: indiceAtual,
    respostas
  }));
}

function nextQuestion() {
  if (!respostas[indiceAtual]) {
    alert("Selecione uma alternativa antes de continuar.");
    return;
  }
  indiceAtual++;
  salvarProgresso();
  renderizarQuestao();
}

function prevQuestion() {
  if (indiceAtual > 0) {
    indiceAtual--;
    salvarProgresso();
    renderizarQuestao();
  }
}

function finalizarSimulado() {
  localStorage.removeItem("simuladoProgresso");

  let acertos = 0;
  questoes.forEach((q, i) => {
    if (respostas[i] === q.correta) acertos++;
  });

  document.getElementById("score-val").innerText = acertos;
  document.getElementById("total-val").innerText = questoes.length;

  const subjectList = document.getElementById("subject-list");
  subjectList.innerHTML = "";

  showScreen(resultScreen);
}

function showDashboard() {
  showScreen(dashboardScreen);
  carregarDashboard();
}

/*************************************************
 * DASHBOARD
 *************************************************/
function carregarDashboard() {
  // Futuro: histórico, ranking, estatísticas
}
