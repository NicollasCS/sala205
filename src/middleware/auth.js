import { ADMIN_TOKEN, DEV_TOKEN, ROOT_TOKEN } from '../config/constants.js';
import { validateAdminSession } from '../controllers/authController.js';

// ========== MIDDLEWARES DE AUTENTICAÇÃO ==========

/**
 * Verificar se tem token admin ou dev
 */
export function isAdminToken(req) {
    const token = req.headers['x-admin-token'];
    return token === ADMIN_TOKEN || token === DEV_TOKEN;
}

/**
 * Verificar se tem token dev
 */
export function isDevToken(req) {
    const token = req.headers['x-admin-token'];
    return token === DEV_TOKEN;
}

/**
 * Verificar se tem token root
 */
export function isRootAdminToken(req) {
    return req.headers['x-root-token'] === ROOT_TOKEN;
}

/**
 * Middleware para verificar admin com AMBAS as formas de autenticação
 * Aceita: token nos headers OU cookie de sessão válido
 */
export function requireAdminFlexible(req, res, next) {
    // Tentar autenticação por token (headers)
    if (isAdminToken(req)) {
        return next();
    }
    
    // Tentar autenticação por sessão (cookie)
    const token = req.cookies.adminSession;
    if (token) {
        const session = validateAdminSession(token);
        if (session) {
            req.adminSession = session;
            return next();
        }
        res.clearCookie('adminSession');
    }
    
    return res.status(401).json({ error: 'Não autenticado. Token ou sessão inválida.' });
}

/**
 * Middleware para verificar admin com AMBAS as formas de autenticação
 * Versão antiga (mantida como alias)
 */
export const requireAdmin = requireAdminFlexible;

/**
 * Middleware para verificar dev
 */
export function requireDev(req, res, next) {
    // Tentar autenticação por token (headers)
    if (isDevToken(req)) {
        return next();
    }
    
    // Tentar autenticação por sessão (cookie)
    const token = req.cookies.adminSession;
    if (token) {
        const session = validateAdminSession(token);
        if (session && session.role === 'dev') {
            req.adminSession = session;
            return next();
        }
        if (session) {
            res.clearCookie('adminSession');
        }
    }
    
    return res.status(401).json({ error: 'Acesso negado. Dev requerido.' });
}

/**
 * Middleware para verificar root
 */
export function requireRoot(req, res, next) {
    if (!isRootAdminToken(req)) {
        return res.status(403).json({ error: 'Acesso negado. Root admin requerido.' });
    }
    next();
}

/**
 * Middleware para verificar sessão HttpOnly (admin)
 */
export function requireAdminSession(req, res, next) {
    const token = req.cookies.adminSession;
    
    if (!token) {
        return res.status(401).json({ error: 'Não autenticado. Faça login novamente.' });
    }
    
    const session = validateAdminSession(token);
    if (!session) {
        res.clearCookie('adminSession');
        return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
    }
    
    // Adicionar dados da sessão ao request para uso posterior
    req.adminSession = session;
    next();
}

/**
 * Middleware para error handler
 */
export function errorHandler(err, req, res, next) {
    console.error('❌ Erro:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Erro no servidor',
        ...(process.env.NODE_ENV === 'development' && { details: err.stack })
    });
}
