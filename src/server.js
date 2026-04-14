import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Supabase Client
const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || ''
);

// Função para inicializar o banco (criar tabelas se não existirem)
async function initDB() {
    try {
        // Criar tabela usuários
        const { error: usuariosError } = await supabase
            .from('usuarios')
            .select('count()', { count: 'exact' })
            .limit(0);

        if (usuariosError && usuariosError.code === 'PGRST116') {
            // Tabela não existe, criar
            const { error: createUserTableError } = await supabase.rpc('create_usuarios_table', {}, { count: 'exact' });
        }

        // Criar tabela comentários
        const { error: comentariosError } = await supabase
            .from('comentarios')
            .select('count()', { count: 'exact' })
            .limit(0);

        if (comentariosError && comentariosError.code === 'PGRST116') {
            // Tabela não existe, criar
            const { error: createTableError } = await supabase.rpc('create_comentarios_table', {}, { count: 'exact' });
        }

        return supabase;
    } catch (err) {
        console.error('Erro ao inicializar banco:', err);
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
        // Verificar se usuário já existe
        const { data: existing } = await supabase
            .from('usuarios')
            .select('id')
            .eq('nome', nome)
            .limit(1);

        if (existing && existing.length > 0) {
            return res.status(409).json({ error: 'Nome de usuário não disponível. Escolha outro.' });
        }

        // Inserir novo usuário
        const { data, error } = await supabase
            .from('usuarios')
            .insert([{ nome, senha }])
            .select();

        if (error) throw error;

        res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao cadastrar usuário' });
    }
});

// Rota para login
app.post('/api/login', async (req, res) => {
    const { nome, senha } = req.body;

    if (!nome || !senha) {
        return res.status(400).json({ error: 'Nome e senha são obrigatórios' });
    }

    try {
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
        // Top-level limit for non-admin
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

// --- Rotas de Reação e Fixação (Integradas do pin_react.js) ---

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

        let reactions = comment.reactions || { '👍': 0, '👎': 0, '❤️': 0 };
        let userReactions = comment.user_reactions || {};

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
    const adminToken = req.headers['x-admin-token'];

    if (adminToken !== 'turma205-admin') {
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
    const adminToken = req.headers['x-admin-token'];

    if (adminToken !== 'turma205-admin') {
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
    const adminToken = req.headers['x-admin-token'];

    if (adminToken !== 'turma205-admin') {
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
        // Verifica se novo nome já existe
        const { data: existing } = await supabase
            .from('usuarios')
            .select('id')
            .eq('nome', novoNome);

        if (existing && existing.length > 0) {
            return res.status(409).json({ error: 'Este nome já está em uso.' });
        }

        // Atualiza nome do usuário
        await supabase
            .from('usuarios')
            .update({ nome: novoNome })
            .eq('id', id);

        // Atualiza autoria dos comentários para manter a posse
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
        // Excluir comentários do usuário
        await supabase
            .from('comentarios')
            .delete()
            .eq('autor', nome);

        // Excluir o usuário
        await supabase
            .from('usuarios')
            .delete()
            .eq('id', id)
            .eq('nome', nome);

        res.json({ message: 'Sua conta e todos os seus comentários foram excluídos com sucesso.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao excluir a conta.' });
    }
});

app.listen(PORT, async () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`Conectado ao Supabase: ${process.env.SUPABASE_URL}`);
    
    // Garante admin ID 1
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('id')
            .eq('nome', 'administrador_turma205-1')
            .limit(1)
            .single();

        if (error && error.code === 'PGRST116') {
            // Admin não existe, criar
            await supabase
                .from('usuarios')
                .insert([{
                    nome: 'administrador_turma205-1',
                    senha: 'admin123', // Alterar em produção!
                }]);
            console.log('✅ Usuário administrador criado');
        }
    } catch (e) {
        console.log('Admin already exists or setup complete');
    }
});
