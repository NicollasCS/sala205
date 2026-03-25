window.onload = function() {
  const popupVisto = localStorage.getItem("popupVisto");
  const usuario = localStorage.getItem("usuarioLogado");

  if (popupVisto || usuario) {
    document.getElementById("popup").style.display = "none";
  } else {
    document.getElementById("popup").style.display = "flex";
  }
};

const usuario = localStorage.getItem("usuarioLogado");
const botaoLogin = document.getElementById("botaoLogin");

if (usuario) {
  const u = JSON.parse(usuario);
  const info = document.createElement("p");
  info.textContent = `Bem-vindo, ${u.nome}!`;
  document.querySelector(".container").appendChild(info);

  botaoLogin.textContent = "Sair";
  botaoLogin.onclick = function() {
    localStorage.removeItem("usuarioLogado");
    window.location.href = "./index.html";
  };
} else {
  botaoLogin.textContent = "Login";
  botaoLogin.onclick = function() {
    document.getElementById("popup").style.display = "flex";
  };
}

function fecharPopup() {
  document.getElementById("popup").style.display = "none";
  localStorage.setItem("popupVisto", "true");
}

function logar() {
  window.location.href = "./auth/login/login.html";
}

function criarConta() {
  window.location.href = "./auth/cadastro/cadastro.html";
}