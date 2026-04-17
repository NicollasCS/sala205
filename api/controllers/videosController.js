/**
 * 🎬 Controller de galeria (videos e imagens)
 */
import busboy from 'busboy';
import { normalizeDescricao, isAdminToken } from '../utils/helpers.js';
import {
    ensureGaleriaPositions,
    ensureGaleriaTipoMidia,
    ensureGaleriaStorageKey
} from '../utils/database.js';

const GALERIA_PAGE_SIZE = 5;

/**
 * GET /api/galeria - Listar galeria com paginação
 */
function handleGetGaleria(supabase) {
    return async (req, res) => {
        try {
            await ensureGaleriaPositions();
            await ensureGaleriaTipoMidia();

            const page = Math.max(0, parseInt(req.query.page, 10) || 0);
            const limit = Math.max(1, parseInt(req.query.limit, 10) || GALERIA_PAGE_SIZE);
            const offset = page * limit;

            let query = supabase
                .from('galeria')
                .select('*', { count: 'exact' });

            try {
                query = query.order('position', { ascending: false, nullsFirst: false });
            } catch {
                query = query.order('data', { ascending: false });
            }

            const { data: galeria, error, count } = await query.range(offset, offset + limit - 1);

            if (error && error.code === '42703') {
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
    };
}

/**
 * POST /api/galeria - Criar item de galeria (foto)
 */
function handleCreateGaleria(supabase) {
    return async (req, res) => {
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
    };
}

/**
 * POST /api/galeria/video-upload - Upload de vídeo para Supabase Storage
 */
function handleVideoUpload(supabase) {
    return async (req, res) => {
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

                    const timestamp = Date.now();
                    const randomStr = Math.random().toString(36).substring(7);
                    videoFilename = `video_${timestamp}_${randomStr}`;

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

                    const urlData = supabase
                        .storage
                        .from('galeria-videos')
                        .getPublicUrl(videoFilename);
                    
                    if (!urlData || !urlData.data || !urlData.data.publicUrl) {
                        throw new Error('Falha ao gerar URL pública do vídeo');
                    }
                    
                    const publicUrl = urlData.data.publicUrl;

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
    };
}

/**
 * PUT /api/galeria/:id - Atualizar item de galeria
 */
function handleUpdateGaleria(supabase) {
    return async (req, res) => {
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
    };
}

/**
 * PUT /api/galeria/reorder - Reordenar galeria
 */
function handleReorderGaleria(supabase) {
    return async (req, res) => {
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
            if (error.code === '42703') {
                console.warn('⚠️  Coluna position não existe. Reordenação em memória apenas.');
                return res.json({ message: 'Ordem atualizada (sem persistência - adicione coluna position na galeria)' });
            }
            console.error(error);
            res.status(500).json({ error: 'Erro ao reordenar galeria' });
        }
    };
}

/**
 * DELETE /api/galeria/:id - Deletar item de galeria
 */
function handleDeleteGaleria(supabase) {
    return async (req, res) => {
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

            const { data: galeriaItem, error: fetchError } = await supabase
                .from('galeria')
                .select(selectCols)
                .eq('id', id)
                .single();

            if (fetchError || !galeriaItem) {
                return res.status(404).json({ error: 'Mídia não encontrada' });
            }

            // Deletar comentários associados
            await supabase
                .from('comentarios_galeria')
                .delete()
                .eq('galeria_id', id);

            // Se tem storage_key e é vídeo, deletar do Storage
            if (hasStorageKey && galeriaItem.storage_key) {
                try {
                    await supabase.storage.from('galeria-videos').remove([galeriaItem.storage_key]);
                } catch (storageError) {
                    console.warn('⚠️  Erro ao deletar vídeo do Storage:', storageError.message);
                }
            }

            // Deletar da galeria
            const { error: deleteError } = await supabase
                .from('galeria')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            res.json({ message: 'Mídia excluída com sucesso' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: `Erro ao excluir mídia: ${error.message}` });
        }
    };
}

export {
    handleGetGaleria,
    handleCreateGaleria,
    handleVideoUpload,
    handleUpdateGaleria,
    handleReorderGaleria,
    handleDeleteGaleria
};
