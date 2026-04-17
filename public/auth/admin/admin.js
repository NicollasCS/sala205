const ADMIN_USER = 'administrador_turma205-1';
const ADMIN_PASS = 'administrador_turma205-1';
const DEV_USER = 'dev205-1';
const DEV_PASS = 'dev205-1';
const ADMIN_TOKEN = 'turma205-admin';
const DEV_TOKEN = 'turma205-dev';
const PAGE_SIZE = 5;
const CROP_SIZE = 420;
const LOGS_PAGE_SIZE = 10;

// Contas protegidas que não podem ser deletadas
const PROTECTED_ACCOUNTS = ['administrador_turma205-1', 'aluno205-1', 'dev205-1'];

const state = {
    galeriaPage: 0,
    logsPage: 0,
    userRole: null, // 'admin', 'dev', ou null
    galeriaPagination: {
        page: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
        total: 0
    },
    galeriaItems: [],
    calendarioItems: [],
    editingGaleriaId: null,
    sortable: null,
    crop: {
        image: null,
        imageLoaded: false,
        zoom: 1,
        minZoom: 1,
        maxZoom: 2.6,
        offsetX: 0,
        offsetY: 0,
        rotation: 0,
        dragStartX: 0,
        dragStartY: 0,
        dragging: false,
        finalDataUrl: '',
        videoBlob: null
    }
};

function qs(id) {
    return document.getElementById(id);
}

function showLoginError(message = 'Credenciais incorretas!') {
    const loginError = qs('loginError');
    loginError.style.display = 'block';
    loginError.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
}

window.togglePasswordVisibility = (fieldId) => {
    const input = qs(fieldId);
    const btn = window.event?.target?.closest('.toggle-password-btn');
    if (!input || !btn) return;

    if (input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
        input.type = 'password';
        btn.innerHTML = '<i class="fas fa-eye"></i>';
    }
};

window.onload = () => {
    bindEvents();
    carregarTema();
    carregarModoExibicao();
    if (localStorage.getItem('adminLoggedIn') === 'true') {
        // Restaurar role do usuário
        const savedRole = localStorage.getItem('userRole');
        if (savedRole) {
            state.userRole = savedRole;
        }
        showAdminPanel();
    }
};

function carregarTema() {
    const temaArmazenado = localStorage.getItem('tema') || 'blue';
    aplicarTema(temaArmazenado);
}

window.mudarTema = function(tema) {
    localStorage.setItem('tema', tema);
    aplicarTema(tema);
}

function aplicarTema(tema) {
    document.body.classList.remove('theme-green', 'theme-red');
    if (tema === 'green') {
        document.body.classList.add('theme-green');
    } else if (tema === 'red') {
        document.body.classList.add('theme-red');
    }
    
    // Atualizar radio button
    const radio = document.querySelector(`input[name="theme"][value="${tema}"]`);
    if (radio) {
        radio.checked = true;
    }
}

// Modo de Exibição (Claro/Escuro)
function carregarModoExibicao() {
    const modoArmazenado = localStorage.getItem('modoExibicao') || 'dark';
    aplicarModoExibicao(modoArmazenado);
}

window.mudarModoExibicao = function(modo) {
    localStorage.setItem('modoExibicao', modo);
    aplicarModoExibicao(modo);
}

function aplicarModoExibicao(modo) {
    document.documentElement.setAttribute('data-theme', modo);
    document.body.classList.remove('light-mode', 'dark-mode');
    if (modo === 'light') {
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.add('dark-mode');
    }
    
    // Atualizar radio button
    const radio = document.querySelector(`input[name="darkmode"][value="${modo}"]`);
    if (radio) {
        radio.checked = true;
    }
}

function bindEvents() {
    qs('adminLoginForm').addEventListener('submit', handleLoginSubmit);
    qs('logoutBtn').addEventListener('click', handleLogout);
    qs('refresh-comments').addEventListener('click', loadComments);
    qs('refresh-users').addEventListener('click', loadUsers);
    qs('salvarDescricao').addEventListener('click', saveDescricao);
    qs('add-galeria-btn').addEventListener('click', () => abrirGaleriaModal());
    qs('galeriaForm').addEventListener('submit', salvarGaleria);
    qs('uploadBtn').addEventListener('click', () => qs('galeriaFoto').click());
    qs('galeriaFoto').addEventListener('change', onFileSelected);
    qs('zoomSlider').addEventListener('input', onZoomChange);
    qs('add-calendario-btn')?.addEventListener('click', () => abrirCalendarioModal());
    qs('calendarioForm')?.addEventListener('submit', salvarCalendario);

    // Event listeners para tipo de mídia
    document.querySelectorAll('input[name="tipoMidia"]').forEach(radio => {
        radio.addEventListener('change', onTipoMidiaChange);
    });

    const canvas = qs('cropCanvas');
    canvas.addEventListener('mousedown', startDrag);
    canvas.addEventListener('mousemove', onDrag);
    canvas.addEventListener('mouseup', endDrag);
    canvas.addEventListener('mouseleave', endDrag);
    canvas.addEventListener('touchstart', startDrag, { passive: false });
    canvas.addEventListener('touchmove', onDrag, { passive: false });
    canvas.addEventListener('touchend', endDrag);

    document.querySelectorAll('.nav-btn').forEach((btn) => {
        btn.addEventListener('click', () => changeTab(btn.dataset.tab));
    });

    // Event listeners para Logs
    qs('clear-logs')?.addEventListener('click', clearLogs);
    qs('export-logs')?.addEventListener('click', exportLogs);
    document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', () => setTimeout(filterLogs, 300));
    });
    qs('filterDetalhes')?.addEventListener('input', () => setTimeout(filterLogs, 300));
    qs('clearFilters')?.addEventListener('click', () => {
        document.querySelectorAll('.filter-checkbox').forEach(cb => cb.checked = true);
        qs('filterDetalhes').value = '';
        filterLogs();
    });

    // Event listeners para Atualizações
    qs('clear-atualizacoes-logs')?.addEventListener('click', clearAtualizacoesLogs);
    qs('export-atualizacoes-logs')?.addEventListener('click', exportAtualizacoesLogs);
    
    // Event listener para formulário de Atualizações
    qs('atualizacaoForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        publicarAtualizacao();
    });

    // Event listener para Database
    qs('database-refresh-btn')?.addEventListener('click', loadDatabase);

    // Contador de caracteres
    qs('atualizacaoTexto')?.addEventListener('input', (e) => {
        const count = e.target.value.length;
        const countSpan = qs('charCount');
        if (countSpan) countSpan.textContent = count;
    });

    // Event listeners para Paginação de Logs
    qs('logs-prev')?.addEventListener('click', () => {
        if (state.logsPage > 0) {
            state.logsPage--;
            filterLogs('logs');
        }
    });
    qs('logs-next')?.addEventListener('click', () => {
        const totalPages = Math.ceil(currentFilteredLogs.length / LOGS_PAGE_SIZE);
        if (state.logsPage < totalPages - 1) {
            state.logsPage++;
            filterLogs('logs');
        }
    });
}

function onTipoMidiaChange() {
    const tipoMidia = document.querySelector('input[name="tipoMidia"]:checked').value;
    const uploadLabel = qs('uploadLabel');
    const uploadHelpText = qs('uploadHelpText');
    const uploadBtnText = qs('uploadBtnText');
    const fileInput = qs('galeriaFoto');
    const cropContainer = qs('cropContainer');
    const videoUrlGroup = qs('videoUrlGroup');
    const galeriaUrlGroup = qs('galeriaUrl')?.parentElement;
    
    if (tipoMidia === 'video') {
        uploadLabel.textContent = 'Vídeo do Dispositivo';
        uploadHelpText.textContent = 'Formatos: MP4, WebM | Máx. 800MB';
        uploadBtnText.textContent = 'Clique para selecionar vídeo';
        fileInput.accept = 'video/*';
        cropContainer.style.display = 'none';
        qs('previewContainer').style.display = 'none';
        videoUrlGroup.style.display = 'block';
        if (galeriaUrlGroup) galeriaUrlGroup.style.display = 'none';
    } else {
        uploadLabel.textContent = 'Foto do Dispositivo';
        uploadHelpText.textContent = 'Tamanho recomendado: min. 400x400px | máx. 5MB | Mín. 100x100px';
        uploadBtnText.textContent = 'Clique para selecionar imagem';
        fileInput.accept = 'image/*';
        qs('previewContainer').style.display = 'none';
        videoUrlGroup.style.display = 'none';
        if (galeriaUrlGroup) galeriaUrlGroup.style.display = 'block';
    }
    
    // Resetar arquivo selecionado
    fileInput.value = '';
    qs('videoUrl').value = '';
    resetCropState();
}

async function handleLoginSubmit(e) {
    e.preventDefault();
    const user = qs('adminUser').value.trim();
    const pass = qs('adminPass').value;

    if (!user || !pass) {
        showLoginError('Nome e senha são obrigatórios.');
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome: user, senha: pass })
        });

        const data = await response.json();

        if (!response.ok) {
            if (user === DEV_USER && pass === DEV_PASS) {
                localStorage.setItem('adminLoggedIn', 'true');
                localStorage.setItem('userRole', 'dev');
                localStorage.setItem('userName', DEV_USER);
                state.userRole = 'dev';
                showAdminPanel();
                return;
            }
            if (user === ADMIN_USER && pass === ADMIN_PASS) {
                localStorage.setItem('adminLoggedIn', 'true');
                localStorage.setItem('userRole', 'admin');
                localStorage.setItem('userName', ADMIN_USER);
                state.userRole = 'admin';
                showAdminPanel();
                return;
            }
            return showLoginError(data.error || 'Credenciais incorretas!');
        }

        const userData = data.user;
        if (!userData) {
            return showLoginError('Resposta inválida do servidor.');
        }

        localStorage.setItem('adminLoggedIn', 'true');
        localStorage.setItem('userRole', userData.role || (userData.is_root ? 'root' : userData.is_admin ? 'admin' : 'user'));
        localStorage.setItem('userName', userData.nome);
        localStorage.setItem('userId', userData.id);
        state.userRole = localStorage.getItem('userRole');
        showAdminPanel();
    } catch (error) {
        console.warn('Erro de rede ao tentar login:', error);
        if (user === DEV_USER && pass === DEV_PASS) {
            localStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('userRole', 'dev');
            localStorage.setItem('userName', DEV_USER);
            state.userRole = 'dev';
            showAdminPanel();
            return;
        }
        if (user === ADMIN_USER && pass === ADMIN_PASS) {
            localStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('userRole', 'admin');
            localStorage.setItem('userName', ADMIN_USER);
            state.userRole = 'admin';
            showAdminPanel();
            return;
        }
        showLoginError('Não foi possível conectar ao servidor de login.');
    }
}

function showAdminPanel() {
    qs('loginScreen').style.display = 'none';
    qs('adminPanel').style.display = 'flex';
    document.body.classList.add('admin-open');
    updatePermissions();
    loadContent();
}

function updatePermissions() {
    const userRole = localStorage.getItem('userRole');
    const formContainer = qs('atualizacoes-form-container');
    const adminWarning = qs('atualizacoes-admin-warning');
    const databaseTab = qs('database-tab');
    const databaseContent = qs('database-content');

    const actionsDiv = qs('atualizacoes-actions');
    
    // Atualizar indicador de role
    const roleIndicator = qs('userRoleIndicator');
    if (roleIndicator) {
        if (userRole === 'dev') {
            roleIndicator.innerHTML = '<i class="fas fa-crown"></i> Modo: Desenvolvedor';
            roleIndicator.style.color = '#f59e0b';
        } else if (userRole === 'admin') {
            roleIndicator.innerHTML = '<i class="fas fa-user-shield"></i> Modo: Administrador';
            roleIndicator.style.color = '#3b82f6';
        } else {
            roleIndicator.innerHTML = 'Sem permissão';
            roleIndicator.style.color = '#6b7280';
        }
    }

    // Dev e Admin têm as mesmas permissões
    const isAdmin = userRole === 'admin' || userRole === 'dev';
    
    // Mostrar/esconder formulário de atualizações - admin e dev podem editar
    if (formContainer) {
        if (isAdmin) {
            formContainer.style.display = 'block';
        } else {
            formContainer.style.display = 'none';
        }
    }

    // Mostrar/esconder botões de ação - admin e dev podem deletar/exportar
    if (actionsDiv) {
        if (isAdmin) {
            actionsDiv.style.display = 'flex';
        } else {
            actionsDiv.style.display = 'none';
        }
    }

    // Remover aviso de admin (agora admin e dev têm as mesmas permissões)
    if (adminWarning) {
        adminWarning.style.display = 'none';
    }

    // Liberar banco de dados para admin e dev
    if (databaseContent) {
        if (isAdmin) {
            databaseContent.classList.remove('cursor-blocked');
            databaseContent.style.cursor = '';
            databaseContent.style.pointerEvents = '';
            databaseContent.style.opacity = '';
        }
    }

    if (userRole === 'admin') {
        console.log('Modo Admin: sem permissão para editar atualizações e banco de dados');
        console.log('Modo Admin: apenas visualizar atualizações');
    }
}

function handleLogout() {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    state.userRole = null;
    qs('adminPanel').style.display = 'none';
    qs('loginScreen').style.display = 'block';
    document.body.classList.remove('admin-open');
    qs('adminLoginForm').reset();
}

function changeTab(tab) {
    const currentBtn = document.querySelector('.nav-btn.active');
    const currentTab = document.querySelector('.tab-content.active');

    if (currentBtn) currentBtn.classList.remove('active');
    if (currentTab) currentTab.classList.remove('active');

    document.querySelector(`.nav-btn[data-tab="${tab}"]`)?.classList.add('active');
    qs(`tab-${tab}`)?.classList.add('active');

    // When switching to logs or atualizacoes tabs, reload and filter
    if (tab === 'logs') {
        filterLogs('logs');
    } else if (tab === 'atualizacoes') {
        // Garantir que permissões sejam atualizadas ao trocar para atualizações
        updatePermissions();
        filterLogs('atualizacoes');
    } else if (tab === 'database') {
        loadDatabase();
    }
}

async function apiFetch(url, options = {}) {
    const headers = {
        ...(options.headers || {})
    };

    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName');

    if (options.admin !== false && userRole) {
        if (userRole === 'dev') {
            headers['x-admin-token'] = DEV_TOKEN;
        } else if (userRole === 'admin' || userRole === 'root') {
            headers['x-admin-token'] = ADMIN_TOKEN;
        }
        if (userRole === 'root') {
            headers['x-root-token'] = 'turma205-root';
        }
    }

    if (userName) {
        headers['x-requester-name'] = userName;
    }

    return fetch(url, {
        ...options,
        headers
    });
}

async function loadDescricao() {
    try {
        const res = await apiFetch('/api/descricao-turma', { admin: false });
        const data = await res.json();
        const textoArea = qs('descricaoTexto');
        const status = qs('descricao-status');

        textoArea.value = data?.descricao && data.descricao !== 'Descrição da turma não configurada.' ? data.descricao : '';
        status.textContent = textoArea.value ? 'Editável' : 'Sem descrição';
        status.className = `count-badge ${textoArea.value ? 'badge-success' : 'badge-warning'}`;
    } catch (e) {
        console.error('Erro ao carregar descrição:', e);
        qs('descricao-status').textContent = 'Erro';
        qs('descricao-status').className = 'count-badge badge-danger';
    }
}

async function saveDescricao() {
    const texto = qs('descricaoTexto').value.trim();

    if (!texto) {
        alert('Digite uma descrição da turma.');
        return;
    }

    if (texto.length < 10) {
        alert('A descrição deve ter pelo menos 10 caracteres.');
        return;
    }

    try {
        const res = await apiFetch('/api/descricao-turma', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ descricao: texto })
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || `Erro ${res.status}: ${res.statusText}`);
        }

        await loadDescricao();
        alert('Descrição salva com sucesso!');
    } catch (e) {
        console.error('Erro ao salvar descrição:', e);
        alert(`Erro: ${e.message}`);
    }
}

async function loadComments() {
    try {
        const res = await apiFetch('/api/comentarios', { admin: false });
        const comments = await res.json();
        const container = qs('comments-list');
        const counter = qs('comments-count');

        if (!Array.isArray(comments)) throw new Error('Erro ao processar lista');

        counter.textContent = `${comments.length} comentários`;

        if (!comments.length) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-comment-slash"></i><p>Nenhum comentário</p></div>';
            return;
        }

        container.innerHTML = comments.map((c) => `
            <div class="comment-item">
                <div class="item-main">
                    <strong class="item-title">${c.autor}</strong>
                    <small class="item-subtitle">${new Date(c.criado).toLocaleString()}</small>
                    <p class="item-text">${c.texto}</p>
                    ${c.is_pinned ? '<span class="admin-pin-badge"><i class="fas fa-thumbtack"></i> Fixado</span>' : ''}
                </div>
                <div class="admin-actions">
                    <button class="pin-btn" onclick="togglePin(${c.id})" title="Fixar comentário">
                        <i class="fas fa-thumbtack${c.is_pinned ? ' pinned' : ''}"></i>
                    </button>
                    <button class="delete-btn" onclick="deleteComment(${c.id})">
                        <i class="fas fa-trash"></i> Apagar
                    </button>
                </div>
            </div>
        `).join('');
    } catch (e) {
        qs('comments-list').innerHTML = '<p class="error-text">Erro ao carregar comentários</p>';
    }
}

window.deleteComment = async (id) => {
    if (!confirm('Apagar comentário?')) return;
    await apiFetch(`/api/comentarios/${id}`, { method: 'DELETE' });
    loadComments();
};

window.togglePin = async (id) => {
    if (!confirm('Fixar/desfixar comentário no topo?')) return;
    await apiFetch(`/api/comentarios/${id}/pin`, { method: 'PUT' });
    loadComments();
};

async function loadUsers() {
    try {
        const res = await apiFetch('/api/usuarios', { admin: false });
        if (!res.ok) throw new Error('Falha ao buscar usuários');

        const users = await res.json();
        const container = qs('users-list');
        const counter = qs('users-count');

        if (!Array.isArray(users)) throw new Error('Formato de dados inválido');

        counter.textContent = `${users.length} contas`;

        if (!users.length) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-user-slash"></i><p>Nenhum usuário cadastrado</p></div>';
            return;
        }

        container.innerHTML = users.map((u) => `
            <div class="user-item">
                <div class="item-main">
                    <strong class="item-title">${u.nome}</strong>
                    <small class="item-subtitle">ID: ${u.id} | Criado: ${u.created ? new Date(u.created).toLocaleString() : 'Data desconhecida'}</small>
                </div>
                ${PROTECTED_ACCOUNTS.includes(u.nome)
                    ? '<span class="protegido-badge"><i class="fas fa-shield-alt"></i> Protegido</span>'
                    : `<button class="delete-btn" onclick="deleteUser('${u.id}', '${u.nome.replace(/'/g, "\\'")}')"><i class="fas fa-user-times"></i> Apagar Conta</button>`}
            </div>
        `).join('');
    } catch (e) {
        console.error(e);
        qs('users-list').innerHTML = `<p class="error-text">Erro ao carregar contas: ${e.message}</p>`;
    }
}

window.deleteUser = async (id, nome) => {
    if (!confirm(`Apagar ${nome} e seus comentários? Esta ação não pode ser desfeita.`)) return;

    const res = await apiFetch('/api/usuarios', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, nome })
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(`Erro ao apagar usuário: ${data.error || res.statusText}`);
        return;
    }

    loadUsers();
};

async function loadGaleria(page = 0) {
    try {
        const res = await apiFetch(`/api/galeria?page=${page}&limit=${PAGE_SIZE}`, { admin: false });
        const response = await res.json();
        const imagens = response.data || [];
        const pagination = response.pagination || {};
        const container = qs('galeria-list');

        state.galeriaPage = pagination.page || 0;
        state.galeriaPagination = pagination;
        state.galeriaItems = imagens;

        if (!imagens.length) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-images"></i><p>Nenhuma imagem na galeria</p></div>';
            renderGaleriaPagination();
            return;
        }

        container.innerHTML = `
            <div class="admin-galeria-help">
                <i class="fas fa-arrows-up-down-left-right"></i>
                Arraste pelo ícone para mudar a ordem das imagens desta página.
            </div>
            <div id="galeriaSortableList" class="galeria-admin-list">
                ${imagens.map((img) => `
                    <div class="galeria-admin-item" data-id="${img.id}">
                        <div class="drag-handle" title="Arrastar para ordenar">
                            <i class="fas fa-grip-vertical"></i>
                        </div>
                        <div class="galeria-thumb">
                            ${img.url ? `<img src="${img.url}" alt="${img.titulo}">` : '<i class="fas fa-image"></i>'}
                        </div>
                        <div class="item-main">
                            <strong class="item-title">${img.titulo}</strong>
                            <small class="item-subtitle">Posição ${(img.position || 0)}${img.data ? ` • ${new Date(img.data).toLocaleDateString('pt-BR')}` : ''}</small>
                            <p class="item-text">${img.descricao}</p>
                        </div>
                        <div class="admin-actions">
                            <button class="edit-btn" onclick="abrirGaleriaModal('${img.id}')">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="delete-btn" onclick="deletarGaleria('${img.id}')">
                                <i class="fas fa-trash"></i> Apagar
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        initSortable();
        renderGaleriaPagination();
    } catch (e) {
        console.error(e);
        qs('galeria-list').innerHTML = '<p class="error-text">Erro ao carregar galeria</p>';
    }
}

window.loadGaleria = loadGaleria;

function renderGaleriaPagination() {
    let paginationBar = qs('adminGaleriaPagination');

    if (!paginationBar) {
        paginationBar = document.createElement('div');
        paginationBar.id = 'adminGaleriaPagination';
        paginationBar.className = 'admin-pagination';
        qs('tab-galeria').appendChild(paginationBar);
    }

    const { page = 0, totalPages = 0, hasNext = false, hasPrevious = false, total = 0 } = state.galeriaPagination;
    if (!total) {
        paginationBar.innerHTML = '';
        return;
    }

    paginationBar.innerHTML = `
        <button class="pagination-control" ${hasPrevious ? '' : 'disabled'} onclick="loadGaleria(${Math.max(0, page - 1)})">
            <i class="fas fa-arrow-left"></i> Anterior
        </button>
        <span class="pagination-info">Página ${page + 1}${totalPages ? ` de ${totalPages}` : ''} • ${total} imagem(ns)</span>
        <button class="pagination-control" ${hasNext ? '' : 'disabled'} onclick="loadGaleria(${page + 1})">
            Próxima <i class="fas fa-arrow-right"></i>
        </button>
    `;
}

function initSortable() {
    const list = qs('galeriaSortableList');
    if (!list) return;

    if (typeof Sortable === 'undefined') {
        console.warn('SortableJS não está disponível. A ordenação da galeria não funcionará.');
        return;
    }

    if (state.sortable) {
        state.sortable.destroy();
    }

    state.sortable = Sortable.create(list, {
        animation: 180,
        handle: '.drag-handle',
        draggable: '.galeria-admin-item',
        ghostClass: 'sortable-ghost',
        fallbackTolerance: 3,
        dragClass: 'sortable-drag',
        forceFallback: false,
        onEnd: async () => {
            const orderedIds = Array.from(list.querySelectorAll('.galeria-admin-item')).map((item) => Number(item.dataset.id));
            await apiFetch('/api/galeria/reorder', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderedIds })
            });
            await loadGaleria(state.galeriaPage);
        }
    });
}

window.abrirGaleriaModal = (id = null) => {
    state.editingGaleriaId = id;
    qs('galeriaModal').style.display = 'block';
    qs('galeriaForm').reset();
    qs('galeriaModalTitle').textContent = id ? 'Editar Imagem' : 'Nova Imagem';
    qs('previewContainer').style.display = 'none';
    qs('cropContainer').style.display = 'none';
    qs('galeriaFoto').value = '';
    qs('videoUrl').value = '';
    resetCropState();
    
    // Resetar para foto por padrão
    document.querySelector('input[name="tipoMidia"][value="photo"]').checked = true;
    onTipoMidiaChange();

    if (!id) return;

    const item = state.galeriaItems.find((img) => img.id === id);
    if (!item) return;

    qs('galeriaTitulo').value = item.titulo || '';
    qs('galeriaDescricao').value = item.descricao || '';
    qs('galeriaUrl').value = item.url || '';
    qs('galeriaData').value = item.data ? String(item.data).slice(0, 10) : '';
    
    // Se é vídeo, trocar tipo de mídia
    if (item.tipo_midia === 'video') {
        document.querySelector('input[name="tipoMidia"][value="video"]').checked = true;
        onTipoMidiaChange();
        qs('videoUrl').value = item.url || '';
    }

    if (item.url) {
        state.crop.finalDataUrl = item.url;
        qs('previewImagem').src = item.url;
        qs('previewContainer').style.display = 'block';
    }
};

window.fecharGaleriaModal = () => {
    qs('galeriaModal').style.display = 'none';
    state.editingGaleriaId = null;
    resetCropState();
    qs('galeriaForm').reset();
};

window.deletarGaleria = async (id) => {
    if (!confirm('Apagar esta imagem da galeria?')) return;

    const res = await apiFetch(`/api/galeria/${id}`, { method: 'DELETE' });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(`Erro ao apagar: ${data.error || res.statusText}`);
        return;
    }

    const nextPage = state.galeriaItems.length === 1 && state.galeriaPage > 0 ? state.galeriaPage - 1 : state.galeriaPage;
    await loadGaleria(nextPage);
};

async function loadCalendario() {
    try {
        const res = await apiFetch('/api/calendario', { admin: false });
        if (!res.ok) throw new Error(`Status ${res.status}`);

        const response = await res.json();
        const eventos = response.data || [];
        const container = qs('calendario-list');
        state.calendarioItems = eventos;

        const semana = getCurrentWeekDates();
        const eventosPorDia = eventos.reduce((acc, evento) => {
            const data = evento.data ? new Date(evento.data) : null;
            if (!data || isNaN(data.getTime())) return acc;
            const key = data.toISOString().slice(0, 10);
            if (!acc[key]) acc[key] = [];
            acc[key].push(evento);
            return acc;
        }, {});

        container.innerHTML = `
            <div class="calendar-week-grid">
                ${semana.map((dia) => {
                    const eventosDia = eventosPorDia[dia.iso] || [];
                    return `
                        <div class="weekday-card">
                            <div class="weekday-card-header">
                                <strong>${dia.label}</strong>
                                <span>${dia.formatted}</span>
                            </div>
                            <div class="weekday-card-body">
                                ${eventosDia.length > 0 ? eventosDia.map((evento) => `
                                    <div class="weekday-event-item">
                                        <div>
                                            <div class="event-title">${evento.titulo || 'Sem título'}</div>
                                            <div class="event-type">${evento.tipo || 'Aviso'}</div>
                                        </div>
                                        <div class="weekday-event-actions">
                                            <button class="edit-btn" onclick="abrirCalendarioModal('${evento.id}')"><i class="fas fa-edit"></i></button>
                                            <button class="delete-btn" onclick="deletarCalendario('${evento.id}')"><i class="fas fa-trash"></i></button>
                                        </div>
                                        <p class="event-description">${evento.descricao || ''}</p>
                                    </div>
                                `).join('') : `<div class="empty-day">Nenhum evento.</div>`}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        if (!eventos.length) {
            container.innerHTML = `
                <div class="calendar-week-grid">
                    ${semana.map((dia) => `
                        <div class="weekday-card">
                            <div class="weekday-card-header">
                                <strong>${dia.label}</strong>
                                <span>${dia.formatted}</span>
                            </div>
                            <div class="weekday-card-body">
                                <div class="empty-day">Nenhum evento.</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    } catch (e) {
        console.error('Erro ao carregar calendário:', e);
        qs('calendario-list').innerHTML = `<p class="error-text">Erro ao carregar calendário: ${e.message}</p>`;
    }
}

function getCurrentWeekDates() {
    const hoje = new Date();
    const diaSemana = hoje.getDay();
    const mondayOffset = diaSemana === 0 ? -6 : 1 - diaSemana;
    const monday = new Date(hoje);
    monday.setDate(hoje.getDate() + mondayOffset);

    const labels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
    return labels.map((label, index) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + index);
        return {
            label,
            date,
            iso: date.toISOString().slice(0, 10),
            formatted: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        };
    });
}

window.abrirCalendarioModal = (id = null) => {
    state.editingCalendarioId = id;
    qs('calendarioModal').style.display = 'block';
    qs('calendarioForm').reset();

    const hoje = new Date();
    const pad = (value) => String(value).padStart(2, '0');
    qs('calendarioData').value = `${hoje.getFullYear()}-${pad(hoje.getMonth() + 1)}-${pad(hoje.getDate())}`;
    qs('calendarioTipo').value = 'Aviso';

    if (!id) return;

    const item = state.calendarioItems.find((evento) => String(evento.id) === String(id));
    if (!item) return;

    qs('calendarioTitulo').value = item.titulo || '';
    qs('calendarioDescricao').value = item.descricao || '';
    qs('calendarioData').value = item.data ? String(item.data).slice(0, 10) : qs('calendarioData').value;
    qs('calendarioTipo').value = item.tipo || 'Aviso';
};

window.fecharCalendarioModal = () => {
    qs('calendarioModal').style.display = 'none';
    state.editingCalendarioId = null;
    qs('calendarioForm').reset();
};

async function salvarCalendario(e) {
    e.preventDefault();

    const titulo = qs('calendarioTitulo').value.trim();
    const descricao = qs('calendarioDescricao').value.trim();
    const data = qs('calendarioData').value;
    const tipo = qs('calendarioTipo').value;

    if (!titulo || !data) {
        alert('Título e data são obrigatórios.');
        return;
    }

    const endpoint = state.editingCalendarioId ? `/api/calendario/${state.editingCalendarioId}` : '/api/calendario';
    const method = state.editingCalendarioId ? 'PUT' : 'POST';

    const res = await apiFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, descricao, data, tipo })
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(`Erro ao salvar evento: ${data.error || res.statusText}`);
        return;
    }

    fecharCalendarioModal();
    await loadCalendario();
    alert(state.editingCalendarioId ? 'Evento atualizado com sucesso!' : 'Evento criado com sucesso!');
}

window.deletarCalendario = async (id) => {
    if (!confirm('Apagar este evento do calendário?')) return;

    const res = await apiFetch(`/api/calendario/${id}`, { method: 'DELETE' });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(`Erro ao apagar evento: ${data.error || res.statusText}`);
        return;
    }

    await loadCalendario();
};

async function salvarGaleria(e) {
    e.preventDefault();

    const tipoMidia = document.querySelector('input[name="tipoMidia"]:checked').value;
    const novaImagem = !state.editingGaleriaId;
    
    // Se é novo e foto, EXIGIR crop
    if (novaImagem && tipoMidia === 'photo' && !state.crop.finalDataUrl) {
        alert('Para adicionar uma nova foto, você deve: 1) Enviar a foto, 2) Ajustar zoom/posição, 3) Clicar em "Confirmar"');
        return;
    }

    // Se é novo e vídeo, EXIGIR upload ou URL
    const videoUrlValue = qs('videoUrl').value.trim();
    if (novaImagem && tipoMidia === 'video' && !state.crop.finalDataUrl && !videoUrlValue) {
        alert('Para adicionar um novo vídeo, você deve enviar o arquivo ou informar uma URL (YouTube, Vimeo, link direto, etc).');
        return;
    }

    // Mostrar loading
    const btnSalvar = document.querySelector('button[type="submit"]');
    const textoBtnOriginal = btnSalvar?.textContent;
    if (btnSalvar) {
        btnSalvar.disabled = true;
        btnSalvar.textContent = '⏳ Salvando...';
    }

    try {
        const titulo = qs('galeriaTitulo').value.trim();
        const descricao = qs('galeriaDescricao').value.trim();
        const data = qs('galeriaData').value || null;

        // Se é vídeo com arquivo (não URL), enviar  como FormData
        if (tipoMidia === 'video' && state.crop.finalDataUrl && !videoUrlValue) {
            await salvarVideoComUpload(titulo, descricao, data);
        } else {
            // Foto ou vídeo com URL - enviar como JSON
            await salvarMidiaJSON(state.crop.finalDataUrl || videoUrlValue, titulo, descricao, data, tipoMidia);
        }

        fecharGaleriaModal();
        await loadGaleria(state.galeriaPage);
        alert(state.editingGaleriaId ? 'Mídia atualizada com sucesso!' : 'Mídia criada com sucesso!');
    } catch (e) {
        console.error('Erro ao salvar mídia:', e);
        alert(`❌ Erro ao salvar: ${e.message}`);
    } finally {
        if (btnSalvar) {
            btnSalvar.disabled = false;
            btnSalvar.textContent = textoBtnOriginal;
        }
    }
}

async function salvarVideoComUpload(titulo, descricao, data) {
    // Usar o blob armazenado do arquivo original
    if (!state.crop.videoBlob) {
        throw new Error('Arquivo de vídeo não encontrado. Selecione novamente.');
    }

    const videoBlob = state.crop.videoBlob;
    
    // Criar FormData com o arquivo e metadados
    const formData = new FormData();
    formData.append('video', videoBlob);
    formData.append('titulo', titulo);
    formData.append('descricao', descricao);
    formData.append('data', data || '');
    formData.append('tipo_midia', 'video');

    // Enviar como FormData
    const res = await fetch('/api/galeria/video-upload', {
        method: 'POST',
        headers: {
            'x-admin-token': ADMIN_TOKEN
        },
        body: formData
    });

    if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = `Erro ${res.status}`;
        try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorMessage;
        } catch (e) {
            if (errorText.includes('521')) {
                errorMessage = 'Servidor do banco de dados está indisponível.';
            }
        }
        throw new Error(errorMessage);
    }

    return await res.json();
}

async function salvarMidiaJSON(url, titulo, descricao, data, tipoMidia) {
    const endpoint = state.editingGaleriaId ? `/api/galeria/${state.editingGaleriaId}` : '/api/galeria';
    const method = state.editingGaleriaId ? 'PUT' : 'POST';

    const payload = {
        titulo,
        descricao,
        url,
        data: data || null,
        tipo_midia: tipoMidia
    };

    if (!url) {
        throw new Error('Envie uma mídia ou informe uma URL.');
    }

    console.log('Enviando para:', endpoint, 'com tipo:', tipoMidia);
    
    const res = await apiFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = `Erro ${res.status}: ${res.statusText}`;
        try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorMessage;
        } catch (e) {
            if (errorText.includes('521') || errorText.includes('Web server is down')) {
                errorMessage = 'Servidor do banco de dados está indisponível. Tente novamente em alguns minutos.';
            }
        }
        throw new Error(errorMessage);
    }

    return await res.json();
}

function resetCropState() {
    state.crop = {
        image: null,
        imageLoaded: false,
        zoom: 1,
        minZoom: 1,
        maxZoom: 2.6,
        offsetX: 0,
        offsetY: 0,
        rotation: 0,
        dragStartX: 0,
        dragStartY: 0,
        dragging: false,
        finalDataUrl: state.crop?.finalDataUrl || '',
        videoBlob: null
    };
    qs('zoomSlider').value = 1;
}

function onFileSelected(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const tipoMidia = document.querySelector('input[name="tipoMidia"]:checked').value;

    if (tipoMidia === 'video') {
        // Processamento de vídeo
        if (!file.type.startsWith('video/')) {
            alert('Selecione um arquivo de vídeo válido.');
            return;
        }

        const maxSize = 800 * 1024 * 1024; // 800MB
        if (file.size > maxSize) {
            alert('Arquivo muito grande. Máximo 800MB.');
            return;
        }

        // Armazenar o blob para upload
        state.crop.videoBlob = file;
        
        const reader = new FileReader();
        reader.onload = () => {
            state.crop.finalDataUrl = reader.result;
            const container = qs('previewContainer');
            container.innerHTML = '<label>Preview final:</label>';
            const preview = document.createElement('video');
            preview.src = reader.result;
            preview.controls = true;
            preview.style.maxWidth = '100%';
            preview.style.maxHeight = '300px';
            preview.style.borderRadius = '8px';
            preview.style.backgroundColor = '#000';
            container.appendChild(preview);
            container.style.display = 'block';
            qs('cropContainer').style.display = 'none';
        };
        reader.readAsDataURL(file);
    } else {
        // Processamento de imagem
        if (!file.type.startsWith('image/')) {
            alert('Selecione um arquivo de imagem válido.');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const image = new Image();
            image.onload = () => {
                state.crop.image = image;
                state.crop.imageLoaded = true;
                state.crop.rotation = 0;
                state.crop.finalDataUrl = '';
                prepareCropInitialState();
                qs('cropContainer').style.display = 'block';
                qs('previewContainer').style.display = 'none';
                drawCrop();
            };
            image.src = reader.result;
        };
        reader.readAsDataURL(file);
    }
}

function prepareCropInitialState() {
    const image = state.crop.image;
    const baseScale = Math.max(CROP_SIZE / image.width, CROP_SIZE / image.height);

    state.crop.minZoom = 1;
    state.crop.maxZoom = 2.6;
    state.crop.zoom = 1.04;
    state.crop.baseScale = baseScale;
    state.crop.offsetX = 0;
    state.crop.offsetY = 0;
    qs('zoomSlider').min = state.crop.minZoom;
    qs('zoomSlider').max = state.crop.maxZoom;
    qs('zoomSlider').value = state.crop.zoom;
    clampCropOffsets();
}

function getEventPoint(event) {
    if (event.touches?.length) {
        return { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }
    return { x: event.clientX, y: event.clientY };
}

function startDrag(event) {
    if (!state.crop.imageLoaded) return;
    event.preventDefault();
    const point = getEventPoint(event);
    state.crop.dragging = true;
    state.crop.dragStartX = point.x - state.crop.offsetX;
    state.crop.dragStartY = point.y - state.crop.offsetY;
}

function onDrag(event) {
    if (!state.crop.dragging || !state.crop.imageLoaded) return;
    event.preventDefault();
    const point = getEventPoint(event);
    state.crop.offsetX = point.x - state.crop.dragStartX;
    state.crop.offsetY = point.y - state.crop.dragStartY;
    clampCropOffsets();
    drawCrop();
}

function endDrag() {
    state.crop.dragging = false;
}

function onZoomChange(event) {
    if (!state.crop.imageLoaded) return;
    state.crop.zoom = Number(event.target.value);
    clampCropOffsets();
    drawCrop();
}

function getCropMetrics() {
    const image = state.crop.image;
    const radians = (state.crop.rotation * Math.PI) / 180;
    const rotated = Math.abs(Math.sin(radians)) > 0.5;
    const sourceWidth = rotated ? image.height : image.width;
    const sourceHeight = rotated ? image.width : image.height;
    const scale = state.crop.baseScale * state.crop.zoom;
    return { radians, scale, sourceWidth, sourceHeight };
}

function clampCropOffsets() {
    if (!state.crop.imageLoaded) return;
    const { scale, sourceWidth, sourceHeight } = getCropMetrics();

    const renderedWidth = sourceWidth * scale;
    const renderedHeight = sourceHeight * scale;
    const maxOffsetX = Math.max(0, (renderedWidth - CROP_SIZE) / 2);
    const maxOffsetY = Math.max(0, (renderedHeight - CROP_SIZE) / 2);

    state.crop.offsetX = Math.min(maxOffsetX, Math.max(-maxOffsetX, state.crop.offsetX));
    state.crop.offsetY = Math.min(maxOffsetY, Math.max(-maxOffsetY, state.crop.offsetY));
}

function drawCrop() {
    if (!state.crop.imageLoaded) return;

    const canvas = qs('cropCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = CROP_SIZE;
    canvas.height = CROP_SIZE;

    const { radians, scale } = getCropMetrics();

    ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, CROP_SIZE, CROP_SIZE);

    ctx.save();
    ctx.translate(CROP_SIZE / 2 + state.crop.offsetX, CROP_SIZE / 2 + state.crop.offsetY);
    ctx.rotate(radians);
    ctx.scale(scale, scale);
    ctx.drawImage(state.crop.image, -state.crop.image.width / 2, -state.crop.image.height / 2);
    ctx.restore();

    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, CROP_SIZE - 2, CROP_SIZE - 2);
}

window.rotarImagem = (angle = 90) => {
    if (!state.crop.imageLoaded) return;
    state.crop.rotation = (state.crop.rotation + angle + 360) % 360;
    prepareCropInitialState();
    drawCrop();
};

window.resetarPosicao = () => {
    if (!state.crop.imageLoaded) return;
    prepareCropInitialState();
    drawCrop();
};

window.confirmarCrop = () => {
    if (!state.crop.imageLoaded) return;
    state.crop.finalDataUrl = qs('cropCanvas').toDataURL('image/jpeg', 0.9);
    qs('previewImagem').src = state.crop.finalDataUrl;
    qs('previewContainer').style.display = 'block';
    qs('cropContainer').style.display = 'none';
    qs('galeriaUrl').value = '';
};

window.cancelarCrop = () => {
    qs('cropContainer').style.display = 'none';
    qs('galeriaFoto').value = '';
    resetCropState();
};

async function loadContent() {
    await Promise.all([
        loadComments(),
        loadUsers(),
        loadGaleria(state.galeriaPage),
        loadDescricao(),
        loadCalendario(),
        loadLogs()
    ]);
}

// ============ LOGS FUNCTIONS ============

let allLogs = [];
let currentFilteredLogs = [];

async function loadLogs() {
    try {
        const res = await apiFetch('/api/logs');
        if (!res.ok) throw new Error(`Status ${res.status}`);
        
        allLogs = await res.json();
        if (!Array.isArray(allLogs)) allLogs = [];
        
        displayLogs(allLogs);
        updateLogsStats();
    } catch (e) {
        console.error('Erro ao carregar logs:', e);
        const container = qs('logs-list');
        if (container) {
            container.innerHTML = `
                <div class="logs-empty">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Erro ao carregar logs ou nenhum log disponível</p>
                </div>
            `;
        }
    }
}

function displayLogs(logs) {
    const container = qs('logs-list');
    const pagination = qs('logs-pagination');
    if (!container || !pagination) return;

    if (!logs || logs.length === 0) {
        container.innerHTML = `
            <div class="logs-empty">
                <i class="fas fa-history"></i>
                <p>Nenhum log encontrado</p>
            </div>
        `;
        pagination.style.display = 'none';
        return;
    }

    // Store filtered logs for pagination
    currentFilteredLogs = logs;
    
    // Calculate pagination
    const totalPages = Math.ceil(logs.length / LOGS_PAGE_SIZE);
    const startIndex = state.logsPage * LOGS_PAGE_SIZE;
    const endIndex = Math.min(startIndex + LOGS_PAGE_SIZE, logs.length);
    const paginatedLogs = logs.slice(startIndex, endIndex);

    // Display paginated logs
    container.innerHTML = paginatedLogs.map(log => `
        <div class="log-item">
            <div class="log-item-icon ${getLogIconClass(log.categoria)}">
                <i class="fas fa-${getLogIcon(log.categoria)}"></i>
            </div>
            <div class="log-item-main">
                <div class="log-header">
                    <span class="log-action">${escapeHtml(log.subcategoria || log.categoria || 'Atividade')}</span>
                    <span class="log-action-type ${getLogCategoryClass(log.categoria)}">
                        ${escapeHtml(log.categoria || 'LOG')}
                    </span>
                </div>
                <div class="log-timestamp">
                    <i class="fas fa-clock"></i>
                    ${formatarData(log.timestamp || new Date().toISOString())}
                </div>
                ${log.detalhes ? `
                <div class="log-details">
                    <i class="fas fa-info-circle"></i> ${escapeHtml(log.detalhes)}
                </div>
                ` : ''}
            </div>
        </div>
    `).join('');

    // Update pagination controls
    const prevBtn = qs('logs-prev');
    const nextBtn = qs('logs-next');
    const currentPageSpan = qs('logs-current-page');
    const totalPagesSpan = qs('logs-total-pages');

    if (prevBtn) prevBtn.disabled = state.logsPage === 0;
    if (nextBtn) nextBtn.disabled = state.logsPage >= totalPages - 1;
    if (currentPageSpan) currentPageSpan.textContent = state.logsPage + 1;
    if (totalPagesSpan) totalPagesSpan.textContent = totalPages;
    
    // Show pagination only if there's more than one page
    pagination.style.display = totalPages > 1 ? 'flex' : 'none';
}

function getLogIcon(categoria) {
    const icons = {
        'CONTAS': 'users',
        'ATUALIZAÇÕES': 'upload',
        'GALERIA': 'images',
        'COMENTÁRIOS': 'comments'
    };
    return icons[categoria?.toUpperCase()] || 'history';
}

function getLogIconClass(categoria) {
    const classes = {
        'CONTAS': 'create',
        'ATUALIZAÇÕES': 'update',
        'GALERIA': 'update',
        'COMENTÁRIOS': 'delete'
    };
    return classes[categoria?.toUpperCase()] || 'view';
}

function getLogCategoryClass(categoria) {
    const classes = {
        'CONTAS': 'create',
        'ATUALIZAÇÕES': 'update',
        'GALERIA': 'update',
        'COMENTÁRIOS': 'delete'
    };
    return classes[categoria?.toUpperCase()] || 'view';
}

function formatarData(timestamp) {
    try {
        const data = new Date(timestamp);
        const agora = new Date();
        const diferenca = agora - data;
        const minutos = Math.floor(diferenca / 60000);
        const horas = Math.floor(diferenca / 3600000);
        const dias = Math.floor(diferenca / 86400000);

        if (minutos < 1) return 'Agora mesmo';
        if (minutos < 60) return `${minutos}m atrás`;
        if (horas < 24) return `${horas}h atrás`;
        if (dias < 7) return `${dias}d atrás`;

        return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return 'Data inválida';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function filterLogs(tab = 'logs') {
    // Reset pagination when filtering
    state.logsPage = 0;

    // Pegar categorias selecionadas (apenas para a tab logs)
    let selectedCategories = ['CONTAS', 'COMENTÁRIOS']; // Default para tab logs
    
    if (tab === 'logs') {
        // Usar checkboxes selecionados para logs
        selectedCategories = Array.from(document.querySelectorAll('.filter-checkbox:checked'))
            .map(cb => cb.value);
    } else if (tab === 'atualizacoes') {
        // Apenas ATUALIZAÇÕES para tab atualizacoes
        selectedCategories = ['ATUALIZAÇÕES'];
    }
    
    const detalhes = tab === 'logs' ? (qs('filterDetalhes')?.value.toLowerCase() || '') : '';

    const filtered = allLogs.filter(log => {
        const matchCategoria = selectedCategories.includes(log.categoria);
        const matchDetalhes = !detalhes || (log.detalhes || '').toLowerCase().includes(detalhes);
        return matchCategoria && matchDetalhes;
    });

    // Exibir logs na tab apropriada
    if (tab === 'logs') {
        displayLogs(filtered);
    } else if (tab === 'atualizacoes') {
        displayAtualizacoesLogs(filtered);
    } else {
        displayLogs(filtered);
    }
}

async function clearLogs() {
    if (!confirm('Tem certeza que deseja limpar TODOS os logs? Esta ação não pode ser desfeita.')) {
        return;
    }

    if (!confirm('CONFIRMAR: Deseja realmente deletar todos os logs?')) {
        return;
    }

    try {
        const res = await apiFetch('/api/logs', {
            method: 'DELETE'
        });

        if (!res.ok) throw new Error(`Status ${res.status}`);

        allLogs = [];
        await loadLogs();
        alert('Todos os logs foram deletados com sucesso!');
    } catch (e) {
        console.error('Erro ao deletar logs:', e);
        alert(`Erro ao deletar logs: ${e.message}`);
    }
}

function exportLogs() {
    if (allLogs.length === 0) {
        alert('Não há logs para exportar');
        return;
    }

    // Criar CSV
    const headers = ['Data', 'Categoria', 'Tipo', 'Detalhes'];
    const rows = allLogs.map(log => [
        formatarData(log.timestamp),
        log.categoria || '',
        log.subcategoria || '',
        log.detalhes || ''
    ]);

    let csv = headers.join(',') + '\n';
    csv += rows.map(row => 
        row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`)
        .join(',')
    ).join('\n');

    // Fazer download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function updateLogsStats() {
    // Placeholder para futuras estatísticas de logs
    // Pode ser expandido para mostrar gráficos ou resumos
}

function displayAtualizacoesLogs(logs) {
    const container = qs('atualizacoes-list');
    if (!container) return;

    if (!logs || logs.length === 0) {
        container.innerHTML = `
            <div class="logs-empty">
                <i class="fas fa-sync-alt"></i>
                <p>Nenhuma atualização registrada</p>
            </div>
        `;
        return;
    }

    const userRole = localStorage.getItem('userRole');
    const canDelete = userRole === 'dev';

    container.innerHTML = logs.map((log, index) => `
        <div class="log-item">
            <div class="log-item-icon ${getLogIconClass(log.categoria)}">
                <i class="fas fa-${getLogIcon(log.categoria)}"></i>
            </div>
            <div class="log-item-main">
                <div class="log-header">
                    <span class="log-action">${escapeHtml(log.subcategoria || log.categoria || 'Atualização')}</span>
                    <span class="log-action-type ${getLogCategoryClass(log.categoria)}">
                        ${escapeHtml(log.categoria || 'LOG')}
                    </span>
                </div>
                <div class="log-timestamp">
                    <i class="fas fa-clock"></i>
                    ${formatarData(log.timestamp || new Date().toISOString())}
                </div>
                ${log.detalhes ? `
                <div class="log-details">
                    <i class="fas fa-info-circle"></i> ${escapeHtml(log.detalhes)}
                </div>
                ` : ''}
                ${canDelete ? `
                <div class="log-actions">
                    <button class="btn-delete-update" onclick="deletarAtualizacao(${index}, '${escapeHtml(log.id || log.subcategoria)}')">
                        <i class="fas fa-trash"></i> Deletar
                    </button>
                </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

async function clearAtualizacoesLogs() {
    // Apenas desenvolvedores podem limpar atualizações
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'dev') {
        alert('Apenas desenvolvedores podem limpar atualizações');
        return;
    }

    if (!confirm('Tem certeza que deseja limpar TODAS as atualizações? Esta ação não pode ser desfeita.')) {
        return;
    }

    if (!confirm('CONFIRMAR: Deseja realmente deletar todas as atualizações?')) {
        return;
    }

    try {
        const res = await apiFetch('/api/logs', {
            method: 'DELETE'
        });

        if (!res.ok) throw new Error(`Status ${res.status}`);

        allLogs = [];
        await loadLogs();
        alert('Todas as atualizações foram deletadas com sucesso!');
    } catch (e) {
        console.error('Erro ao deletar atualizações:', e);
        alert(`Erro ao deletar atualizações: ${e.message}`);
    }
}

function exportAtualizacoesLogs() {
    // Apenas desenvolvedores podem exportar atualizações
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'dev') {
        alert('Apenas desenvolvedores podem exportar atualizações');
        return;
    }

    const atualizacoes = allLogs.filter(log => log.categoria === 'ATUALIZAÇÕES');
    
    if (atualizacoes.length === 0) {
        alert('Não há atualizações para exportar');
        return;
    }

    // Criar CSV
    const headers = ['Data', 'Categoria', 'Tipo', 'Detalhes'];
    const rows = atualizacoes.map(log => [
        formatarData(log.timestamp),
        log.categoria || '',
        log.subcategoria || '',
        log.detalhes || ''
    ]);

    let csv = headers.join(',') + '\n';
    csv += rows.map(row => 
        row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`)
        .join(',')
    ).join('\n');

    // Fazer download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `atualizacoes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function publicarAtualizacao() {
    // Verificar se é desenvolvedor
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'dev') {
        alert('Apenas desenvolvedores podem publicar atualizações');
        return;
    }

    const titulo = qs('atualizacaoTitulo')?.value?.trim();
    const texto = qs('atualizacaoTexto')?.value?.trim();

    if (!titulo || titulo.length < 3) {
        alert('Título deve ter pelo menos 3 caracteres');
        return;
    }

    if (!texto || texto.length < 10) {
        alert('Mensagem deve ter pelo menos 10 caracteres');
        return;
    }

    try {
        // Log de atualização do sistema
        const res = await window.addLog('ATUALIZAÇÕES', titulo, texto);
        
        if (res !== false) {
            alert('Atualização publicada com sucesso!');
            // Limpar formulário
            qs('atualizacaoForm').reset();
            qs('charCount').textContent = '0';
            // Recarregar atualizações
            await loadLogs();
            filterLogs('atualizacoes');
        } else {
            alert('Erro ao publicar atualização');
        }
    } catch (e) {
        console.error('Erro ao publicar atualização:', e);
        alert(`Erro: ${e.message}`);
    }
}

async function deletarAtualizacao(index, updateId) {
    // Verificar se é desenvolvedor
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'dev') {
        alert('Apenas desenvolvedores podem deletar atualizações');
        return;
    }

    if (!confirm('Tem certeza que deseja deletar esta atualização?')) {
        return;
    }

    try {
        // Encontrar o log para deletar
        const logsAttualizacoes = allLogs.filter(log => log.categoria === 'ATUALIZAÇÕES');
        if (index >= 0 && index < logsAttualizacoes.length) {
            const logToDelete = logsAttualizacoes[index];
            
            // Chamar API para deletar (se existir)
            if (window.deleteLog && typeof window.deleteLog === 'function') {
                const res = await window.deleteLog(logToDelete.id || updateId);
                if (res !== false) {
                    alert('Atualização deletada com sucesso!');
                    // Recarregar
                    await loadLogs();
                    filterLogs('atualizacoes');
                    return;
                }
            }
            
            // Fallback: remover localmente e salvar
            allLogs = allLogs.filter(log => log !== logToDelete);
            alert('Atualização deletada com sucesso!');
            displayAtualizacoesLogs(logsAttualizacoes.filter((_, i) => i !== index));
        }
    } catch (e) {
        console.error('Erro ao deletar atualização:', e);
        alert(`Erro ao deletar: ${e.message}`);
    }
}

window.addLog = async function(categoria, subcategoria, detalhes = '') {
    try {
        const res = await apiFetch('/api/logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                categoria: categoria,
                subcategoria: subcategoria,
                detalhes: detalhes,
                timestamp: new Date().toISOString()
            })
        });

        if (!res.ok) {
            console.warn('Erro ao adicionar log:', res.status);
            return false;
        }
        return true;
    } catch (e) {
        console.error('Erro ao adicionar log:', e);
        return false;
    }
};

window.deleteLog = async function(logId) {
    try {
        const res = await apiFetch(`/api/logs/${logId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!res.ok) {
            console.warn('Erro ao deletar log:', res.status);
            return false;
        }
        return true;
    } catch (e) {
        console.error('Erro ao deletar log:', e);
        return false;
    }
};

// ===== FUNÇÕES DE BANCO DE DADOS =====

async function loadDatabase() {
    try {
        const container = qs('database-content');
        container.innerHTML = '<div style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #3b82f6;"></i><p>Carregando tabelas...</p></div>';

        // Buscar lista de tabelas
        const tablesRes = await apiFetch('/api/database/tables');
        if (!tablesRes.ok) throw new Error('Erro ao buscar tabelas');
        
        const { tables } = await tablesRes.json();
        const isDev = localStorage.getItem('userRole') === 'dev';

        // Buscar dados de cada tabela
        const tablesData = [];
        for (const table of tables) {
            try {
                const res = await apiFetch(`/api/database/table/${table}?limit=10&offset=0`);
                if (res.ok) {
                    const data = await res.json();
                    tablesData.push(data);
                }
            } catch (e) {
                console.warn(`Erro ao buscar dados de ${table}:`, e);
            }
        }

        // Renderizar tabelas
        if (tablesData.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #94a3b8;"><i class="fas fa-database"></i><p>Nenhuma tabela encontrada</p></div>';
            return;
        }

        container.innerHTML = tablesData.map(tableData => `
            <div class="database-table-card">
                <div class="database-table-header">
                    <div>
                        <h3>${tableData.tableName}</h3>
                        <span class="table-record-count">${tableData.total} registros</span>
                    </div>
                    ${isDev ? `<button class="btn-clear-table" onclick="clearDatabaseTable('${tableData.tableName}')"><i class="fas fa-broom"></i> Limpar tabela</button>` : ''}
                </div>
                <div class="database-table-wrap">
                    <table class="database-table">
                        <thead>
                            <tr>
                                ${tableData.data.length > 0 ? Object.keys(tableData.data[0]).map(key => `
                                    <th>
                                        <div class="table-header-cell">
                                            <span>${key}</span>
                                            ${isDev && key !== 'id' ? `<button class="column-action-btn" onclick="clearDatabaseColumn('${tableData.tableName}', '${key}')" title="Limpar coluna ${key}"><i class="fas fa-trash-alt"></i></button>` : ''}
                                        </div>
                                    </th>
                                `).join('') : '<th>Sem dados</th>'}
                                ${isDev ? '<th>Ações</th>' : ''}
                            </tr>
                        </thead>
                        <tbody>
                            ${tableData.data.length > 0 ? tableData.data.map((row, idx) => `
                                <tr class="${idx % 2 === 0 ? 'even-row' : 'odd-row'}">
                                    ${Object.keys(row).map((key, colIdx) => {
                                        const val = row[key];
                                        const isPasswordField = key.toLowerCase().includes('senha') || key.toLowerCase().includes('password');
                                        const displayVal = typeof val === 'object' ? JSON.stringify(val).substring(0, 50) : String(val);
                                        if (isPasswordField && val) {
                                            const inputId = `password-${tableData.tableName}-${idx}-${colIdx}`;
                                            return `
                                                <td class="password-cell">
                                                    <div class="password-cell-inner">
                                                        <input type="password" id="${inputId}" value="${displayVal}" readonly>
                                                        <button class="toggle-password-btn" onclick="togglePasswordVisibility('${inputId}')" title="Mostrar/ocultar senha">
                                                            <i class="fas fa-eye"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            `;
                                        }
                                        return `
                                            <td>${displayVal}</td>
                                        `;
                                    }).join('')}
                                    ${isDev ? `<td class="table-actions-cell"><button class="btn-delete-row" onclick="deleteDatabaseRow('${tableData.tableName}', '${row.id ?? ''}')"><i class="fas fa-trash-alt"></i> Excluir</button></td>` : ''}
                                </tr>
                            `).join('') : '<tr><td colspan="100%" class="empty-table-text">Tabela vazia</td></tr>'}
                        </tbody>
                    </table>
                </div>
                ${tableData.total > 10 ? `
                    <div class="table-footer">
                        Mostrando 10 de ${tableData.total} registros
                    </div>
                ` : ''}
            </div>
        `).join('');

    } catch (e) {
        console.error('Erro ao carregar database:', e);
        qs('database-content').innerHTML = `<div style="padding: 2rem; background: rgba(239,68,68,0.1); border-radius: 12px; color: #fca5a5;"><i class="fas fa-exclamation-triangle"></i> Erro ao carregar: ${e.message}</div>`;
    }
}

window.deleteDatabaseRow = async (tableName, rowId) => {
    if (!rowId) {
        alert('Não foi possível excluir: registro sem ID.');
        return;
    }
    if (!confirm(`Tem certeza que deseja excluir o registro ${rowId} da tabela ${tableName}?`)) return;

    try {
        const res = await apiFetch(`/api/database/table/${tableName}/row/${rowId}`, { method: 'DELETE' });
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || `Erro ${res.status}`);
        }
        alert('Registro excluído com sucesso.');
        loadDatabase();
    } catch (e) {
        console.error('Erro ao excluir registro:', e);
        alert(`Erro ao excluir registro: ${e.message}`);
    }
};

window.clearDatabaseColumn = async (tableName, columnName) => {
    if (!confirm(`Tem certeza que deseja limpar todos os valores da coluna ${columnName} na tabela ${tableName}? Esta ação não pode ser desfeita.`)) return;

    try {
        const res = await apiFetch(`/api/database/table/${tableName}/column/${columnName}`, { method: 'DELETE' });
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || `Erro ${res.status}`);
        }
        alert(`Coluna ${columnName} limpa com sucesso.`);
        loadDatabase();
    } catch (e) {
        console.error('Erro ao limpar coluna:', e);
        alert(`Erro ao limpar coluna: ${e.message}`);
    }
};

window.clearDatabaseTable = async (tableName) => {
    if (!confirm(`Tem certeza que deseja limpar todos os registros da tabela ${tableName}? Esta ação não pode ser desfeita.`)) return;

    try {
        const res = await apiFetch(`/api/database/table/${tableName}/clear`, { method: 'DELETE' });
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || `Erro ${res.status}`);
        }
        alert(`Tabela ${tableName} limpa com sucesso.`);
        loadDatabase();
    } catch (e) {
        console.error('Erro ao limpar tabela:', e);
        alert(`Erro ao limpar tabela: ${e.message}`);
    }
};

setInterval(() => {
    if (localStorage.getItem('adminLoggedIn') === 'true') {
        loadContent();
    }
}, 10000);
