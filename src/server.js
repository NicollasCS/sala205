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
const PORT = process.env.PORT || 3000;
const GALERIA_PAGE_SIZE = 5;

// 📝 NOTA: Upload de vídeos agora usa Supabase Storage (não mais local)
// Multer deixado para referência, mas não é mais usado
// const uploadDir = path.join(__dirname, '../public/uploads/videos');
// const upload = multer({...});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Supabase Client
const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || ''
);

function isAdminToken(req) {
    const token = req.headers['x-admin-token'];
    return token === 'turma205-admin' || token === 'turma205-dev';
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

// Rota para login (com suporte a Admin sem criptografia)
app.post('/api/login', async (req, res) => {
    const { nome, senha } = req.body;

    if (!nome || !senha) {
        return res.status(400).json({ error: 'Nome e senha são obrigatórios' });
    }

    try {
        // Se é admin, compara o hash MD5 da senha
        if (nome === 'administrador_turma205-1') {
            const adminSenhaHash = crypto.createHash('md5').update('administrador_turma205-1').digest('hex');
            if (senha === adminSenhaHash) {
                return res.json({
                    message: 'Login bem-sucedido!',
                    user: {
                        id: 'admin',
                        nome: 'administrador_turma205-1',
                        is_admin: true
                    }
                });
            }
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Para usuários normais, busca com MD5
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

        res.json({
            message: 'Login bem-sucedido!',
            user: {
                id: user.id,
                nome: user.nome,
                is_admin: nome === 'administrador_turma205-1'
            }
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

// Rota para renomear usuário
app.put('/api/usuarios/renomear', async (req, res) => {
    const { id, nomeAtual, novoNome } = req.body;

    if (!id || !nomeAtual || !novoNome) {
        return res.status(400).json({ error: 'Dados incompletos.' });
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
    try {
        const { data: usuarios, error } = await supabase
            .from('usuarios')
            .select('id, nome, created')
            .order('created', { ascending: false });

        if (error) throw error;

        res.json(usuarios || []);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar usuários' });
    }
});

// Rota para excluir usuário e seus comentários
app.delete('/api/usuarios', async (req, res) => {
    const { id, nome } = req.body;

    if (!id || !nome) {
        return res.status(400).json({ error: 'ID e nome do usuário são obrigatórios.' });
    }

    if (nome === 'administrador_turma205-1') {
        return res.status(403).json({ error: 'Esta conta de administrador não pode ser excluída.' });
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
            query = query.order('position', { ascending: true, nullsFirst: false });
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

                const insertData = {
                    titulo,
                    descricao,
                    url: publicUrl,
                    data: data || null,
                    position: nextPos,
                    tipo_midia: tipo_midia || 'video',
                    storage_key: videoFilename
                };

                const { data: novaImagem, error } = await supabase
                    .from('galeria')
                    .insert([insertData])
                    .select();

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
        await Promise.all(
            orderedIds.map((id, index) =>
                supabase
                    .from('galeria')
                    .update({ position: index + 1 })
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
        return res.status(401).json({ error: 'Acesso negado' });
    }

    try {
        // Obter o item da galeria para pegar a storage_key
        const { data: galeriaItem, error: fetchError } = await supabase
            .from('galeria')
            .select('storage_key, url')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        // Se tem storage_key, deletar do Supabase Storage
        if (galeriaItem?.storage_key) {
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

        if (error) throw error;

        await ensureGaleriaPositions();
        res.json({ message: 'Imagem/vídeo apagado com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao apagar imagem/vídeo' });
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

// Rotas explícitas para servir arquivos HTML
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/auth/admin/admin.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/auth/login/login.html'));
});

app.get('/cadastro', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/auth/cadastro/cadastro.html'));
});

// Fallback para index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, async () => {
    await initDB();
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`Conectado ao Supabase: ${process.env.SUPABASE_URL}`);

    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('id')
            .eq('nome', 'administrador_turma205-1')
            .limit(1)
            .single();

        if (error && error.code === 'PGRST116') {
            await supabase
                .from('usuarios')
                .insert([{
                    nome: 'administrador_turma205-1',
                    senha: 'admin123'
                }]);
            console.log('✅ Usuário administrador criado');
        } else if (data) {
            console.log('Admin already exists or setup complete');
        }
    } catch (e) {
        console.log('Admin already exists or setup complete');
    }
});
