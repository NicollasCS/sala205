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
        console.log('📝 Verificando/Criando tabela textos_pagina...');

        // Verificar se tabela já existe tentando fazer uma query
        const { data: tableCheck, error: checkError } = await supabase
            .from('textos_pagina')
            .select('id')
            .limit(1);

        if (!checkError) {
            console.log('✅ Tabela textos_pagina já existe');

            // Se tabela existe, verificar se tem dados
            const { data: existing, error: existError } = await supabase
                .from('textos_pagina')
                .select('*');

            if (!existError && (!existing || existing.length === 0)) {
                console.log('📝 Inserindo dados padrão...');
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
                    console.error('⚠️  Erro ao inserir dados padrão:', insertError.message);
                } else {
                    console.log('✅ Dados padrão inseridos');
                }
            }
            return true;
        }

        // Se tabela não existe, exibir instruções
        if (checkError && checkError.message.includes('relation "public.textos_pagina" does not exist')) {
            console.warn('\n⚠️  Tabela textos_pagina não existe!\n');
            console.log('📋 Execute o SQL abaixo no Dashboard do Supabase:');
            console.log('   1. Vá para: https://supabase.com/dashboard/project/[seu-projeto]/sql');
            console.log('   2. Clique em "New Query"');
            console.log('   3. Cole o SQL do arquivo: sql/TEXTOS_PAGINA_SETUP.sql\n');
            
            console.log('Ou execute esse script depois de criar a tabela.\n');
            return false;
        }

        console.error('❌ Erro desconhecido:', checkError);
        return false;

    } catch (error) {
        console.error('❌ Erro:', error.message);
        return false;
    }
}

// Executar
setupTextosTable().then(success => {
    if (success) {
        console.log('\n✅ Setup da tabela textos_pagina concluído!');
    } else {
        console.log('\n⚠️  Execute manualmente o SQL no dashboard Supabase');
    }
    process.exit(success ? 0 : 1);
});
