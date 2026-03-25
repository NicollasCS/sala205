import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function setupAdmin() {
    const db = await open({
        filename: './database/banco.db',
        driver: sqlite3.Database,
    });

    // Cria admin se não existir com ID 1
    const admin = await db.get('SELECT id FROM usuarios WHERE nome = ?', ['administrador_turma205-1']);
    
    if (!admin) {
        await db.run(`INSERT OR IGNORE INTO usuarios (id, nome, senha) VALUES (1, 'administrador_turma205-1', 'administrador_turma205-1')`);
        console.log('✅ Admin criado com ID 1!');
    } else {
        console.log('✅ Admin já existe (ID 1)');
    }

    await db.close();
}

setupAdmin().catch(console.error);
