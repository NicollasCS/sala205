import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// ========== INICIALIZAÇÃO DO SUPABASE ==========

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

export const supabase = supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

if (!supabase) {
    console.error('❌ Supabase não configurado. Verifique SUPABASE_URL e SUPABASE_KEY/SUPABASE_SERVICE_ROLE_KEY.');
} else {
    console.log('✅ Supabase conectado:', supabaseUrl);
}

export default supabase;
