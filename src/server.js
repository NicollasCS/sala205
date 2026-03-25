import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Função para inicializar o banco
async function initDB() {
    const db = await open({
        filename: './database/banco.db',
        driver: sqlite3.Database,
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL UNIQUE,
        senha TEXT NOT NULL,
        created DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS comentarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        autor TEXT NOT NULL,
        texto TEXT NOT NULL,
        parent_id INTEGER DEFAULT NULL, 
        reactions TEXT DEFAULT '{\"👍\":0,\"👎\":0,\"❤️\":0}',
        criado DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    return db;
}

// Rota para cadastro
app.post('/api/cadastro', async (req, res) => {
    const { nome, senha } = req.body;

    if (!nome || !senha) {
        return res.status(400).json({ error: 'Nome e senha são obrigatórios' });
    }

    try {
        const db = await initDB();
        const existing = await db.get('SELECT id FROM usuarios WHERE nome = ?', [nome]);
        if (existing) {
            return res.status(409).json({ error: 'Nome de usuário não disponível. Escolha outro.' });
        }
        await db.run('INSERT INTO usuarios (nome, senha) VALUES (?, ?)', [nome, senha]);
        await db.close();

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
        const db = await initDB();
        const user = await db.get('SELECT * FROM usuarios WHERE nome = ? AND senha = ?', [nome, senha]);
        await db.close();

        if (user) {
            res.json({ message: 'Login bem-sucedido!', user: { id: user.id, nome: user.nome, is_admin: nome === 'administrador_turma205-1' } });
        } else {
            res.status(401).json({ error: 'Credenciais inválidas' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
});

// GET comments
app.get('/api/comentarios', async (req, res) => {
    try {
        const db = await initDB();
        const comentarios = await db.all('SELECT * FROM comentarios ORDER BY criado DESC');
        await db.close();
        res.json(comentarios);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar comentários' });
    }
});

// POST comment
app.post('/api/comentarios', async (req, res) => {
    const { autor, texto, parent_id, is_admin } = req.body;

    if (!autor || !texto) {
        return res.status(400).json({ error: 'Autor e texto são obrigatórios' });
    }

    if (texto.length > 120) {
        return res.status(400).json({ error: 'Comentário muito longo. Máximo 120 caracteres.' });
    }

    try {
        const db = await initDB();
        
        // Top-level limit for non-admin
        if (!parent_id && !is_admin) {
            const count = await db.get('SELECT COUNT(*) as count FROM comentarios WHERE autor = ? AND parent_id IS NULL', [autor]);
            if (count.count >= 2) {
                return res.status(400).json({ error: 'Limite de 2 comentários principais atingido.' });
            }
        }

        const result = await db.run(
            'INSERT INTO comentarios (autor, texto, parent_id) VALUES (?, ?, ?)', 
            [autor, texto, parent_id || null]
        );
        const comentario = await db.get('SELECT * FROM comentarios WHERE id = ?', [result.lastID]);
        await db.close();
        res.status(201).json(comentario);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar comentário' });
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
        const db = await initDB();
        const existing = await db.get('SELECT * FROM comentarios WHERE id = ?', [id]);
        if (!existing) {
            await db.close();
            return res.status(404).json({ error: 'Comentário não encontrado.' });
        }

        await db.run(
            'UPDATE comentarios SET autor = ?, texto = ?, criado = CURRENT_TIMESTAMP WHERE id = ?',
            [autor, texto, id]
        );
        const updated = await db.get('SELECT * FROM comentarios WHERE id = ?', [id]);
        await db.close();
        res.json({ message: 'Comentário atualizado', comentario: updated });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar comentário' });
    }
});

// DELETE own comment (user)
app.delete('/api/comentarios/meus/:id', async (req, res) => {
    const { id } = req.params;
    const { autor } = req.body; // User must send their name for verification

    if (!autor) {
        return res.status(400).json({ error: 'Autor é obrigatório para verificação.' });
    }

    try {
        const db = await initDB();
        const comentario = await db.get('SELECT autor FROM comentarios WHERE id = ?', [id]);

        if (!comentario) {
            return res.status(404).json({ error: 'Comentário não encontrado.' });
        }

        if (comentario.autor !== autor) {
            return res.status(403).json({ error: 'Acesso negado. Você só pode excluir seus próprios comentários.' });
        }

        await db.run('DELETE FROM comentarios WHERE id = ?', [id]);
        await db.close();
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
        const db = await initDB();
        await db.run('DELETE FROM comentarios WHERE id = ?', [id]);
        await db.close();
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
        const db = await initDB();
        
        // Verifica se novo nome já existe
        const existing = await db.get('SELECT id FROM usuarios WHERE nome = ?', [novoNome]);
        if (existing) {
            await db.close();
            return res.status(409).json({ error: 'Este nome já está em uso.' });
        }

        // Atualiza nome do usuário
        await db.run('UPDATE usuarios SET nome = ? WHERE id = ?', [novoNome, id]);
        // Atualiza autoria dos comentários para manter a posse
        await db.run('UPDATE comentarios SET autor = ? WHERE autor = ?', [novoNome, nomeAtual]);

        await db.close();
        res.json({ message: 'Nome atualizado com sucesso.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar nome.' });
    }
});

// GET users (admin)
app.get('/api/usuarios', async (req, res) => {
    try {
        const db = await initDB();
        const usuarios = await db.all('SELECT id, nome, created FROM usuarios ORDER BY created DESC');
        await db.close();
        res.json(usuarios);
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
        const db = await initDB();
        // Usar transação para garantir que ambas as operações funcionem
        await db.exec('BEGIN TRANSACTION');
        // 1. Excluir comentários do usuário
        await db.run('DELETE FROM comentarios WHERE autor = ?', [nome]);
        // 2. Excluir o próprio usuário
        await db.run('DELETE FROM usuarios WHERE id = ? AND nome = ?', [id, nome]);
        await db.exec('COMMIT');
        await db.close();

        res.json({ message: 'Sua conta e todos os seus comentários foram excluídos com sucesso.' });
    } catch (error) {
        console.error(error);
        try {
            await db.exec('ROLLBACK');
        } catch (rbError) { /* ignore */ }
        res.status(500).json({ error: 'Erro ao excluir a conta.' });
    }
});

// GET users (admin)
app.get('/api/usuarios', async (req, res) => {
    try {
        const db = await initDB();
        const usuarios = await db.all('SELECT id, nome, created FROM usuarios ORDER BY created DESC');
        await db.close();
        res.json(usuarios);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar usuários' });
    }
});

app.listen(PORT, async () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    
    // Garante admin ID 1
    try {
        const adminSetup = await import('./setup_admin.js');
        await adminSetup.default();
    } catch (e) {
        console.log('Admin setup OK');
    }
});
