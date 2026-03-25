// Sala 205 - Index JS Melhorado with Enhanced Comments Section
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

  document.body.style.overflowX = 'hidden'; // Remove o scroll lateral da página toda

  atualizarStatusLogin();
  carregarComentarios();
  initCharCounter();
  initSidebar();
};

// Sidebar Toggle
function initSidebar() {
  const toggleBtn = document.getElementById('toggleCommentsBtn');
  const sidebar = document.getElementById('secao2');
  const overlay = document.createElement('div');
  overlay.id = 'sidebarOverlay';
  overlay.className = 'sidebar-overlay';
  document.body.appendChild(overlay);

  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
  });

  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  });

  // Close button in sidebar
  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-sidebar';
  closeBtn.innerHTML = '&times;';
  closeBtn.onclick = overlay.onclick;
  sidebar.insertBefore(closeBtn, sidebar.firstChild);
}

// Contador caracteres
function initCharCounter() {
  const textarea = document.getElementById('novoComentario');
  const charCount = document.getElementById('charCount');
  if (textarea && charCount) {
    textarea.addEventListener('input', () => {
      const length = textarea.value.length;
      charCount.textContent = `${length}/120`;
      charCount.style.color = length > 100 ? '#f59e0b' : length > 115 ? '#ef4444' : '#666';
    });
  }
}

// Status login + Bem-vindo
function atualizarStatusLogin() {
  const usuarioRaw = localStorage.getItem('usuarioLogado');
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
    welcomeEl.style.maxWidth = 'calc(100% - 4rem)'; // Evita que o balão de boas-vindas cause scroll em telas pequenas
    document.body.appendChild(welcomeEl);
  }

  if (usuarioRaw) {
    const u = JSON.parse(usuarioRaw);
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

    // Admin button
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

    if (comentarioForm) comentarioForm.style.display = 'block';
    if (mensagemSemConta) mensagemSemConta.style.display = 'none';

  } else {
    welcomeEl.style.display = 'none';

    if (botaoLogin) {
      botaoLogin.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
      botaoLogin.onclick = () => document.getElementById('popup').style.display = 'flex';
    }

    let adminBtn = document.getElementById('adminBtn');
    if (adminBtn) adminBtn.remove();

    if (comentarioForm) comentarioForm.style.display = 'none';
    if (mensagemSemConta) mensagemSemConta.style.display = 'block';
  }
}

// Popup functions
function fecharPopup() {
  document.getElementById('popup').style.display = 'none';
}

function logar() { 
  location.href = './auth/login/login.html'; 
}

function criarConta() { 
  location.href = './auth/cadastro/cadastro.html'; 
}

// Enhanced Comments System
let commentsPollingInterval;

async function carregarComentarios(scrollToNew = false) {
  try {
    const res = await fetch('/api/comentarios');
    const comentarios = res.ok ? await res.json() : [];
    const userRaw = localStorage.getItem('usuarioLogado');
    const usuarioLogado = userRaw ? JSON.parse(userRaw) : null;

    const container = document.getElementById('comentariosExistentes');
    const firstChild = container.firstChild;
    const newCommentsCount = container.children.length === 0 ? 0 : comentarios.filter(c => new Date(c.criado) > new Date(firstChild.dataset.timestamp || 0)).length;

    container.innerHTML = '';
    const fragment = document.createDocumentFragment();

    comentarios.slice(0, 20).forEach((c, index) => {
      const div = document.createElement('div');
      div.className = 'comentario-item';
      div.style.cssText = 'padding: 1.5rem; margin-bottom: 1.2rem; min-height: 100px; box-sizing: border-box; width: 100%; background: rgba(255,255,255,0.05); border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);'; 
      div.dataset.timestamp = new Date(c.criado).getTime();
      
      const avatarText = c.autor.charAt(0).toUpperCase();
      const deleteBtn = usuarioLogado && (usuarioLogado.nome === c.autor || usuarioLogado.nome === 'administrador_turma205-1') 
        ? `<button class="delete-btn" onclick="excluirComentario(${c.id})"><i class="fas fa-trash"></i></button>` 
        : '';

      const reactions = typeof c.reactions === 'string' ? JSON.parse(c.reactions) : (c.reactions || {});
      const btnStyle = 'background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.1); padding: 5px 12px; border-radius: 20px; color: white; cursor: pointer; transition: all 0.2s; font-size: 0.9rem; display: flex; align-items: center; gap: 6px;';
      
      const reactionHtml = `
        <div class="reactions" style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: nowrap;">
          <button class="react-btn" style="${btnStyle}" data-emoji="👍" data-comment-id="${c.id}"><span>${reactions['👍'] || 0}</span> 👍</button>
          <button class="react-btn" style="${btnStyle}" data-emoji="❤️" data-comment-id="${c.id}"><span>${reactions['❤️'] || 0}</span> ❤️</button>
          <button class="react-btn" style="${btnStyle}" data-emoji="👎" data-comment-id="${c.id}"><span>${reactions['👎'] || 0}</span> 👎</button>
        </div>`;
      
      const pinBadge = c.is_pinned ? '<div class="pin-badge"><i class="fas fa-thumbtack"></i> Fixado</div>' : '';
      
      div.innerHTML = `
        <div class="comment-header" style="display: flex; gap: 1rem; width: 100%; box-sizing: border-box; align-items: flex-start;">
          <div class="avatar" style="width: 45px; height: 45px; min-width: 45px; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; background: var(--primary); border-radius: 50%; color: white; font-weight: bold;">${avatarText}</div>
          <div class="comment-meta" style="flex: 1; min-width: 0;">
            <strong style="display: block; font-size: 1.1rem; color: #60a5fa; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${c.autor}">${c.autor}</strong>
            <div class="comment-time">${formatRelativeTime(new Date(c.criado))}</div>
            <p style="font-size: 1rem; line-height: 1.4; margin: 8px 0; color: #e5e7eb;">${c.texto}</p>
            ${pinBadge}
            ${reactionHtml}
          </div>
          ${deleteBtn}
        </div>`;

      div.querySelectorAll('.react-btn').forEach(btn => {
        btn.onclick = async (e) => {
          const emoji = btn.dataset.emoji;
          const commentId = btn.dataset.commentId;
          const user = JSON.parse(localStorage.getItem('usuarioLogado'));
          if (!user) return alert('Faça login para reagir');

          await fetch(`/api/comentarios/${commentId}/react`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emoji, autor: user.nome })
          });
          carregarComentarios();
        };
      });
      
      if (index < newCommentsCount) div.style.background = 'rgba(34,197,94,0.2)';
      fragment.appendChild(div);
    });

    container.appendChild(fragment);
    
    if (scrollToNew && newCommentsCount > 0) {
      container.scrollTop = 0;
    }

  } catch (e) {
    document.getElementById('comentariosExistentes').innerHTML = '<p style="text-align: center; color: var(--text-muted);">Erro carregando comentários</p>';
  }
}

function formatRelativeTime(date) {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Agora';
  if (minutes < 60) return `${minutes}m atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

async function excluirComentario(id) {
  if (confirm('Excluir este comentário?')) {
    try {
      const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
      await fetch(`/api/comentarios/meus/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autor: usuario.nome })
      });
      carregarComentarios();
    } catch (e) {
      alert('Erro ao excluir comentário');
    }
  }
}

// Post comment with loading + optimistic UI
document.getElementById('btnEnviarComentario').onclick = async function() {
  const btn = this;
  const textarea = document.getElementById('novoComentario');
  const texto = textarea.value.trim();
  if (!texto) return alert('Escreva um comentário');

  const userRaw = localStorage.getItem('usuarioLogado');
  if (!userRaw) {
    alert('Você precisa estar logado para comentar.');
    location.href = './auth/login/login.html';
    return;
  }

  const usuario = JSON.parse(userRaw);
  const is_admin = usuario.nome === 'administrador_turma205-1';

  // Loading state
  btn.disabled = true;
  btn.classList.add('loading');
  btn.textContent = '';

  // Optimistic preview
  const optimisticComment = document.createElement('div');
  optimisticComment.className = 'comentario-item';
  optimisticComment.style.opacity = '0.7';
  optimisticComment.innerHTML = `
    <div class="comment-header">
      <div class="avatar">${usuario.nome.charAt(0).toUpperCase()}</div>
      <div class="comment-meta">
        <strong>${usuario.nome}</strong>
        <div class="comment-time">Enviando...</div>
        <p>${texto}</p>
      </div>
    </div>
  `;
  document.getElementById('comentariosExistentes').insertBefore(optimisticComment, document.getElementById('comentariosExistentes').firstChild);

  try {
    const response = await fetch('/api/comentarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ autor: usuario.nome, texto, is_admin })
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Erro ao enviar comentário');
    }

    // Success - remove optimistic, reload
    optimisticComment.remove();
    textarea.value = '';
    document.getElementById('charCount').textContent = '0/120';
    carregarComentarios(true); // scroll to new
  } catch (e) {
    alert(e.message);
    optimisticComment.remove();
  } finally {
    btn.disabled = false;
    btn.classList.remove('loading');
    btn.textContent = 'Enviar comentário';
  }
};

// Auto-reload comments every 10s
function startPolling() {
  commentsPollingInterval = setInterval(() => {
    carregarComentarios();
  }, 10000);
}

startPolling();

// Stop polling when page unload
window.addEventListener('beforeunload', () => {
  clearInterval(commentsPollingInterval);
});
