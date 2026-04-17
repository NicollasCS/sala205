/**
 * Script para criar tabela textos_pagina no Supabase
 * Execute: node src/setup_textos_pagina.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ SUPABASE_URL ou SUPABASE_KEY não configurados no .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupTextosTable() {
    try {
        console.log('📝 Criando tabela textos_pagina...');

        // SQL para criar a tabela
        const sql = `
            -- Criar tabela textos_pagina
            CREATE TABLE IF NOT EXISTS textos_pagina (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                
                -- Textos da Hero Section
                tituloMain TEXT DEFAULT 'Sala 205 - Anexo',
                subtituloMain TEXT DEFAULT 'Irmã Maria Teresa (EEBIMT)',
                descricaoHero TEXT DEFAULT 'Conheça a história, memórias e projetos da nossa turma',
                btnExplorar TEXT DEFAULT 'Explorar',
                
                -- Textos da Galeria
                tituloGaleria TEXT DEFAULT 'Galeria de Fotos',
                subtituloGaleria TEXT DEFAULT 'Momentos especiais da Sala 205',
                
                -- Textos da Comunidade
                tituloComunidade TEXT DEFAULT 'Participe da Comunidade',
                subtituloComunidade TEXT DEFAULT 'Conecte-se com seus colegas de turma',
                
                -- Textos dos Blocos de Funcionalidades
                comentarios TEXT DEFAULT 'Deixe mensagens e interaja com a turma',
                seguranca TEXT DEFAULT 'Faça login para acesso completo',
                cadastro TEXT DEFAULT 'Crie sua conta e faça parte',
                
                -- Timestamps
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            -- Habilitar RLS
            ALTER TABLE textos_pagina ENABLE ROW LEVEL SECURITY;

            -- Policy para leitura pública
            CREATE POLICY "Textos são públicos" ON textos_pagina
                FOR SELECT USING (true);

            -- Policy para admin atualizar
            CREATE POLICY "Admins podem atualizar textos" ON textos_pagina
                FOR UPDATE USING (true);
        `;

        const { error: sqlError } = await supabase.rpc('execute_sql', { sql });

        if (sqlError && sqlError.message.includes('does not exist')) {
            // Se a função execute_sql não existe, usar SQL direto pelo dashboard
            console.warn('⚠️  RPC execute_sql não disponível. Execute o SQL manualmente no dashboard Supabase');
            console.log('\n📋 SQL a executar:\n', sql);
            return false;
        }

        if (sqlError) {
            console.error('❌ Erro ao criar tabela:', sqlError);
            return false;
        }

        // Verificar se a tabela foi criada
        const { data, error } = await supabase
            .from('textos_pagina')
            .select('*')
            .limit(1);

        if (error) {
            console.error('❌ Erro ao verificar tabela:', error.message);
            return false;
        }

        // Inserir valores padrão se tabela estiver vazia
        const { data: existing } = await supabase
            .from('textos_pagina')
            .select('id')
            .limit(1);

        if (!existing || existing.length === 0) {
            const { error: insertError } = await supabase
                .from('textos_pagina')
                .insert([{
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
                }]);

            if (insertError) {
                console.error('❌ Erro ao inserir dados padrão:', insertError);
            } else {
                console.log('✅ Dados padrão inseridos');
            }
        }

        console.log('✅ Tabela textos_pagina criada com sucesso!');
        return true;

    } catch (error) {
        console.error('❌ Erro:', error.message);
        return false;
    }
}

// Executar
setupTextosTable().then(success => {
    process.exit(success ? 0 : 1);
});
