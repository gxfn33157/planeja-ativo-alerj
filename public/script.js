let questoes = [];
let indiceAtual = 0;
let respostas = {};

const perguntaEl = document.getElementById("pergunta");
const alternativasEl = document.getElementById("alternativas");
const progressoEl = document.getElementById("progresso");
const btnProximo = document.getElementById("proximo");

// ====== CARREGAR QUESTÕES ======
fetch("questoes.json")
  .then(res => res.json())
  .then(data => {
    questoes = data;

    // recuperar progresso salvo
    const salvo = JSON.parse(localStorage.getItem("simuladoProgresso"));
    if (salvo) {
      indiceAtual = salvo.indice;
      respostas = salvo.respostas || {};
    }

    renderizarQuestao();
  })
  .catch(err => {
    perguntaEl.innerText = "Erro ao carregar questões.";
    console.error(err);
  });

// ====== RENDERIZAR QUESTÃO ======
function renderizarQuestao() {
  const questao = questoes[indiceAtual];

  if (!questao) {
    finalizarSimulado();
    return;
  }

  perguntaEl.innerText = questao.texto;
  alternativasEl.innerHTML = "";

  const letras = ["A", "B", "C", "D", "E"];

  questao.alts.forEach((alt, i) => {
    const letra = letras[i];

    const label = document.createElement("label");
    label.style.display = "block";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "alternativa";
    input.value = letra;

    if (respostas[indiceAtual] === letra) {
      input.checked = true;
    }

    input.addEventListener("change", () => {
      respostas[indiceAtual] = letra;
      salvarProgresso();
    });

    label.appendChild(input);
    label.append(` ${letra}) ${alt.l}`);
    alternativasEl.appendChild(label);
  });

  progressoEl.innerText = `Questão ${indiceAtual + 1} de ${questoes.length}`;
}

// ====== SALVAR PROGRESSO ======
function salvarProgresso() {
  localStorage.setItem(
    "simuladoProgresso",
    JSON.stringify({
      indice: indiceAtual,
      respostas: respostas
    })
  );
}

// ====== PRÓXIMA QUESTÃO ======
btnProximo.addEventListener("click", () => {
  if (!respostas[indiceAtual]) {
    alert("Selecione uma alternativa antes de continuar.");
    return;
  }

  indiceAtual++;
  salvarProgresso();
  renderizarQuestao();
});

// ====== FINALIZAR ======
function finalizarSimulado() {
  localStorage.removeItem("simuladoProgresso");

  let acertos = 0;
  questoes.forEach((q, i) => {
    if (respostas[i] === q.correta) acertos++;
  });

  perguntaEl.innerText = "Simulado finalizado!";
  alternativasEl.innerHTML = `
    <p>Você acertou <strong>${acertos}</strong> de ${questoes.length} questões.</p>
  `;
  progressoEl.innerText = "";
  btnProximo.style.display = "none";
}
