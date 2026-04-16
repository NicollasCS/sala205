import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const supabase = supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

async function setupDatabase() {
    console.log('🔧 Configurando banco de dados Supabase...\n');

    try {
        // ===== Criar tabela calendario =====
        console.log('📅 Tabela calendario...');
        console.log('   ℹ️  Esta tabela deve ser criada manualmente no Supabase SQL Editor');
        console.log('   Execute o SQL em: SUPABASE_SETUP.sql\n');

        // ===== Criar/Verificar usuários especiais =====
        console.log('👤 Configurando usuários especiais...');
        
        const usuariosEspeciais = [
            { nome: 'aluno205-1', senha: 'aluno205-1' },
            { nome: 'dev205-1', senha: 'dev205-1' }
        ];

        for (const user of usuariosEspeciais) {
            // Hash da senha com MD5
            const senhaHash = crypto.createHash('md5').update(user.senha).digest('hex');
            
            // Verificar se usuário já existe
            const { data: existing, error: checkError } = await supabase
                .from('usuarios')
                .select('id, nome')
                .eq('nome', user.nome)
                .maybeSingle();

            if (existing) {
                console.log(`✅ ${user.nome} já existe no banco de dados`);
                continue;
            }

            // Inserir novo usuário
            const { data: newUser, error: insertError } = await supabase
                .from('usuarios')
                .insert([
                    {
                        nome: user.nome,
                        senha: senhaHash
                    }
                ])
                .select()
                .single();

            if (insertError) {
                console.log(`❌ Erro ao inserir ${user.nome}: ${insertError.message}`);
                continue;
            }

            console.log(`✅ ${user.nome} criado com sucesso`);
            console.log(`   Email: ${user.nome}`);
            console.log(`   Senha: ${user.senha}`);
        }

        console.log('\n✨ Configuração do banco de dados concluída!');
        console.log('\n📝 PRÓXIMOS PASSOS:');
        console.log('   1. Execute o SQL em SUPABASE_SETUP.sql no console Supabase');
        console.log('   2. Contas protegidas:');
        console.log('      - aluno205-1 (acesso ao calendário)');
        console.log('      - dev205-1 (conta de desenvolvimento)');
        console.log('   3. Estas contas NÃO podem ser deletadas pela página de admin');

    } catch (error) {
        console.error('❌ Erro na configuração do banco:', error.message);
        process.exit(1);
    }
}

setupDatabase();
