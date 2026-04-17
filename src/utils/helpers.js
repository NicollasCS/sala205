import crypto from 'crypto';
import { supabase } from './supabase.js';
import { PROFANITY_WORDS, PROTECTED_ACCOUNTS } from '../config/constants.js';

// ========== HELPERS E FUNÇÕES UTILITÁRIAS ==========

/**
 * Verificar se texto contém palavrões
 */
export function isProfane(text) {
    const lower = text.toLowerCase();
    return PROFANITY_WORDS.some(word => lower.includes(word));
}

/**
 * Normalizar descrição (limpar quebras de linha)
 */
export function normalizeDescricao(value) {
    return String(value || '')
        .replace(/\r\n/g, '\n')
        .split('\n')
        .map((line) => line.trim())
        .join('\n')
        .trim();
}

/**
 * Normalizar usuário (adicionar role e is_admin dinamicamente)
 */
export function normalizeUser(user) {
    if (!user) return null;
    const role = user.role || (user.is_admin ? 'admin' : 'user');
    const is_admin = user.nome === 'administrador_turma205-1' || role === 'admin' || role === 'root' || user.is_admin;
    const is_root = user.nome === 'administrador_turma205-1' || role === 'root';
    return {
        id: user.id,
        nome: user.nome,
        role,
        is_admin,
        is_root
    };
}

/**
 * Promover usuário para admin
 */
export async function promoteUserToAdmin(userId) {
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
        lastError = err;
    }

    if (lastError) {
        throw new Error(lastError.message || lastError.code || 'Não foi possível promover o usuário.');
    }
}

/**
 * Criar log no banco de dados
 */
export async function createLog(categoria, subcategoria, detalhes = '') {
    try {
        if (!supabase) return;
        
        await supabase
            .from('logs')
            .insert([{
                categoria,
                subcategoria,
                detalhes,
                timestamp: new Date().toISOString()
            }]);
    } catch (e) {
        console.warn('⚠️  Aviso: Tabela "logs" não existe. Log não registrado.');
    }
}

/**
 * Buscar configuração do app
 */
export async function getAppSetting(key) {
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
 * Salvar configuração do app
 */
export async function setAppSetting(key, value) {
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
 * Buscar descrição atual da turma
 */
export async function getDescricaoAtual() {
    try {
        if (!supabase) return null;
        
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
 * Garantir posições da galeria
 */
export async function ensureGaleriaPositions() {
    try {
        if (!supabase) return;
        
        const { data, error } = await supabase
            .from('galeria')
            .select('id, position, data')
            .order('position', { ascending: true, nullsFirst: false })
            .order('data', { ascending: false });

        if (error && error.code === '42703') {
            console.warn('⚠️  Coluna position não existe em galeria.');
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
 * Garantir coluna tipo_midia em galeria
 */
export async function ensureGaleriaTipoMidia() {
    try {
        if (!supabase) return;
        
        const { data, error } = await supabase
            .from('galeria')
            .select('id, tipo_midia')
            .limit(1);

        if (error && error.code === '42703') {
            console.warn('⚠️  Coluna tipo_midia não existe em galeria.');
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
 * Garantir coluna storage_key em galeria
 */
export async function ensureGaleriaStorageKey() {
    try {
        if (!supabase) return false;
        
        const { data, error } = await supabase
            .from('galeria')
            .select('storage_key')
            .limit(1);

        if (error && error.code === '42703') {
            console.warn('⚠️  Coluna storage_key não existe em galeria.');
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
 * Garantir tabela calendario existe
 */
export async function ensureCalendarioTable() {
    try {
        if (!supabase) return false;
        
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
 * Validar se nome é protegido
 */
export function isProtectedAccount(nome) {
    return PROTECTED_ACCOUNTS.includes(nome);
}

/**
 * Calcular MD5 hash
 */
export function calculateMD5(text) {
    return crypto.createHash('md5').update(text).digest('hex');
}
