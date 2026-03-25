// Admin JS - Login + Navegação + Gerenciamento Completo
const ADMIN_USER = 'administrador_turma205-1';
const ADMIN_PASS = 'administrador_turma205-1';
const ADMIN_TOKEN = 'turma205-admin';

// ===== VERIFICAÇÃO DE SESSÃO AO INICIAR =====
window.onload = () => {
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    if (isLoggedIn === 'true') {
        showAdminPanel();
    }
};

// ===== LOGIN =====
document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('adminUser').value;
    const pass = document.getElementById('adminPass').value;
    
    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        localStorage.setItem('adminLoggedIn', 'true'); // Salva o login
        showAdminPanel();
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
});

function showAdminPanel() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'flex'; // Flex para manter o layout
    loadContent();
}

// Logout
document.getElementById('logoutBtn').onclick = () => {
    localStorage.removeItem('adminLoggedIn'); // Remove a sessão
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'block';
    document.getElementById('adminLoginForm').reset();
};

// ===== NAVEGAÇÃO =====
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelector('.nav-btn.active').classList.remove('active');
        btn.classList.add('active');
        
        document.querySelector('.tab-content.active').classList.remove('active');
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    };
});

// ===== COMENTÁRIOS =====
async function loadComments() {
    try {
        const res = await fetch('/api/comentarios');
        const comments = await res.json();
        const container = document.getElementById('comments-list');
        const counter = document.getElementById('comments-count');
        
        if (!Array.isArray(comments)) throw new Error('Erro ao processar lista');

        if (comments.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 3rem; color: var(--text-muted);"><i class="fas fa-comment-slash" style="font-size: 4rem;"></i><p>Nenhum comentário</p></div>';
        } else {
            container.innerHTML = comments.map(c => `
                <div class="comment-item">
                    <div>
                        <strong style="color: #3b82f6;">${c.autor}</strong>
                        <br><small style="color: var(--text-muted);">${new Date(c.criado).toLocaleString()}</small>
                        <p style="margin-top: 0.5rem; color: #1e293b;">${c.texto}</p>
                    </div>
                    <button class="delete-btn" onclick="deleteComment(${c.id})">
                        <i class="fas fa-trash"></i> Apagar
                    </button>
                </div>
            `).join('');
        }
        counter.textContent = `${comments.length} comentários`;
    } catch (e) {
        document.getElementById('comments-list').innerHTML = '<p style="color: #f87171; text-align: center;">Erro ao carregar comentários</p>';
    }
}

window.deleteComment = async (id) => {
    if (confirm('Apagar comentário?')) {
        await fetch(`/api/comentarios/${id}`, {
            method: 'DELETE',
            headers: { 'x-admin-token': ADMIN_TOKEN }
        });
        loadComments();
    }
};

document.getElementById('refresh-comments').onclick = loadComments;

// ===== CONTAS =====
async function loadUsers() {
    try {
        const res = await fetch('/api/usuarios');
        
        if (!res.ok) throw new Error('Falha ao buscar usuários');

        const users = await res.json();
        const container = document.getElementById('users-list');
        const counter = document.getElementById('users-count');
        
        if (!Array.isArray(users)) throw new Error('Formato de dados inválido');

        if (users.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 3rem; color: var(--text-muted);"><i class="fas fa-user-slash" style="font-size: 4rem;"></i><p>Nenhum usuário cadastrado</p></div>';
        } else {
            container.innerHTML = users.map(u => `
                <div class="user-item">
                    <div>
                        <strong style="color: #3b82f6;">${u.nome}</strong>
                        <br><small style="color: var(--text-muted);">ID: ${u.id} | Criado: ${u.created ? new Date(u.created).toLocaleString() : 'Data desconhecida'}</small>
                    </div>
                    ${u.nome === 'administrador_turma205-1' 
                        ? '<span style="color: #64748b; font-weight: 600; background: #e2e8f0; padding: 0.5rem 1rem; border-radius: 8px;"><i class="fas fa-shield-alt"></i> Protegido</span>'
                        : `<button class="delete-btn" onclick="deleteUser(${u.id}, '${u.nome.replace(/'/g, "\\'")}')">
                               <i class="fas fa-user-times"></i> Apagar Conta
                           </button>`}
                </div>
            `).join('');
        }
        counter.textContent = `${users.length} contas`;
    } catch (e) {
        console.error(e);
        document.getElementById('users-list').innerHTML = `<p style="color: #f87171; text-align: center;">Erro ao carregar contas: ${e.message}</p>`;
    }
}

window.deleteUser = async (id, nome) => {
    if (confirm(`Apagar ${nome} e seus comentários? Esta ação não pode ser desfeita!`)) {
        await fetch('/api/usuarios', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, nome })
        });
        loadUsers();
    }
};

// Load inicial
async function loadContent() {
    loadComments();
    loadUsers();
}

// Auto-refresh a cada 30s
setInterval(loadContent, 30000);
