let questoes = [];
let indice = 0;
let respostas = [];
let usuario = null;

const telas = ["login-screen","dashboard-screen","simulado-screen","resultado-screen"];

function mostrarTela(id) {
  telas.forEach(t => document.getElementById(t).classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

window.onload = () => {
  const salvo = localStorage.getItem("usuarioLogado");
  if (salvo) {
    usuario = salvo;
    document.getElementById("user-display").innerText = usuario;
    mostrarTela("dashboard-screen");
  }
};

function login() {
  const u = username.value.trim();
  const p = password.value.trim();
  if (!u || !p) {
    login-msg.innerText = "Preencha os campos.";
    return;
  }
  usuario = u;
  localStorage.setItem("usuarioLogado", u);
  document.getElementById("user-display").innerText = u;
  mostrarTela("dashboard-screen");
}

function logout() {
  localStorage.removeItem("usuarioLogado");
  location.reload();
}

async function iniciarSimulado() {
  const res = await fetch("/questoes.json");
  questoes = await res.json();
  questoes = questoes.sort(() => Math.random() - 0.5).slice(0, 80);
  respostas = new Array(questoes.length).fill(null);
  indice = 0;
  renderizar();
  mostrarTela("simulado-screen");
}

function renderizar() {
  const q = questoes[indice];
  contador.innerText = `Questão ${indice+1} / ${questoes.length}`;
  pergunta.innerText = q.pergunta;
  alternativas.innerHTML = "";

  q.alternativas.forEach((alt,i)=>{
    const b = document.createElement("button");
    b.innerText = `${String.fromCharCode(65+i)}) ${alt}`;
    if (respostas[indice] === i) b.classList.add("selected");
    b.onclick = () => { respostas[indice] = i; renderizar(); };
    alternativas.appendChild(b);
  });
}

function proxima() {
  if (indice < questoes.length-1) { indice++; renderizar(); }
}

function anterior() {
  if (indice > 0) { indice--; renderizar(); }
}

function finalizar() {
  let acertos = 0;
  const materias = {};

  questoes.forEach((q,i)=>{
    if (!materias[q.materia]) materias[q.materia]={total:0,acertos:0,conteudos:new Set(),links:new Set()};
    materias[q.materia].total++;
    q.conteudos.forEach(c=>materias[q.materia].conteudos.add(c));
    q.links.forEach(l=>materias[q.materia].links.add(l));
    if (respostas[i] === q.resposta) {
      acertos++;
      materias[q.materia].acertos++;
    }
  });

  pontuacao.innerText = `Você acertou ${acertos} de ${questoes.length}`;
  resultado-detalhado.innerHTML = "";

  Object.keys(materias).forEach(m=>{
    const r = materias[m];
    resultado-detalhado.innerHTML += `
      <h3>${m}</h3>
      <p>${r.acertos}/${r.total}</p>
      <ul>${[...r.conteudos].map(c=>`<li>${c}</li>`).join("")}</ul>
      <ul>${[...r.links].map(l=>`<li><a href="${l}" target="_blank">${l}</a></li>`).join("")}</ul>
    `;
  });

  mostrarTela("resultado-screen");
}

function voltarDashboard() {
  mostrarTela("dashboard-screen");
}
