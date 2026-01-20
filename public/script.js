let questoes = [];
let indice = 0;
let respostas = JSON.parse(localStorage.getItem("respostas")) || [];

async function iniciar() {
  document.getElementById("login").classList.add("hidden");
  document.getElementById("simulado").classList.remove("hidden");

  const res = await fetch("/questoes.json");
  questoes = await res.json();

  questoes = questoes.sort(() => Math.random() - 0.5);

  carregar();
}

function carregar() {
  const q = questoes[indice];
  document.getElementById("contador").innerText = `Questão ${indice + 1}/${questoes.length}`;
  document.getElementById("pergunta").innerText = q.texto;

  const div = document.getElementById("alternativas");
  div.innerHTML = "";

  q.alts.forEach((a, i) => {
    const btn = document.createElement("button");
    btn.innerText = `${String.fromCharCode(65 + i)}) ${a.l}`;

    if (respostas[indice] === String.fromCharCode(65 + i)) {
      btn.classList.add("selecionada");
    }

    btn.onclick = () => {
      respostas[indice] = String.fromCharCode(65 + i);
      localStorage.setItem("respostas", JSON.stringify(respostas));
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
  const pendentes = respostas.filter(r => !r).length;
  if (pendentes > 0) {
    alert(`Você possui ${pendentes} questões sem resposta.`);
    return;
  }

  let acertos = 0;
  let porMateria = {};

  questoes.forEach((q, i) => {
    if (respostas[i] === q.correta) {
      acertos++;
    } else {
      porMateria[q.materia] = porMateria[q.materia] || new Set();
      porMateria[q.materia].add(q.conteudo);
    }
  });

  document.getElementById("simulado").classList.add("hidden");
  document.getElementById("resultado").classList.remove("hidden");
  document.getElementById("nota").innerText = `${acertos} / ${questoes.length}`;

  const analise = document.getElementById("analise");
  analise.innerHTML = "<h3>Conteúdos para revisar:</h3>";

  for (let m in porMateria) {
    analise.innerHTML += `<p><b>${m}</b>: ${[...porMateria[m]].join(", ")}</p>`;
  }

  localStorage.removeItem("respostas");
}

function sair() {
  localStorage.setItem("respostas", JSON.stringify(respostas));
  location.reload();
}

function reiniciar() {
  localStorage.clear();
  location.reload();
}
