// Sala 205 - Index JS Melhorado with Enhanced Comments Section
let galeriaAtualPage = 0;

// Sistema de Temas
function carregarTema() {
    const temaArmazenado = localStorage.getItem('tema') || 'blue';
    aplicarTema(temaArmazenado);
}

function aplicarTema(tema) {
    document.body.classList.remove('theme-green', 'theme-red');
    if (tema === 'green') {
        document.body.classList.add('theme-green');
    } else if (tema === 'red') {
        document.body.classList.add('theme-red');
    }
    // Atualizar radio buttons
    const radioButtons = document.querySelectorAll('input[name="theme-main"]');
    radioButtons.forEach(radio => {
        radio.checked = radio.value === tema;
    });
}

window.mudarTemaMain = function(tema) {
    localStorage.setItem('tema', tema);
    aplicarTema(tema);
}

// Inicialização ao carregar página
window.addEventListener('DOMContentLoaded', function() {
  carregarTema();
  const usuarioRaw = localStorage.getItem('usuarioLogado');
  const usuario = usuarioRaw ? JSON.parse(usuarioRaw) : null;

  // Controle do Popup: Garante que some se estiver logado
  const popup = document.getElementById('popup');
  if (usuario) {
    if (popup) popup.style.display = 'none';
  } else {
    if (popup) popup.style.display = 'flex';
  }

  // Fechar popup ao clicar no overlay (fundo escuro)
  if (popup) {
    popup.addEventListener('click', (e) => {
      // Só fecha se clicar fora do popup-content
      if (e.target === popup) {
        popup.style.display = 'none';
        e.stopPropagation();
      }
    }, { capture: false });
    
    // Garante que cliques em elementos filhos não propagam para fechar
    const popupContent = popup.querySelector('.popup-content');
    if (popupContent) {
      popupContent.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }
  }

  atualizarStatusLogin();
  carregarComentarios();
  carregarGaleria();
  carregarDescricaoTurma();
  // carregarCalendario(); // Calendário removido da página inicial
  initCharCounter();
  initSidebar();
});

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
}

// Função global para fechar comentários
window.fecharComentarios = () => {
  const sidebar = document.getElementById('secao2');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
};

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
    const isAdmin = u.nome === 'administrador_turma205-1';
    
    const configBtnHTML = isAdmin ? '' : `<button class="config-btn" onclick="toggleConfigMenu(event)" title="Configurações" style="background: none; border: none; color: white; cursor: pointer; font-size: 1.2rem; margin-left: 0.5rem;">
      <i class="fas fa-cog"></i>
    </button>`;
    welcomeEl.innerHTML = `👋 Bem-vindo, <strong>${u.nome}</strong>! ${configBtnHTML}`;
    welcomeEl.style.display = 'block';
    
    // Criar menu de configurações se não existe
    let configMenu = document.getElementById('configMenu');
    if (!configMenu) {
      configMenu = document.createElement('div');
      configMenu.id = 'configMenu';
      configMenu.className = 'config-menu';
      configMenu.style.cssText = `
        position: fixed; top: 5.5rem; right: 2rem; 
        background: linear-gradient(135deg, rgba(30,41,59,0.95), rgba(15,23,42,0.95)); 
        backdrop-filter: blur(20px); padding: 0; border-radius: 12px; 
        border: 1px solid rgba(59,130,246,0.3); z-index: 1000;
        box-shadow: 0 15px 40px rgba(0,0,0,0.4); min-width: 200px;
        display: none;
      `;
      
      let menuHTML = '';
      const isProtectedAccount = u.nome === 'aluno205-1' || u.nome === 'dev205-1';
      
      if (!isAdmin && !isProtectedAccount) {
        menuHTML += `<button onclick="abrirModalMudarNome()" class="config-menu-item" style="width: 100%; padding: 1rem; border: none; background: none; color: white; text-align: left; cursor: pointer; border-bottom: 1px solid rgba(59,130,246,0.2); transition: all 0.2s;">
          <i class="fas fa-user" style="margin-right: 0.5rem;"></i> Mudar Nome
        </button>`;
      }
      
      if (!isProtectedAccount) {
        menuHTML += `
        <button onclick="abrirModalMudarSenha()" class="config-menu-item" style="width: 100%; padding: 1rem; border: none; background: none; color: white; text-align: left; cursor: pointer; border-bottom: 1px solid rgba(59,130,246,0.2); transition: all 0.2s;">
          <i class="fas fa-lock" style="margin-right: 0.5rem;"></i> Mudar Senha
        </button>
        `;
      } else {
        menuHTML += `
        <div style="width: 100%; padding: 1rem; border-bottom: 1px solid rgba(59,130,246,0.2); color: #fbbf24; font-size: 0.9rem; text-align: center; white-space: nowrap;">
          <i class="fas fa-shield-alt"></i> Conta Protegida
        </div>
        `;
      }
      
      menuHTML += `
        <!-- Seletor de Tema -->
        <div style="padding: 1rem; border-bottom: 1px solid rgba(59,130,246,0.2);">
          <div style="color: white; font-weight: 500; font-size: 0.85rem; margin-bottom: 0.6rem; text-transform: uppercase; letter-spacing: 0.3px;">
            <i class="fas fa-palette" style="margin-right: 0.4rem;"></i> Tema
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.6rem;">
            <label style="cursor: pointer; text-align: center;">
              <input type="radio" name="theme-main" value="blue" style="display: none;" onchange="mudarTemaMain('blue')">
              <div style="width: 100%; height: 40px; background: linear-gradient(135deg, #3b82f6, #2563eb); border-radius: 6px; border: 3px solid transparent; transition: all 0.3s; margin-bottom: 0.3rem;" class="theme-preview-box blue-box"></div>
              <span style="color: rgba(255,255,255,0.8); font-weight: 500; font-size: 0.75rem;">Azul</span>
            </label>
            <label style="cursor: pointer; text-align: center;">
              <input type="radio" name="theme-main" value="green" style="display: none;" onchange="mudarTemaMain('green')">
              <div style="width: 100%; height: 40px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 6px; border: 3px solid transparent; transition: all 0.3s; margin-bottom: 0.3rem;" class="theme-preview-box green-box"></div>
              <span style="color: rgba(255,255,255,0.8); font-weight: 500; font-size: 0.75rem;">Verde</span>
            </label>
            <label style="cursor: pointer; text-align: center;">
              <input type="radio" name="theme-main" value="red" style="display: none;" onchange="mudarTemaMain('red')">
              <div style="width: 100%; height: 40px; background: linear-gradient(135deg, #ef4444, #dc2626); border-radius: 6px; border: 3px solid transparent; transition: all 0.3s; margin-bottom: 0.3rem;" class="theme-preview-box red-box"></div>
              <span style="color: rgba(255,255,255,0.8); font-weight: 500; font-size: 0.75rem;">Vermelho</span>
            </label>
          </div>
        </div>

        <button onclick="abrirModalExcluirConta()" class="config-menu-item" style="width: 100%; padding: 1rem; border: none; background: none; color: #ef4444; text-align: left; cursor: pointer; transition: all 0.2s;">
          <i class="fas fa-trash" style="margin-right: 0.5rem;"></i> Excluir Conta
        </button>
      `;
      
      configMenu.innerHTML = menuHTML;
      document.body.appendChild(configMenu);
    }

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
    if (isAdmin && !adminBtn) {
      adminBtn = document.createElement('button');
      adminBtn.id = 'adminBtn';
      adminBtn.innerHTML = '<i class="fas fa-user-shield"></i> Painel Admin';
      adminBtn.style.cssText = `
        position: fixed; top: 8rem; right: 2rem; 
        background: linear-gradient(135deg, #8b5cf6, #7c3aed); 
        color: white; border: none; padding: 1rem 1.8rem; border-radius: 30px; 
        font-weight: 600; cursor: pointer; z-index: 999; 
        box-shadow: 0 10px 30px rgba(139,92,246,0.4); transition: all 0.3s;
      `;
      adminBtn.onclick = () => location.href = './auth/admin/admin.html';
      document.body.appendChild(adminBtn);
    }

    // Button exclusivo para aluno205-1
    let alunoCalendarioBtn = document.getElementById('alunoCalendarioBtn');
    if (u.nome === 'aluno205-1') {
      if (!alunoCalendarioBtn) {
        alunoCalendarioBtn = document.createElement('button');
        alunoCalendarioBtn.id = 'alunoCalendarioBtn';
        alunoCalendarioBtn.innerHTML = '<i class="fas fa-calendar-week"></i> Meu Calendário';
        alunoCalendarioBtn.style.cssText = `
          position: fixed; top: 14rem; right: 2rem;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white; border: none; padding: 1rem 1.8rem; border-radius: 30px;
          font-weight: 600; cursor: pointer; z-index: 999;
          box-shadow: 0 10px 30px rgba(34,197,94,0.4); transition: all 0.3s;
        `;
        alunoCalendarioBtn.onclick = () => location.href = './auth/aluno205-1/calendario.html';
        document.body.appendChild(alunoCalendarioBtn);
      }
    } else if (alunoCalendarioBtn) {
      alunoCalendarioBtn.remove();
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
window.fecharPopup = function() {
  console.log('Fechando popup...');
  const popup = document.getElementById('popup');
  if (popup) popup.style.display = 'none';
};

window.logar = function() { 
  console.log('Redirecionando para login...');
  window.location.href = '/auth/login/login.html'; 
};

window.criarConta = function() { 
  console.log('Redirecionando para cadastro...');
  window.location.href = '/auth/cadastro/cadastro.html'; 
};

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

// ============ FUNÇÕES DE CONFIGURAÇÃO DO PERFIL ============

window.toggleConfigMenu = function(event) {
  if (event) {
    event.stopPropagation();
  }
  const menu = document.getElementById('configMenu');
  if (!menu) return;
  
  const isHidden = menu.style.display === 'none' || menu.style.display === '';
  if (isHidden) {
    menu.style.display = 'block';
    carregarTema(); // Sincroniza o tema ao abrir o menu
    // Usar setTimeout para evitar conflito com click que acionou a função
    setTimeout(() => {
      document.addEventListener('click', window.fecharConfigMenuListener);
    }, 10);
  } else {
    window.fecharConfigMenu();
  }
};

window.fecharConfigMenuListener = function(event) {
  const menu = document.getElementById('configMenu');
  const btn = document.querySelector('.config-btn');
  
  // Se click foi no menu ou no botão, não fecha
  if (menu && menu.contains(event.target)) return;
  if (btn && btn.contains(event.target)) return;
  
  window.fecharConfigMenu();
};

window.fecharConfigMenu = function() {
  const menu = document.getElementById('configMenu');
  if (menu) menu.style.display = 'none';
  document.removeEventListener('click', window.fecharConfigMenuListener);
};

function criarModal(titulo, conteudoHTML) {
  // Remover modal anterior se existir
  const modalAnterior = document.getElementById('configModal');
  if (modalAnterior) modalAnterior.remove();
  
  const modal = document.createElement('div');
  modal.id = 'configModal';
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
    background: rgba(0,0,0,0.5); z-index: 2000; display: flex; 
    align-items: center; justify-content: center; backdrop-filter: blur(5px);
  `;
  
  const content = document.createElement('div');
  content.style.cssText = `
    background: linear-gradient(135deg, rgba(30,41,59,0.98), rgba(15,23,42,0.98)); 
    backdrop-filter: blur(30px); border-radius: 16px; 
    border: 1px solid rgba(59,130,246,0.3); 
    padding: 2rem; max-width: 500px; width: 90%; 
    box-shadow: 0 25px 50px rgba(0,0,0,0.5); color: white;
  `;
  
  content.innerHTML = `
    <h2 style="margin: 0 0 1.5rem 0; font-size: 1.5rem;">${titulo}</h2>
    ${conteudoHTML}
  `;
  
  modal.appendChild(content);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) fecharModal();
  });
  
  document.body.appendChild(modal);
  return modal;
}

function fecharModal() {
  const modal = document.getElementById('configModal');
  if (modal) modal.remove();
  window.fecharConfigMenu();
}

async function abrirModalMudarNome() {
  const usuarioRaw = localStorage.getItem('usuarioLogado');
  const usuario = JSON.parse(usuarioRaw);
  
  const conteudo = `
    <form onsubmit="submeterMudarNome(event)" style="display: flex; flex-direction: column; gap: 1rem;">
      <label style="display: flex; flex-direction: column; gap: 0.5rem;">
        <span style="font-weight: 600; font-size: 0.95rem;">Nome Atual</span>
        <input type="text" value="${usuario.nome}" disabled style="
          background: rgba(255,255,255,0.1); border: 1px solid rgba(59,130,246,0.3); 
          padding: 0.75rem; border-radius: 8px; color: white; cursor: not-allowed;
        ">
      </label>
      <label style="display: flex; flex-direction: column; gap: 0.5rem;">
        <span style="font-weight: 600; font-size: 0.95rem;">Novo Nome</span>
        <input type="text" id="novoNome" placeholder="Digite o novo nome" minlength="3" required style="
          background: rgba(255,255,255,0.1); border: 1px solid rgba(59,130,246,0.3); 
          padding: 0.75rem; border-radius: 8px; color: white;
        ">
      </label>
      <div style="display: flex; gap: 1rem; margin-top: 1rem;">
        <button type="button" onclick="fecharModal()" style="
          flex: 1; padding: 0.75rem; border: 1px solid rgba(59,130,246,0.3); 
          background: transparent; color: white; border-radius: 8px; cursor: pointer; transition: all 0.2s;
        ">Cancelar</button>
        <button type="submit" style="
          flex: 1; padding: 0.75rem; background: linear-gradient(135deg, #3b82f6, #2563eb); 
          color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s;
        ">Confirmar</button>
      </div>
    </form>
  `;
  criarModal('Mudar Nome', conteudo);
  document.getElementById('novoNome').focus();
}

async function submeterMudarNome(event) {
  event.preventDefault();
  const novoNome = document.getElementById('novoNome').value.trim();
  const usuarioRaw = localStorage.getItem('usuarioLogado');
  const usuario = JSON.parse(usuarioRaw);
  
  if (novoNome.length < 3) {
    alert('Nome deve ter pelo menos 3 caracteres');
    return;
  }
  
  try {
    const response = await fetch(`/api/usuario/${usuario.id}/alterar-nome`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ novoNome })
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Erro ao atualizar nome');
    }
    
    // Atualizar localStorage
    usuario.nome = novoNome;
    localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
    
    alert('Nome alterado com sucesso!');
    fecharModal();
    atualizarStatusLogin();
  } catch (error) {
    alert(error.message);
  }
}

async function abrirModalMudarSenha() {
  const conteudo = `
    <form onsubmit="submeterMudarSenha(event)" style="display: flex; flex-direction: column; gap: 1rem;">
      <label style="display: flex; flex-direction: column; gap: 0.5rem;">
        <span style="font-weight: 600; font-size: 0.95rem;">Senha Atual</span>
        <input type="password" id="senhaAtual" placeholder="Digite sua senha atual" required style="
          background: rgba(255,255,255,0.1); border: 1px solid rgba(59,130,246,0.3); 
          padding: 0.75rem; border-radius: 8px; color: white;
        ">
      </label>
      <label style="display: flex; flex-direction: column; gap: 0.5rem;">
        <span style="font-weight: 600; font-size: 0.95rem;">Nova Senha</span>
        <input type="password" id="novaSenha" placeholder="Digite a nova senha" minlength="6" required style="
          background: rgba(255,255,255,0.1); border: 1px solid rgba(59,130,246,0.3); 
          padding: 0.75rem; border-radius: 8px; color: white;
        ">
      </label>
      <label style="display: flex; flex-direction: column; gap: 0.5rem;">
        <span style="font-weight: 600; font-size: 0.95rem;">Confirmar Senha</span>
        <input type="password" id="confirmarSenha" placeholder="Confirme a nova senha" minlength="6" required style="
          background: rgba(255,255,255,0.1); border: 1px solid rgba(59,130,246,0.3); 
          padding: 0.75rem; border-radius: 8px; color: white;
        ">
      </label>
      <div style="display: flex; gap: 1rem; margin-top: 1rem;">
        <button type="button" onclick="fecharModal()" style="
          flex: 1; padding: 0.75rem; border: 1px solid rgba(59,130,246,0.3); 
          background: transparent; color: white; border-radius: 8px; cursor: pointer; transition: all 0.2s;
        ">Cancelar</button>
        <button type="submit" style="
          flex: 1; padding: 0.75rem; background: linear-gradient(135deg, #3b82f6, #2563eb); 
          color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s;
        ">Confirmar</button>
      </div>
    </form>
  `;
  criarModal('Mudar Senha', conteudo);
  document.getElementById('senhaAtual').focus();
}

async function submeterMudarSenha(event) {
  event.preventDefault();
  const senhaAtual = document.getElementById('senhaAtual').value;
  const novaSenha = document.getElementById('novaSenha').value;
  const confirmarSenha = document.getElementById('confirmarSenha').value;
  const usuarioRaw = localStorage.getItem('usuarioLogado');
  const usuario = JSON.parse(usuarioRaw);
  
  if (novaSenha !== confirmarSenha) {
    alert('As senhas não correspondem');
    return;
  }
  
  if (novaSenha.length < 6) {
    alert('Senha deve ter pelo menos 6 caracteres');
    return;
  }
  
  try {
    const response = await fetch(`/api/usuario/${usuario.id}/alterar-senha`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senhaAtual, novaSenha })
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Erro ao atualizar senha');
    }
    
    alert('Senha alterada com sucesso!');
    fecharModal();
  } catch (error) {
    alert(error.message);
  }
}

async function abrirModalExcluirConta() {
  const conteudo = `
    <div style="background: rgba(239,68,68,0.1); border-left: 4px solid #ef4444; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
      <p style="margin: 0; line-height: 1.6;">
        <strong>Atenção!</strong> Esta ação é <strong>irreversível</strong>. Sua conta e todos os dados serão deletados permanentemente.
      </p>
    </div>
    <form onsubmit="submeterExcluirConta(event)" style="display: flex; flex-direction: column; gap: 1rem;">
      <label style="display: flex; flex-direction: column; gap: 0.5rem;">
        <span style="font-weight: 600; font-size: 0.95rem;">Confirme com sua Senha</span>
        <input type="password" id="senhaConfirm" placeholder="Digite sua senha para confirmar" required style="
          background: rgba(255,255,255,0.1); border: 1px solid rgba(59,130,246,0.3); 
          padding: 0.75rem; border-radius: 8px; color: white;
        ">
      </label>
      <div style="display: flex; gap: 1rem; margin-top: 1rem;">
        <button type="button" onclick="fecharModal()" style="
          flex: 1; padding: 0.75rem; border: 1px solid rgba(59,130,246,0.3); 
          background: transparent; color: white; border-radius: 8px; cursor: pointer; transition: all 0.2s;
        ">Cancelar</button>
        <button type="submit" style="
          flex: 1; padding: 0.75rem; background: linear-gradient(135deg, #ef4444, #dc2626); 
          color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s;
        ">Deletar Conta</button>
      </div>
    </form>
  `;
  criarModal('Excluir Conta', conteudo);
  document.getElementById('senhaConfirm').focus();
}

async function submeterExcluirConta(event) {
  event.preventDefault();
  const senhaConfirm = document.getElementById('senhaConfirm').value;
  const usuarioRaw = localStorage.getItem('usuarioLogado');
  const usuario = JSON.parse(usuarioRaw);
  
  try {
    const response = await fetch(`/api/usuario/${usuario.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha: senhaConfirm })
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Erro ao deletar conta');
    }
    
    alert('Conta deletada. Redirecionando...');
    localStorage.clear();
    location.href = '/';
  } catch (error) {
    alert(error.message);
  }
}

// Stop polling when page unload
window.addEventListener('beforeunload', () => {
  clearInterval(commentsPollingInterval);
});

// ===== GALERIA =====

async function carregarGaleria(page = 0) {
  try {
    const res = await fetch(`/api/galeria?page=${page}&limit=5`);
    const response = await res.json();
    const imagens = response.data;
    const pagination = response.pagination;
    const container = document.getElementById('galeriaContainer');
    const paginationDiv = document.getElementById('galeriaPagination');
    const nextBtn = document.getElementById('galeriaNextBtn');

    galeriaAtualPage = page;

    if (!Array.isArray(imagens) || imagens.length === 0) {
      container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);"><i class="fas fa-image" style="font-size: 3rem;"></i><p>Galeria vazia</p></div>';
      if (paginationDiv) paginationDiv.style.display = 'none';
      return;
    }

    container.innerHTML = imagens.map((item) => {
      const tipoMidia = item.tipo_midia || 'photo';
      const nomeArquivo = item.titulo.replace(/\s+/g, '_').toLowerCase();
      const extension = tipoMidia === 'video' ? '.mp4' : '.jpg';
      
      // Mostrar botão de download apenas para admins
      const usuarioRaw = localStorage.getItem('usuarioLogado');
      const usuario = usuarioRaw ? JSON.parse(usuarioRaw) : null;
      const isAdmin = usuario && usuario.nome === 'administrador_turma205-1';
      
      let midiaHTML = '';
      if (tipoMidia === 'video') {
        const btnDownload = isAdmin ? `
          <div class="galeria-video-controls" style="margin-top: 0.5rem; display: flex; gap: 0.5rem;">
            <button onclick="downloadMidia('${item.url}', '${nomeArquivo}${extension}')" class="btn-download" style="
              flex: 1; padding: 0.5rem; background: linear-gradient(135deg, #3b82f6, #2563eb); 
              color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.2s;
            ">
              <i class="fas fa-download"></i> Baixar Vídeo
            </button>
          </div>
        ` : '';
        
        const videoContent = renderizarVidoUrl(item.url);
        
        midiaHTML = `
          <div class="galeria-midia-video">
            ${videoContent}
            ${btnDownload}
          </div>
        `;
      } else {
        const btnDownload = isAdmin ? `
          <button onclick="downloadMidia('${item.url}', '${nomeArquivo}${extension}')" class="btn-download-pequeno" style="
            position: absolute; bottom: 0.5rem; right: 0.5rem;
            background: rgba(0,0,0,0.6); color: white; border: none; 
            padding: 0.5rem 0.75rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem;
            transition: all 0.2s; backdrop-filter: blur(5px);
          ">
            <i class="fas fa-download"></i>
          </button>
        ` : '';
        
        midiaHTML = `
          <div class="galeria-midia-foto" style="position: relative; overflow: hidden; border-radius: 8px;">
            ${item.url ? `<img src="${item.url}" alt="${item.titulo}" style="width: 100%; height: 100%; object-fit: cover;">` : `<i class="fas fa-image galeria-placeholder"></i>`}
            ${btnDownload}
          </div>
        `;
      }
      
      return `
        <div class="galeria-card">
          <div class="galeria-imagem">
            ${midiaHTML}
          </div>
          <div class="galeria-conteudo">
            <h3>${item.titulo}</h3>
            <p>${item.descricao}</p>
            ${item.data ? `<div class="galeria-meta">
              <div class="galeria-meta-item">
                <i class="fas fa-calendar"></i>
                ${new Date(item.data).toLocaleDateString('pt-BR')}
              </div>
              <div class="galeria-meta-item">
                <i class="fas fa-${tipoMidia === 'video' ? 'video' : 'image'}"></i>
                ${tipoMidia === 'video' ? 'Vídeo' : 'Foto'}
              </div>
            </div>` : `<div class="galeria-meta">
              <div class="galeria-meta-item">
                <i class="fas fa-${tipoMidia === 'video' ? 'video' : 'image'}"></i>
                ${tipoMidia === 'video' ? 'Vídeo' : 'Foto'}
              </div>
            </div>`}
          </div>
          <div class="galeria-comentarios" style="border-top: 1px solid rgba(255,255,255,0.1); padding: 1rem 0 0 0;">
            <div style="font-size: 0.9rem; font-weight: 600; color: #60a5fa; margin-bottom: 0.75rem;"><i class="fas fa-comments"></i> Comentários</div>
            <div id="comentarios-galeria-${item.id}" style="max-height: 200px; overflow-y: auto; margin-bottom: 0.75rem;"></div>
            <form id="form-comentario-galeria-${item.id}" onsubmit="enviarComentarioForm(${item.id}, event)" style="display: flex; gap: 0.5rem;">
              <input type="text" placeholder="Seu comentário (máx 100 caracteres)" maxlength="100" style="flex: 1; padding: 0.5rem; border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; background: rgba(255,255,255,0.05); color: #e5e7eb; font-size: 0.9rem;">
              <button type="submit" style="background: #3b82f6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 600; white-space: nowrap;"><i class="fas fa-paper-plane"></i> Enviar</button>
            </form>
          </div>
        </div>
      `;
    }).join('');

    // Carregar comentários de cada imagem
    imagens.forEach(item => {
      atualizarComentariosGaleria(item.id);
    });

    // Mostrar/esconder botão "Anterior" (voltar página)
    const prevBtn = document.getElementById('galeriaPrevBtn');
    if (prevBtn) {
      prevBtn.style.display = galeriaAtualPage > 0 ? 'block' : 'none';
    }

    // Mostrar pagination se há botão anterior OU próxima página
    const showPagination = (galeriaAtualPage > 0) || pagination.hasNext;
    if (paginationDiv) {
      paginationDiv.style.display = showPagination ? 'flex' : 'none';
    }

    // Esconder "Conheça mais sobre" e descrição quando não estiver na página 1
    const botaoConhecer = document.getElementById('conhecer');
    const secaoTurma = document.getElementById('secaoTurma');
    if (botaoConhecer) {
      botaoConhecer.style.display = galeriaAtualPage === 0 ? 'block' : 'none';
    }
    if (secaoTurma) {
      secaoTurma.style.display = galeriaAtualPage === 0 ? 'block' : 'none';
    }
  } catch (e) {
    console.error('Erro ao carregar galeria:', e);
    const container = document.getElementById('galeriaContainer');
    if (container) {
      container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #f87171;"><i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i><p>Erro ao carregar galeria</p></div>';
    }
  }
}

function carregarProximaPaginaGaleria() {
  carregarGaleria(galeriaAtualPage + 1);
}

function carregarPaginaAnteriorGaleria() {
  if (galeriaAtualPage > 0) {
    carregarGaleria(galeriaAtualPage - 1);
  }
}

// ===== FUNÇÕES DE COMENTÁRIOS DE GALERIA =====

async function carregarComentariosGaleria(galeriaId) {
  try {
    const res = await fetch(`/api/galeria/${galeriaId}/comentarios`);
    if (!res.ok) throw new Error('Erro ao carregar comentários');
    return await res.json();
  } catch (e) {
    console.error('Erro ao carregar comentários:', e);
    return [];
  }
}

async function enviarComentarioGaleria(galeriaId, texto) {
  const usuarioRaw = localStorage.getItem('usuarioLogado');
  const usuario = usuarioRaw ? JSON.parse(usuarioRaw) : null;
  
  if (!usuario) {
    alert('Você precisa estar logado para comentar');
    return null;
  }

  if (!texto || texto.trim().length === 0) {
    alert('Comentário não pode estar vazio');
    return null;
  }

  if (texto.length > 100) {
    alert('Comentário deve ter no máximo 100 caracteres');
    return null;
  }

  try {
    const res = await fetch(`/api/galeria/${galeriaId}/comentarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        autor: usuario.nome,
        texto: texto.trim()
      })
    });

    const data = await res.json();
    
    if (!res.ok) {
      alert(data.error || 'Erro ao enviar comentário');
      return null;
    }

    return data;
  } catch (e) {
    console.error('Erro ao enviar comentário:', e);
    alert('Erro ao enviar comentário');
    return null;
  }
}

async function deletarComentarioGaleria(comentarioId) {
  const usuarioRaw = localStorage.getItem('usuarioLogado');
  const usuario = usuarioRaw ? JSON.parse(usuarioRaw) : null;
  
  if (!usuario) {
    alert('Você precisa estar logado');
    return false;
  }

  if (!confirm('Tem certeza que deseja deletar este comentário?')) {
    return false;
  }

  try {
    const res = await fetch(`/api/galeria/comentarios/${comentarioId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ autor: usuario.nome })
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error || 'Erro ao deletar comentário');
      return false;
    }

    return true;
  } catch (e) {
    console.error('Erro ao deletar comentário:', e);
    alert('Erro ao deletar comentário');
    return false;
  }
}

async function atualizarComentariosGaleria(galeriaId) {
  const container = document.getElementById(`comentarios-galeria-${galeriaId}`);
  if (!container) return;

  container.innerHTML = '<div style="text-align: center; padding: 1rem; color: #94a3b8;"><i class="fas fa-spinner fa-spin"></i></div>';

  const comentarios = await carregarComentariosGaleria(galeriaId);
  
  if (comentarios.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 1rem; color: #94a3b8; font-size: 0.9rem;">Nenhum comentário ainda</div>';
  } else {
    container.innerHTML = comentarios.map(c => {
      const usuarioRaw = localStorage.getItem('usuarioLogado');
      const usuario = usuarioRaw ? JSON.parse(usuarioRaw) : null;
      const podeDelete = usuario && (usuario.nome === c.autor || usuario.nome === 'administrador_turma205-1');
      
      return `
        <div style="padding: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: start; gap: 1rem;">
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 600; color: #60a5fa; font-size: 0.9rem;">${c.autor}</div>
            <div style="color: #e5e7eb; margin-top: 0.25rem; word-break: break-word;">${c.texto}</div>
            <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 0.5rem;">${new Date(c.criado).toLocaleDateString('pt-BR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
          </div>
          ${podeDelete ? `<button onclick="(async () => { if (await deletarComentarioGaleria(${c.id})) { await atualizarComentariosGaleria(${galeriaId}); } })()" style="background: rgba(239,68,68,0.2); color: #fca5a5; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem;"><i class="fas fa-trash"></i></button>` : ''}
        </div>
      `;
    }).join('');
  }
}

async function focarNovaFormulario(galeriaId) {
  const container = document.getElementById(`form-comentario-galeria-${galeriaId}`);
  if (!container) return;
  
  const input = container.querySelector('input');
  if (input) input.focus();
}

async function enviarComentarioForm(galeriaId, event) {
  if (event) event.preventDefault();
  
  const container = document.getElementById(`form-comentario-galeria-${galeriaId}`);
  if (!container) return;
  
  const input = container.querySelector('input');
  const texto = input.value;
  
  const resultado = await enviarComentarioGaleria(galeriaId, texto);
  if (resultado) {
    input.value = '';
    await atualizarComentariosGaleria(galeriaId);
  }
}

function carregarProximaPaginaGaleria() {
  carregarGaleria(galeriaAtualPage + 1);
}

function carregarPaginaAnteriorGaleria() {
  if (galeriaAtualPage > 0) {
    carregarGaleria(galeriaAtualPage - 1);
  }
}

async function carregarCalendario() {
  const container = document.getElementById('calendarioContainer');
  const secaoCalendario = document.getElementById('secaoCalendario');
  const usuarioRaw = localStorage.getItem('usuarioLogado');
  const usuario = usuarioRaw ? JSON.parse(usuarioRaw) : null;

  // Esconder seção se usuário não é aluno205-1
  if (!usuario || usuario.nome !== 'aluno205-1') {
    if (secaoCalendario) {
      secaoCalendario.style.display = 'none';
    }
    return;
  }

  // Mostrar seção para aluno205-1
  if (secaoCalendario) {
    secaoCalendario.style.display = 'block';
  }

  try {
    const res = await fetch('/api/calendario');
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const response = await res.json();
    const eventos = Array.isArray(response.data) ? response.data : [];

    const hoje = new Date();
    const umaSemana = new Date(hoje);
    umaSemana.setDate(hoje.getDate() + 7);

    const eventosSemana = eventos
      .map((evento) => ({ ...evento, dataObj: new Date(evento.data) }))
      .filter((evento) => evento.dataObj >= hoje && evento.dataObj <= umaSemana)
      .sort((a, b) => a.dataObj - b.dataObj);

    if (!eventosSemana.length) {
      container.innerHTML = `
        <div class="empty-state calendario-empty">
          <i class="fas fa-calendar-day"></i>
          <p>Nenhum compromisso programado para os próximos 7 dias.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <table class="calendario-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Evento</th>
            <th>Descrição</th>
            <th>Tipo</th>
          </tr>
        </thead>
        <tbody>
          ${eventosSemana.map((evento) => `
            <tr>
              <td>${evento.dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
              <td>${evento.titulo || ''}</td>
              <td>${evento.descricao || ''}</td>
              <td>${evento.tipo || 'Aviso'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (e) {
    console.error('Erro ao carregar calendário:', e);
    container.innerHTML = `<div class="error-text">Erro ao carregar calendário: ${e.message}</div>`;
  }
}

function getVideoEmbedFromUrl(url) {
  if (!url) return null;
  
  // YouTube
  const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (youtubeMatch) {
    return `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${youtubeMatch[1]}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="border-radius: 8px;"></iframe>`;
  }
  
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `<iframe width="100%" height="100%" src="https://player.vimeo.com/video/${vimeoMatch[1]}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="border-radius: 8px;"></iframe>`;
  }
  
  // Se é URL de vídeo direto (.mp4, .webm, etc)
  if (url.match(/\.(mp4|webm|ogg|mov|avi|mkv)(\?|$)/i) || url.includes('blob:')) {
    return null; // Será tratado como <video> normal
  }
  
  // Tenta como link direto de vídeo
  return null;
}

function renderizarVidoUrl(url) {
  const embed = getVideoEmbedFromUrl(url);
  if (embed) {
    return `<div style="width: 100%; height: 100%; border-radius: 8px; overflow: hidden;">${embed}</div>`;
  }
  // Se for arquivo direto
  return `<video controls style="width: 100%; height: 100%; border-radius: 8px; background: #000; object-fit: cover; display: block;">
    <source src="${url}" type="video/mp4">
    Seu navegador não suporta vídeos.
  </video>`;
}

function downloadMidia(nomeArquivo, url) {
  // Verificar se é admin
  const usuarioRaw = localStorage.getItem('usuarioLogado');
  const usuario = usuarioRaw ? JSON.parse(usuarioRaw) : null;
  const isAdmin = usuario && usuario.nome === 'administrador_turma205-1';
  
  if (!isAdmin) {
    alert('Apenas administradores podem baixar mídia');
    return;
  }
  
  if (!url) {
    alert('Link de mídia não disponível');
    return;
  }
  
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  link.style.display = 'none';
  document.body.appendChild(link);
  
  // Verificar se é URL de domínio diferentes (CORS)
  try {
    link.click();
  } catch (e) {
    console.error('Erro ao baixar:', e);
    // Se falhar, abre em nova aba
    window.open(url, '_blank');
  }
  
  document.body.removeChild(link);
}

// Carregar Descrição da Turma
async function carregarDescricaoTurma() {
  try {
    const res = await fetch('/api/descricao-turma');
    const data = await res.json();
    const container = document.getElementById('descricaoTurma');
    
    if (data && data.descricao) {
      container.innerHTML = `<p>${data.descricao.split('\n').join('</p><p>')}</p>`;
    } else {
      container.innerHTML = '<p>Descrição da turma indisponível no momento.</p>';
    }
  } catch (e) {
    console.error('Erro ao carregar descrição:', e);
    const container = document.getElementById('descricaoTurma');
    if (container) {
      container.innerHTML = '<p>Descrição da turma indisponível no momento.</p>';
    }
  }
}
