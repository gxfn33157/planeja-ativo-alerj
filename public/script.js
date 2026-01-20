let questoes = [];
let indice = 0;
let respostas = [];

const linksConteudo = {
  "Direito Constitucional": {
    "Poder Legislativo": {
      youtube: "https://www.youtube.com/results?search_query=poder+legislativo+constitucional",
      site: "https://www.jusbrasil.com.br/artigos/poder-legislativo/"
    }
  },
  "Direito Administrativo": {
    "Atos Administrativos": {
      youtube: "https://www.youtube.com/results?search_query=atos+administrativos",
      site: "https://www.direitonet.com.br/resumos/exibir/3/Atos-Administrativos"
    }
  }
};

async function iniciar() {
  document.getElementById("btnIniciar").classList.add("hidden");
  document.getElementById("simulado").classList.remove("hidden");

  const res = await fetch("/questoes.json");
  questoes = await res.json();

  questoes = questoes.sort(() => Math.random() - 0.5).slice(0, 80);
  respostas = Array(questoes.length).fill(null);

  carregar();
}

function carregar() {
  const q = questoes[indice];
  document.getElementById("contador").innerText = `Questão ${indice + 1} / ${questoes.length}`;
  document.getElementById("pergunta").innerText = q.texto;

  const div = document.getElementById("alternativas");
  div.innerHTML = "";

  q.alternativas.forEach((alt, i) => {
    const btn = document.createElement("button");
    btn.innerText = alt;
    if (respostas[indice] === i) btn.classList.add("selecionada");

    btn.onclick = () => {
      respostas[indice] = i;
      carregar();
    };

    div.appendChild(btn);
  });
}

function proxima() {
  if (indice < questoes.length - 1) {
    indice++;
    carregar();
  }
}

function anterior() {
  if (indice > 0) {
    indice--;
    carregar();
  }
}

function finalizar() {
  let acertos = 0;
  const revisao = {};

  questoes.forEach((q, i) => {
    if (respostas[i] === q.correta) acertos++;
    else {
      revisao[q.materia] ??= {};
      revisao[q.materia][q.conteudo] = true;
    }
  });

  salvarHistorico(acertos);
  salvarRanking(acertos);

  document.getElementById("simulado").classList.add("hidden");
  document.getElementById("resultado").classList.remove("hidden");
  document.getElementById("nota").innerText = `Nota: ${acertos} / ${questoes.length}`;

  renderAnalise(revisao);
  renderHistorico();
  renderRanking();
}

function renderAnalise(revisao) {
  const div = document.getElementById("analise");
  div.innerHTML = "";

  for (let materia in revisao) {
    for (let conteudo in revisao[materia]) {
      const link = linksConteudo[materia]?.[conteudo];
      div.innerHTML += `
        <p>
          <b>${materia} – ${conteudo}</b><br>
          ${link ? `
          <a href="${link.youtube}" target="_blank">▶ YouTube</a> |
          <a href="${link.site}" target="_blank">📘 Artigo</a>
          ` : "Links em breve"}
        </p>
      `;
    }
  }
}

function salvarHistorico(nota) {
  const hist = JSON.parse(localStorage.getItem("historico")) || [];
  hist.push({ data: new Date().toLocaleString(), nota });
  localStorage.setItem("historico", JSON.stringify(hist.slice(-5)));
}

function salvarRanking(nota) {
  const rank = JSON.parse(localStorage.getItem("ranking")) || [];
  rank.push(nota);
  rank.sort((a, b) => b - a);
  localStorage.setItem("ranking", JSON.stringify(rank.slice(0, 5)));
}

function renderHistorico() {
  const ul = document.getElementById("historico");
  ul.innerHTML = "";
  (JSON.parse(localStorage.getItem("historico")) || []).forEach(h => {
    ul.innerHTML += `<li>${h.data} – ${h.nota}</li>`;
  });
}

function renderRanking() {
  const ol = document.getElementById("ranking");
  ol.innerHTML = "";
  (JSON.parse(localStorage.getItem("ranking")) || []).forEach(r => {
    ol.innerHTML += `<li>${r}</li>`;
  });
}

function reiniciar() {
  location.reload();
}
