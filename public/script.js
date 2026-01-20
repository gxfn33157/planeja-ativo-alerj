/* ---------- TELAS ---------- */
const telas = document.querySelectorAll(".screen");

function mostrarTela(id) {
  telas.forEach(t => t.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

/* ---------- LOGIN ---------- */
function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const msg = document.getElementById("login-msg");

  fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  })
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        msg.innerText = data.error || "Erro ao logar";
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      document.getElementById("user-display").innerText = data.user.username;

      mostrarTela("dashboard-screen");
    })
    .catch(() => {
      msg.innerText = "Erro de conexão com o servidor";
    });
}

/* ---------- REGISTRO ---------- */
function register() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const msg = document.getElementById("login-msg");

  fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        msg.innerText = "Conta criada! Agora faça login.";
      } else {
        msg.innerText = data.error;
      }
    });
}

/* ---------- LOGOUT ---------- */
function logout() {
  localStorage.removeItem("user");
  mostrarTela("login-screen");
}

/* ---------- INIT ---------- */
window.onload = () => {
  const user = localStorage.getItem("user");
  if (user) {
    document.getElementById("user-display").innerText =
      JSON.parse(user).username;
    mostrarTela("dashboard-screen");
  } else {
    mostrarTela("login-screen");
  }
};
