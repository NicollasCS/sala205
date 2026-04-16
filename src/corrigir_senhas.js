import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const supabase = supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

async function corrigirSenhas() {
    console.log('🔐 Corrigindo senhas no banco...\n');

    const senhasCorretas = {
        'aluno205-1': crypto.createHash('md5').update('aluno205-1').digest('hex'),
        'dev205-1': crypto.createHash('md5').update('dev205-1').digest('hex'),
        'administrador_turma205-1': crypto.createHash('md5').update('administrador_turma205-1').digest('hex')
    };

    console.log('📝 Hashes corretos calculados:');
    Object.entries(senhasCorretas).forEach(([user, hash]) => {
        console.log(`   ${user}: ${hash}`);
    });

    console.log('\n⚙️  Atualizando banco de dados...\n');

    try {
        for (const [nome, senhaHash] of Object.entries(senhasCorretas)) {
            const { data, error } = await supabase
                .from('usuarios')
                .update({ senha: senhaHash })
                .eq('nome', nome)
                .select();

            if (error) {
                console.log(`❌ Erro ao atualizar ${nome}: ${error.message}`);
                continue;
            }

            console.log(`✅ ${nome} atualizado com sucesso`);
        }

        console.log('\n✨ Todas as senhas foram corrigidas!');
        console.log('\n🧪 Teste novamente com:');
        console.log('   Usuário: aluno205-1');
        console.log('   Senha: aluno205-1');

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

corrigirSenhas();
