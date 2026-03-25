// PIN comment (admin)
app.put('/api/comentarios/:id/pin', async (req, res) => {
    const { id } = req.params;
    const adminToken = req.headers['x-admin-token'];

    if (adminToken !== 'turma205-admin') {
        return res.status(403).json({ error: 'Acesso negado. Administrador requerido.' });
    }

    try {
        const db = await initDB();
        const comment = await db.get('SELECT is_pinned FROM comentarios WHERE id = ?', [id]);
        if (!comment) {
            await db.close();
            return res.status(404).json({ error: 'Comentário não encontrado.' });
        }

        const newPinned = comment.is_pinned ? 0 : 1;
        await db.run('UPDATE comentarios SET is_pinned = ? WHERE id = ?', [newPinned, id]);
        await db.close();
        res.json({ message: `Comentário ${newPinned ? 'fixado' : 'desfixado'}`, is_pinned: newPinned });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao fixar comentário' });
    }
});

// React to comment
app.post('/api/comentarios/:id/react', async (req, res) => {
    const { id } = req.params;
    const { emoji, autor } = req.body;

    const validEmojis = ['👍', '❤️', '👎'];
    if (!validEmojis.includes(emoji) || !autor) {
        return res.status(400).json({ error: 'Emoji inválido ou autor ausente.' });
    }

    try {
        const db = await initDB();
        const comment = await db.get('SELECT reactions, user_reactions FROM comentarios WHERE id = ?', [id]);
        if (!comment) {
            await db.close();
            return res.status(404).json({ error: 'Comentário não encontrado.' });
        }

        let reactions = JSON.parse(comment.reactions || '{}');
        let userReactions = JSON.parse(comment.user_reactions || '{}');

        // Toggle reaction for user
        if (userReactions[autor] === emoji) {
            delete userReactions[autor];
            reactions[emoji] = Math.max(0, (reactions[emoji] || 0) - 1);
        } else {
            userReactions[autor] = emoji;
            reactions[emoji] = (reactions[emoji] || 0) + 1;
        }

        await db.run(
            'UPDATE comentarios SET reactions = ?, user_reactions = ? WHERE id = ?', 
            [JSON.stringify(reactions), JSON.stringify(userReactions), id]
        );
        await db.close();
        res.json({ reactions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro na reação' });
    }
});

