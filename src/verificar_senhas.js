import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
);

async function verificarSenhas() {
    console.log('🔍 Verificando senhas no banco...\n');

    const senhasEsperadas = {
        'aluno205-1': '34e6c4e15d88fcc2aae02e87d10c7e77',
        'dev205-1': '96c8577903a3dd04d6a9c77f4869cce2',
        'administrador_turma205-1': crypto.createHash('md5').update('administrador_turma205-1').digest('hex')
    };

    console.log('📝 Hashes esperados:');
    Object.entries(senhasEsperadas).forEach(([user, hash]) => {
        console.log(`   ${user}: ${hash}`);
    });

    console.log('\n🔎 Buscando usuários no banco...\n');

    try {
        const { data: usuarios, error } = await supabase
            .from('usuarios')
            .select('nome, senha')
            .in('nome', ['aluno205-1', 'dev205-1', 'administrador_turma205-1']);

        if (error) {
            console.error('❌ Erro ao buscar:', error.message);
            return;
        }

        if (!usuarios || usuarios.length === 0) {
            console.log('❌ Nenhum usuário encontrado!');
            return;
        }

        console.log('📊 Usuários encontrados:\n');
        usuarios.forEach(user => {
            const esperado = senhasEsperadas[user.nome];
            const match = user.senha === esperado ? '✅ OK' : '❌ DIFERENTE';
            console.log(`${match} ${user.nome}`);
            console.log(`   Esperado: ${esperado}`);
            console.log(`   Banco:    ${user.senha}`);
            console.log('');
        });

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

verificarSenhas();
