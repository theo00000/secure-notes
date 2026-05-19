import { getDatabase } from "./database";
import { createId } from "../../utils/id";
import { nowIso } from "../../utils/date";
import type { EncryptedNoteRow, Note } from "../../types/note";

function mapRowToNote(row: EncryptedNoteRow): Note {
  return {
    id: row.id,

    // SEMENTARA:
    // Di step crypto nanti, encryptedTitle/encryptedBody akan didekripsi dulu.
    title: row.encryptedTitle,
    body: row.encryptedBody,

    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    pinned: row.pinned === 1,
  };
}

export async function getAllNotes(): Promise<Note[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<EncryptedNoteRow>(`
    SELECT *
    FROM notes
    ORDER BY pinned DESC, updatedAt DESC;
  `);

  return rows.map(mapRowToNote);
}

export async function getNoteById(id: string): Promise<Note | null> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<EncryptedNoteRow>(
    `
    SELECT *
    FROM notes
    WHERE id = ?;
    `,
    [id],
  );

  if (!row) return null;

  return mapRowToNote(row);
}

export async function createEmptyNote(): Promise<Note> {
  const db = await getDatabase();

  const id = createId();
  const createdAt = nowIso();

  await db.runAsync(
    `
    INSERT INTO notes (
      id,
      encryptedTitle,
      encryptedBody,
      titleIv,
      bodyIv,
      titleAuthTag,
      bodyAuthTag,
      createdAt,
      updatedAt,
      pinned
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,
    [id, "", "", null, null, null, null, createdAt, createdAt, 0],
  );

  return {
    id,
    title: "",
    body: "",
    createdAt,
    updatedAt: createdAt,
    pinned: false,
  };
}

export async function updateNoteContent(
  id: string,
  title: string,
  body: string,
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
    UPDATE notes
    SET encryptedTitle = ?,
        encryptedBody = ?,
        updatedAt = ?
    WHERE id = ?;
    `,
    [title, body, nowIso(), id],
  );
}

export async function deleteNote(id: string): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
    DELETE FROM notes
    WHERE id = ?;
    `,
    [id],
  );
}

export async function togglePinned(id: string, pinned: boolean): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
    UPDATE notes
    SET pinned = ?,
        updatedAt = ?
    WHERE id = ?;
    `,
    [pinned ? 1 : 0, nowIso(), id],
  );
}
