import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function limparUsuarios() {
    const db = await open({
        filename: './database/banco.db',
        driver: sqlite3.Database,
    });

    await db.exec(`
        DELETE FROM usuarios WHERE id > 1;
    `);

    await db.close();
}

await limparUsuarios();