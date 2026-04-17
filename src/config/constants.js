// ========== CONSTANTES DO PROJETO ==========

export const PORT = process.env.PORT || 6767;
export const NODE_ENV = process.env.NODE_ENV || 'development';

// Galeria
export const GALERIA_PAGE_SIZE = 5;

// Autenticação
export const ADMIN_TOKEN = 'turma205-admin';
export const DEV_TOKEN = 'turma205-dev';
export const ROOT_TOKEN = 'turma205-root';

// Contas protegidas (não podem ser criadas/renomeadas/deletadas via API)
export const PROTECTED_ACCOUNTS = [
    'administrador_turma205-1',
    'aluno205-1',
    'dev205-1'
];

// Limite de comentários por usuário
export const MAX_ROOT_COMMENTS = 2;
export const MAX_COMMENT_LENGTH = 120;
export const MAX_GALLERY_COMMENT_LENGTH = 100;

// Palavrões proibidos
export const PROFANITY_WORDS = [
    'puta', 'merda', 'caralho', 'bosta', 'cu', 
    'fuck', 'shit', 'ass', 'damn'
];

// Emojis válidos para reações
export const VALID_EMOJIS = ['👍', '❤️', '👎'];

// Rotas da API
export const API_ROUTES = {
    AUTH: '/api/auth',
    USUARIOS: '/api/usuarios',
    CALENDARIO: '/api/calendario',
    GALERIA: '/api/galeria',
    COMENTARIOS: '/api/comentarios',
    ADMIN: '/api/admin',
    LOGS: '/api/logs',
    HEALTH: '/api/health'
};
