import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Se rulează la pornirea aplicației (SQLiteProvider onInit).
 * `PRAGMA user_version` ține minte ce versiune de schemă are deja baza de date.
 * Când adaugi ceva nou, adaugă un pas nou la final; nu modifica unul existent.
 */
const DATABASE_VERSION = 1;

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  if (version >= DATABASE_VERSION) return;

  if (version === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS habits (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        name           TEXT NOT NULL,
        icon           TEXT NOT NULL,
        color          TEXT NOT NULL,
        frequency_type TEXT NOT NULL CHECK (frequency_type IN ('daily', 'specific')),
        target_days    TEXT NOT NULL DEFAULT '[]',   -- JSON, ex. '[1,3,5]' (0 = duminică)
        reminder_time  TEXT,                         -- 'HH:MM' sau NULL
        created_at     TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS completions (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        habit_id        INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
        completion_date TEXT NOT NULL,               -- YYYY-MM-DD, ora locală
        completed_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (habit_id, completion_date)
      );
      CREATE INDEX IF NOT EXISTS idx_completions_habit_date ON completions(habit_id, completion_date);

      CREATE TABLE IF NOT EXISTS "character" (
        id    INTEGER PRIMARY KEY CHECK (id = 1),
        level INTEGER NOT NULL DEFAULT 1,
        xp    INTEGER NOT NULL DEFAULT 0,
        hp    INTEGER NOT NULL DEFAULT 100,
        str   INTEGER NOT NULL DEFAULT 0,
        int   INTEGER NOT NULL DEFAULT 0,
        vit   INTEGER NOT NULL DEFAULT 0,
        spi   INTEGER NOT NULL DEFAULT 0
      );
      INSERT OR IGNORE INTO "character" (id) VALUES (1);
    `);

    // Obiceiuri de pornire, ca ecranul Today să nu fie gol (doar dacă tabela e goală).
    const count = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM habits');
    const starters: [string, string, string, string, string][] = [
      ['Mișcare / Sport', '🏃', '#3B82F6', 'daily', '[]'],
      ['Citit', '📖', '#F59E0B', 'daily', '[]'],
      ['Somn (7–9 h)', '🌙', '#6366F1', 'daily', '[]'],
      ['Meditație (5–10 min)', '🧘', '#F97316', 'daily', '[]'],
      ['O sarcină importantă', '🎯', '#EF4444', 'specific', '[1,2,3,4,5]'],
    ];
    for (const [name, icon, color, type, days] of count?.n === 0 ? starters : []) {
      await db.runAsync(
        'INSERT INTO habits (name, icon, color, frequency_type, target_days) VALUES (?, ?, ?, ?, ?)',
        name, icon, color, type, days,
      );
    }
    version = 1;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
