let questoes = [];
let indiceAtual = 0;
let respostas = {};

// ELEMENTOS DA TELA (precisam existir no HTML)
const perguntaEl = document.getElementById("q-text");
const alternativasEl = document.getElementById("q-options");
const progressoEl = document.getElementById("q-number");
const btnProximo = document.getElementById("btn-next");
const btnFinalizar = document.getElementById("btn-finish");

// ====== CARREGAR QUESTÕES ======
async function carregarQuestoes() {
  try {
    const res = await fetch("/api/questions", {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token")
      }
    });

    questoes = await res.json();

    // recuperar progresso salvo
    const salvo = JSON.parse(localStorage.getItem("simuladoProgresso"));
    if (salvo) {
      indiceAtual = salvo.indice;
      respostas = salvo.respostas || {};
    }

    renderizarQuestao();
  } catch (err) {
    perguntaEl.innerText = "Erro ao carregar questões.";
    console.error(err);
  }
}

// ====== RENDERIZAR QUESTÃO ======
function renderizarQuestao() {
  const questao = questoes[indiceAtual];
  if (!questao) return finalizarSimulado();

  perguntaEl.innerText = questao.texto;
  alternativasEl.innerHTML = "";

  const letras = ["A", "B", "C", "D", "E"];

  questao.alts.forEach((alt, i) => {
    const letra = letras[i];

    const label = document.createElement("label");
    label.className = "option";

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

  progressoEl.innerText = `Questão ${indiceAtual + 1}/${questoes.length}`;

  btnProximo.style.display =
    indiceAtual === questoes.length - 1 ? "none" : "inline-block";
  btnFinalizar.style.display =
    indiceAtual === questoes.length - 1 ? "inline-block" : "none";
}

// ====== SALVAR PROGRESSO ======
function salvarProgresso() {
  localStorage.setItem(
    "simuladoProgresso",
    JSON.stringify({
      indice: indiceAtual,
      respostas
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
btnFinalizar.addEventListener("click", finalizarSimulado);

function finalizarSimulado() {
  localStorage.removeItem("simuladoProgresso");

  let acertos = 0;
  questoes.forEach((q, i) => {
    if (respostas[i] === q.correta) acertos++;
  });

  document.getElementById("score-val").innerText = acertos;
  document.getElementById("total-val").innerText = questoes.length;

  // trocar telas
  document.getElementById("simulado-screen").classList.remove("active");
  document.getElementById("result-screen").classList.add("active");
}

// ====== INICIAR ======
carregarQuestoes();
