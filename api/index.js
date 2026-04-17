import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import multer from 'multer';
import busboy from 'busboy';
import fs from 'fs';
import crypto from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const GALERIA_PAGE_SIZE = 5;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// IMPORTANTE: Não usar express.static() em serverless Vercel
// Arquivos estáticos são servidos separadamente pelo Vercel

// Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const supabase = supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

if (!supabase) {
    console.error('❌ Supabase não configurado. Verifique SUPABASE_URL e SUPABASE_KEY/SUPABASE_SERVICE_ROLE_KEY.');
    app.use('/api', (req, res) => {
        res.status(500).json({
            error: 'Supabase não configurado no servidor. Verifique SUPABASE_URL e SUPABASE_KEY/SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente do Vercel.'
        });
    });
}

// 🛡️ Filtro simples de palavrões
const palavroesProibidos = ['puta', 'merda', 'caralho', 'bosta', 'cu', 'fuck', 'shit', 'ass', 'damn'];
function profanityFilterIsProfane(text) {
    const lower = text.toLowerCase();
    return palavroesProibidos.some(word => lower.includes(word));
}

function isAdminToken(req) {
    const token = req.headers['x-admin-token'];
    return token === 'turma205-admin' || token === 'turma205-dev';
}

function isDevToken(req) {
    const token = req.headers['x-admin-token'];
    return token === 'turma205-dev';
}

function normalizeDescricao(value) {
    return String(value || '')
        .replace(/\r\n/g, '\n')
        .split('\n')
        .map((line) => line.trim())
        .join('\n')
        .trim();
}

async function ensureGaleriaPositions() {
    try {
        const { data, error } = await supabase
            .from('galeria')
            .select('id, position, data')
            .order('position', { ascending: true, nullsFirst: false })
            .order('data', { ascending: false });

        // Se coluna não existe, não quebra
        if (error && error.code === '42703') {
            console.warn('⚠️  Coluna position não existe em galeria. Execute no Supabase: ALTER TABLE galeria ADD COLUMN position integer DEFAULT 0;');
            return;
        }

        if (error) throw error;

        const imagens = data || [];
        const updates = [];

        imagens.forEach((img, index) => {
            const nextPosition = index + 1;
            if (img.position !== nextPosition) {
                updates.push(
                    supabase
                        .from('galeria')
                        .update({ position: nextPosition })
                        .eq('id', img.id)
                );
            }
        });

        if (updates.length > 0) {
            await Promise.all(updates);
        }
    } catch (err) {
        if (err.code !== '42703') throw err;
    }
}

async function ensureGaleriaTipoMidia() {
    try {
        const { data, error } = await supabase
            .from('galeria')
            .select('id, tipo_midia')
            .limit(1);

        // Se coluna tipo_midia não existe, avisa
        if (error && error.code === '42703') {
            console.warn('⚠️  Coluna tipo_midia não existe em galeria. Execute no Supabase: ALTER TABLE galeria ADD COLUMN tipo_midia text DEFAULT \'photo\';');
            return;
        }

        if (error) throw error;

        // Se coluna existe mas tem valores NULL, preenche com 'photo'
        await supabase
            .from('galeria')
            .update({ tipo_midia: 'photo' })
            .is('tipo_midia', null);

    } catch (err) {
        if (err.code !== '42703') {
            console.warn('Erro ao verificar/atualizar tipo_midia:', err.message);
        }
    }
}

async function ensureGaleriaStorageKey() {
    try {
        const { data, error } = await supabase
            .from('galeria')
            .select('storage_key')
            .limit(1);

        if (error && error.code === '42703') {
            console.warn('⚠️  Coluna storage_key não existe em galeria. Uploads de vídeo continuarão, mas sem persistir a chave.');
            return false;
        }

        if (error) throw error;
        return true;
    } catch (err) {
        if (err.code === '42703') return false;
        throw err;
    }
}

async function ensureCalendarioTable() {
    try {
        const { error } = await supabase
            .from('calendario')
            .select('id')
            .limit(1);

        if (error) {
            if (error.code === 'PGRST205' || error.message?.includes('calendario')) {
                console.warn('⚠️  Tabela calendario não existe. Crie no Supabase ou use a interface de gerenciamento.');
                return false;
            }
            throw error;
        }

        return true;
    } catch (err) {
        if (err.code === 'PGRST205' || err.message?.includes('calendario')) {
            return false;
        }
        throw err;
    }
}

async function getDescricaoAtual() {
    try {
        const { data, error } = await supabase
            .from('descricao_turma')
            .select('id, descricao')
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        // Se tabela não existe (PGRST205), retorna null (sem erro)
        if (error && error.code === 'PGRST205') {
            return null;
        }

        if (error) throw error;
        return data || null;
    } catch (err) {
        // Fallback silencioso
        if (err.code === 'PGRST205' || err.message?.includes('descricao_turma')) {
            return null;
        }
        throw err;
    }
}

async function getAppSetting(key) {
    if (!supabase) return null;
    try {
        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', key)
            .maybeSingle();

        if (error) {
            if (error.code === 'PGRST205' || error.code === '42703') return null;
            throw error;
        }

        return data?.value ?? null;
    } catch (err) {
        if (err.code === 'PGRST205' || err.code === '42703' || err.message?.includes('app_settings')) {
            return null;
        }
        throw err;
    }
}

async function setAppSetting(key, value) {
    if (!supabase) throw new Error('Supabase não configurado');
    try {
        const payload = {
            key,
            value: String(value),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('app_settings')
            .upsert(payload, { onConflict: 'key' })
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST205' || error.code === '42703') {
                throw new Error('Tabela app_settings não encontrada');
            }
            throw error;
        }

        return data;
    } catch (err) {
        if (err.message?.includes('app_settings')) {
            throw err;
        }
        throw err;
    }
}

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

async function promoteUserToAdmin(userId) {
    if (!supabase) throw new Error('Supabase não configurado');
    let lastError = null;

    try {
        const { error } = await supabase
            .from('usuarios')
            .update({ role: 'admin' })
            .eq('id', userId);

        if (!error) return;
        lastError = error;
    } catch (err) {
        if (err.code !== '42703') throw err;
        lastError = err;
    }

    try {
        const { error } = await supabase
            .from('usuarios')
            .update({ is_admin: true })
            .eq('id', userId);

        if (!error) return;
        lastError = error;
    } catch (err) {
        if (err.code !== '42703') throw err;
        lastError = err;
    }

    if (lastError) {
        throw new Error(lastError.message || lastError.code || 'Não foi possível promover o usuário. Verifique o esquema do banco.');
    }
}

function isRootAdminToken(req) {
    return req.headers['x-root-token'] === 'turma205-root';
}

// Função para inicializar o banco (criar tabelas se não existirem)
async function initDB() {
    try {
        const { error: galeriaError } = await supabase
            .from('galeria')
            .select('count()', { count: 'exact' })
            .limit(0);

        if (!galeriaError) {
            await ensureGaleriaPositions();
            await ensureGaleriaTipoMidia();
        }

        return supabase;
    } catch (err) {
        console.warn('⚠️  Aviso na inicialização do banco (não bloqueia):', err.message);
        return supabase;
    }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        supabaseConfigured: !!process.env.SUPABASE_URL
    });
});

// Rota para cadastro
app.post('/api/cadastro', async (req, res) => {
    const { nome, senha } = req.body;

    if (!nome || !senha) {
        return res.status(400).json({ error: 'Nome e senha são obrigatórios' });
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

        // Log: Criação de Conta
        await createLog('CONTAS', 'CRIAÇÃO DE CONTAS', `Novo usuário criado: ${nome}`);

        res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao cadastrar usuário' });
    }
});

// Rota para login (com suporte a Admin com MD5)
app.post('/api/login', async (req, res) => {
    const { nome, senha } = req.body;

    if (!nome || !senha) {
        return res.status(400).json({ error: 'Nome e senha são obrigatórios' });
    }

    try {
        // MD5 das credenciais admin
        const adminMD5 = crypto.createHash('md5').update('administrador_turma205-1').digest('hex');
        const devMD5 = crypto.createHash('md5').update('dev205-1').digest('hex');

        // Conta root do projeto
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

        // Conta do dev local/manual
        if (nome === 'dev205-1') {
            if (senha === devMD5) {
                return res.json({
                    message: 'Login bem-sucedido!',
                    user: {
                        id: 'dev',
                        nome: 'dev205-1',
                        role: 'dev',
                        is_admin: false,
                        is_root: false
                    }
                });
            }
        }

        const { data: user, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('nome', nome)
            .eq('senha', senha)
            .limit(1)
            .single();

        if (error || !user) {
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
});

// GET comments
app.get('/api/comentarios', async (req, res) => {
    try {
        const { data: comentarios, error } = await supabase
            .from('comentarios')
            .select('*')
            .order('is_pinned', { ascending: false })
            .order('criado', { ascending: false });

        if (error) throw error;

        res.json(comentarios || []);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar comentários' });
    }
});

// POST comment
app.post('/api/comentarios', async (req, res) => {
    const { autor, texto, parent_id } = req.body;
    const is_admin = autor === 'administrador_turma205-1';

    if (!autor || !texto) {
        return res.status(400).json({ error: 'Autor e texto são obrigatórios' });
    }

    if (texto.length > 120) {
        return res.status(400).json({ error: 'Comentário muito longo. Máximo 120 caracteres.' });
    }

    // 🛡️ Validar palavrões
    if (profanityFilterIsProfane(texto)) {
        return res.status(400).json({ error: 'Comentário contém linguagem inadequada. Por favor, revise.' });
    }

    try {
        if (!parent_id && !is_admin) {
            const { data, error: countError } = await supabase
                .from('comentarios')
                .select('id', { count: 'exact' })
                .eq('autor', autor)
                .is('parent_id', null);

            if (!countError && data && data.length >= 2) {
                return res.status(400).json({ error: 'Limite de 2 comentários principais atingido.' });
            }
        }

        const { data: comentario, error } = await supabase
            .from('comentarios')
            .insert([{
                autor,
                texto,
                parent_id: parent_id || null,
                reactions: { '👍': 0, '👎': 0, '❤️': 0 },
                user_reactions: {},
                is_pinned: false
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(comentario);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar comentário' });
    }
});

app.post('/api/comentarios/:id/react', async (req, res) => {
    const { id } = req.params;
    const { emoji, autor } = req.body;
    const validEmojis = ['👍', '❤️', '👎'];

    if (!validEmojis.includes(emoji) || !autor) {
        return res.status(400).json({ error: 'Dados inválidos' });
    }

    try {
        const { data: comment, error: fetchError } = await supabase
            .from('comentarios')
            .select('reactions, user_reactions')
            .eq('id', id)
            .single();

        if (fetchError || !comment) {
            return res.status(404).json({ error: 'Não encontrado' });
        }

        const reactions = comment.reactions || { '👍': 0, '👎': 0, '❤️': 0 };
        const userReactions = comment.user_reactions || {};

        if (userReactions[autor] === emoji) {
            delete userReactions[autor];
            reactions[emoji] = Math.max(0, (reactions[emoji] || 0) - 1);
        } else {
            if (userReactions[autor]) {
                reactions[userReactions[autor]] = Math.max(0, reactions[userReactions[autor]] - 1);
            }
            userReactions[autor] = emoji;
            reactions[emoji] = (reactions[emoji] || 0) + 1;
        }

        await supabase
            .from('comentarios')
            .update({ reactions, user_reactions: userReactions })
            .eq('id', id);

        res.json({ reactions });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Erro na reação' });
    }
});

app.put('/api/comentarios/:id/pin', async (req, res) => {
    const { id } = req.params;

    if (!isAdminToken(req)) {
        return res.status(403).json({ error: 'Acesso negado' });
    }

    try {
        const { data: comment, error: fetchError } = await supabase
            .from('comentarios')
            .select('is_pinned')
            .eq('id', id)
            .single();

        if (fetchError || !comment) {
            return res.status(404).json({ error: 'Comentário não encontrado' });
        }

        const newPinned = !comment.is_pinned;

        await supabase
            .from('comentarios')
            .update({ is_pinned: newPinned })
            .eq('id', id);

        res.json({ is_pinned: newPinned });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Erro ao fixar' });
    }
});

// UPDATE comment (admin)
app.put('/api/comentarios/:id', async (req, res) => {
    const { id } = req.params;
    const { autor, texto } = req.body;

    if (!isAdminToken(req)) {
        return res.status(403).json({ error: 'Acesso negado. Administrador requerido.' });
    }

    if (!autor || !texto) {
        return res.status(400).json({ error: 'Autor e texto são obrigatórios.' });
    }

    try {
        const { data: existing, error: fetchError } = await supabase
            .from('comentarios')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !existing) {
            return res.status(404).json({ error: 'Comentário não encontrado.' });
        }

        const { data: updated, error } = await supabase
            .from('comentarios')
            .update({ autor, texto, criado: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({ message: 'Comentário atualizado', comentario: updated });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar comentário' });
    }
});

// DELETE own comment (user)
app.delete('/api/comentarios/meus/:id', async (req, res) => {
    const { id } = req.params;
    const { autor } = req.body;

    if (!autor) {
        return res.status(400).json({ error: 'Autor é obrigatório para verificação.' });
    }

    try {
        const { data: comentario, error: fetchError } = await supabase
            .from('comentarios')
            .select('autor')
            .eq('id', id)
            .single();

        if (fetchError || !comentario) {
            return res.status(404).json({ error: 'Comentário não encontrado.' });
        }

        if (comentario.autor !== autor) {
            return res.status(403).json({ error: 'Acesso negado. Você só pode excluir seus próprios comentários.' });
        }

        const { error } = await supabase
            .from('comentarios')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Comentário excluído com sucesso.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao excluir comentário' });
    }
});

// DELETE comment (admin)
app.delete('/api/comentarios/:id', async (req, res) => {
    const { id } = req.params;

    if (!isAdminToken(req)) {
        return res.status(403).json({ error: 'Acesso negado. Administrador requerido.' });
    }

    try {
        const { error } = await supabase
            .from('comentarios')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Comentário excluído' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao excluir comentário' });
    }
});

// ===== COMENTÁRIOS DE GALERIA =====

// GET comentários de uma imagem/video
app.get('/api/galeria/:galeriaId/comentarios', async (req, res) => {
    const { galeriaId } = req.params;

    try {
        const { data, error } = await supabase
            .from('comentarios_galeria')
            .select('*')
            .eq('galeria_id', galeriaId)
            .order('criado', { ascending: false });

        if (error) throw error;

        res.json(data || []);
    } catch (error) {
        console.error('Erro ao buscar comentários:', error);
        res.status(500).json({ error: 'Erro ao buscar comentários' });
    }
});

// POST para adicionar comentário em galeria (máx 100 chars, 1 por usuário por imagem)
app.post('/api/galeria/:galeriaId/comentarios', async (req, res) => {
    const { galeriaId } = req.params;
    const { autor, texto } = req.body;

    if (!autor || !texto) {
        return res.status(400).json({ error: 'Autor e texto são obrigatórios' });
    }

    if (texto.length > 100) {
        return res.status(400).json({ error: 'Comentário muito longo. Máximo 100 caracteres.' });
    }

    if (texto.trim().length === 0) {
        return res.status(400).json({ error: 'Comentário não pode estar vazio' });
    }

    // 🛡️ Validar palavrões
    if (profanityFilterIsProfane(texto)) {
        return res.status(400).json({ error: 'Comentário contém linguagem inadequada. Por favor, revise.' });
    }

    try {
        // Verificar se usuário já comentou nesta imagem
        const { data: existingComment, error: checkError } = await supabase
            .from('comentarios_galeria')
            .select('id')
            .eq('galeria_id', galeriaId)
            .eq('autor', autor)
            .single();

        if (!checkError && existingComment) {
            return res.status(400).json({ error: 'Você já comentou nesta imagem/video' });
        }

        // Inserir novo comentário
        const { data: novoComentario, error } = await supabase
            .from('comentarios_galeria')
            .insert([{
                galeria_id: galeriaId,
                autor,
                texto: texto.trim(),
                criado: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(novoComentario);
    } catch (error) {
        console.error('Erro ao criar comentário:', error);
        res.status(500).json({ error: 'Erro ao criar comentário' });
    }
});

// DELETE comentário de galeria (usuário pode deletar seu próprio)
app.delete('/api/galeria/comentarios/:comentarioId', async (req, res) => {
    const { comentarioId } = req.params;
    const { autor } = req.body;

    if (!autor) {
        return res.status(400).json({ error: 'Autor é obrigatório' });
    }

    try {
        // Verificar se comentário pertence ao usuário
        const { data: comentario, error: checkError } = await supabase
            .from('comentarios_galeria')
            .select('*')
            .eq('id', comentarioId)
            .single();

        if (checkError || !comentario) {
            return res.status(404).json({ error: 'Comentário não encontrado' });
        }

        // Apenas o autor ou admin podem deletar
        const isAdmin = autor === 'administrador_turma205-1';
        if (comentario.autor !== autor && !isAdmin) {
            return res.status(403).json({ error: 'Você não pode deletar este comentário' });
        }

        const { error } = await supabase
            .from('comentarios_galeria')
            .delete()
            .eq('id', comentarioId);

        if (error) throw error;

        res.json({ message: 'Comentário deletado' });
    } catch (error) {
        console.error('Erro ao deletar comentário:', error);
        res.status(500).json({ error: 'Erro ao deletar comentário' });
    }
});

// Rota para renomear usuário
app.put('/api/usuarios/renomear', async (req, res) => {
    const { id, nomeAtual, novoNome } = req.body;

    if (!id || !nomeAtual || !novoNome) {
        return res.status(400).json({ error: 'Dados incompletos.' });
    }

    // Contas protegidas que não podem ser renomeadas
    const protectedAccounts = ['administrador_turma205-1', 'aluno205-1', 'dev205-1'];
    if (protectedAccounts.includes(nomeAtual)) {
        return res.status(403).json({ error: 'Contas de sistema não podem ser renomeadas.' });
    }

    try {
        const { data: existing } = await supabase
            .from('usuarios')
            .select('id')
            .eq('nome', novoNome);

        if (existing && existing.length > 0) {
            return res.status(409).json({ error: 'Este nome já está em uso.' });
        }

        await supabase
            .from('usuarios')
            .update({ nome: novoNome })
            .eq('id', id);

        await supabase
            .from('comentarios')
            .update({ autor: novoNome })
            .eq('autor', nomeAtual);

        res.json({ message: 'Nome atualizado com sucesso.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar nome.' });
    }
});

// GET users (admin)
app.get('/api/usuarios', async (req, res) => {
    if (!supabase) {
        console.error('❌ Supabase não configurado');
        return res.status(503).json({ error: 'Supabase não configurado - SUPABASE_URL ou SUPABASE_KEY faltando' });
    }

    try {
        console.log('📥 Buscando usuários do Supabase...');
        const { data: usuarios, error } = await supabase
            .from('usuarios')
            .select('id, nome, created, role, is_admin')
            .order('created', { ascending: false });

        if (error) {
            console.error('❌ Erro Supabase ao listar usuários:', {
                code: error.code,
                message: error.message,
                details: error.details
            });

            // Se é erro de tabela não existir, retornar array vazio
            if (error.code === 'PGRST205' || error.message?.includes('usuarios')) {
                console.warn('⚠️ Tabela usuarios não encontrada, retornando array vazio');
                return res.json([]);
            }

            return res.status(500).json({ 
                error: `Erro ao listar usuários: ${error.message}`,
                code: error.code 
            });
        }

        console.log(`✅ ${usuarios?.length || 0} usuários encontrados`);
        res.json(usuarios || []);
    } catch (error) {
        console.error('❌ Erro na rota de usuários:', error);
        res.status(500).json({ error: `Erro ao listar usuários: ${error.message}` });
    }
});

app.post('/api/admin-requests', async (req, res) => {
    const requesterToken = req.headers['x-admin-token'];
    if (!requesterToken) {
        return res.status(403).json({ error: 'Acesso negado. Administrador requerido.' });
    }

    const { requested_user_id, requested_user_name, requested_by_id, requested_by_name, target_role = 'admin' } = req.body;
    if (!requested_user_id || !requested_user_name || !requested_by_id || !requested_by_name) {
        return res.status(400).json({ error: 'Dados de solicitação incompletos.' });
    }

    try {
        const { data, error } = await supabase
            .from('admin_requests')
            .insert([{ requested_user_id, requested_user_name, requested_by_id, requested_by_name, target_role, status: 'pending', created_at: new Date().toISOString() }])
            .select()
            .single();

        if (error) {
            if (error.code === '42703' || error.message?.includes('admin_requests')) {
                return res.status(500).json({ error: 'Tabela admin_requests não encontrada no Supabase. Crie a tabela para habilitar solicitações de admin.' });
            }
            throw error;
        }

        res.status(201).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar solicitação de admin' });
    }
});

app.get('/api/admin-requests', async (req, res) => {
    const rootToken = req.headers['x-root-token'];
    const requesterToken = req.headers['x-admin-token'];

    if (!requesterToken) {
        return res.status(403).json({ error: 'Acesso negado. Administrador requerido.' });
    }

    try {
        let query = supabase.from('admin_requests').select('*').order('created_at', { ascending: false });

        if (!isRootAdminToken(req)) {
            const requesterName = req.headers['x-requester-name'];
            if (!requesterName) {
                return res.status(403).json({ error: 'Acesso negado. Root ou autor da solicitação requerido.' });
            }
            query = query.eq('requested_by_name', requesterName);
        }

        const { data, error } = await query;
        if (error) {
            if (error.code === '42703' || error.message?.includes('admin_requests')) {
                return res.status(500).json({ error: 'Tabela admin_requests não encontrada no Supabase.' });
            }
            throw error;
        }

        res.json(data || []);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar solicitações de admin' });
    }
});

app.put('/api/admin-requests/:id', async (req, res) => {
    if (!isRootAdminToken(req)) {
        return res.status(403).json({ error: 'Apenas administrador root pode revisar solicitações.' });
    }

    const { id } = req.params;
    const { action, reason, reviewed_by_name = 'administrador_turma205-1' } = req.body;
    if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ error: 'Ação inválida. Use approve ou reject.' });
    }

    try {
        const { data: request, error: fetchError } = await supabase
            .from('admin_requests')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !request) {
            return res.status(404).json({ error: 'Solicitação não encontrada.' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ error: 'Solicitação já foi processada.' });
        }

        if (action === 'approve') {
            await promoteUserToAdmin(request.requested_user_id);
        }

        const { error: updateError } = await supabase
            .from('admin_requests')
            .update({
                status: action === 'approve' ? 'approved' : 'rejected',
                reviewed_at: new Date().toISOString(),
                reviewed_by_name,
                review_reason: reason || null
            })
            .eq('id', id);

        if (updateError) throw updateError;

        res.json({ message: `Solicitação ${action} com sucesso.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao processar solicitação de admin' });
    }
});

app.get('/api/site-status', async (req, res) => {
    try {
        const maintenanceModeEnv = process.env.MAINTENANCE_MODE === 'true';
        const maintenanceMessageEnv = process.env.MAINTENANCE_MESSAGE || 'Site em manutenção. Volte mais tarde.';
        const maintenanceValue = await getAppSetting('maintenance_mode');
        const messageValue = await getAppSetting('maintenance_message');

        const maintenanceMode = maintenanceValue !== null ? maintenanceValue === 'true' : maintenanceModeEnv;
        const maintenanceMessage = messageValue || maintenanceMessageEnv;

        res.json({ maintenanceMode, maintenanceMessage });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar status do site' });
    }
});

app.put('/api/site-status', async (req, res) => {
    if (!isRootAdminToken(req)) {
        return res.status(403).json({ error: 'Apenas administrador root pode alterar o modo de manutenção.' });
    }

    const { maintenanceMode, maintenanceMessage } = req.body;
    if (typeof maintenanceMode !== 'boolean') {
        return res.status(400).json({ error: 'maintenanceMode deve ser booleano.' });
    }

    try {
        await setAppSetting('maintenance_mode', maintenanceMode ? 'true' : 'false');
        if (typeof maintenanceMessage === 'string') {
            await setAppSetting('maintenance_message', maintenanceMessage);
        }
        res.json({ message: 'Status do site atualizado.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message || 'Erro ao salvar status do site' });
    }
});

// Rota para excluir usuário e seus comentários
app.delete('/api/usuarios', async (req, res) => {
    const { id, nome } = req.body;

    if (!id || !nome) {
        return res.status(400).json({ error: 'ID e nome do usuário são obrigatórios.' });
    }

    // Contas protegidas que não podem ser excluídas
    const protectedAccounts = ['administrador_turma205-1', 'aluno205-1', 'dev205-1'];
    if (protectedAccounts.includes(nome)) {
        return res.status(403).json({ error: 'Esta conta não pode ser excluída. É uma conta de sistema.' });
    }

    try {
        await supabase
            .from('comentarios')
            .delete()
            .eq('autor', nome);

        await supabase
            .from('usuarios')
            .delete()
            .eq('id', id)
            .eq('nome', nome);

        // Log: Exclusão de Conta
        await createLog('CONTAS', 'EXCLUSÃO DE CONTAS', `Conta deletada: ${nome}`);

        res.json({ message: 'Sua conta e todos os seus comentários foram excluídos com sucesso.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao excluir a conta.' });
    }
});

// Descrição turma endpoints
app.get('/api/descricao-turma', async (req, res) => {
    try {
        const data = await getDescricaoAtual();
        res.json({ descricao: data?.descricao || 'Descrição da turma não configurada.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar descrição', descricao: 'Carregando informações da turma...' });
    }
});

app.post('/api/descricao-turma', async (req, res) => {
    const descricao = normalizeDescricao(req.body?.descricao);

    if (!isAdminToken(req)) {
        return res.status(401).json({ error: 'Acesso negado' });
    }

    if (!descricao || descricao.length < 10) {
        return res.status(400).json({ error: 'Descrição muito curta (mín 10 chars)' });
    }

    try {
        const existing = await getDescricaoAtual();
        const payload = {
            descricao,
            updated_at: new Date().toISOString()
        };

        let query = supabase.from('descricao_turma');
        if (existing?.id) {
            query = query.update(payload).eq('id', existing.id);
        } else {
            query = query.insert([payload]);
        }

        const { data, error } = await query.select().single();

        // Se a tabela não existe, retorna mensagem amigável
        if (error?.code === 'PGRST205' || error?.message?.includes('descricao_turma')) {
            return res.status(503).json({ 
                error: 'Tabela descricao_turma não configurada. Execute no Supabase SQL Editor: CREATE TABLE descricao_turma (id serial PRIMARY KEY, descricao text NOT NULL, updated_at timestamp with time zone DEFAULT now());' 
            });
        }

        if (error) throw error;
        
        // Log: Atualização do Site
        await createLog('ATUALIZAÇÕES', 'ATUALIZAÇÃO DO SITE', `Descrição da turma atualizada pelo desenvolvedor`);
        
        res.json({ message: 'Descrição atualizada!', data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao salvar descrição' });
    }
});

// ===== ROTAS DE GALERIA =====
app.get('/api/galeria', async (req, res) => {
    try {
        await ensureGaleriaPositions();
        await ensureGaleriaTipoMidia();

        const page = Math.max(0, parseInt(req.query.page, 10) || 0);
        const limit = Math.max(1, parseInt(req.query.limit, 10) || GALERIA_PAGE_SIZE);
        const offset = page * limit;

        let query = supabase
            .from('galeria')
            .select('*', { count: 'exact' });

        // Se coluna position não existe, ordena apenas por data
        try {
            query = query.order('position', { ascending: false, nullsFirst: false });
        } catch {
            query = query.order('data', { ascending: false });
        }

        const { data: galeria, error, count } = await query.range(offset, offset + limit - 1);

        if (error && error.code === '42703') {
            // Coluna position não existe, retorna sem ordenação ou ordena por ID
            const { data: galeriaFallback, error: errorFallback, count: countFallback } = await supabase
                .from('galeria')
                .select('*', { count: 'exact' })
                .order('id', { ascending: false })
                .range(offset, offset + limit - 1);

            if (errorFallback) throw errorFallback;

            const total = countFallback || 0;
            return res.json({
                data: galeriaFallback || [],
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasPrevious: page > 0,
                    hasNext: offset + limit < total
                }
            });
        }

        if (error) throw error;

        const total = count || 0;
        res.json({
            data: galeria || [],
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasPrevious: page > 0,
                hasNext: offset + limit < total
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar galeria' });
    }
});

// Endpoint para upload de vídeo (Supabase Storage)
app.post('/api/galeria/video-upload', async (req, res) => {
    if (!isAdminToken(req)) {
        return res.status(401).json({ error: 'Acesso negado' });
    }

    try {
        const bb = busboy({ headers: req.headers });
        const fields = {};
        let videoBuffer = null;
        let videoFilename = null;
        let videoMimetype = null;

        bb.on('field', (fieldname, val) => {
            fields[fieldname] = val;
        });

        bb.on('file', (fieldname, file, info) => {
            if (fieldname === 'video') {
                videoMimetype = info.mimetype;
                const chunks = [];
                
                file.on('data', (data) => {
                    chunks.push(data);
                });

                file.on('end', () => {
                    videoBuffer = Buffer.concat(chunks);
                });
            }
        });

        bb.on('finish', async () => {
            try {
                const { titulo, descricao, data, tipo_midia } = fields;

                if (!videoBuffer) {
                    return res.status(400).json({ error: 'Arquivo de vídeo não foi enviado' });
                }

                // Gerar nome único para o arquivo
                const timestamp = Date.now();
                const randomStr = Math.random().toString(36).substring(7);
                videoFilename = `video_${timestamp}_${randomStr}`;

                // Upload para Supabase Storage
                const { data: uploadData, error: uploadError } = await supabase
                    .storage
                    .from('galeria-videos')
                    .upload(videoFilename, videoBuffer, {
                        contentType: videoMimetype || 'video/mp4',
                        upsert: false
                    });

                if (uploadError) {
                    console.error('Erro ao fazer upload no Supabase Storage:', uploadError);
                    return res.status(500).json({ error: `Erro no Supabase Storage: ${uploadError.message}` });
                }

                // Obter URL pública do vídeo
                const { data: { publicUrl } } = supabase
                    .storage
                    .from('galeria-videos')
                    .getPublicUrl(videoFilename);

                await ensureGaleriaPositions();

                const { data: current } = await supabase
                    .from('galeria')
                    .select('position')
                    .order('position', { ascending: false })
                    .limit(1);

                const nextPos = (current?.[0]?.position || 0) + 1;

                const hasStorageKey = await ensureGaleriaStorageKey();
                const insertData = {
                    titulo,
                    descricao,
                    url: publicUrl,
                    data: data || null,
                    position: nextPos,
                    tipo_midia: tipo_midia || 'video'
                };

                if (hasStorageKey) {
                    insertData.storage_key = videoFilename;
                }

                let { data: novaImagem, error } = await supabase
                    .from('galeria')
                    .insert([insertData])
                    .select();

                if (error && error.code === '42703' && error.message?.includes('storage_key')) {
                    delete insertData.storage_key;
                    const retry = await supabase
                        .from('galeria')
                        .insert([insertData])
                        .select();
                    novaImagem = retry.data;
                    error = retry.error;
                }

                if (error) throw error;
                
                console.log('✅ Vídeo salvo no Supabase Storage:', videoFilename);
                res.status(201).json({ 
                    message: 'Vídeo upload com sucesso!', 
                    data: novaImagem,
                    storage_url: publicUrl
                });
            } catch (error) {
                console.error('Erro ao processar upload:', error.message);
                res.status(500).json({ error: `Erro ao processar upload: ${error.message}` });
            }
        });

        bb.on('error', (err) => {
            console.error('Erro no busboy:', err);
            res.status(500).json({ error: `Erro ao fazer upload: ${err.message}` });
        });

        req.pipe(bb);
    } catch (error) {
        console.error('Erro ao fazer upload de vídeo:', error.message);
        res.status(500).json({ error: `Erro ao fazer upload de vídeo: ${error.message}` });
    }
});

app.post('/api/galeria', async (req, res) => {
    const { titulo, descricao, url, data, tipo_midia } = req.body;

    if (!isAdminToken(req)) {
        return res.status(401).json({ error: 'Acesso negado' });
    }

    if (!titulo || !descricao || !url) {
        return res.status(400).json({ error: 'Título, descrição e URL/arquivo são obrigatórios' });
    }

    try {
        await ensureGaleriaPositions();

        const { data: current } = await supabase
            .from('galeria')
            .select('position')
            .order('position', { ascending: false })
            .limit(1);

        const nextPos = (current?.[0]?.position || 0) + 1;

        const insertData = {
            titulo,
            descricao,
            url,
            data: data || null,
            position: nextPos
        };

        // Tenta incluir tipo_midia, mas continua sem ele se a coluna não existir
        try {
            await ensureGaleriaTipoMidia();
            insertData.tipo_midia = tipo_midia || 'photo';
        } catch (e) {
            console.warn('Coluna tipo_midia não disponível, continuando sem ela');
        }

        const { data: novaImagem, error } = await supabase
            .from('galeria')
            .insert([insertData])
            .select();

        if (error) throw error;
        res.status(201).json({ message: 'Mídia adicionada com sucesso!', data: novaImagem });
    } catch (error) {
        console.error('Erro ao adicionar mídia:', error.message);
        res.status(500).json({ error: `Erro ao adicionar mídia: ${error.message}` });
    }
});

app.put('/api/galeria/:id', async (req, res) => {
    const { id } = req.params;
    const { titulo, descricao, url, data, tipo_midia } = req.body;

    if (!isAdminToken(req)) {
        return res.status(401).json({ error: 'Acesso negado' });
    }

    try {
        const updateData = {};
        if (titulo !== undefined) updateData.titulo = titulo;
        if (descricao !== undefined) updateData.descricao = descricao;
        if (url !== undefined) updateData.url = url;
        if (data !== undefined) updateData.data = data || null;
        
        // Tenta incluir tipo_midia, mas continua sem ele se a coluna não existir
        if (tipo_midia !== undefined) {
            try {
                await ensureGaleriaTipoMidia();
                updateData.tipo_midia = tipo_midia;
            } catch (e) {
                console.warn('Coluna tipo_midia não disponível, continuando sem ela');
            }
        }

        const { data: imagemAtualizada, error } = await supabase
            .from('galeria')
            .update(updateData)
            .eq('id', id)
            .select();

        if (error) throw error;
        res.json({ message: 'Mídia atualizada com sucesso!', data: imagemAtualizada });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar mídia' });
    }
});

app.put('/api/galeria/reorder', async (req, res) => {
    const { orderedIds } = req.body || {};

    if (!isAdminToken(req)) {
        return res.status(401).json({ error: 'Acesso negado' });
    }

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
        return res.status(400).json({ error: 'Lista de ordenação inválida' });
    }

    try {
        const total = orderedIds.length;
        await Promise.all(
            orderedIds.map((id, index) =>
                supabase
                    .from('galeria')
                    .update({ position: total - index })
                    .eq('id', id)
            )
        );

        res.json({ message: 'Ordem atualizada com sucesso!' });
    } catch (error) {
        // Se coluna não existe, retorna aviso pero sucesso (modo degradado)
        if (error.code === '42703') {
            console.warn('⚠️  Coluna position não existe. Reordenação armazenado em memória apenas.');
            return res.json({ message: 'Ordem atualizada (sem persistência - adicione coluna position na galeria)' });
        }
        console.error(error);
        res.status(500).json({ error: 'Erro ao reordenar galeria' });
    }
});

// DELETE galeria
app.delete('/api/galeria/:id', async (req, res) => {
    const { id } = req.params;

    if (!isAdminToken(req)) {
        return res.status(401).json({ error: 'Acesso negado - token de admin inválido' });
    }

    if (!supabase) {
        return res.status(503).json({ error: 'Supabase não configurado' });
    }

    try {
        const hasStorageKey = await ensureGaleriaStorageKey();
        const selectCols = hasStorageKey ? 'storage_key, url' : 'url';

        // Obter o item da galeria para pegar a storage_key
        const { data: galeriaItem, error: fetchError } = await supabase
            .from('galeria')
            .select(selectCols)
            .eq('id', id)
            .single();

        if (fetchError) {
            console.error('Erro ao buscar item da galeria:', fetchError);
            return res.status(500).json({ error: `Erro ao buscar item: ${fetchError.message}` });
        }

        if (!galeriaItem) {
            return res.status(404).json({ error: 'Imagem não encontrada' });
        }

        // Se tem storage_key, deletar do Supabase Storage
        if (hasStorageKey && galeriaItem?.storage_key) {
            const { error: storageError } = await supabase
                .storage
                .from('galeria-videos')
                .remove([galeriaItem.storage_key]);

            if (storageError) {
                console.error('Erro ao deletar vídeo do Storage:', storageError);
                // Continuar mesmo se houver erro no storage
            } else {
                console.log('✅ Vídeo deletado do Supabase Storage:', galeriaItem.storage_key);
            }
        }

        // Deletar o registro da galeria
        const { error } = await supabase
            .from('galeria')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Erro ao deletar registro:', error);
            return res.status(500).json({ error: `Erro ao deletar: ${error.message}` });
        }

        await ensureGaleriaPositions();
        res.json({ message: 'Imagem/vídeo apagado com sucesso!' });
    } catch (error) {
        console.error('Erro na rota de deleção:', error);
        res.status(500).json({ error: `Erro ao apagar imagem/vídeo: ${error.message}` });
    }
});

// ===== ROTAS DE CALENDÁRIO =====
app.get('/api/calendario', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('calendario')
            .select('*')
            .order('data', { ascending: true })
            .order('created_at', { ascending: true });

        if (error) {
            if (error.code === 'PGRST205' || error.message?.includes('calendario')) {
                return res.json({ data: [] });
            }
            throw error;
        }

        res.json({ data: data || [] });
    } catch (error) {
        console.error('Erro ao buscar calendário:', error);
        res.status(500).json({ error: 'Erro ao buscar calendário' });
    }
});

app.post('/api/calendario', async (req, res) => {
    if (!isAdminToken(req)) {
        return res.status(401).json({ error: 'Acesso negado' });
    }

    const { titulo, descricao, data, tipo } = req.body;

    if (!titulo || !data) {
        return res.status(400).json({ error: 'Título e data são obrigatórios' });
    }

    try {
        const { data: newEvent, error } = await supabase
            .from('calendario')
            .insert([{ titulo, descricao: descricao || '', data, tipo: tipo || 'Aviso', created_at: new Date().toISOString() }])
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST205' || error.message?.includes('calendario')) {
                return res.status(503).json({
                    error: 'Tabela calendario não configurada. Execute no Supabase SQL Editor: CREATE TABLE calendario (id serial PRIMARY KEY, titulo text NOT NULL, descricao text, data date NOT NULL, tipo text DEFAULT \'Aviso\', created_at timestamp with time zone DEFAULT now());'
                });
            }
            throw error;
        }

        await createLog('CALENDÁRIO', 'ADICIONAR EVENTO', `Evento criado: ${titulo} em ${data}`);
        res.status(201).json({ data: newEvent });
    } catch (error) {
        console.error('Erro ao criar evento de calendário:', error);
        res.status(500).json({ error: 'Erro ao criar evento' });
    }
});

app.put('/api/calendario/:id', async (req, res) => {
    if (!isAdminToken(req)) {
        return res.status(401).json({ error: 'Acesso negado' });
    }

    const { id } = req.params;
    const { titulo, descricao, data, tipo } = req.body;

    if (!titulo || !data) {
        return res.status(400).json({ error: 'Título e data são obrigatórios' });
    }

    try {
        const { data: updatedEvent, error } = await supabase
            .from('calendario')
            .update({ titulo, descricao: descricao || '', data, tipo: tipo || 'Aviso' })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST205' || error.message?.includes('calendario')) {
                return res.status(503).json({
                    error: 'Tabela calendario não configurada. Execute no Supabase SQL Editor: CREATE TABLE calendario (id serial PRIMARY KEY, titulo text NOT NULL, descricao text, data date NOT NULL, tipo text DEFAULT \'Aviso\', created_at timestamp with time zone DEFAULT now());'
                });
            }
            throw error;
        }

        await createLog('CALENDÁRIO', 'ATUALIZAR EVENTO', `Evento atualizado: ${titulo} (${id})`);
        res.json({ data: updatedEvent });
    } catch (error) {
        console.error('Erro ao atualizar evento de calendário:', error);
        res.status(500).json({ error: 'Erro ao atualizar evento' });
    }
});

app.delete('/api/calendario/:id', async (req, res) => {
    if (!isAdminToken(req)) {
        return res.status(401).json({ error: 'Acesso negado' });
    }

    const { id } = req.params;

    try {
        const { error } = await supabase
            .from('calendario')
            .delete()
            .eq('id', id);

        if (error) {
            if (error.code === 'PGRST205' || error.message?.includes('calendario')) {
                return res.status(503).json({
                    error: 'Tabela calendario não configurada. Execute no Supabase SQL Editor: CREATE TABLE calendario (id serial PRIMARY KEY, titulo text NOT NULL, descricao text, data date NOT NULL, tipo text DEFAULT \'Aviso\', created_at timestamp with time zone DEFAULT now());'
                });
            }
            throw error;
        }

        await createLog('CALENDÁRIO', 'REMOVER EVENTO', `Evento removido: ${id}`);
        res.json({ message: 'Evento removido com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar evento de calendário:', error);
        res.status(500).json({ error: 'Erro ao deletar evento' });
    }
});

// ============ ENDPOINTS DE PERFIL DO USUÁRIO ============

// Alterar Nome
app.post('/api/usuario/:id/alterar-nome', async (req, res) => {
    const { id } = req.params;
    const { novoNome } = req.body;

    if (!novoNome || novoNome.trim().length < 3) {
        return res.status(400).json({ error: 'Nome deve ter pelo menos 3 caracteres' });
    }

    try {
        // Verificar se é admin
        const { data: usuario, error: errorCheck } = await supabase
            .from('usuarios')
            .select('nome')
            .eq('id', id)
            .single();

        if (errorCheck) throw errorCheck;

        if (usuario.nome === 'administrador_turma205-1') {
            return res.status(403).json({ error: 'Não é permitido alterar nome do admin' });
        }

        // Atualizar nome
        const { data: updated, error } = await supabase
            .from('usuarios')
            .update({ nome: novoNome.trim() })
            .eq('id', id)
            .select();

        if (error) throw error;

        res.json({ message: 'Nome alterado com sucesso!', data: updated });
    } catch (error) {
        console.error('Erro ao alterar nome:', error);
        res.status(500).json({ error: 'Erro ao alterar nome' });
    }
});

// Alterar Senha
app.post('/api/usuario/:id/alterar-senha', async (req, res) => {
    const { id } = req.params;
    const { senhaAtual, novaSenha } = req.body;

    if (!senhaAtual || !novaSenha) {
        return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
    }

    if (novaSenha.length < 6) {
        return res.status(400).json({ error: 'Nova senha deve ter pelo menos 6 caracteres' });
    }

    try {
        // Buscar usuário
        const { data: usuario, error: errorCheck } = await supabase
            .from('usuarios')
            .select('senha, nome')
            .eq('id', id)
            .single();

        if (errorCheck) throw errorCheck;

        // Verificar senha atual (comparação simples - em produção usar bcrypt)
        if (usuario.senha !== senhaAtual) {
            return res.status(401).json({ error: 'Senha atual incorreta' });
        }

        // Verificar se é admin
        if (usuario.nome === 'administrador_turma205-1') {
            return res.status(403).json({ error: 'Não é permitido alterar senha do admin' });
        }

        // Atualizar senha
        const { data: updated, error } = await supabase
            .from('usuarios')
            .update({ senha: novaSenha })
            .eq('id', id)
            .select();

        if (error) throw error;

        res.json({ message: 'Senha alterada com sucesso!', data: updated });
    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        res.status(500).json({ error: 'Erro ao alterar senha' });
    }
});

// Deletar Conta
app.delete('/api/usuario/:id', async (req, res) => {
    const { id } = req.params;
    const { senha } = req.body;

    if (!senha) {
        return res.status(400).json({ error: 'Senha é obrigatória para deletar conta' });
    }

    try {
        // Buscar usuário
        const { data: usuario, error: errorCheck } = await supabase
            .from('usuarios')
            .select('senha, nome')
            .eq('id', id)
            .single();

        if (errorCheck) throw errorCheck;

        // Fazer hash MD5 da senha enviada e comparar com a armazenada
        const senhaHashEnviada = crypto.createHash('md5').update(senha).digest('hex');
        const senhaValida = usuario.senha === senhaHashEnviada;
        
        if (!senhaValida) {
            return res.status(401).json({ error: 'Senha incorreta' });
        }

        // Verificar se é admin
        if (usuario.nome === 'administrador_turma205-1') {
            return res.status(403).json({ error: 'Não é permitido deletar conta admin' });
        }

        // Deletar usuário
        const { error: deleteError } = await supabase
            .from('usuarios')
            .delete()
            .eq('id', id);

        if (deleteError) throw deleteError;

        // Deletar comentários do usuário
        await supabase
            .from('comentarios')
            .delete()
            .eq('autor', usuario.nome);

        // Log: Exclusão de Conta
        await createLog('CONTAS', 'EXCLUSÃO DE CONTAS', `Conta deletada: ${usuario.nome}`);

        res.json({ message: 'Conta deletada com sucesso!' });
    } catch (error) {
        console.error('Erro ao deletar conta:', error);
        res.status(500).json({ error: 'Erro ao deletar conta' });
    }
});

// ============ HELPER FOR LOGS ============

async function createLog(categoria, subcategoria, detalhes = '') {
    try {
        await supabase
            .from('logs')
            .insert([{
                categoria,
                subcategoria,
                detalhes,
                timestamp: new Date().toISOString()
            }]);
    } catch (e) {
        // Se tabela não existe, apenas loga no console
        console.warn('⚠️  Aviso: Tabela "logs" não existe. Log não registrado.');
    }
}

// ============ LOGS ENDPOINTS ============

// GET all logs (admin)
app.get('/api/logs', async (req, res) => {
    if (!isAdminToken(req)) {
        return res.status(403).json({ error: 'Acesso negado' });
    }

    try {
        const { data: logs, error } = await supabase
            .from('logs')
            .select('*')
            .order('timestamp', { ascending: false });

        // Se tabela não existe, retorna vazio
        if (error?.code === 'PGRST116' || error?.message?.includes('logs')) {
            return res.json([]);
        }

        if (error) throw error;
        res.json(logs || []);
    } catch (error) {
        console.error('Erro ao buscar logs:', error);
        res.status(500).json({ error: 'Erro ao buscar logs' });
    }
});

// POST new log
app.post('/api/logs', async (req, res) => {
    const { categoria, subcategoria, detalhes } = req.body;

    if (!categoria || !subcategoria) {
        return res.status(400).json({ error: 'Categoria e subcategoria são obrigatórias' });
    }

    try {
        const { data: log, error } = await supabase
            .from('logs')
            .insert([{
                categoria,
                subcategoria,
                detalhes: detalhes || '',
                timestamp: new Date().toISOString()
            }])
            .select();

        if (error) throw error;
        res.status(201).json(log);
    } catch (error) {
        console.error('Erro ao criar log:', error);
        // Não retorna erro - logs são secundários
        res.status(201).json({ warning: 'Log não pôde ser registrado' });
    }
});

// DELETE all logs (admin)
app.delete('/api/logs', async (req, res) => {
    if (!isAdminToken(req)) {
        return res.status(403).json({ error: 'Acesso negado' });
    }

    try {
        const { error } = await supabase
            .from('logs')
            .delete()
            .neq('id', 0); // Delete all records

        // Se tabela não existe, ainda retorna sucesso (logs são secundários)
        if (error?.code === 'PGRST116' || error?.message?.includes('logs')) {
            return res.json({ message: 'Nenhum log para deletar (tabela não existe)' });
        }

        if (error) throw error;
        res.json({ message: 'Todos os logs foram deletados' });
    } catch (error) {
        console.error('Erro ao deletar logs:', error);
        // Retorna sucesso mesmo com erro - logs são secundários
        res.json({ message: 'Logs deletados ou não existem' });
    }
});

// ===== ENDPOINTS DE BANCO DE DADOS (APENAS ADMIN) =====

// Listar tabelas do banco
app.get('/api/database/tables', async (req, res) => {
    if (!isAdminToken(req)) {
        console.warn('⚠️ Acesso negado - token inválido');
        return res.status(401).json({ error: 'Acesso negado - token de admin inválido' });
    }

    if (!supabase) {
        console.error('❌ Supabase não configurado');
        return res.status(503).json({ error: 'Supabase não configurado' });
    }

    try {
        console.log('📥 Buscando tabelas do Supabase...');
        const { data, error } = await supabase.rpc('get_table_names', {});
        
        if (error) {
            console.warn('⚠️ RPC get_table_names não disponível:', error.message);
            // Se RPC não existe, retornar tabelas conhecidas
            const tabelas = ['usuarios', 'comentarios', 'galeria', 'calendario', 'descricao_turma', 'logs'];
            console.log('✅ Retornando tabelas conhecidas:', tabelas);
            return res.json({ tables: tabelas });
        }

        console.log('✅ Tabelas do RPC:', data);
        res.json({ tables: data || [] });
    } catch (error) {
        console.error('❌ Erro ao listar tabelas:', error);
        // Retornar tabelas conhecidas como fallback
        const tabelas = ['usuarios', 'comentarios', 'galeria', 'calendario', 'descricao_turma', 'logs'];
        console.log('✅ Fallback: retornando tabelas conhecidas');
        res.json({ tables: tabelas });
    }
});

// Buscar conteúdo de uma tabela específica
app.get('/api/database/table/:tableName', async (req, res) => {
    if (!isAdminToken(req)) {
        return res.status(401).json({ error: 'Acesso negado - token inválido' });
    }

    if (!supabase) {
        return res.status(503).json({ error: 'Supabase não configurado' });
    }

    const { tableName } = req.params;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);

    // Lista de tabelas permitidas (whitelist para segurança)
    const tabelasPermitidas = ['usuarios', 'comentarios', 'galeria', 'calendario', 'descricao_turma', 'logs'];
    
    if (!tabelasPermitidas.includes(tableName)) {
        return res.status(400).json({ error: `Tabela não permitida: ${tableName}` });
    }

    try {
        console.log(`📥 Buscando dados da tabela: ${tableName} (limit=${limit}, offset=${offset})`);
        
        const { data, error, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact' })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error(`❌ Erro ao buscar dados de ${tableName}:`, {
                code: error.code,
                message: error.message,
                details: error.details
            });
            
            // Se tabela não existe, retornar dados vazios
            if (error.code === 'PGRST205' || error.message?.includes('relation')) {
                console.warn(`⚠️ Tabela ${tableName} não encontrada, retornando dados vazios`);
                return res.json({
                    tableName,
                    data: [],
                    total: 0,
                    limit,
                    offset,
                    pages: 0
                });
            }
            
            return res.status(500).json({ 
                error: `Erro ao buscar dados da tabela ${tableName}: ${error.message}`,
                code: error.code
            });
        }

        console.log(`✅ ${data?.length || 0} registros encontrados em ${tableName}`);
        res.json({
            tableName,
            data: data || [],
            total: count || 0,
            limit,
            offset,
            pages: Math.ceil((count || 0) / limit)
        });
    } catch (error) {
        console.error(`❌ Erro na rota de busca da tabela ${tableName}:`, error);
        res.status(500).json({ error: `Erro ao buscar dados da tabela ${tableName}: ${error.message}` });
    }
});

app.delete('/api/database/table/:tableName/row/:id', async (req, res) => {
    if (!isDevToken(req)) {
        return res.status(401).json({ error: 'Acesso negado' });
    }

    const { tableName, id } = req.params;
    const tabelasPermitidas = ['usuarios', 'comentarios', 'galeria', 'calendario', 'descricao_turma', 'logs'];
    if (!tabelasPermitidas.includes(tableName)) {
        return res.status(400).json({ error: 'Tabela não permitida' });
    }

    try {
        const { data, error } = await supabase
            .from(tableName)
            .delete()
            .eq('id', id);

        if (error) throw error;

        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'Registro não encontrado' });
        }

        res.json({ message: 'Registro excluído com sucesso' });
    } catch (error) {
        console.error(`Erro ao excluir registro de ${tableName}:`, error);
        res.status(500).json({ error: 'Erro ao excluir registro' });
    }
});

app.delete('/api/database/table/:tableName/column/:columnName', async (req, res) => {
    if (!isDevToken(req)) {
        return res.status(401).json({ error: 'Acesso negado' });
    }

    const { tableName, columnName } = req.params;
    const tabelasPermitidas = ['usuarios', 'comentarios', 'galeria', 'calendario', 'descricao_turma', 'logs'];
    if (!tabelasPermitidas.includes(tableName)) {
        return res.status(400).json({ error: 'Tabela não permitida' });
    }

    if (columnName.toLowerCase() === 'id') {
        return res.status(403).json({ error: 'Não é permitido limpar a coluna de ID' });
    }

    try {
        const { data, error } = await supabase
            .from(tableName)
            .update({ [columnName]: null })
            .not('id', 'is', null);

        if (error) throw error;

        res.json({ message: `Coluna ${columnName} limpa com sucesso` });
    } catch (error) {
        console.error(`Erro ao limpar coluna ${columnName} de ${tableName}:`, error);
        res.status(500).json({ error: `Erro ao limpar coluna ${columnName}` });
    }
});

app.delete('/api/database/table/:tableName/clear', async (req, res) => {
    if (!isDevToken(req)) {
        return res.status(401).json({ error: 'Acesso negado' });
    }

    const { tableName } = req.params;
    const tabelasPermitidas = ['usuarios', 'comentarios', 'galeria', 'calendario', 'descricao_turma', 'logs'];
    if (!tabelasPermitidas.includes(tableName)) {
        return res.status(400).json({ error: 'Tabela não permitida' });
    }

    try {
        const { data, error } = await supabase
            .from(tableName)
            .delete()
            .not('id', 'is', null);

        if (error) throw error;

        res.json({ message: `Tabela ${tableName} limpa com sucesso` });
    } catch (error) {
        console.error(`Erro ao limpar tabela ${tableName}:`, error);
        res.status(500).json({ error: `Erro ao limpar tabela ${tableName}` });
    }
});

// Rotas explícitas para servir arquivos HTML
app.get('/auth/admin/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/auth/admin/admin.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/auth/admin/admin.html'));
});

app.get('/auth/login/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/auth/login/login.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/auth/login/login.html'));
});

app.get('/auth/cadastro/cadastro', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/auth/cadastro/cadastro.html'));
});

app.get('/cadastro', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/auth/cadastro/cadastro.html'));
});

// Catchall: retornar 404 JSON (não tentar servir arquivos em serverless)
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Rota não encontrada. Use uma rota /api/...',
        path: req.path,
        method: req.method 
    });
});

export default app;
