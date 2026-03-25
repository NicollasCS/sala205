document.getElementById("formCadastro").addEventListener("submit", async function(e) {
  e.preventDefault();

  const nome = document.getElementById("nome").value;
  const senha = document.getElementById("senha").value;

  if (!nome || !senha) {
    alert("Por favor, preencha todos os campos!");
    return;
  }

  try {
    const response = await fetch('/api/cadastro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, senha }),
    });

    const data = await response.json();

    if (response.ok) {
      // salvar localmente
      localStorage.setItem('usuarioLogado', JSON.stringify({ nome, senha }));
      alert(data.message);

      // redirecionar para index
      window.location.href = '../../index.html';
    } else {
      alert(data.error || 'Erro ao cadastrar');
    }
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao conectar com o servidor');
  }
});