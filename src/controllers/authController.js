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

        // Conta root
        if (nome === 'administrador_turma205-1') {
            if (senha === adminMD5) {
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
            if (senha === devMD5) {
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
            if (senha === alunoMD5) {
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

        const senhaHash = calculateMD5(user.senha);
        if (senha !== senhaHash) {
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
