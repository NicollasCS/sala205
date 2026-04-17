import { supabase, createLog } from '../utils/database.js';

/**
 * Obter todos os textos da página
 */
export async function getTextos(req, res) {
    try {
        const { data, error } = await supabase
            .from('textos_pagina')
            .select('*')
            .limit(1)
            .single();

        if (error?.code === 'PGRST116') {
            // Tabela vazia, retornar valores padrão
            return res.json(getTextosDefault());
        }

        if (error?.message?.includes('textos_pagina')) {
            return res.status(503).json({ 
                error: 'Tabela textos_pagina não configurada.' 
            });
        }

        if (error) throw error;

        res.json(data || getTextosDefault());
    } catch (error) {
        console.error('Erro ao buscar textos:', error);
        res.status(500).json({ error: 'Erro ao buscar textos' });
    }
}

/**
 * Atualizar textos da página
 */
export async function updateTextos(req, res) {
    const textos = {
        tituloMain: req.body?.tituloMain || '',
        subtituloMain: req.body?.subtituloMain || '',
        descricaoHero: req.body?.descricaoHero || '',
        btnExplorar: req.body?.btnExplorar || 'Explorar',
        tituloGaleria: req.body?.tituloGaleria || '',
        subtituloGaleria: req.body?.subtituloGaleria || '',
        tituloComunidade: req.body?.tituloComunidade || '',
        subtituloComunidade: req.body?.subtituloComunidade || '',
        comentarios: req.body?.comentarios || '',
        seguranca: req.body?.seguranca || '',
        cadastro: req.body?.cadastro || '',
        updated_at: new Date().toISOString()
    };

    if (!textos.tituloMain) {
        return res.status(400).json({ error: 'Título principal é obrigatório' });
    }

    try {
        // Tentar buscar primeiro registro
        const { data: existing } = await supabase
            .from('textos_pagina')
            .select('id')
            .limit(1)
            .single();

        let query = supabase.from('textos_pagina');
        if (existing?.id) {
            query = query.update(textos).eq('id', existing.id);
        } else {
            query = query.insert([textos]);
        }

        const { data, error } = await query.select().single();

        if (error?.message?.includes('textos_pagina')) {
            return res.status(503).json({ 
                error: 'Tabela textos_pagina não configurada.' 
            });
        }

        if (error) throw error;

        await createLog('SISTEMA', 'TEXTOS', 'Textos da página atualizados');

        res.json({ message: 'Textos atualizados!', data });
    } catch (error) {
        console.error('Erro ao atualizar textos:', error);
        res.status(500).json({ error: 'Erro ao atualizar textos: ' + error.message });
    }
}

// Textos padrão
function getTextosDefault() {
    return {
        tituloMain: 'Sala 205 - Anexo',
        subtituloMain: 'Irmã Maria Teresa (EEBIMT)',
        descricaoHero: 'Conheça a história, memórias e projetos da nossa turma',
        btnExplorar: 'Explorar',
        tituloGaleria: 'Galeria de Fotos',
        subtituloGaleria: 'Momentos especiais da Sala 205',
        tituloComunidade: 'Participe da Comunidade',
        subtituloComunidade: 'Conecte-se com seus colegas de turma',
        comentarios: 'Deixe mensagens e interaja com a turma',
        seguranca: 'Faça login para acesso completo',
        cadastro: 'Crie sua conta e faça parte'
    };
}
