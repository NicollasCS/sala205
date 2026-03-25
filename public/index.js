// Sala 205 - Index JS Melhorado com Welcome + Admin
window.onload = function() {
  const usuarioRaw = localStorage.getItem('usuarioLogado');
  const usuario = usuarioRaw ? JSON.parse(usuarioRaw) : null;

  // Controle do Popup: Garante que some se estiver logado
  const popup = document.getElementById('popup');
  if (usuario) {
    if (popup) popup.style.display = 'none';
  } else {
    if (popup) popup.style.display = 'flex';
  }

  atualizarStatusLogin();
  carregarComentarios();
  initCharCounter();
};

// Contador caracteres
function initCharCounter() {
  const textarea = document.getElementById('novoComentario');
  const charCount = document.getElementById('charCount');
  if (textarea && charCount) {
    textarea.addEventListener('input', () => {
      const length = textarea.value.length;
      charCount.textContent = `${length}/120`;
      charCount.style.color = length > 100 ? '#f59e0b' : length > 115 ? '#ef4444' : 'var(--text-muted)';
    });
  }
}

// Status login + Bem-vindo
function atualizarStatusLogin() {
  const usuario = localStorage.getItem('usuarioLogado');
  const botaoLogin = document.getElementById('botaoLogin');
  const comentarioForm = document.getElementById('comentarioForm');
  const mensagemSemConta = document.getElementById('mensagemSemConta');

  // Criar welcome se não existe
  let welcomeEl = document.getElementById('welcomeUser');
  if (!welcomeEl) {
    welcomeEl = document.createElement('div');
    welcomeEl.id = 'welcomeUser';
    welcomeEl.style.cssText = `
      position: fixed; top: 2rem; right: 2rem; 
      background: linear-gradient(135deg, rgba(59,130,246,0.2), rgba(16,185,129,0.2)); 
      backdrop-filter: blur(15px); padding: 1.2rem 2rem; border-radius: 30px; 
      border: 1px solid rgba(59,130,246,0.3); color: white; font-weight: 600; 
      z-index: 999; font-size: 1rem; box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(welcomeEl);
  }

  if (usuario) {
    const u = JSON.parse(usuario);
    welcomeEl.innerHTML = `👋 Bem-vindo, <strong>${u.nome}</strong>!`;
    welcomeEl.style.display = 'block';

    if (botaoLogin) {
      botaoLogin.innerHTML = '<i class="fas fa-sign-out-alt"></i> Sair';
      botaoLogin.onclick = () => {
        localStorage.clear();
        location.reload();
      };
      botaoLogin.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
    }

    // Admin button ABAIXO do login
    let adminBtn = document.getElementById('adminBtn');
    if (u.nome === 'administrador_turma205-1' && !adminBtn) {
      adminBtn = document.createElement('button');
      adminBtn.id = 'adminBtn';
      adminBtn.innerHTML = '<i class="fas fa-user-shield"></i> Painel Admin';
      adminBtn.style.cssText = `
        position: fixed; top: 5rem; right: 2rem; 
        background: linear-gradient(135deg, #8b5cf6, #7c3aed); 
        color: white; border: none; padding: 1rem 1.8rem; border-radius: 30px; 
        font-weight: 600; cursor: pointer; z-index: 999; 
        box-shadow: 0 10px 30px rgba(139,92,246,0.4); transition: all 0.3s;
      `;
      adminBtn.onclick = () => location.href = './auth/admin/admin.html';
      document.body.appendChild(adminBtn);
    }

    comentarioForm.style.display = 'block';
    mensagemSemConta.style.display = 'none';

  } else {
    welcomeEl.style.display = 'none';

    if (botaoLogin) {
      botaoLogin.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
      botaoLogin.onclick = () => document.getElementById('popup').style.display = 'flex';
    }

    let adminBtn = document.getElementById('adminBtn');
    if (adminBtn) adminBtn.remove();

    comentarioForm.style.display = 'none';
    mensagemSemConta.style.display = 'block';
  }
}

// Popup
function fecharPopup() {
  document.getElementById('popup').style.display = 'none';
}

function logar() { location.href = './auth/login/login.html'; }
function criarConta() { location.href = './auth/cadastro/cadastro.html'; }

// Comentários
async function carregarComentarios() {
  try {
    const res = await fetch('/api/comentarios');
    const comentarios = res.ok ? await res.json() : [];
    const usuarioNome = JSON.parse(localStorage.getElementById('usuarioLogado') || '{}').nome;

    const container = document.getElementById('comentariosExistentes');
    container.innerHTML = '';

    comentarios.slice(0, 20).forEach(c => {
      const div = document.createElement('div');
      div.className = 'comentario-item';
      div.style.cssText = 'background: rgba(255,255,255,0.1); padding: 1.5rem; border-radius: 16px; margin-bottom: 1rem; border-left: 4px solid var(--primary); transition: all 0.3s;';
      
      div.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;">
          <div style="flex: 1;">
            <strong style="color: var(--primary); font-size: 1.1rem;">${c.autor}</strong>
            <p style="color: var(--text); margin: 0.5rem 0 0.5rem; line-height: 1.5;">${c.texto}</p>
            <small style="color: var(--text-muted);">${new Date(c.criado).toLocaleString()}</small>
          </div>
          ${usuarioNome === c.autor ? '<button onclick="excluirComentario(' + c.id + ')" style="background: #ef4444; color: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-size: 0.85rem;"><i class="fas fa-trash"></i></button>' : ''}
        </div>
      `;
      container.appendChild(div);
    });

  } catch (e) {
    document.getElementById('comentariosExistentes').innerHTML = '<p style="text-align: center; color: var(--text-muted);">Erro carregando comentários</p>';
  }
}

async function excluirComentario(id) {
  if (confirm('Excluir comentário?')) {
    try {
      const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
      await fetch(`/api/comentarios/meus/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autor: usuario.nome })
      });
      carregarComentarios();
    } catch (e) {
      alert('Erro ao excluir');
    }
  }
}

document.getElementById('btnEnviarComentario').onclick = async () => {
  const textarea = document.getElementById('novoComentario');
  const texto = textarea.value.trim();
  if (!texto) return alert('Escreva um comentário');

  const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
  if (!usuario) return location.href = './auth/login/login.html';

  try {
    await fetch('/api/comentarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ autor: usuario.nome, texto })
    });
    textarea.value = '';
    carregarComentarios();
  } catch (e) {
    alert('Erro ao enviar');
  }
};
