/**
 * 📋 Logs Controller
 * Gerencia logs da aplicação e acesso à estrutura do banco de dados
 */

import { isAdminToken, isRootAdminToken } from '../utils/helpers.js';

/**
 * GET /api/logs - Listar todos os logs
 */
function handleGetLogs(supabase) {
    return async (req, res) => {
        if (!isAdminToken(req)) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        try {
            const { data: logs, error } = await supabase
                .from('logs')
                .select('*')
                .order('timestamp', { ascending: false });

            // Se tabela não existe, retorna vazio
            if (error?.code === 'PGRST116' || error?.code === 'PGRST205' || error?.message?.includes('logs')) {
                return res.json([]);
            }

            if (error) throw error;
            res.json(logs || []);
        } catch (error) {
            console.error('Erro ao buscar logs:', error);
            res.status(500).json({ error: 'Erro ao buscar logs' });
        }
    };
}

/**
 * POST /api/logs - Criar novo log
 */
function handleCreateLog(supabase) {
    return async (req, res) => {
        if (!isAdminToken(req)) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const { categoria, subcategoria, detalhes } = req.body;

        if (!categoria || !subcategoria) {
            return res.status(400).json({ error: 'Categoria e subcategoria são obrigatórias' });
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
                .select()
                .single();

            if (error) {
                // Se tabela não existe, retorna sucesso silencioso
                if (error.code === 'PGRST205') {
                    return res.status(201).json({ message: 'Log criado (tabela não existe)' });
                }
                throw error;
            }

            res.status(201).json(log);
        } catch (error) {
            console.error('Erro ao criar log:', error);
            res.status(500).json({ error: 'Erro ao criar log' });
        }
    };
}

/**
 * DELETE /api/logs - Deletar todos os logs (admin root only)
 */
function handleDeleteLogs(supabase) {
    return async (req, res) => {
        if (!isRootAdminToken(req)) {
            return res.status(403).json({ error: 'Apenas administrador root pode deletar logs' });
        }

        try {
            const { error } = await supabase
                .from('logs')
                .delete()
                .gt('id', 0); // Deletar todos

            if (error) {
                // Se tabela não existe, retorna sucesso silencioso
                if (error.code === 'PGRST205') {
                    return res.json({ message: 'Logs deletados' });
                }
                throw error;
            }

            res.json({ message: 'Logs deletados com sucesso' });
        } catch (error) {
            console.error('Erro ao deletar logs:', error);
            res.status(500).json({ error: 'Erro ao deletar logs' });
        }
    };
}

/**
 * DELETE /api/logs/:id - Deletar log específico
 */
function handleDeleteLogById(supabase) {
    return async (req, res) => {
        if (!isAdminToken(req)) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

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
    };
}

/**
 * GET /api/database/tables - Listar todas as tabelas
 */
function handleGetDatabaseTables(supabase) {
    return async (req, res) => {
        if (!isAdminToken(req)) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        try {
            const { data, error } = await supabase.rpc('get_table_names', {});
            
            if (error) {
                // Se RPC não existe, retornar tabelas conhecidas
                const tabelas = ['usuarios', 'comentarios', 'galeria', 'calendario', 'descricao_turma', 'logs', 'admin_requests'];
                return res.json({ tables: tabelas });
            }

            res.json({ tables: data || [] });
        } catch (error) {
            console.error('Erro ao listar tabelas:', error);
            // Retornar tabelas conhecidas como fallback
            const tabelas = ['usuarios', 'comentarios', 'galeria', 'calendario', 'descricao_turma', 'logs', 'admin_requests'];
            res.json({ tables: tabelas });
        }
    };
}

/**
 * GET /api/database/table/:tableName - Listar conteúdo de uma tabela
 */
function handleGetTableData(supabase) {
    return async (req, res) => {
        if (!isAdminToken(req)) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const { tableName } = req.params;
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
        const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);

        // Lista de tabelas permitidas (whitelist para segurança)
        const tabelasPermitidas = ['usuarios', 'comentarios', 'galeria', 'calendario', 'descricao_turma', 'logs', 'admin_requests'];
        
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
                table: tableName,
                total: count,
                limit,
                offset,
                data: data || []
            });
        } catch (error) {
            console.error('Erro ao buscar tabela:', error);
            res.status(500).json({ error: 'Erro ao buscar tabela' });
        }
    };
}

// ===== EXPORTAR HANDLERS =====
export {
    handleGetLogs,
    handleCreateLog,
    handleDeleteLogs,
    handleDeleteLogById,
    handleGetDatabaseTables,
    handleGetTableData
};
