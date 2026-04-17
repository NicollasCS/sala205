// Login JS - Estilo Moderno com MD5
document.getElementById("formLogin").addEventListener("submit", async function (e) {
  e.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const senha = document.getElementById("senha").value;

  if (!nome || !senha) {
    document.getElementById('formError').textContent = 'Preencha todos os campos!';
    document.getElementById('formError').style.display = 'block';
    return;
  }

  try {
    // Fazer hash da senha com MD5
    const senhaHash = CryptoJS.MD5(senha).toString();
    
    console.log('📝 Tentativa de login:');
    console.log('   Usuário:', nome);
    console.log('   Senha digitada:', senha);
    console.log('   Senha MD5:', senhaHash);
    
    document.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
    document.querySelector('button[type="submit"]').disabled = true;

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, senha: senhaHash }),
    });

    const data = await response.json();

    document.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-arrow-right"></i> Entrar';
    document.querySelector('button[type="submit"]').disabled = false;

    if (response.ok) {
      console.log('✅ Login bem-sucedido:', data.user);
      localStorage.setItem('usuarioLogado', JSON.stringify(data.user));
      localStorage.setItem('popupVisto', 'true');
      // Animação de sucesso
      document.querySelector('.glass-card').style.transform = 'scale(1.02)';
      setTimeout(() => {
        window.location.href = '../../index.html';
      }, 800);
    } else {
      console.log('❌ Erro no login:', data);
      document.getElementById('formError').textContent = data.error || 'Erro no login';
      document.getElementById('formError').style.display = 'block';
    }
  } catch (error) {
    document.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-arrow-right"></i> Entrar';
    document.querySelector('button[type="submit"]').disabled = false;
    console.error('❌ Erro de conexão:', error);
    document.getElementById('formError').textContent = 'Erro de conexão. Verifique o servidor.';
    document.getElementById('formError').style.display = 'block';
  }
});

// Limpar erro ao digitar
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => {
        document.getElementById('formError').style.display = 'none';
    });
});
