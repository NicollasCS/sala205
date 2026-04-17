/**
 * 🛡️ Funções auxiliares para API
 * Contém validações, filtros e utilitários reutilizáveis
 */

const palavroesProibidos = ['puta', 'merda', 'caralho', 'bosta', 'cu', 'fuck', 'shit', 'ass', 'damn'];

/**
 * Verifica se um texto contém palavrões
 */
function isProfane(text) {
    const lower = String(text || '').toLowerCase();
    return palavroesProibidos.some(word => lower.includes(word));
}

/**
 * Verifica se requisição tem token admin
 */
function isAdminToken(req) {
    const token = req.headers['x-admin-token'];
    return token === 'turma205-admin' || token === 'turma205-dev';
}

/**
 * Verifica se requisição tem token dev
 */
function isDevToken(req) {
    const token = req.headers['x-admin-token'];
    return token === 'turma205-dev';
}

/**
 * Verifica se requisição tem token root admin (super admin)
 */
function isRootAdminToken(req) {
    return req.headers['x-root-token'] === 'turma205-root' || 
           req.headers['x-admin-token'] === 'turma205-root';
}

/**
 * Normaliza descrição: remove espaços em branco e normaliza quebras de linha
 */
function normalizeDescricao(value) {
    return String(value || '')
        .replace(/\r\n/g, '\n')
        .split('\n')
        .map((line) => line.trim())
        .filter(line => line.length > 0)
        .join('\n')
        .trim();
}

/**
 * Normaliza dados do usuário adicionando campos de role
 */
function normalizeUser(user) {
    if (!user) return null;
    const role = user.role || (user.is_admin ? 'admin' : 'user');
    const is_admin = user.nome === 'administrador_turma205-1' || role === 'admin' || role === 'root' || user.is_admin;
    const is_root = user.nome === 'administrador_turma205-1' || role === 'root';
    return {
        id: user.id,
        nome: user.nome,
        role,
        is_admin,
        is_root
    };
}

export { isProfane, isAdminToken, isDevToken, isRootAdminToken, normalizeDescricao, normalizeUser };
