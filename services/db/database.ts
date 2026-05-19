import * as SQLite from "expo-sqlite";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync("secure_notes.db");
  }

  return dbPromise;
}

export async function initDatabase(): Promise<void> {
  const db = await getDatabase();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY NOT NULL,
      encryptedTitle TEXT NOT NULL,
      encryptedBody TEXT NOT NULL,
      titleIv TEXT,
      bodyIv TEXT,
      titleAuthTag TEXT,
      bodyAuthTag TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      pinned INTEGER NOT NULL DEFAULT 0
    );
  `);
}
