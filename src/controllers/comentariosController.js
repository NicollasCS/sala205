import { supabase } from '../utils/supabase.js';
import { isProfane, createLog } from '../utils/helpers.js';
import { MAX_ROOT_COMMENTS, MAX_COMMENT_LENGTH, MAX_GALLERY_COMMENT_LENGTH, VALID_EMOJIS } from '../config/constants.js';

// ========== COMENTÁRIOS PRINCIPAIS ==========

/**
 * Listar todos os comentários
 */
export async function listComentarios(req, res) {
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
}

/**
 * Criar novo comentário
 */
export async function createComentario(req, res) {
    const { autor, texto, parent_id } = req.body;
    const is_admin = autor === 'administrador_turma205-1';

    if (!autor || !texto) {
        return res.status(400).json({ error: 'Autor e texto são obrigatórios' });
    }

    if (texto.length > MAX_COMMENT_LENGTH) {
        return res.status(400).json({ error: `Comentário muito longo. Máximo ${MAX_COMMENT_LENGTH} caracteres.` });
    }

    if (isProfane(texto)) {
        return res.status(400).json({ error: 'Comentário contém linguagem inadequada.' });
    }

    try {
        if (!parent_id && !is_admin) {
            const { data, error: countError } = await supabase
                .from('comentarios')
                .select('id', { count: 'exact' })
                .eq('autor', autor)
                .is('parent_id', null);

            if (!countError && data && data.length >= MAX_ROOT_COMMENTS) {
                return res.status(400).json({ error: `Limite de ${MAX_ROOT_COMMENTS} comentários principais atingido.` });
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

        await createLog('COMENTÁRIOS', 'NOVO COMENTÁRIO', `Comentário de ${autor}`);

        res.status(201).json(comentario);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar comentário' });
    }
}

/**
 * Reação em comentário
 */
export async function reagirComentario(req, res) {
    const { id } = req.params;
    const { emoji, autor } = req.body;

    if (!VALID_EMOJIS.includes(emoji) || !autor) {
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
}

/**
 * Fixar/desafixar comentário
 */
export async function pinComentario(req, res) {
    const { id } = req.params;

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

        await createLog('COMENTÁRIOS', newPinned ? 'FIXAR' : 'DESAFIXAR', `Comentário ${id} ${newPinned ? 'fixado' : 'desafixado'}`);

        res.json({ is_pinned: newPinned });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Erro ao fixar' });
    }
}

/**
 * Atualizar comentário (admin)
 */
export async function updateComentario(req, res) {
    const { id } = req.params;
    const { autor, texto } = req.body;

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

        await createLog('COMENTÁRIOS', 'EDITAR', `Comentário ${id} editado`);

        res.json({ message: 'Comentário atualizado', comentario: updated });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar comentário' });
    }
}

/**
 * Deletar comentário próprio
 */
export async function deleteComentarioSeu(req, res) {
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
            return res.status(403).json({ error: 'Você só pode excluir seus próprios comentários.' });
        }

        const { error } = await supabase
            .from('comentarios')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await createLog('COMENTÁRIOS', 'DELETAR', `Comentário ${id} deletado pelo autor`);

        res.json({ message: 'Comentário excluído com sucesso.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao excluir comentário' });
    }
}

/**
 * Deletar comentário (admin)
 */
export async function deleteComentario(req, res) {
    const { id } = req.params;

    try {
        const { error } = await supabase
            .from('comentarios')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await createLog('COMENTÁRIOS', 'DELETAR', `Comentário ${id} deletado por admin`);

        res.json({ message: 'Comentário excluído' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao excluir comentário' });
    }
}

// ========== COMENTÁRIOS DE GALERIA ==========

/**
 * Listar comentários de uma mídia
 */
export async function listComentariosGaleria(req, res) {
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
}

/**
 * Criar comentário em galeria
 */
export async function createComentarioGaleria(req, res) {
    const { galeriaId } = req.params;
    const { autor, texto } = req.body;

    if (!autor || !texto) {
        return res.status(400).json({ error: 'Autor e texto são obrigatórios' });
    }

    if (texto.length > MAX_GALLERY_COMMENT_LENGTH) {
        return res.status(400).json({ error: `Comentário muito longo. Máximo ${MAX_GALLERY_COMMENT_LENGTH} caracteres.` });
    }

    if (texto.trim().length === 0) {
        return res.status(400).json({ error: 'Comentário não pode estar vazio' });
    }

    if (isProfane(texto)) {
        return res.status(400).json({ error: 'Comentário contém linguagem inadequada.' });
    }

    try {
        const { data: existingComment, error: checkError } = await supabase
            .from('comentarios_galeria')
            .select('id')
            .eq('galeria_id', galeriaId)
            .eq('autor', autor)
            .single();

        if (!checkError && existingComment) {
            return res.status(400).json({ error: 'Você já comentou aqui. Exclua o comentário anterior para comentar novamente.' });
        }

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

        await createLog('COMENTÁRIOS_GALERIA', 'NOVO', `Comentário em mídia ${galeriaId}`);

        res.status(201).json(novoComentario);
    } catch (error) {
        console.error('Erro ao criar comentário:', error);
        res.status(500).json({ error: 'Erro ao criar comentário' });
    }
}

/**
 * Deletar comentário de galeria
 */
export async function deleteComentarioGaleria(req, res) {
    const { comentarioId } = req.params;
    const { autor } = req.body;

    if (!autor) {
        return res.status(400).json({ error: 'Autor é obrigatório' });
    }

    try {
        const { data: comentario, error: checkError } = await supabase
            .from('comentarios_galeria')
            .select('*')
            .eq('id', comentarioId)
            .single();

        if (checkError || !comentario) {
            return res.status(404).json({ error: 'Comentário não encontrado' });
        }

        const isAdmin = autor === 'administrador_turma205-1';
        if (comentario.autor !== autor && !isAdmin) {
            return res.status(403).json({ error: 'Você não pode deletar este comentário' });
        }

        const { error } = await supabase
            .from('comentarios_galeria')
            .delete()
            .eq('id', comentarioId);

        if (error) throw error;

        await createLog('COMENTÁRIOS_GALERIA', 'DELETAR', `Comentário ${comentarioId} deletado`);

        res.json({ message: 'Comentário deletado' });
    } catch (error) {
        console.error('Erro ao deletar comentário:', error);
        res.status(500).json({ error: 'Erro ao deletar comentário' });
    }
}
