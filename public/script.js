let usuarioAtual = "";
let questoes = [];
let indice = 0;
let respostas = {};
let estatisticas = {};

const letras = ["A", "B", "C", "D", "E"];

document.getElementById("btnLogin").onclick = login;

// ===== LOGIN =====
async function login() {
  const usuario = loginUsuario.value.trim();
  const senha = loginSenha.value.trim();

  if (!usuario || !senha) {
    loginMsg.innerText = "Preencha usuário e senha";
    return;
  }

  usuarioAtual = usuario;
  nomeUsuario.innerText = usuario;

  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("app-screen").classList.remove("hidden");

  carregarDados();
}

// ===== LOGOUT =====
function logout() {
  localStorage.removeItem("progresso");
  location.reload();
}

// ===== INICIAR =====
async function iniciarSimulado() {
  const res = await fetch("questoes.json");
  questoes = shuffle(await res.json()).slice(0, 80);

  indice = 0;
  respostas = {};
  estatisticas = {};

  document.getElementById("simulado").classList.remove("hidden");
  document.getElementById("resultado").classList.add("hidden");

  mostrarQuestao();
}

// ===== MOSTRAR =====
function mostrarQuestao() {
  const q = questoes[indice];

  document.getElementById("contador").innerText =
    `Questão ${indice + 1} de ${questoes.length}`;

  document.getElementById("pergunta").innerText = q.texto;

  const div = document.getElementById("opcoes");
  div.innerHTML = "";

  q.alts.forEach((alt, i) => {
    const el = document.createElement("div");
    el.className = "opcao";
    el.innerText = `${letras[i]}) ${alt.l}`;

    if (respostas[indice] === letras[i]) {
      el.classList.add("selecionada");
    }

    el.onclick = () => {
      respostas[indice] = letras[i];
      salvarProgresso();
      mostrarQuestao();
    };

    div.appendChild(el);
  });
}

// ===== NAVEGAÇÃO =====
function proximaQuestao() {
  if (indice < questoes.length - 1) {
    indice++;
    salvarProgresso();
    mostrarQuestao();
  }
}

function anteriorQuestao() {
  if (indice > 0) {
    indice--;
    mostrarQuestao();
  }
}

// ===== FINALIZAR =====
function finalizarSimulado() {
  if (Object.keys(respostas).length < questoes.length) {
    alert("Existem questões sem resposta.");
    return;
  }

  let acertos = 0;
  estatisticas = {};

  questoes.forEach((q, i) => {
    estatisticas[q.materia] ??= { total: 0, acertos: 0 };
    estatisticas[q.materia].total++;

    if (respostas[i] === q.correta) {
      acertos++;
      estatisticas[q.materia].acertos++;
    }
  });

  document.getElementById("simulado").classList.add("hidden");
  document.getElementById("resultado").classList.remove("hidden");

  document.getElementById("resultado").innerHTML = `
    <h2>Resultado Final</h2>
    <h1>${acertos} / ${questoes.length}</h1>
    <h3>Revisar Conteúdos:</h3>
    <ul>
      ${Object.keys(estatisticas).map(m =>
        `<li>${m} —
          <a target="_blank" href="https://www.youtube.com/results?search_query=${encodeURIComponent(m)}">
            Vídeos
          </a>
        </li>`
      ).join("")}
    </ul>
  `;

  localStorage.removeItem("progresso");
  renderEstatisticas();
}

// ===== PROGRESSO =====
function salvarProgresso() {
  localStorage.setItem("progresso", JSON.stringify({
    indice,
    respostas,
    questoes
  }));
}

// ===== DADOS =====
function carregarDados() {
  // preparado para backend
}

function renderEstatisticas() {
  estatisticasEl.innerHTML = Object.entries(estatisticas)
    .map(([m, d]) => `<li>${m}: ${d.acertos}/${d.total}</li>`)
    .join("");
}

// ===== UTIL =====
function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}
