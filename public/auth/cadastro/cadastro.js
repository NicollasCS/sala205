// Cadastro JS - Estilo Moderno com MD5
document.getElementById("formCadastro").addEventListener("submit", async function(e) {
  e.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const senha = document.getElementById("senha").value;

  if (!nome || !senha) {
    document.getElementById('cadastroError').textContent = 'Preencha todos os campos!';
    document.getElementById('cadastroError').style.display = 'block';
    return;
  }

  // Verificar se os termos foram aceitos
  const termosCkeck = document.getElementById("aceitarTermos");
  const politicaCheck = document.getElementById("aceitarPolitica");
  
  if (termosCkeck && !termosCkeck.checked) {
    document.getElementById('cadastroError').textContent = 'Você deve aceitar os Termos de Uso';
    document.getElementById('cadastroError').style.display = 'block';
    return;
  }
  
  if (politicaCheck && !politicaCheck.checked) {
    document.getElementById('cadastroError').textContent = 'Você deve aceitar a Política de Privacidade';
    document.getElementById('cadastroError').style.display = 'block';
    return;
  }

  try {
    // Fazer hash da senha com MD5
    const senhaHash = CryptoJS.MD5(senha).toString();
    
    document.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cadastrando...';
    document.querySelector('button[type="submit"]').disabled = true;

    const response = await fetch('/api/cadastro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, senha: senhaHash }),
    });

    const data = await response.json();

    document.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-check"></i> Cadastrar';
    document.querySelector('button[type="submit"]').disabled = false;

    if (response.ok) {
      // Após cadastro, o ideal é o usuário fazer login para validar a senha ou o servidor retornar o objeto user real
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
