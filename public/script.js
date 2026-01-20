let usuarioAtual = "";
let questoes = [];
let indice = 0;
let respostas = {};
let estatisticas = {};

const loginDiv = document.getElementById("login");
const appDiv = document.getElementById("app");

document.getElementById("btnLogin").onclick = login;

// ===== LOGIN =====
async function login() {
  const usuario = document.getElementById("loginUsuario").value.trim();
  const senha = document.getElementById("loginSenha").value.trim();
  const msg = document.getElementById("loginMsg");

  if (!usuario || !senha) {
    msg.innerText = "Informe usuário e senha";
    return;
  }

  try {
    const res = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, senha })
    });

    if (!res.ok) {
      msg.innerText = "Login inválido";
      return;
    }

    usuarioAtual = usuario;
    document.getElementById("nomeUsuario").innerText = usuario;

    loginDiv.style.display = "none";
    appDiv.style.display = "block";

    carregarDados();
    restaurarProgresso();

  } catch (e) {
    msg.innerText = "Erro de conexão";
  }
}

// ===== INICIAR SIMULADO =====
async function iniciarSimulado() {
  const res = await fetch("/questoes.json");
  questoes = embaralhar(await res.json()).slice(0, 80);

  indice = 0;
  respostas = {};
  estatisticas = {};

  document.getElementById("quiz").style.display = "block";
  mostrarQuestao();
}

// ===== MOSTRAR QUESTÃO =====
function mostrarQuestao() {
  const q = questoes[indice];
  document.getElementById("pergunta").innerText =
    `${indice + 1}. ${q.texto}`;

  const opcoes = document.getElementById("opcoes");
  opcoes.innerHTML = "";

  q.alts.forEach((alt, i) => {
    const btn = document.createElement("button");
    btn.innerText = alt.l;
    btn.onclick = () => {
      respostas[indice] = "ABCDE"[i];
      salvarProgresso();
    };
    opcoes.appendChild(btn);
  });
}

// ===== PRÓXIMA =====
function proximaQuestao() {
  indice++;
  salvarProgresso();

  if (indice >= questoes.length) {
    finalizarSimulado();
  } else {
    mostrarQuestao();
  }
}

// ===== FINALIZAR =====
async function finalizarSimulado() {
  let acertos = 0;

  questoes.forEach((q, i) => {
    if (!estatisticas[q.materia]) {
      estatisticas[q.materia] = { total: 0, acertos: 0 };
    }

    estatisticas[q.materia].total++;

    if (respostas[i] === q.correta) {
      acertos++;
      estatisticas[q.materia].acertos++;
    }
  });

  const nota = Math.round((acertos / questoes.length) * 100);

  document.getElementById("resultado").innerHTML = `
    <h2>Nota final: ${nota}%</h2>
    <h3>Conteúdos para revisão:</h3>
    <ul>
      ${Object.keys(estatisticas).map(m => `
        <li>
          ${m} –
          <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(m)}" target="_blank">YouTube</a>
        </li>
      `).join("")}
    </ul>
  `;

  renderEstatisticas();

  await fetch("/resultado", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      usuario: usuarioAtual,
      resultado: {
        nota,
        data: new Date().toLocaleDateString()
      }
    })
  });

  localStorage.removeItem("progresso");
  carregarDados();
}

// ===== ESTATÍSTICAS =====
function renderEstatisticas() {
  const ul = document.getElementById("estatisticas");
  ul.innerHTML = "";

  Object.entries(estatisticas).forEach(([mat, d]) => {
    ul.innerHTML += `
      <li>${mat}: ${d.acertos}/${d.total}</li>
    `;
  });
}

// ===== SALVAR / RESTAURAR PROGRESSO =====
function salvarProgresso() {
  localStorage.setItem("progresso", JSON.stringify({
    indice,
    respostas,
    questoes
  }));
}

function restaurarProgresso() {
  const data = localStorage.getItem("progresso");
  if (!data) return;

  const p = JSON.parse(data);
  questoes = p.questoes;
  respostas = p.respostas;
  indice = p.indice;

  document.getElementById("quiz").style.display = "block";
  mostrarQuestao();
}

// ===== DADOS =====
async function carregarDados() {
  const res = await fetch(`/dados/${usuarioAtual}`);
  const data = await res.json();

  document.getElementById("historico").innerHTML =
    data.historico.map(h =>
      `<li>${h.data} – ${h.nota}%</li>`
    ).join("");

  document.getElementById("ranking").innerHTML =
    data.ranking.map(r =>
      `<li>${r.usuario} – ${r.nota}%</li>`
    ).join("");
}

// ===== UTIL =====
function embaralhar(arr) {
  return arr.sort(() => Math.random() - 0.5);
}
