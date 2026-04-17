import busboy from 'busboy';
import { supabase } from '../utils/supabase.js';
import { 
    ensureGaleriaPositions, 
    ensureGaleriaTipoMidia, 
    ensureGaleriaStorageKey,
    createLog 
} from '../utils/helpers.js';
import { GALERIA_PAGE_SIZE } from '../config/constants.js';

// ========== GALERIA ==========

/**
 * Listar galeria com paginação
 */
export async function listGaleria(req, res) {
    try {
        await ensureGaleriaPositions();
        await ensureGaleriaTipoMidia();

        const page = Math.max(0, parseInt(req.query.page, 10) || 0);
        const limit = Math.max(1, parseInt(req.query.limit, 10) || GALERIA_PAGE_SIZE);
        const offset = page * limit;

        let query = supabase
            .from('galeria')
            .select('*', { count: 'exact' })
            .order('position', { ascending: false, nullsFirst: false })
            .order('data', { ascending: false });

        // Primeiro, obter o total de itens sem usar range
        const { count: totalCount, error: countError } = await supabase
            .from('galeria')
            .select('*', { count: 'exact' })
            .limit(1);

        if (countError) throw countError;

        const total = totalCount || 0;

        // Se offset é maior que total, retornar lista vazia com paginação correta
        if (offset >= total && total > 0) {
            return res.json({
                data: [],
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasPrevious: page > 0,
                    hasNext: false
                }
            });
        }

        // Se não há itens, retornar vazio
        if (total === 0) {
            return res.json({
                data: [],
                pagination: {
                    page: 0,
                    limit,
                    total: 0,
                    totalPages: 0,
                    hasPrevious: false,
                    hasNext: false
                }
            });
        }

        const { data: galeria, error } = await query.range(offset, offset + limit - 1);

        if (error && error.code === '42703') {
            const { data: galeriaFallback, error: errorFallback } = await supabase
                .from('galeria')
                .select('*', { count: 'exact' })
                .order('id', { ascending: false })
                .range(offset, offset + limit - 1);

            if (errorFallback) throw errorFallback;

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
}

/**
 * Upload de vídeo via Supabase Storage
 */
export async function uploadVideo(req, res) {
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
                    console.error('Erro no Storage:', uploadError);
                    return res.status(500).json({ error: `Erro no Storage: ${uploadError.message}` });
                }

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
                
                console.log('✅ Vídeo salvo:', videoFilename);
                await createLog('GALERIA', 'UPLOAD VÍDEO', `Vídeo enviado: ${titulo}`);

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
        console.error('Erro ao fazer upload:', error.message);
        res.status(500).json({ error: `Erro ao fazer upload: ${error.message}` });
    }
}

/**
 * Adicionar imagem/mídia à galeria
 */
export async function addMidia(req, res) {
    const { titulo, descricao, url, data, tipo_midia } = req.body;

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
            console.warn('Coluna tipo_midia não disponível');
        }

        const { data: novaImagem, error } = await supabase
            .from('galeria')
            .insert([insertData])
            .select();

        if (error) throw error;

        await createLog('GALERIA', 'ADICIONAR MÍDIA', `Mídia adicionada: ${titulo}`);

        res.status(201).json({ message: 'Mídia adicionada com sucesso!', data: novaImagem });
    } catch (error) {
        console.error('Erro ao adicionar mídia:', error.message);
        res.status(500).json({ error: `Erro ao adicionar mídia: ${error.message}` });
    }
}

/**
 * Atualizar mídia
 */
export async function updateMidia(req, res) {
    const { id } = req.params;
    const { titulo, descricao, url, data, tipo_midia } = req.body;

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
                console.warn('Coluna tipo_midia não disponível');
            }
        }

        const { data: imagemAtualizada, error } = await supabase
            .from('galeria')
            .update(updateData)
            .eq('id', id)
            .select();

        if (error) throw error;

        await createLog('GALERIA', 'ATUALIZAR MÍDIA', `Mídia atualizada: ${id}`);

        res.json({ message: 'Mídia atualizada com sucesso!', data: imagemAtualizada });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar mídia' });
    }
}

/**
 * Reordenar galeria
 */
export async function reorderGaleria(req, res) {
    const { orderedIds } = req.body || {};

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

        await createLog('GALERIA', 'REORDENAR', `Ordem da galeria atualizada`);

        res.json({ message: 'Ordem atualizada com sucesso!' });
    } catch (error) {
        if (error.code === '42703') {
            console.warn('⚠️  Coluna position não existe.');
            return res.json({ message: 'Ordem atualizada (sem persistência)' });
        }
        console.error(error);
        res.status(500).json({ error: 'Erro ao reordenar galeria' });
    }
}

/**
 * Deletar mídia
 */
export async function deleteMidia(req, res) {
    const { id } = req.params;

    try {
        const hasStorageKey = await ensureGaleriaStorageKey();
        const selectCols = hasStorageKey ? 'storage_key, url' : 'url';

        const { data: galeriaItem, error: fetchError } = await supabase
            .from('galeria')
            .select(selectCols)
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        if (hasStorageKey && galeriaItem?.storage_key) {
            const { error: storageError } = await supabase
                .storage
                .from('galeria-videos')
                .remove([galeriaItem.storage_key]);

            if (storageError) {
                console.error('Erro ao deletar do Storage:', storageError);
            } else {
                console.log('✅ Vídeo deletado do Storage:', galeriaItem.storage_key);
            }
        }

        const { error } = await supabase
            .from('galeria')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await ensureGaleriaPositions();
        await createLog('GALERIA', 'DELETAR MÍDIA', `Mídia deletada: ${id}`);

        res.json({ message: 'Imagem/vídeo apagado com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao apagar imagem/vídeo' });
    }
}
