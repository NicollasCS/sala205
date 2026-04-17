import { supabase } from '../utils/supabase.js';
import { 
    promoteUserToAdmin, 
    getAppSetting, 
    setAppSetting,
    getDescricaoAtual,
    normalizeDescricao,
    createLog 
} from '../utils/helpers.js';

// ========== ADMIN E SISTEMA ==========

/**
 * Criar solicitação de promoção a admin
 */
export async function createAdminRequest(req, res) {
    const { requested_user_id, requested_user_name, requested_by_id, requested_by_name, target_role = 'admin' } = req.body;
    
    if (!requested_user_id || !requested_user_name || !requested_by_id || !requested_by_name) {
        return res.status(400).json({ error: 'Dados de solicitação incompletos.' });
    }

    try {
        const { data, error } = await supabase
            .from('admin_requests')
            .insert([{ 
                requested_user_id, 
                requested_user_name, 
                requested_by_id, 
                requested_by_name, 
                target_role, 
                status: 'pending', 
                created_at: new Date().toISOString() 
            }])
            .select()
            .single();

        if (error) {
            if (error.code === '42703' || error.message?.includes('admin_requests')) {
                return res.status(500).json({ 
                    error: 'Tabela admin_requests não encontrada.' 
                });
            }
            throw error;
        }

        await createLog('ADMIN', 'SOLICITAÇÃO', `Solicitação de admin para ${requested_user_name}`);

        res.status(201).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar solicitação' });
    }
}

/**
 * Listar solicitações de admin
 */
export async function listAdminRequests(req, res) {
    try {
        let query = supabase
            .from('admin_requests')
            .select('*')
            .order('created_at', { ascending: false });

        // Se não é root, filtrar por autor
        const isRoot = req.headers['x-root-token'] === 'turma205-root';
        if (!isRoot) {
            const requesterName = req.headers['x-requester-name'];
            if (!requesterName) {
                return res.status(403).json({ error: 'Acesso negado.' });
            }
            query = query.eq('requested_by_name', requesterName);
        }

        const { data, error } = await query;
        
        if (error) {
            if (error.code === '42703' || error.message?.includes('admin_requests')) {
                return res.status(500).json({ 
                    error: 'Tabela admin_requests não encontrada.' 
                });
            }
            throw error;
        }

        res.json(data || []);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar solicitações' });
    }
}

/**
 * Revisar solicitação de admin
 */
export async function reviewAdminRequest(req, res) {
    const { id } = req.params;
    const { action, reason, reviewed_by_name = 'administrador_turma205-1' } = req.body;
    
    if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ error: 'Ação inválida.' });
    }

    try {
        const { data: request, error: fetchError } = await supabase
            .from('admin_requests')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !request) {
            return res.status(404).json({ error: 'Solicitação não encontrada.' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ error: 'Solicitação já foi processada.' });
        }

        if (action === 'approve') {
            await promoteUserToAdmin(request.requested_user_id);
        }

        const { error: updateError } = await supabase
            .from('admin_requests')
            .update({
                status: action === 'approve' ? 'approved' : 'rejected',
                reviewed_at: new Date().toISOString(),
                reviewed_by_name,
                review_reason: reason || null
            })
            .eq('id', id);

        if (updateError) throw updateError;

        await createLog('ADMIN', 'REVISÃO', `Solicitação ${action}: ${request.requested_user_name}`);

        res.json({ message: `Solicitação ${action} com sucesso.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao processar solicitação' });
    }
}

/**
 * Obter status de manutenção do site
 */
export async function getSiteStatus(req, res) {
    try {
        const maintenanceModeEnv = process.env.MAINTENANCE_MODE === 'true';
        const maintenanceMessageEnv = process.env.MAINTENANCE_MESSAGE || 'Site em manutenção. Volte mais tarde.';
        const maintenanceValue = await getAppSetting('maintenance_mode');
        const messageValue = await getAppSetting('maintenance_message');

        const maintenanceMode = maintenanceValue !== null ? maintenanceValue === 'true' : maintenanceModeEnv;
        const maintenanceMessage = messageValue || maintenanceMessageEnv;

        res.json({ maintenanceMode, maintenanceMessage });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar status' });
    }
}

/**
 * Atualizar status de manutenção do site
 */
export async function updateSiteStatus(req, res) {
    const { maintenanceMode, maintenanceMessage } = req.body;
    
    if (typeof maintenanceMode !== 'boolean') {
        return res.status(400).json({ error: 'maintenanceMode deve ser booleano.' });
    }

    try {
        await setAppSetting('maintenance_mode', maintenanceMode ? 'true' : 'false');
        if (typeof maintenanceMessage === 'string') {
            await setAppSetting('maintenance_message', maintenanceMessage);
        }

        await createLog('SISTEMA', 'MANUTENÇÃO', `Modo manutenção: ${maintenanceMode}`);

        res.json({ message: 'Status atualizado.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message || 'Erro ao salvar status' });
    }
}

/**
 * Obter descrição da turma
 */
export async function getDescricao(req, res) {
    try {
        const data = await getDescricaoAtual();
        res.json({ descricao: data?.descricao || 'Descrição não configurada.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar descrição' });
    }
}

/**
 * Atualizar descrição da turma
 */
export async function updateDescricao(req, res) {
    const descricao = normalizeDescricao(req.body?.descricao);

    if (!descricao || descricao.length < 10) {
        return res.status(400).json({ error: 'Descrição muito curta (mín 10 chars)' });
    }

    try {
        const existing = await getDescricaoAtual();
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
                error: 'Tabela descricao_turma não configurada.' 
            });
        }

        if (error) throw error;
        
        await createLog('SISTEMA', 'DESCRIÇÃO', 'Descrição da turma atualizada');
        
        res.json({ message: 'Descrição atualizada!', data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao salvar descrição' });
    }
}

// ========== LOGS ==========

/**
 * Listar logs
 */
export async function listLogs(req, res) {
    try {
        const { data: logs, error } = await supabase
            .from('logs')
            .select('*')
            .order('timestamp', { ascending: false });

        if (error?.code === 'PGRST205' || error?.message?.includes('logs')) {
            return res.json([]);
        }

        if (error) throw error;
        res.json(logs || []);
    } catch (error) {
        console.error('Erro ao buscar logs:', error);
        res.status(500).json({ error: 'Erro ao buscar logs' });
    }
}

/**
 * Criar log manualmente
 */
export async function createLogManual(req, res) {
    const { categoria, subcategoria, detalhes } = req.body;

    if (!categoria || !subcategoria) {
        return res.status(400).json({ error: 'Categoria e subcategoria obrigatórias' });
    }

    try {
        const { data: log, error } = await supabase
            .from('logs')
            .insert([{
                categoria,
                subcategoria,
                detalhes: detalhes || '',
                timestamp: new Date().toISOString()
            }])
            .select();

        if (error) throw error;
        res.status(201).json(log);
    } catch (error) {
        console.error('Erro ao criar log:', error);
        res.status(201).json({ warning: 'Log não pôde ser registrado' });
    }
}

/**
 * Deletar todos os logs
 */
export async function deleteLogs(req, res) {
    try {
        const { error } = await supabase
            .from('logs')
            .delete()
            .neq('id', 0);

        if (error?.code === 'PGRST205' || error?.message?.includes('logs')) {
            return res.json({ message: 'Nenhum log encontrado' });
        }

        if (error) throw error;
        res.json({ message: 'Todos os logs foram deletados' });
    } catch (error) {
        console.error('Erro ao deletar logs:', error);
        res.json({ message: 'Logs deletados ou não existem' });
    }
}

/**
 * Deletar log específico por ID
 */
export async function deleteLogById(req, res) {
    const { id } = req.params;

    try {
        const { error } = await supabase
            .from('logs')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ message: 'Log deletado com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar log:', error);
        res.status(500).json({ error: 'Erro ao deletar log' });
    }
}

// ========== DATABASE INFO ==========

/**
 * Listar tabelas
 */
export async function listTables(req, res) {
    try {
        const { data, error } = await supabase.rpc('get_table_names', {});
        
        if (error) {
            const tabelas = ['usuarios', 'comentarios', 'galeria', 'calendario', 'descricao_turma', 'logs'];
            return res.json({ tables: tabelas });
        }

        res.json({ tables: data || [] });
    } catch (error) {
        console.error('Erro ao listar tabelas:', error);
        const tabelas = ['usuarios', 'comentarios', 'galeria', 'calendario', 'descricao_turma', 'logs'];
        res.json({ tables: tabelas });
    }
}

/**
 * Buscar conteúdo de tabela específica
 */
export async function getTableData(req, res) {
    const { tableName } = req.params;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);

    const tabelasPermitidas = ['usuarios', 'comentarios', 'galeria', 'calendario', 'descricao_turma', 'logs'];
    
    if (!tabelasPermitidas.includes(tableName)) {
        return res.status(400).json({ error: 'Tabela não permitida' });
    }

    try {
        const { data, error, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact' })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        res.json({
            tableName,
            data: data || [],
            total: count || 0,
            limit,
            offset,
            pages: Math.ceil((count || 0) / limit)
        });
    } catch (error) {
        console.error(`Erro ao buscar ${tableName}:`, error);
        res.status(500).json({ error: `Erro ao buscar dados` });
    }
}

/**
 * Deletar linha da tabela
 */
export async function deleteTableRow(req, res) {
    const { tableName, id } = req.params;
    const tabelasPermitidas = ['usuarios', 'comentarios', 'galeria', 'calendario', 'descricao_turma', 'logs'];
    
    if (!tabelasPermitidas.includes(tableName)) {
        return res.status(400).json({ error: 'Tabela não permitida' });
    }

    try {
        const { data, error } = await supabase
            .from(tableName)
            .delete()
            .eq('id', id);

        if (error) throw error;

        await createLog('DATABASE', 'DELETE', `Linha ${id} deletada de ${tableName}`);

        res.json({ message: 'Linha deletada' });
    } catch (error) {
        console.error(`Erro ao deletar de ${tableName}:`, error);
        res.status(500).json({ error: 'Erro ao deletar' });
    }
}
