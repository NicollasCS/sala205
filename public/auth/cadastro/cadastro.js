// Cadastro JS - Estilo Moderno
document.getElementById("formCadastro").addEventListener("submit", async function(e) {
  e.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const senha = document.getElementById("senha").value;

  if (!nome || !senha) {
    document.getElementById('cadastroError').textContent = 'Preencha todos os campos!';
    document.getElementById('cadastroError').style.display = 'block';
    return;
  }

  try {
    document.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cadastrando...';
    document.querySelector('button[type="submit"]').disabled = true;

    const response = await fetch('/api/cadastro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, senha }),
    });

    const data = await response.json();

    document.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-check"></i> Cadastrar';
    document.querySelector('button[type="submit"]').disabled = false;

    if (response.ok) {
      localStorage.setItem('usuarioLogado', JSON.stringify({ nome, id: Date.now() })); // Simula user
      // Animação sucesso
      document.querySelector('.glass-card').style.transform = 'scale(1.02)';
      setTimeout(() => {
        window.location.href = '../../index.html';
      }, 800);
    } else {
      document.getElementById('cadastroError').textContent = data.error || 'Erro ao cadastrar';
      document.getElementById('cadastroError').style.display = 'block';
    }
  } catch (error) {
    document.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-check"></i> Cadastrar';
    document.querySelector('button[type="submit"]').disabled = false;
    console.error('Erro:', error);
    document.getElementById('cadastroError').textContent = 'Erro de conexão. Verifique o servidor.';
    document.getElementById('cadastroError').style.display = 'block';
  }
});

// Limpar erro
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => {
        document.getElementById('cadastroError').style.display = 'none';
    });
});
