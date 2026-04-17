/**
 * 🗄️ Funções de gerenciamento de banco de dados
 */

/**
 * Garante que a coluna position exista em galeria e reorganiza as posições
 */
async function ensureGaleriaPositions(supabase) {
    try {
        const { data, error } = await supabase
            .from('galeria')
            .select('id, position, data')
            .order('position', { ascending: true, nullsFirst: false })
            .order('data', { ascending: false });

        if (error && error.code === '42703') {
            console.warn('⚠️  Coluna position não existe em galeria. Execute: ALTER TABLE galeria ADD COLUMN position integer DEFAULT 0;');
            return;
        }

        if (error) throw error;

        const imagens = data || [];
        const updates = [];

        imagens.forEach((img, index) => {
            const nextPosition = index + 1;
            if (img.position !== nextPosition) {
                updates.push(
                    supabase
                        .from('galeria')
                        .update({ position: nextPosition })
                        .eq('id', img.id)
                );
            }
        });

        if (updates.length > 0) {
            await Promise.all(updates);
        }
    } catch (err) {
        if (err.code !== '42703') throw err;
    }
}

/**
 * Garante que a coluna tipo_midia exista em galeria
 */
async function ensureGaleriaTipoMidia(supabase) {
    try {
        const { data, error } = await supabase
            .from('galeria')
            .select('id, tipo_midia')
            .limit(1);

        if (error && error.code === '42703') {
            console.warn('⚠️  Coluna tipo_midia não existe. Execute: ALTER TABLE galeria ADD COLUMN tipo_midia text DEFAULT \'photo\';');
            return;
        }

        if (error) throw error;

        await supabase
            .from('galeria')
            .update({ tipo_midia: 'photo' })
            .is('tipo_midia', null);

    } catch (err) {
        if (err.code !== '42703') {
            console.warn('Erro ao verificar tipo_midia:', err.message);
        }
    }
}

/**
 * Garante que a coluna storage_key exista em galeria
 */
async function ensureGaleriaStorageKey(supabase) {
    try {
        const { data, error } = await supabase
            .from('galeria')
            .select('storage_key')
            .limit(1);

        if (error && error.code === '42703') {
            console.warn('⚠️  Coluna storage_key não existe. Uploads continuarão sem persistir a chave.');
            return false;
        }

        if (error) throw error;
        return true;
    } catch (err) {
        if (err.code === '42703') return false;
        throw err;
    }
}

/**
 * Verifica se tabela calendario existe
 */
async function ensureCalendarioTable(supabase) {
    try {
        const { error } = await supabase
            .from('calendario')
            .select('id')
            .limit(1);

        if (error) {
            if (error.code === 'PGRST205' || error.message?.includes('calendario')) {
                console.warn('⚠️  Tabela calendario não existe.');
                return false;
            }
            throw error;
        }

        return true;
    } catch (err) {
        if (err.code === 'PGRST205' || err.message?.includes('calendario')) {
            return false;
        }
        throw err;
    }
}

/**
 * Obtém descrição atual da turma
 */
async function getDescricaoAtual(supabase) {
    try {
        const { data, error } = await supabase
            .from('descricao_turma')
            .select('id, descricao')
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error && error.code === 'PGRST205') {
            return null;
        }

        if (error) throw error;
        return data || null;
    } catch (err) {
        if (err.code === 'PGRST205' || err.message?.includes('descricao_turma')) {
            return null;
        }
        throw err;
    }
}

/**
 * Obtém valor de setting da aplicação
 */
async function getAppSetting(supabase, key) {
    if (!supabase) return null;
    try {
        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', key)
            .maybeSingle();

        if (error) {
            if (error.code === 'PGRST205' || error.code === '42703') return null;
            throw error;
        }

        return data?.value ?? null;
    } catch (err) {
        if (err.code === 'PGRST205' || err.code === '42703' || err.message?.includes('app_settings')) {
            return null;
        }
        throw err;
    }
}

/**
 * Define valor de setting da aplicação
 */
async function setAppSetting(supabase, key, value) {
    if (!supabase) throw new Error('Supabase não configurado');
    try {
        const payload = {
            key,
            value: String(value),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('app_settings')
            .upsert(payload, { onConflict: 'key' })
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST205' || error.code === '42703') {
                throw new Error('Tabela app_settings não encontrada');
            }
            throw error;
        }

        return data;
    } catch (err) {
        if (err.message?.includes('app_settings')) {
            throw err;
        }
        throw err;
    }
}

/**
 * Promove usuário a admin
 */
async function promoteUserToAdmin(supabase, userId) {
    if (!supabase) throw new Error('Supabase não configurado');
    let lastError = null;

    try {
        const { error } = await supabase
            .from('usuarios')
            .update({ role: 'admin' })
            .eq('id', userId);

        if (!error) return;
        lastError = error;
    } catch (err) {
        if (err.code !== '42703') throw err;
        lastError = err;
    }

    try {
        const { error } = await supabase
            .from('usuarios')
            .update({ is_admin: true })
            .eq('id', userId);

        if (!error) return;
        lastError = error;
    } catch (err) {
        if (err.code !== '42703') throw err;
    }

    if (lastError) throw lastError;
}

export {
    ensureGaleriaPositions,
    ensureGaleriaTipoMidia,
    ensureGaleriaStorageKey,
    ensureCalendarioTable,
    getDescricaoAtual,
    getAppSetting,
    setAppSetting,
    promoteUserToAdmin
};
