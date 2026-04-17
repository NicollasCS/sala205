import crypto from 'crypto';
import { supabase } from '../utils/supabase.js';
import { normalizeUser, createLog, isProtectedAccount, calculateMD5 } from '../utils/helpers.js';

// ========== AUTENTICAÇÃO ==========

/**
 * Cadastro de novo usuário
 */
export async function cadastro(req, res) {
    const { nome, senha } = req.body;

    if (!nome || !senha) {
        return res.status(400).json({ error: 'Nome e senha são obrigatórios' });
    }

    if (nome.length < 3) {
        return res.status(400).json({ error: 'Nome deve ter pelo menos 3 caracteres' });
    }

    if (isProtectedAccount(nome)) {
        return res.status(403).json({ error: 'Este nome de usuário é protegido e não pode ser criado' });
    }

    try {
        const { data: existing } = await supabase
            .from('usuarios')
            .select('id')
            .eq('nome', nome)
            .limit(1);

        if (existing && existing.length > 0) {
            return res.status(409).json({ error: 'Nome de usuário não disponível. Escolha outro.' });
        }

        const { error } = await supabase
            .from('usuarios')
            .insert([{ nome, senha }])
            .select();

        if (error) throw error;

        await createLog('CONTAS', 'CRIAÇÃO DE CONTAS', `Novo usuário criado: ${nome}`);

        res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
    } catch (error) {
        console.error('Erro ao cadastrar:', error);
        res.status(500).json({ error: 'Erro ao cadastrar usuário' });
    }
}

/**
 * Gerar token seguro (usado em cookies HttpOnly)
 */
function generateSecureToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Armazenar sessão em memória (em produção, usar Redis ou banco de dados)
 */
const sessions = new Map();

export function createAdminSession(nome, role) {
    const token = generateSecureToken();
    const expiresIn = 24 * 60 * 60 * 1000; // 24 horas
    
    sessions.set(token, {
        nome,
        role,
        createdAt: Date.now(),
        expiresAt: Date.now() + expiresIn
    });
    
    return token;
}

export function validateAdminSession(token) {
    if (!token || !sessions.has(token)) {
        return null;
    }
    
    const session = sessions.get(token);
    
    // Verificar se expirou
    if (Date.now() > session.expiresAt) {
        sessions.delete(token);
        return null;
    }
    
    return session;
}

export function destroyAdminSession(token) {
    sessions.delete(token);
}

/**
 * Login do usuário
 */
export async function login(req, res) {
    const { nome, senha } = req.body;

    if (!nome || !senha) {
        return res.status(400).json({ error: 'Nome e senha são obrigatórios' });
    }

    try {
        const adminMD5 = calculateMD5('administrador_turma205-1');
        const devMD5 = calculateMD5('dev205-1');
        const alunoMD5 = calculateMD5('aluno205-1');
        const senhaHash = calculateMD5(senha); // Hash da senha recebida

        // Conta root
        if (nome === 'administrador_turma205-1') {
            if (senhaHash === adminMD5) {
                return res.json({
                    message: 'Login bem-sucedido!',
                    user: {
                        id: 'admin',
                        nome: 'administrador_turma205-1',
                        role: 'root',
                        is_admin: true,
                        is_root: true
                    }
                });
            }
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Conta dev
        if (nome === 'dev205-1') {
            if (senhaHash === devMD5) {
                return res.json({
                    message: 'Login bem-sucedido!',
                    user: {
                        id: 'dev',
                        nome: 'dev205-1',
                        role: 'dev',
                        is_admin: true,
                        is_root: false
                    }
                });
            }
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Conta aluno padrão
        if (nome === 'aluno205-1') {
            if (senhaHash === alunoMD5) {
                return res.json({
                    message: 'Login bem-sucedido!',
                    user: {
                        id: 'aluno',
                        nome: 'aluno205-1',
                        role: 'aluno',
                        is_admin: false,
                        is_root: false
                    }
                });
            }
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Buscar na base de dados
        if (!supabase) {
            return res.status(503).json({ error: 'Supabase não configurado' });
        }

        const { data: user, error } = await supabase
            .from('usuarios')
            .select('id, nome, senha')
            .eq('nome', nome)
            .limit(1)
            .single();

        if (error || !user) {
            console.warn(`⚠️ Usuário '${nome}' não encontrado`);
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const userSenhaHash = calculateMD5(user.senha);
        if (senhaHash !== userSenhaHash) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const normalized = normalizeUser(user);
        return res.json({
            message: 'Login bem-sucedido!',
            user: normalized
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
}

/**
 * Login do Admin (com cookie HttpOnly seguro)
 */
export async function loginAdmin(req, res) {
    const { nome, senha } = req.body;

    if (!nome || !senha) {
        return res.status(400).json({ error: 'Nome e senha são obrigatórios' });
    }

    try {
        const adminMD5 = calculateMD5('administrador_turma205-1');
        const devMD5 = calculateMD5('dev205-1');
        const senhaHash = calculateMD5(senha); // Hash da senha recebida

        let userRole = null;
        let userName = null;

        // Validar credenciais de admin
        if (nome === 'administrador_turma205-1' && senhaHash === adminMD5) {
            userRole = 'admin';
            userName = 'administrador_turma205-1';
        } else if (nome === 'dev205-1' && senhaHash === devMD5) {
            userRole = 'dev';
            userName = 'dev205-1';
        } else {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Criar sessão segura
        const sessionToken = createAdminSession(userName, userRole);

        // Enviar cookie HttpOnly (não acessível via JavaScript)
        res.cookie('adminSession', sessionToken, {
            httpOnly: true,        // Não acessível via JS (protege contra XSS)
            secure: process.env.NODE_ENV === 'production', // HTTPS apenas em produção
            sameSite: 'Strict',    // Protege contra CSRF
            maxAge: 24 * 60 * 60 * 1000 // 24 horas
        });

        return res.json({
            message: 'Login bem-sucedido!',
            user: {
                nome: userName,
                role: userRole
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
}

/**
 * Verificar sessão do admin
 */
export async function verifyAdminSession(req, res) {
    const token = req.cookies.adminSession;

    if (!token) {
        return res.status(401).json({ authenticated: false });
    }

    const session = validateAdminSession(token);
    if (!session) {
        // Token expirou, limpar cookie
        res.clearCookie('adminSession');
        return res.status(401).json({ authenticated: false });
    }

    return res.json({
        authenticated: true,
        user: {
            nome: session.nome,
            role: session.role
        }
    });
}

/**
 * Logout do admin
 */
export async function logoutAdmin(req, res) {
    const token = req.cookies.adminSession;
    
    if (token) {
        destroyAdminSession(token);
    }
    
    // Limpar cookie
    res.clearCookie('adminSession');
    
    return res.json({ message: 'Logout realizado com sucesso' });
}
