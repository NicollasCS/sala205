import { ADMIN_TOKEN, DEV_TOKEN, ROOT_TOKEN } from '../config/constants.js';

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
 * Middleware para verificar admin
 */
export function requireAdmin(req, res, next) {
    if (!isAdminToken(req)) {
        return res.status(403).json({ error: 'Acesso negado. Administrador requerido.' });
    }
    next();
}

/**
 * Middleware para verificar dev
 */
export function requireDev(req, res, next) {
    if (!isDevToken(req)) {
        return res.status(403).json({ error: 'Acesso negado. Dev requerido.' });
    }
    next();
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
 * Middleware para error handler
 */
export function errorHandler(err, req, res, next) {
    console.error('❌ Erro:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Erro no servidor',
        ...(process.env.NODE_ENV === 'development' && { details: err.stack })
    });
}
