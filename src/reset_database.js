import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../database/banco.db');

try {
    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
        console.log('\n✅ Banco de dados antigo apagado com sucesso!');
        console.log('Agora inicie o servidor (npm start) para criar as novas tabelas corretamente.\n');
    } else {
        console.log('\n⚠️  O banco de dados não foi encontrado (já está limpo).\n');
    }
} catch (error) {
    console.error('Erro ao apagar banco:', error);
}