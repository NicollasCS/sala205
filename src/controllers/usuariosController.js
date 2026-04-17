import { supabase } from '../utils/supabase.js';
import { normalizeUser, createLog, isProtectedAccount } from '../utils/helpers.js';

// ========== USUÁRIOS ==========

/**
 * Listar todos os usuários (admin)
 */
export async function listUsers(req, res) {
    if (!supabase) {
        console.error('❌ Supabase não configurado');
        return res.status(503).json({ error: 'Supabase não configurado' });
    }

    try {
        console.log('📥 Buscando usuários do Supabase...');
        const { data: usuarios, error } = await supabase
            .from('usuarios')
            .select('id, nome, created');

        if (error) {
            console.error('❌ Erro ao buscar usuários:', error);
            
            if (error.code === 'PGRST205' || error.message?.includes('usuarios')) {
                console.warn('⚠️ Tabela usuarios não encontrada');
                return res.json([]);
            }

            return res.status(500).json({ error: `Erro ao listar usuários: ${error.message}` });
        }

        console.log(`✅ ${usuarios?.length || 0} usuários encontrados`);
        const normalized = usuarios?.map(u => normalizeUser(u)) || [];
        res.json(normalized);
    } catch (error) {
        console.error('❌ Erro na rota de usuários:', error.message);
        res.status(500).json({ error: `Erro ao listar usuários: ${error.message}` });
    }
}

/**
 * Renomear usuário
 */
export async function renameUser(req, res) {
    const { id, nomeAtual, novoNome } = req.body;

    if (!id || !nomeAtual || !novoNome) {
        return res.status(400).json({ error: 'Dados incompletos.' });
    }

    if (isProtectedAccount(nomeAtual)) {
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

        await createLog('USUÁRIOS', 'RENOMEAÇÃO', `Usuário renomeado: ${nomeAtual} → ${novoNome}`);

        res.json({ message: 'Nome atualizado com sucesso.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar nome.' });
    }
}

/**
 * Deletar usuário
 */
export async function deleteUser(req, res) {
    const { id, nome } = req.body;

    if (!id || !nome) {
        return res.status(400).json({ error: 'ID e nome do usuário são obrigatórios.' });
    }

    if (isProtectedAccount(nome)) {
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

        await createLog('CONTAS', 'EXCLUSÃO DE CONTAS', `Conta deletada: ${nome}`);

        res.json({ message: 'Sua conta e todos os seus comentários foram excluídos com sucesso.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao excluir a conta.' });
    }
}

/**
 * Alterar nome do usuário
 */
export async function alterarNome(req, res) {
    const { id } = req.params;
    const { novoNome } = req.body;

    if (!novoNome || novoNome.trim().length < 3) {
        return res.status(400).json({ error: 'Nome deve ter pelo menos 3 caracteres' });
    }

    try {
        const { data: usuario, error: errorCheck } = await supabase
            .from('usuarios')
            .select('nome')
            .eq('id', id)
            .single();

        if (errorCheck) throw errorCheck;

        if (isProtectedAccount(usuario.nome)) {
            return res.status(403).json({ error: 'Não é permitido alterar nome do admin' });
        }

        const { data: updated, error } = await supabase
            .from('usuarios')
            .update({ nome: novoNome.trim() })
            .eq('id', id)
            .select();

        if (error) throw error;

        await createLog('USUÁRIOS', 'ALTERAÇÃO DE NOME', `Nome alterado: ${usuario.nome} → ${novoNome}`);

        res.json({ message: 'Nome alterado com sucesso!', data: updated });
    } catch (error) {
        console.error('Erro ao alterar nome:', error);
        res.status(500).json({ error: 'Erro ao alterar nome' });
    }
}

/**
 * Alterar senha do usuário
 */
export async function alterarSenha(req, res) {
    const { id } = req.params;
    const { senhaAtual, novaSenha } = req.body;

    if (!senhaAtual || !novaSenha) {
        return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
    }

    if (novaSenha.length < 6) {
        return res.status(400).json({ error: 'Nova senha deve ter pelo menos 6 caracteres' });
    }

    try {
        const { data: usuario, error: errorCheck } = await supabase
            .from('usuarios')
            .select('senha, nome')
            .eq('id', id)
            .single();

        if (errorCheck) throw errorCheck;

        if (usuario.senha !== senhaAtual) {
            return res.status(401).json({ error: 'Senha atual incorreta' });
        }

        if (isProtectedAccount(usuario.nome)) {
            return res.status(403).json({ error: 'Não é permitido alterar senha do admin' });
        }

        const { data: updated, error } = await supabase
            .from('usuarios')
            .update({ senha: novaSenha })
            .eq('id', id)
            .select();

        if (error) throw error;

        await createLog('USUÁRIOS', 'ALTERAÇÃO DE SENHA', `Senha alterada para usuário: ${usuario.nome}`);

        res.json({ message: 'Senha alterada com sucesso!', data: updated });
    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        res.status(500).json({ error: 'Erro ao alterar senha' });
    }
}

/**
 * Deletar conta do usuário
 */
export async function deletarConta(req, res) {
    const { id } = req.params;
    const { senha } = req.body;

    if (!senha) {
        return res.status(400).json({ error: 'Senha é obrigatória para deletar conta' });
    }

    try {
        const { data: usuario, error: errorCheck } = await supabase
            .from('usuarios')
            .select('senha, nome')
            .eq('id', id)
            .single();

        if (errorCheck) throw errorCheck;

        const senhaHashEnviada = require('crypto').createHash('md5').update(senha).digest('hex');
        const senhaValida = usuario.senha === senhaHashEnviada;
        
        if (!senhaValida) {
            return res.status(401).json({ error: 'Senha incorreta' });
        }

        if (isProtectedAccount(usuario.nome)) {
            return res.status(403).json({ error: 'Não é permitido deletar conta admin' });
        }

        await supabase
            .from('usuarios')
            .delete()
            .eq('id', id);

        await supabase
            .from('comentarios')
            .delete()
            .eq('autor', usuario.nome);

        await createLog('CONTAS', 'EXCLUSÃO DE CONTAS', `Conta deletada: ${usuario.nome}`);

        res.json({ message: 'Conta deletada com sucesso!' });
    } catch (error) {
        console.error('Erro ao deletar conta:', error);
        res.status(500).json({ error: 'Erro ao deletar conta' });
    }
}
