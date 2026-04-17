/**
 * 📅 Controllers de configurações (descrição, calendário, etc)
 */
import { normalizeDescricao, isAdminToken } from '../utils/helpers.js';
import { getDescricaoAtual, getAppSetting, setAppSetting } from '../utils/database.js';

/**
 * GET /api/descricao-turma - Obter descrição da turma
 */
function handleGetDescricaoTurma(supabase, getDescricaoAtualFn) {
    return async (req, res) => {
        try {
            const data = await getDescricaoAtualFn(supabase);
            res.json({ descricao: data?.descricao || 'Descrição da turma não configurada.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao buscar descrição', descricao: 'Carregando informações da turma...' });
        }
    };
}

/**
 * POST /api/descricao-turma - Atualizar descrição da turma
 */
function handleUpdateDescricaoTurma(supabase, getDescricaoAtualFn, createLog) {
    return async (req, res) => {
        const descricao = normalizeDescricao(req.body?.descricao);

        if (!isAdminToken(req)) {
            return res.status(401).json({ error: 'Acesso negado' });
        }

        if (!descricao || descricao.length < 10) {
            return res.status(400).json({ error: 'Descrição muito curta (mín 10 chars)' });
        }

        try {
            const existing = await getDescricaoAtualFn(supabase);
            const payload = {
                descricao,
                updated_at: new Date().toISOString()
            };

            let query = supabase.from('descricao_turma');
            if (existing?.id) {
                query = query.update(payload).eq('id', existing.id);
            } else {
                query = query.insert([payload]);
            }

            const { data, error } = await query.select().single();

            if (error?.code === 'PGRST205' || error?.message?.includes('descricao_turma')) {
                return res.status(503).json({ 
                    error: 'Tabela descricao_turma não configurada. Execute no Supabase SQL Editor: CREATE TABLE descricao_turma (id serial PRIMARY KEY, descricao text NOT NULL, updated_at timestamp with time zone DEFAULT now());' 
                });
            }

            if (error) throw error;
            
            if (createLog) {
                await createLog('ATUALIZAÇÕES', 'ATUALIZAÇÃO DO SITE', `Descrição da turma atualizada`);
            }
            
            res.json({ message: 'Descrição atualizada!', data });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao salvar descrição' });
        }
    };
}

/**
 * GET /api/calendario - Listar eventos do calendário
 */
function handleGetCalendario(supabase) {
    return async (req, res) => {
        try {
            const { data, error } = await supabase
                .from('calendario')
                .select('*')
                .order('data', { ascending: true });

            if (error) {
                if (error.code === 'PGRST205' || error.message?.includes('calendario')) {
                    return res.json([]);
                }
                throw error;
            }

            res.json(data || []);
        } catch (error) {
            console.error('Erro ao buscar calendário:', error);
            res.status(500).json({ error: 'Erro ao buscar eventos' });
        }
    };
}

/**
 * POST /api/calendario - Criar evento no calendário
 */
function handleCreateCalendarioEvent(supabase, createLog) {
    return async (req, res) => {
        if (!isAdminToken(req)) {
            return res.status(401).json({ error: 'Acesso negado' });
        }

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
                        error: 'Tabela calendario não configurada. Execute no Supabase SQL Editor: CREATE TABLE calendario (id serial PRIMARY KEY, titulo text NOT NULL, descricao text, data date NOT NULL, tipo text DEFAULT \'Aviso\', created_at timestamp with time zone DEFAULT now());'
                    });
                }
                throw error;
            }

            if (createLog) {
                await createLog('CALENDÁRIO', 'NOVO EVENTO', `Novo evento adicionado: ${titulo}`);
            }

            res.status(201).json(newEvent);
        } catch (error) {
            console.error('Erro ao criar evento de calendário:', error);
            res.status(500).json({ error: 'Erro ao criar evento' });
        }
    };
}

/**
 * PUT /api/calendario/:id - Atualizar evento do calendário
 */
function handleUpdateCalendarioEvent(supabase, createLog) {
    return async (req, res) => {
        if (!isAdminToken(req)) {
            return res.status(401).json({ error: 'Acesso negado' });
        }

        const { id } = req.params;
        const { titulo, descricao, data, tipo } = req.body;

        if (!titulo || !data) {
            return res.status(400).json({ error: 'Título e data são obrigatórios' });
        }

        try {
            const { data: updatedEvent, error } = await supabase
                .from('calendario')
                .update({ titulo, descricao: descricao || '', data, tipo: tipo || 'Aviso' })
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

            if (createLog) {
                await createLog('CALENDÁRIO', 'ATUALIZAR EVENTO', `Evento atualizado: ${titulo} (${id})`);
            }

            res.json({ data: updatedEvent });
        } catch (error) {
            console.error('Erro ao atualizar evento de calendário:', error);
            res.status(500).json({ error: 'Erro ao atualizar evento' });
        }
    };
}

/**
 * DELETE /api/calendario/:id - Deletar evento do calendário
 */
function handleDeleteCalendarioEvent(supabase, createLog) {
    return async (req, res) => {
        if (!isAdminToken(req)) {
            return res.status(401).json({ error: 'Acesso negado' });
        }

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

            if (createLog) {
                await createLog('CALENDÁRIO', 'DELETAR EVENTO', `Evento deletado (ID: ${id})`);
            }

            res.json({ message: 'Evento deletado com sucesso' });
        } catch (error) {
            console.error('Erro ao deletar evento de calendário:', error);
            res.status(500).json({ error: 'Erro ao deletar evento' });
        }
    };
}

/**
 * DELETE /api/usuarios - Deletar usuário e seus comentários
 */
function handleDeleteUsuario(supabase, createLog) {
    return async (req, res) => {
        const { id, nome } = req.body;

        if (!id || !nome) {
            return res.status(400).json({ error: 'ID e nome do usuário são obrigatórios.' });
        }

        const protectedAccounts = ['administrador_turma205-1', 'aluno205-1', 'dev205-1'];
        if (protectedAccounts.includes(nome)) {
            return res.status(403).json({ error: 'Esta conta não pode ser excluída. É uma conta de sistema.' });
        }

        try {
            await supabase
                .from('comentarios')
                .delete()
                .eq('autor', nome);

            await supabase
                .from('usuarios')
                .delete()
                .eq('id', id)
                .eq('nome', nome);

            if (createLog) {
                await createLog('CONTAS', 'EXCLUSÃO DE CONTAS', `Conta deletada: ${nome}`);
            }

            res.json({ message: 'Sua conta e todos os seus comentários foram excluídos com sucesso.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao excluir a conta.' });
        }
    };
}

export {
    handleGetDescricaoTurma,
    handleUpdateDescricaoTurma,
    handleGetCalendario,
    handleCreateCalendarioEvent,
    handleUpdateCalendarioEvent,
    handleDeleteCalendarioEvent,
    handleDeleteUsuario
};
