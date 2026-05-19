export function nowIso(): string {
  return new Date().toISOString();
}

export function formatNoteDate(value: string): string {
  return new Date(value).toLocaleString();
}
