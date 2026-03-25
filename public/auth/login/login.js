document.getElementById("formLogin").addEventListener("submit", async function (e) {
  e.preventDefault();

  const nome = document.getElementById("nome").value;
  const senha = document.getElementById("senha").value;

  if (!nome || !senha) {
    alert("Por favor, preencha todos os campos!");
    return;
  }

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, senha }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('usuarioLogado', JSON.stringify({ nome, senha }));
      localStorage.setItem('popupVisto', 'true');
      alert(data.message || 'Login realizado com sucesso!');
      window.location.href = '../../index.html';
    } else {
      alert(data.error || 'Usuário ou senha inválidos');
    }
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao conectar com o servidor');
  }
});
