let usuarioAtual = "";
let questoes = [];
let indice = 0;
let respostas = {};

async function login() {
  const usuario = usuarioInput.value;
  const senha = senhaInput.value;

  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario, senha })
  });

  if (!res.ok) {
    msg.innerText = "Erro no login";
    return;
  }

  usuarioAtual = usuario;
  user.innerText = usuario;
  loginDiv.style.display = "none";
  app.style.display = "block";

  carregarDados();
}

async function iniciar() {
  const res = await fetch("/questoes.json");
  questoes = embaralhar(await res.json()).slice(0, 80);
  indice = 0;
  respostas = {};
  quiz.style.display = "block";
  mostrar();
}

function mostrar() {
  const q = questoes[indice];
  pergunta.innerText = q.texto;
  opcoes.innerHTML = "";

  q.alts.forEach((a, i) => {
    const btn = document.createElement("button");
    btn.innerText = a.l;
    btn.onclick = () => respostas[indice] = "ABCDE"[i];
    opcoes.appendChild(btn);
  });
}

async function proxima() {
  indice++;
  if (indice >= questoes.length) return finalizar();
  mostrar();
}

async function finalizar() {
  let acertos = 0;
  questoes.forEach((q, i) => {
    if (respostas[i] === q.correta) acertos++;
  });

  const nota = Math.round((acertos / questoes.length) * 100);

  resultado.innerHTML = `
    <h2>Nota: ${nota}%</h2>
    <p>Revisar:</p>
    <ul>
      ${questoes.map(q => `
        <li>${q.conteudo} -
        <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(q.conteudo)}" target="_blank">Vídeos</a></li>
      `).join("")}
    </ul>
  `;

  await fetch("/resultado", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      usuario: usuarioAtual,
      resultado: { nota, data: new Date().toLocaleDateString() }
    })
  });

  carregarDados();
}

async function carregarDados() {
  const res = await fetch(`/dados/${usuarioAtual}`);
  const data = await res.json();

  historico.innerHTML = data.historico.map(h =>
    `<li>${h.data} - ${h.nota}%</li>`
  ).join("");

  ranking.innerHTML = data.ranking.map(r =>
    `<li>${r.usuario} - ${r.nota}%</li>`
  ).join("");
}

function embaralhar(arr) {
  return arr.sort(() => Math.random() - 0.5);
}
