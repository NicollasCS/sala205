import { supabase } from '../utils/supabase.js';
import { createLog } from '../utils/helpers.js';

// ========== CALENDÁRIO ==========

/**
 * Listar eventos do calendário
 */
export async function listEventos(req, res) {
    try {
        const { data, error } = await supabase
            .from('calendario')
            .select('*')
            .order('data', { ascending: true })
            .order('created_at', { ascending: true });

        if (error) {
            if (error.code === 'PGRST205' || error.message?.includes('calendario')) {
                return res.json({ data: [] });
            }
            throw error;
        }

        res.json({ data: data || [] });
    } catch (error) {
        console.error('Erro ao buscar calendário:', error);
        res.status(500).json({ error: 'Erro ao buscar calendário' });
    }
}

/**
 * Criar novo evento
 */
export async function createEvento(req, res) {
    const { titulo, descricao, data, tipo } = req.body;

    if (!titulo || !data) {
        return res.status(400).json({ error: 'Título e data são obrigatórios' });
    }

    try {
        const { data: newEvent, error } = await supabase
            .from('calendario')
            .insert([{ 
                titulo, 
                descricao: descricao || '', 
                data, 
                tipo: tipo || 'Aviso', 
                created_at: new Date().toISOString() 
            }])
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST205' || error.message?.includes('calendario')) {
                return res.status(503).json({
                    error: 'Tabela calendario não configurada. Crie a tabela no Supabase.'
                });
            }
            throw error;
        }

        await createLog('CALENDÁRIO', 'ADICIONAR EVENTO', `Evento criado: ${titulo} em ${data}`);
        res.status(201).json({ data: newEvent });
    } catch (error) {
        console.error('Erro ao criar evento:', error);
        res.status(500).json({ error: 'Erro ao criar evento' });
    }
}

/**
 * Atualizar evento
 */
export async function updateEvento(req, res) {
    const { id } = req.params;
    const { titulo, descricao, data, tipo } = req.body;

    if (!titulo || !data) {
        return res.status(400).json({ error: 'Título e data são obrigatórios' });
    }

    try {
        const { data: updatedEvent, error } = await supabase
            .from('calendario')
            .update({ 
                titulo, 
                descricao: descricao || '', 
                data, 
                tipo: tipo || 'Aviso' 
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST205' || error.message?.includes('calendario')) {
                return res.status(503).json({
                    error: 'Tabela calendario não configurada.'
                });
            }
            throw error;
        }

        await createLog('CALENDÁRIO', 'ATUALIZAR EVENTO', `Evento atualizado: ${titulo} (${id})`);
        res.json({ data: updatedEvent });
    } catch (error) {
        console.error('Erro ao atualizar evento:', error);
        res.status(500).json({ error: 'Erro ao atualizar evento' });
    }
}

/**
 * Deletar evento
 */
export async function deleteEvento(req, res) {
    const { id } = req.params;

    try {
        const { error } = await supabase
            .from('calendario')
            .delete()
            .eq('id', id);

        if (error) {
            if (error.code === 'PGRST205' || error.message?.includes('calendario')) {
                return res.status(503).json({
                    error: 'Tabela calendario não configurada.'
                });
            }
            throw error;
        }

        await createLog('CALENDÁRIO', 'REMOVER EVENTO', `Evento removido: ${id}`);
        res.json({ message: 'Evento removido com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar evento:', error);
        res.status(500).json({ error: 'Erro ao deletar evento' });
    }
}
