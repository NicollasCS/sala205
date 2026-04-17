/**
 * 🖼️ Controllers de galeria e comentários de galeria
 */
import { isProfane } from '../utils/helpers.js';

/**
 * GET /api/galeria/:galeriaId/comentarios - Listar comentários de uma galeria
 */
function handleGetGaleriaComentarios(supabase) {
    return async (req, res) => {
        const { galeriaId } = req.params;
        
        console.log(`📖 GET /api/galeria/:galeriaId/comentarios - Galeria ID: ${galeriaId}`);

        if (!supabase) {
            console.error('❌ Supabase não configurado');
            return res.status(503).json({ error: 'Supabase não configurado' });
        }

        try {
            console.log(`📥 Buscando comentários para galeria ID: ${galeriaId}`);
            const { data, error } = await supabase
                .from('comentarios_galeria')
                .select('*')
                .eq('galeria_id', galeriaId)
                .order('criado', { ascending: false });

            if (error) {
                console.error(`❌ Erro ao buscar comentários:`, error);
                return res.status(500).json({ error: 'Erro ao buscar comentários', details: error.message });
            }

            console.log(`✅ ${data?.length || 0} comentários encontrados para galeria ${galeriaId}`);
            res.json(data || []);
        } catch (error) {
            console.error(`❌ Erro ao buscar comentários:`, error);
            res.status(500).json({ error: 'Erro ao buscar comentários', details: error.message });
        }
    };
}

/**
 * POST /api/galeria/:galeriaId/comentarios - Criar comentário em galeria
 */
function handleCreateGaleriaComentario(supabase) {
    return async (req, res) => {
        const { galeriaId } = req.params;
        const { autor, texto } = req.body;
        
        console.log(`✍️ POST /api/galeria/:galeriaId/comentarios - Galeria ID: ${galeriaId}, Autor: ${autor}`);

        if (!supabase) {
            console.error('❌ Supabase não configurado');
            return res.status(503).json({ error: 'Supabase não configurado' });
        }

        if (!autor || !texto) {
            console.warn(`⚠️ Dados incompletos - autor: ${autor}, texto: ${texto?.substring(0, 20) || 'N/A'}`);
            return res.status(400).json({ error: 'Autor e texto são obrigatórios' });
        }

        if (texto.length > 100) {
            console.warn(`⚠️ Texto muito longo: ${texto.length} caracteres (máximo 100)`);
            return res.status(400).json({ error: 'Comentário muito longo. Máximo 100 caracteres.' });
        }

        if (texto.trim().length === 0) {
            console.warn(`⚠️ Texto vazio ou só com espaços`);
            return res.status(400).json({ error: 'Comentário não pode estar vazio' });
        }

        if (isProfane(texto)) {
            console.warn(`⚠️ Texto contém palavrões: ${texto}`);
            return res.status(400).json({ error: 'Comentário contém linguagem inadequada. Por favor, revise.' });
        }

        try {
            const { data: existingComment } = await supabase
                .from('comentarios_galeria')
                .select('id')
                .eq('galeria_id', galeriaId)
                .eq('autor', autor)
                .single();

            if (existingComment) {
                console.warn(`⚠️ Usuário ${autor} já comentou na galeria ${galeriaId}`);
                return res.status(400).json({ error: 'Você já comentou aqui. Exclua o comentário anterior para comentar novamente.' });
            }

            console.log(`🔄 Inserindo novo comentário na galeria ${galeriaId}`);
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

            console.log(`✅ Novo comentário criado na galeria ${galeriaId} por ${autor}`);
            res.status(201).json(novoComentario);
        } catch (error) {
            console.error('❌ Erro ao criar comentário:', error);
            res.status(500).json({ error: 'Erro ao criar comentário', details: error.message });
        }
    };
}

/**
 * DELETE /api/galeria/comentarios/:comentarioId - Deletar comentário de galeria
 */
function handleDeleteGaleriaComentario(supabase) {
    return async (req, res) => {
        const { comentarioId } = req.params;
        const { autor } = req.body;
        
        console.log(`🗑️ DELETE /api/galeria/comentarios/:comentarioId - Comentário ID: ${comentarioId}, Autor: ${autor}`);

        if (!autor) {
            console.warn(`⚠️ Autor não fornecido no body`);
            return res.status(400).json({ error: 'Autor é obrigatório' });
        }

        if (!supabase) {
            console.error('❌ Supabase não configurado');
            return res.status(503).json({ error: 'Supabase não configurado' });
        }

        try {
            console.log(`📥 Buscando comentário ID: ${comentarioId}`);
            const { data: comentario, error: checkError } = await supabase
                .from('comentarios_galeria')
                .select('*')
                .eq('id', comentarioId)
                .single();

            if (checkError || !comentario) {
                console.warn(`⚠️ Comentário ID ${comentarioId} não encontrado`);
                return res.status(404).json({ error: 'Comentário não encontrado' });
            }

            const isAdmin = autor === 'administrador_turma205-1';
            if (comentario.autor !== autor && !isAdmin) {
                console.warn(`⚠️ Acesso negado - comentário autor: ${comentario.autor}, solicitante: ${autor}`);
                return res.status(403).json({ error: 'Você não pode deletar este comentário' });
            }

            console.log(`🔄 Deletando comentário ID: ${comentarioId}`);
            const { error } = await supabase
                .from('comentarios_galeria')
                .delete()
                .eq('id', comentarioId);

            if (error) throw error;

            console.log(`✅ Comentário ${comentarioId} deletado com sucesso`);
            res.json({ message: 'Comentário deletado' });
        } catch (error) {
            console.error(`❌ Erro ao deletar comentário:`, error);
            res.status(500).json({ error: 'Erro ao deletar comentário', details: error.message });
        }
    };
}

export {
    handleGetGaleriaComentarios,
    handleCreateGaleriaComentario,
    handleDeleteGaleriaComentario
};
