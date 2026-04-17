/**
 * 💬 Controllers de comentários gerais (não de galeria)
 */
import { isProfane, isAdminToken } from '../utils/helpers.js';

/**
 * GET /api/comentarios - Listar todos os comentários
 */
function handleGetComentarios(supabase) {
    return async (req, res) => {
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
    };
}

/**
 * POST /api/comentarios - Criar comentário
 */
function handleCreateComentario(supabase) {
    return async (req, res) => {
        const { autor, texto, parent_id } = req.body;
        const is_admin = autor === 'administrador_turma205-1';

        if (!autor || !texto) {
            return res.status(400).json({ error: 'Autor e texto são obrigatórios' });
        }

        if (texto.length > 120) {
            return res.status(400).json({ error: 'Comentário muito longo. Máximo 120 caracteres.' });
        }

        if (isProfane(texto)) {
            return res.status(400).json({ error: 'Comentário contém linguagem inadequada. Por favor, revise.' });
        }

        try {
            if (!parent_id && !is_admin) {
                const { data } = await supabase
                    .from('comentarios')
                    .select('id')
                    .eq('autor', autor)
                    .is('parent_id', null);

                if (data && data.length >= 2) {
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
    };
}

/**
 * POST /api/comentarios/:id/react - Reagir a comentário
 */
function handleReactComentario(supabase) {
    return async (req, res) => {
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
    };
}

/**
 * PUT /api/comentarios/:id/pin - Fixar/desafixar comentário (admin)
 */
function handlePinComentario(supabase) {
    return async (req, res) => {
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
    };
}

/**
 * PUT /api/comentarios/:id - Atualizar comentário (admin)
 */
function handleUpdateComentario(supabase) {
    return async (req, res) => {
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
    };
}

/**
 * DELETE /api/comentarios/meus/:id - Deletar próprio comentário (user)
 */
function handleDeleteMyComentario(supabase) {
    return async (req, res) => {
        const { id } = req.params;
        const { autor } = req.body;
        
        console.log(`🗑️ DELETE /api/comentarios/meus/:id - ID: ${id}, Autor: ${autor}`);

        if (!autor) {
            console.warn('⚠️ Autor não fornecido no body');
            return res.status(400).json({ error: 'Autor é obrigatório para verificação.' });
        }

        if (!supabase) {
            console.error('❌ Supabase não configurado');
            return res.status(503).json({ error: 'Supabase não configurado' });
        }

        try {
            console.log(`📥 Buscando comentário ID: ${id}`);
            const { data: comentario, error: fetchError } = await supabase
                .from('comentarios')
                .select('autor')
                .eq('id', id)
                .single();

            if (fetchError) {
                console.error(`❌ Erro ao buscar comentário:`, fetchError);
                return res.status(404).json({ error: 'Comentário não encontrado.', details: fetchError.message });
            }

            if (!comentario) {
                console.warn(`⚠️ Comentário ID ${id} não encontrado`);
                return res.status(404).json({ error: 'Comentário não encontrado.' });
            }

            if (comentario.autor !== autor) {
                console.warn(`⚠️ Acesso negado - comentário autor: ${comentario.autor}, solicitante: ${autor}`);
                return res.status(403).json({ error: 'Acesso negado. Você só pode excluir seus próprios comentários.' });
            }

            console.log(`🔄 Deletando comentário ID: ${id}`);
            const { error } = await supabase
                .from('comentarios')
                .delete()
                .eq('id', id);

            if (error) throw error;

            console.log(`✅ Comentário ${id} excluído com sucesso`);
            res.json({ message: 'Comentário excluído com sucesso.' });
        } catch (error) {
            console.error(`❌ Erro ao excluir comentário:`, error);
            res.status(500).json({ error: 'Erro ao excluir comentário', details: error.message });
        }
    };
}

/**
 * DELETE /api/comentarios/:id - Deletar comentário (admin)
 */
function handleDeleteComentario(supabase) {
    return async (req, res) => {
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
    };
}

export {
    handleGetComentarios,
    handleCreateComentario,
    handleReactComentario,
    handlePinComentario,
    handleUpdateComentario,
    handleDeleteMyComentario,
    handleDeleteComentario
};
