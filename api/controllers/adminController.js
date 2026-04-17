/**
 * 👥 Controllers de usuários e administrativos
 */

/**
 * PUT /api/usuarios/renomear - Renomear usuário
 */
function handleRenameUsuario(supabase) {
    return async (req, res) => {
        const { id, nomeAtual, novoNome } = req.body;

        if (!id || !nomeAtual || !novoNome) {
            return res.status(400).json({ error: 'Dados incompletos.' });
        }

        const protectedAccounts = ['administrador_turma205-1', 'aluno205-1', 'dev205-1'];
        if (protectedAccounts.includes(nomeAtual)) {
            return res.status(403).json({ error: 'Contas de sistema não podem ser renomeadas.' });
        }

        try {
            const { data: existing } = await supabase
                .from('usuarios')
                .select('id')
                .eq('nome', novoNome);

            if (existing && existing.length > 0) {
                return res.status(409).json({ error: 'Este nome já está em uso.' });
            }

            await supabase
                .from('usuarios')
                .update({ nome: novoNome })
                .eq('id', id);

            await supabase
                .from('comentarios')
                .update({ autor: novoNome })
                .eq('autor', nomeAtual);

            res.json({ message: 'Nome atualizado com sucesso.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao atualizar nome.' });
        }
    };
}

/**
 * GET /api/usuarios - Listar usuários
 */
function handleGetUsuarios(supabase) {
    return async (req, res) => {
        if (!supabase) {
            console.error('❌ Supabase não configurado');
            return res.status(503).json({ error: 'Supabase não configurado - SUPABASE_URL ou SUPABASE_KEY faltando' });
        }

        try {
            console.log('📥 Buscando usuários do Supabase...');
            const { data: usuarios, error } = await supabase
                .from('usuarios')
                .select('id, nome, created, role, is_admin')
                .order('created', { ascending: false });

            if (error) {
                console.error('❌ Erro Supabase ao listar usuários:', {
                    code: error.code,
                    message: error.message,
                    details: error.details
                });

                if (error.code === 'PGRST205' || error.message?.includes('usuarios')) {
                    console.warn('⚠️ Tabela usuarios não encontrada, retornando array vazio');
                    return res.json([]);
                }

                return res.status(500).json({ 
                    error: `Erro ao listar usuários: ${error.message}`,
                    code: error.code 
                });
            }

            console.log(`✅ ${usuarios?.length || 0} usuários encontrados`);
            res.json(usuarios || []);
        } catch (error) {
            console.error('❌ Erro na rota de usuários:', error);
            res.status(500).json({ error: `Erro ao listar usuários: ${error.message}` });
        }
    };
}

/**
 * POST /api/admin-requests - Criar solicitação de admin
 */
function handleCreateAdminRequest(supabase) {
    return async (req, res) => {
        const requesterToken = req.headers['x-admin-token'];
        if (!requesterToken) {
            return res.status(403).json({ error: 'Acesso negado. Administrador requerido.' });
        }

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
                    return res.status(500).json({ error: 'Tabela admin_requests não encontrada no Supabase.' });
                }
                throw error;
            }

            res.status(201).json(data);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao criar solicitação de admin' });
        }
    };
}

/**
 * GET /api/admin-requests - Listar solicitações de admin
 */
function handleGetAdminRequests(supabase, isRootAdminToken) {
    return async (req, res) => {
        const requesterToken = req.headers['x-admin-token'];

        if (!requesterToken) {
            return res.status(403).json({ error: 'Acesso negado. Administrador requerido.' });
        }

        try {
            let query = supabase.from('admin_requests').select('*').order('created_at', { ascending: false });

            if (!isRootAdminToken(req)) {
                const requesterName = req.headers['x-requester-name'];
                if (!requesterName) {
                    return res.status(403).json({ error: 'Acesso negado. Root ou autor da solicitação requerido.' });
                }
                query = query.eq('requested_by_name', requesterName);
            }

            const { data, error } = await query;
            if (error) {
                if (error.code === '42703' || error.message?.includes('admin_requests')) {
                    return res.status(500).json({ error: 'Tabela admin_requests não encontrada no Supabase.' });
                }
                throw error;
            }

            res.json(data || []);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao listar solicitações de admin' });
        }
    };
}

/**
 * PUT /api/admin-requests/:id - Revisar solicitação de admin
 */
function handleReviewAdminRequest(supabase, isRootAdminToken, promoteUserToAdmin) {
    return async (req, res) => {
        if (!isRootAdminToken(req)) {
            return res.status(403).json({ error: 'Apenas administrador root pode revisar solicitações.' });
        }

        const { id } = req.params;
        const { action, reason, reviewed_by_name = 'administrador_turma205-1' } = req.body;
        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ error: 'Ação inválida. Use approve ou reject.' });
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

            res.json({ message: `Solicitação ${action} com sucesso.` });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao processar solicitação de admin' });
        }
    };
}

/**
 * GET /api/site-status - Obter status do site
 */
function handleGetSiteStatus(supabase, getAppSetting) {
    return async (req, res) => {
        try {
            const maintenanceModeEnv = process.env.MAINTENANCE_MODE === 'true';
            const maintenanceMessageEnv = process.env.MAINTENANCE_MESSAGE || 'Site em manutenção. Volte mais tarde.';
            const maintenanceValue = await getAppSetting(supabase, 'maintenance_mode');
            const messageValue = await getAppSetting(supabase, 'maintenance_message');

            const maintenanceMode = maintenanceValue !== null ? maintenanceValue === 'true' : maintenanceModeEnv;
            const maintenanceMessage = messageValue || maintenanceMessageEnv;

            res.json({ maintenanceMode, maintenanceMessage });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao buscar status do site' });
        }
    };
}

/**
 * PUT /api/site-status - Atualizar status do site
 */
function handleUpdateSiteStatus(supabase, setAppSetting, isRootAdminToken) {
    return async (req, res) => {
        if (!isRootAdminToken(req)) {
            return res.status(403).json({ error: 'Apenas administrador root pode alterar o modo de manutenção.' });
        }

        const { maintenanceMode, maintenanceMessage } = req.body;
        if (typeof maintenanceMode !== 'boolean') {
            return res.status(400).json({ error: 'maintenanceMode deve ser booleano.' });
        }

        try {
            await setAppSetting(supabase, 'maintenance_mode', maintenanceMode ? 'true' : 'false');
            if (typeof maintenanceMessage === 'string') {
                await setAppSetting(supabase, 'maintenance_message', maintenanceMessage);
            }

            res.json({ message: 'Status do site atualizado com sucesso.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao atualizar status do site' });
        }
    };
}

export {
    handleRenameUsuario,
    handleGetUsuarios,
    handleCreateAdminRequest,
    handleGetAdminRequests,
    handleReviewAdminRequest,
    handleGetSiteStatus,
    handleUpdateSiteStatus
};
