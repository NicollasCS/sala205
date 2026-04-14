import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

async function migrateData() {
    console.log('Starting migration from SQLite to Supabase...');

    try {
        // Conectar ao SQLite
        const sqliteDb = await open({
            filename: './database/banco.db',
            driver: sqlite3.Database,
        });

        // Migrar usuários
        console.log('Migrating usuarios...');
        const usuarios = await sqliteDb.all('SELECT * FROM usuarios');
        if (usuarios.length > 0) {
            await supabase.from('usuarios').insert(usuarios);
            console.log(`✅ ${usuarios.length} usuarios migrados`);
        }

        // Migrar comentários
        console.log('Migrating comentarios...');
        const comentarios = await sqliteDb.all('SELECT * FROM comentarios');
        if (comentarios.length > 0) {
            const processedComentarios = comentarios.map(c => ({
                ...c,
                reactions: typeof c.reactions === 'string' ? JSON.parse(c.reactions) : c.reactions,
                user_reactions: typeof c.user_reactions === 'string' ? JSON.parse(c.user_reactions) : c.user_reactions,
                is_pinned: c.is_pinned ? true : false,
            }));

            await supabase.from('comentarios').insert(processedComentarios);
            console.log(`✅ ${comentarios.length} comentarios migrados`);
        }

        await sqliteDb.close();
        console.log('✅ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrateData();
