export type EncryptedNoteRow = {
  id: string;
  encryptedTitle: string;
  encryptedBody: string;
  titleIv: string | null;
  bodyIv: string | null;
  titleAuthTag: string | null;
  bodyAuthTag: string | null;
  createdAt: string;
  updatedAt: string;
  pinned: number;
};

export type Note = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
};
