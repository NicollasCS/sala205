import sqlite3 from 'sqlite3';
import {open} from 'sqlite';

async function criarEPopularTabelaDeUsuarios (user, senha) {
    const db = await open ({
        filename: './database/banco.db',
        driver: sqlite3.Database,
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY,
        nome TEXT NOT NULL,
        senha TEXT NOT NULL
        )
        `);
        
    await db.run(`INSERT INTO usuarios (nome, senha) VALUES (?,?)`, [user, senha]);
    await db.close();
}

await criarEPopularTabelaDeUsuarios('caneteste2', 'caneteste2');