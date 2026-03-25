import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function migrateDB() {
  const db = await open({
filename: '../database/banco.db',
    driver: sqlite3.Database,
  });

  // Add is_pinned if missing
  await db.exec(`
    CREATE TABLE IF NOT EXISTS comentarios_temp (
      id INTEGER PRIMARY KEY,
      autor TEXT NOT NULL,
      texto TEXT NOT NULL,
      parent_id INTEGER,
      reactions TEXT DEFAULT '{"👍":0,"👎":0,"❤️":0}',
      user_reactions TEXT DEFAULT '{}',
      is_pinned INTEGER DEFAULT 0,
      criado DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migrate data
  await db.exec(`
    INSERT OR IGNORE INTO comentarios_temp 
    SELECT 
      id, autor, texto, parent_id, reactions, '{}' as user_reactions, 0 as is_pinned, criado
    FROM comentarios
  `);

  // Drop old, rename new
  await db.exec('DROP TABLE IF EXISTS comentarios');
  await db.exec('ALTER TABLE comentarios_temp RENAME TO comentarios');

  console.log('✅ Migration complete: Added is_pinned + user_reactions columns.');
  await db.close();
}

migrateDB().catch(console.error);

