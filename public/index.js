// Sala 205 - Improved Index JS
// Modern version with optimized drag and drop

// ============================================
// GLOBAL STATE
// ============================================

let galeriaAtualPage = 0;
const dragState = {
    isDragging: false,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
    element: null
};

// ============================================
// POPUP FUNCTIONS
// ============================================

window.fecharPopup = function() {
    const popup = document.getElementById('popup');
    if (popup) popup.classList.remove('active');
};

window.logar = function() {
    window.location.href = '/auth/login/login.html';
};

window.criarConta = function() {
    window.location.href = '/auth/cadastro/cadastro.html';
};

// ============================================
// DARK MODE SYSTEM
// ============================================

function carregarModoDark() {
    const modoDarkArmazenado = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    let shouldBeDark = prefersDark;
    if (modoDarkArmazenado !== null) {
        shouldBeDark = modoDarkArmazenado === 'true';
    }
    
    aplicarModoDark(shouldBeDark);
}

function aplicarModoDark(isDark) {
    if (isDark) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'true');
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'false');
    }
    
    atualizarIconeModo();
}

function atualizarIconeModo() {
    const btn = document.querySelector('.theme-toggle-btn');
    if (btn) {
        const icon = btn.querySelector('i');
        const isDark = document.body.classList.contains('dark-mode');
        if (icon) {
            icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
}

window.toggleDarkMode = function() {
    const isDark = document.body.classList.contains('dark-mode');
    aplicarModoDark(!isDark);
};

// ============================================
// POPUP DRAG FUNCTIONALITY (Optimized)
// ============================================

function initPopupDrag() {
    const popup = document.getElementById('popup');
    const popupContent = document.getElementById('popupContent');
    
    if (!popup || !popupContent) return;
    
    let rect = null;
    let maxX, maxY;
    
    popupContent.addEventListener('mousedown', (e) => {
        if (e.target.closest('.popup-close') || e.target.closest('button')) {
            return;
        }
        
        dragState.isDragging = true;
        dragState.element = popupContent;
        dragState.startX = e.clientX;
        dragState.startY = e.clientY;
        
        rect = popupContent.getBoundingClientRect();
        dragState.offsetX = e.clientX - rect.left;
        dragState.offsetY = e.clientY - rect.top;
        
        maxX = window.innerWidth - rect.width;
        maxY = window.innerHeight - rect.height;
        
        popupContent.style.cursor = 'grabbing';
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!dragState.isDragging || !dragState.element) return;
        
        // Usar requestAnimationFrame para suavizar
        requestAnimationFrame(() => {
            let newX = e.clientX - dragState.offsetX;
            let newY = e.clientY - dragState.offsetY;
            
            // Limitar movement dentro da viewport
            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));
            
            dragState.element.style.position = 'fixed';
            dragState.element.style.left = newX + 'px';
            dragState.element.style.top = newY + 'px';
            dragState.element.style.transform = 'none';
        });
    });
    
    document.addEventListener('mouseup', () => {
        if (dragState.isDragging) {
            dragState.isDragging = false;
            if (dragState.element) {
                dragState.element.style.cursor = 'grab';
            }
        }
    });
    
    // Fechar ao clicar no fundo
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            fecharPopup();
        }
    });
}

// ============================================
// COMMENTS SIDEBAR
// ============================================

function initSidebar() {
    const toggleBtn = document.getElementById('toggleCommentsBtn');
    const sidebar = document.getElementById('secao2');
    
    if (!toggleBtn || !sidebar) return;
    
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });
}

window.fecharComentarios = function() {
    const sidebar = document.getElementById('secao2');
    if (sidebar) sidebar.classList.remove('open');
};

// ============================================
// CHARACTER COUNTER
// ============================================

function initCharCounter() {
    const textarea = document.getElementById('novoComentario');
    const charCount = document.getElementById('charCount');
    
    if (!textarea || !charCount) return;
    
    textarea.addEventListener('input', () => {
        const length = textarea.value.length;
        charCount.textContent = `${length}/120`;
    });
}

// ============================================
// COMMENTS FUNCTIONALITY
// ============================================

async function carregarComentarios() {
    try {
        const response = await fetch('/api/comentarios');
        if (!response.ok) throw new Error('API error');
        const comentarios = await response.json();
        renderizarComentarios(comentarios);
    } catch (err) {
        console.error('Erro ao carregar comentários:', err);
        renderizarComentarios([]);
    }
}

function renderizarComentarios(comentarios) {
    const container = document.getElementById('comentariosExistentes');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!comentarios || comentarios.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-light);">Sem comentários ainda. Seja o primeiro!</p>';
        return;
    }
    
    comentarios.forEach(c => {
        const div = document.createElement('div');
        div.className = 'comentario-item';
        div.innerHTML = `
            <div class="comment-header">
                <div class="avatar">${c.autor.charAt(0).toUpperCase()}</div>
                <div class="comment-meta">
                    <strong>${c.autor}</strong>
                    <span class="comment-time">${new Date(c.criado).toLocaleDateString('pt-BR')}</span>
                </div>
            </div>
            <p>${escapeHtml(c.texto)}</p>
        `;
        container.appendChild(div);
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function enviarComentario() {
    const textarea = document.getElementById('novoComentario');
    const btnEnviar = document.getElementById('btnEnviarComentario');
    const mensagemSemConta = document.getElementById('mensagemSemConta');
    
    if (!textarea) return;
    
    const usuarioRaw = localStorage.getItem('usuarioLogado');
    const usuario = usuarioRaw ? JSON.parse(usuarioRaw) : null;
    
    if (!usuario) {
        if (mensagemSemConta) mensagemSemConta.style.display = 'block';
        return;
    }
    
    const texto = textarea.value.trim();
    if (!texto) return;
    
    try {
        btnEnviar.disabled = true;
        btnEnviar.textContent = 'Enviando...';
        
        const response = await fetch('/api/comentarios', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                texto: texto,
                autor: usuario.nome || usuario.usuario
            })
        });
        
        if (!response.ok) {
            throw new Error(`Erro: ${response.statusText}`);
        }
        
        // Limpar e atualizar
        textarea.value = '';
        document.getElementById('charCount').textContent = '0/120';
        await carregarComentarios();
    } catch (err) {
        console.error('Erro ao enviar comentário:', err);
        alert('Erro ao enviar comentário. Tente novamente.');
    } finally {
        btnEnviar.disabled = false;
        btnEnviar.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar comentário';
    }
}

// ============================================
// GALLERY FUNCTIONALITY
// ============================================

async function carregarGaleria() {
    try {
        const response = await fetch(`/api/galeria?page=${galeriaAtualPage}`);
        const data = await response.json();
        renderizarGaleria(data.items);
        atualizarPaginacao(data);
    } catch (err) {
        console.error('Erro ao carregar galeria:', err);
    }
}

function renderizarGaleria(items) {
    const container = document.getElementById('galeriaContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!items || items.length === 0) {
        container.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">Nenhuma imagem ainda</p>';
        return;
    }
    
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'galeria-item';
        
        if (item.tipo === 'video') {
            div.innerHTML = `
                <video style="width: 100%; height: 100%; object-fit: cover;">
                    <source src="${item.url}" type="video/mp4">
                </video>
                <div class="galeria-overlay">
                    <div class="galeria-title">
                        <i class="fas fa-video"></i> ${item.titulo}
                    </div>
                </div>
            `;
        } else {
            div.innerHTML = `
                <img src="${item.url}" alt="${item.titulo}" />
                <div class="galeria-overlay">
                    <div class="galeria-title">${item.titulo}</div>
                </div>
            `;
        }
        
        container.appendChild(div);
    });
}

function atualizarPaginacao(data) {
    const paginationContainer = document.getElementById('galeriaPagination');
    const prevBtn = document.getElementById('galeriaPrevBtn');
    const nextBtn = document.getElementById('galeriaNextBtn');
    
    if (!paginationContainer) return;
    
    if (data.totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }
    
    paginationContainer.style.display = 'flex';
    
    if (prevBtn) {
        prevBtn.style.display = galeriaAtualPage > 0 ? 'flex' : 'none';
    }
    if (nextBtn) {
        nextBtn.style.display = data.hasNext ? 'flex' : 'none';
    }
}

window.carregarProximaPaginaGaleria = function() {
    galeriaAtualPage++;
    carregarGaleria();
    document.getElementById('galeriaContainer').scrollIntoView({ behavior: 'smooth' });
};

window.carregarPaginaAnteriorGaleria = function() {
    galeriaAtualPage = Math.max(0, galeriaAtualPage - 1);
    carregarGaleria();
    document.getElementById('galeriaContainer').scrollIntoView({ behavior: 'smooth' });
};

// ============================================
// DESCRIPTION LOADING
// ============================================

async function carregarDescricaoTurma() {
    try {
        const response = await fetch('/api/descricao-turma');
        if (!response.ok) throw new Error('API error');
        const data = await response.json();
        
        const container = document.getElementById('descricaoTurma');
        if (container && data.descricao) {
            container.innerHTML = data.descricao;
            // Cachear no localStorage
            localStorage.setItem('descricaoTurma', data.descricao);
        }
    } catch (err) {
        console.error('Erro ao carregar descrição da API:', err);
        // Fallback: tentar carregar do localStorage
        const container = document.getElementById('descricaoTurma');
        const descricaoCache = localStorage.getItem('descricaoTurma');
        if (container && descricaoCache) {
            container.innerHTML = descricaoCache;
        } else if (container) {
            container.innerHTML = 'Espaço criado para reunir memórias e fotos da turma.<br>Um projeto gerido com dedicação e amor.';
        }
    }
}

// ============================================
// LOGIN STATUS HANDLING
// ============================================

function atualizarStatusLogin() {
    const usuarioRaw = localStorage.getItem('usuarioLogado');
    const usuario = usuarioRaw ? JSON.parse(usuarioRaw) : null;
    const popup = document.getElementById('popup');
    const botaoLogin = document.getElementById('botaoLogin');
    const usuarioContainer = document.getElementById('usuarioContainer');
    const nomeUsuarioNav = document.getElementById('nomeUsuarioNav');
    const botoesLoginContato = document.getElementById('botoesLoginContato');
    const btnEnviarComentario = document.getElementById('btnEnviarComentario');
    const mensagemSemConta = document.getElementById('mensagemSemConta');
    
    if (usuario) {
        // Usuário logado
        if (popup) popup.classList.remove('active');
        if (botaoLogin) botaoLogin.style.display = 'none';
        if (usuarioContainer) {
            usuarioContainer.style.display = 'flex';
            if (nomeUsuarioNav) {
                const primeiroNome = usuario.nome ? usuario.nome.split(' ')[0] : 'Usuário';
                nomeUsuarioNav.textContent = `Olá, ${primeiroNome}`;
            }
        }
        if (botoesLoginContato) botoesLoginContato.style.display = 'none';
        if (mensagemSemConta) mensagemSemConta.style.display = 'none';
    } else {
        // Usuário não logado
        if (popup) popup.classList.add('active');
        if (botaoLogin) {
            botaoLogin.style.display = 'block';
            botaoLogin.textContent = 'Login';
            botaoLogin.onclick = window.logar;
        }
        if (usuarioContainer) usuarioContainer.style.display = 'none';
        if (botoesLoginContato) botoesLoginContato.style.display = 'flex';
    }
    
    // Setup comentário button
    if (btnEnviarComentario) {
        btnEnviarComentario.onclick = () => {
            if (usuario) {
                enviarComentario();
            } else {
                if (mensagemSemConta) mensagemSemConta.style.display = 'block';
            }
        };
    }
}

// ============================================
// SETTINGS & USER MANAGEMENT
// ============================================

function toggleSettingsMenu() {
    const settingsMenu = document.getElementById('settingsMenu');
    if (settingsMenu) {
        settingsMenu.classList.toggle('active');
    }
}

function fecharSettings() {
    const modal = document.getElementById('settingsModal');
    const settingsMenu = document.getElementById('settingsMenu');
    if (modal) modal.classList.remove('active');
    if (settingsMenu) settingsMenu.classList.remove('active');
}

function abrirMudaNome(e) {
    e.preventDefault();
    const usuarioRaw = localStorage.getItem('usuarioLogado');
    const usuario = usuarioRaw ? JSON.parse(usuarioRaw) : null;
    
    if (!usuario) return;
    
    const modal = document.getElementById('settingsModal');
    const settingsBody = document.getElementById('settingsBody');
    
    if (modal && settingsBody) {
        settingsBody.innerHTML = `
            <h2>Mudar Nome</h2>
            <form onsubmit="salvarNovoNome(event)">
                <div class="form-group">
                    <label for="novoNome">Novo nome:</label>
                    <input type="text" id="novoNome" required placeholder="Digite seu novo nome" value="${usuario.nome || ''}">
                </div>
                <button type="submit" class="btn-primary">Salvar</button>
                <button type="button" class="btn-secondary" onclick="fecharSettings()" style="background-color: var(--border);">Cancelar</button>
            </form>
        `;
        modal.classList.add('active');
        document.getElementById('settingsMenu').classList.remove('active');
    }
}

function salvarNovoNome(e) {
    e.preventDefault();
    const novoNome = document.getElementById('novoNome').value.trim();
    
    if (!novoNome) {
        alert('Nome não pode estar vazio');
        return;
    }
    
    const usuarioRaw = localStorage.getItem('usuarioLogado');
    const usuario = usuarioRaw ? JSON.parse(usuarioRaw) : null;
    
    if (usuario) {
        usuario.nome = novoNome;
        localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
        
        // Atualizar nome na navbar
        const nomeUsuarioNav = document.getElementById('nomeUsuarioNav');
        if (nomeUsuarioNav) {
            const primeiroNome = novoNome.split(' ')[0];
            nomeUsuarioNav.textContent = `Olá, ${primeiroNome}`;
        }
        
        // TODO: Fazer PATCH para API /api/usuarios/{id}
        alert('Nome atualizado com sucesso!');
        fecharSettings();
    }
}

function abrirMudaSenha(e) {
    e.preventDefault();
    const modal = document.getElementById('settingsModal');
    const settingsBody = document.getElementById('settingsBody');
    
    if (modal && settingsBody) {
        settingsBody.innerHTML = `
            <h2>Mudar Senha</h2>
            <form onsubmit="salvarNovaSenha(event)">
                <div class="form-group">
                    <label for="senhaAtual">Senha atual:</label>
                    <input type="password" id="senhaAtual" required>
                </div>
                <div class="form-group">
                    <label for="novaSenha">Nova senha:</label>
                    <input type="password" id="novaSenha" required minlength="6">
                </div>
                <div class="form-group">
                    <label for="confirmarSenha">Confirmar nova senha:</label>
                    <input type="password" id="confirmarSenha" required minlength="6">
                </div>
                <button type="submit" class="btn-primary">Atualizar Senha</button>
                <button type="button" class="btn-secondary" onclick="fecharSettings()" style="background-color: var(--border);">Cancelar</button>
            </form>
        `;
        modal.classList.add('active');
        document.getElementById('settingsMenu').classList.remove('active');
    }
}

function salvarNovaSenha(e) {
    e.preventDefault();
    const novaSenha = document.getElementById('novaSenha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;
    
    if (novaSenha !== confirmarSenha) {
        alert('As senhas não coincidem!');
        return;
    }
    
    if (novaSenha.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres');
        return;
    }
    
    // TODO: Fazer POST para API /api/auth/mudar-senha
    alert('Senha atualizada com sucesso!');
    fecharSettings();
}

function abrirPolitica(e) {
    e.preventDefault();
    const modal = document.getElementById('settingsModal');
    const settingsBody = document.getElementById('settingsBody');
    
    if (modal && settingsBody) {
        settingsBody.innerHTML = `
            <h2>Política de Privacidade</h2>
            <div style="max-height: 400px; overflow-y: auto;">
                <h3>1. Coleta de Informações</h3>
                <p>Coletamos informações que você nos fornece voluntariamente, como seu nome e email.</p>
                
                <h3>2. Uso de Informações</h3>
                <p>Utilizamos suas informações para melhorar nossa plataforma e proporcionar uma melhor experiência.</p>
                
                <h3>3. Proteção de Dados</h3>
                <p>Seus dados são armazenados de forma segura e não são compartilhados com terceiros.</p>
                
                <h3>4. Cookies</h3>
                <p>Utilizamos cookies para melhorar a experiência do usuário.</p>
                
                <h3>5. Contato</h3>
                <p>Para dúvidas sobre nossa política de privacidade, entre em contato conosco.</p>
            </div>
            <button type="button" class="btn-primary" onclick="fecharSettings()">Fechar</button>
        `;
        modal.classList.add('active');
        document.getElementById('settingsMenu').classList.remove('active');
    }
}

function abrirTermos(e) {
    e.preventDefault();
    const modal = document.getElementById('settingsModal');
    const settingsBody = document.getElementById('settingsBody');
    
    if (modal && settingsBody) {
        settingsBody.innerHTML = `
            <h2>Termos de Uso</h2>
            <div style="max-height: 400px; overflow-y: auto;">
                <h3>1. Aceitação dos Termos</h3>
                <p>Ao acessar e usar este site, você aceita estar vinculado por estes termos e condições.</p>
                
                <h3>2. Licença de Uso</h3>
                <p>É concedida a você uma licença limitada para usar este site para fins pessoais.</p>
                
                <h3>3. Restrições</h3>
                <p>Você concorda em não reproduzir, distribuir ou transmitir qualquer conteúdo sem permissão.</p>
                
                <h3>4. Isenção de Responsabilidade</h3>
                <p>Este site é fornecido "como está" sem garantias de qualquer tipo.</p>
                
                <h3>5. Limitação de Responsabilidade</h3>
                <p>Em nenhum caso seremos responsáveis por danos diretos ou indiretos.</p>
                
                <h3>6. Modificações</h3>
                <p>Nos reservamos o direito de modificar estes termos a qualquer momento.</p>
            </div>
            <button type="button" class="btn-primary" onclick="fecharSettings()">Fechar</button>
        `;
        modal.classList.add('active');
        document.getElementById('settingsMenu').classList.remove('active');
    }
}

function abrirDeleteConta(e) {
    e.preventDefault();
    const modal = document.getElementById('settingsModal');
    const settingsBody = document.getElementById('settingsBody');
    
    if (modal && settingsBody) {
        settingsBody.innerHTML = `
            <h2>Excluir Conta</h2>
            <p style="color: #ef4444; font-weight: bold;">⚠️ Esta ação é irreversível!</p>
            <p>Sua conta, comentários e dados associados serão permanentemente deletados.</p>
            <form onsubmit="confirmarExcluirConta(event)">
                <div class="form-group">
                    <label for="senhaConfirm">Digite sua senha para confirmar:</label>
                    <input type="password" id="senhaConfirm" required>
                </div>
                <button type="submit" class="btn-delete" style="background-color: #ef4444;">Sim, excluir minha conta</button>
                <button type="button" class="btn-secondary" onclick="fecharSettings()" style="background-color: var(--border);">Cancelar</button>
            </form>
        `;
        modal.classList.add('active');
        document.getElementById('settingsMenu').classList.remove('active');
    }
}

function confirmarExcluirConta(e) {
    e.preventDefault();
    
    // TODO: Fazer DELETE para API /api/usuarios/{id} com autenticação
    
    if (confirm('Você tem certeza? Esta ação não pode ser desfeita!')) {
        localStorage.removeItem('usuarioLogado');
        localStorage.removeItem('token');
        alert('Conta excluída com sucesso. Você será redirecionado...');
        window.location.href = './index.html';
    }
}

function fazerLogout(e) {
    e.preventDefault();
    localStorage.removeItem('usuarioLogado');
    localStorage.removeItem('token');
    window.location.reload();
}

function abrirMudarTema(e) {
    e.preventDefault();
    const modal = document.getElementById('settingsModal');
    const settingsBody = document.getElementById('settingsBody');
    const temaAtual = localStorage.getItem('tema') || 'green';
    
    if (modal && settingsBody) {
        settingsBody.innerHTML = `
            <h2>Mudar Tema</h2>
            <p style="margin-bottom: 1.5rem; color: var(--text-light);">Escolha a cor do tema:</p>
            <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
                <label style="flex: 1; cursor: pointer;">
                    <input type="radio" name="tema-color" value="blue" ${temaAtual === 'blue' ? 'checked' : ''} onchange="salvarTema('blue')" style="margin-right: 0.5rem;">
                    <span style="background: #3b82f6; display: inline-block; width: 2rem; height: 2rem; border-radius: 50%; vertical-align: middle;"></span>
                    Azul
                </label>
                <label style="flex: 1; cursor: pointer;">
                    <input type="radio" name="tema-color" value="green" ${temaAtual === 'green' ? 'checked' : ''} onchange="salvarTema('green')" style="margin-right: 0.5rem;">
                    <span style="background: #10b981; display: inline-block; width: 2rem; height: 2rem; border-radius: 50%; vertical-align: middle;"></span>
                    Verde
                </label>
            </div>
            <button type="button" class="btn-primary" onclick="fecharSettings()">Pronto</button>
        `;
        modal.classList.add('active');
        document.getElementById('settingsMenu').classList.remove('active');
    }
}

function salvarTema(tema) {
    localStorage.setItem('tema', tema);
    aplicarTema(tema);
}

function carregarTema() {
    const temaArmazenado = localStorage.getItem('tema') || 'green';
    aplicarTema(temaArmazenado);
}

function aplicarTema(tema) {
    document.body.classList.remove('theme-green', 'theme-blue');
    if (tema === 'green') {
        document.body.classList.add('theme-green');
    }
    // 'blue' é o padrão, não precisa adicionar classe
}

// ============================================
// THEME SELECTOR (NAVBAR)
// ============================================

window.toggleTemaSelector = function() {
    const selector = document.getElementById('temaSelector');
    if (selector) {
        selector.style.display = selector.style.display === 'none' ? 'flex' : 'none';
    }
};

window.mudarTema = function(tema) {
    salvarTema(tema === 'azul' ? 'blue' : 'green');
    toggleTemaSelector();
};

// ============================================
// ADMIN PANEL ACCESS
// ============================================

function atualizarMenuAdmin() {
    const usuarioRaw = localStorage.getItem('usuarioLogado');
    const usuario = usuarioRaw ? JSON.parse(usuarioRaw) : null;
    const opAdmin = document.getElementById('opAdmin');
    const temaBtn = document.querySelector('.theme-selector-btn');
    
    if (usuario && (usuario.tipoUsuario === 'admin' || usuario.tipoUsuario === 'dev' || usuario.usuario === 'administrator_turma205')) {
        if (opAdmin) {
            opAdmin.style.display = 'flex';
        }
    } else if (opAdmin) {
        opAdmin.style.display = 'none';
    }
    
    // Mostrar seletor de temas no navbar quando logado
    if (usuario && temaBtn) {
        temaBtn.style.display = 'inline-block';
    } else if (temaBtn) {
        temaBtn.style.display = 'none';
    }
}

// ============================================
// PAGE INITIALIZATION
// ============================================

window.addEventListener('DOMContentLoaded', function() {
    // Dark mode
    carregarModoDark();
    
    // Theme
    carregarTema();
    
    // Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(err => {
            console.log('Service Worker registration failed:', err);
        });
    }
    
    // Initialize components
    atualizarStatusLogin();
    atualizarMenuAdmin();
    initPopupDrag();
    initSidebar();
    initCharCounter();
    
    // Close settings menu when clicking outside
    document.addEventListener('click', function(e) {
        const settingsMenu = document.getElementById('settingsMenu');
        const botaoSettings = document.getElementById('botaoSettings');
        if (settingsMenu && !settingsMenu.contains(e.target) && !botaoSettings.contains(e.target)) {
            settingsMenu.classList.remove('active');
        }
    });
    
    // Close modal when clicking outside
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                fecharSettings();
            }
        });
    }
    
    // Load data
    carregarComentarios();
    carregarGaleria();
    carregarDescricaoTurma();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    dragState.isDragging = false;
});
