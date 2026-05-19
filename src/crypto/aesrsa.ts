import * as ExpoCrypto from "expo-crypto";
import { gcm } from "@noble/ciphers/aes.js";

const AES_KEY_SIZE = 32;
const AES_GCM_IV_SIZE = 12;

export type RSAKeyPair = {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
};

export type AESRSANote = {
  version: 1;
  algorithm: "AES-256-GCM + RSA-OAEP";

  noteIv: string;
  ciphertext: string;

  encryptedNoteKey: string;
  createdAt: string;
};

function getSubtleCrypto(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle;

  if (!subtle) {
    throw new Error(
      "WebCrypto crypto.subtle tidak tersedia. AES-RSA benchmark disarankan dijalankan di browser/web."
    );
  }

  return subtle;
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  return ExpoCrypto.getRandomValues(bytes);
}

function utf8ToBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function bytesToUtf8(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error("Invalid hex string");
  }

  const bytes = new Uint8Array(hex.length / 2);

  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }

  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
}

export async function generateRSAKeyPair(): Promise<RSAKeyPair> {
  const subtle = getSubtleCrypto();

  const keyPair = await subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
  };
}

export async function encryptNoteKeyWithRSA(
  publicKey: CryptoKey,
  noteKey: Uint8Array
): Promise<string> {
  const subtle = getSubtleCrypto();

  const encryptedKey = await subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    publicKey,
    toArrayBuffer(noteKey)
  );

  return bytesToHex(new Uint8Array(encryptedKey));
}

export async function decryptNoteKeyWithRSA(
  privateKey: CryptoKey,
  encryptedNoteKeyHex: string
): Promise<Uint8Array> {
  const subtle = getSubtleCrypto();

  const encryptedNoteKey = hexToBytes(encryptedNoteKeyHex);

  const noteKey = await subtle.decrypt(
    {
      name: "RSA-OAEP",
    },
    privateKey,
    toArrayBuffer(encryptedNoteKey)
  );

  return new Uint8Array(noteKey);
}

export async function encryptNoteWithAESRSA(
  title: string,
  body: string,
  rsaKeyPair: RSAKeyPair
): Promise<AESRSANote> {
  const noteKey = randomBytes(AES_KEY_SIZE);
  const noteIv = randomBytes(AES_GCM_IV_SIZE);

  const notePayload = JSON.stringify({
    title,
    body,
    encryptedAt: new Date().toISOString(),
  });

  const plaintextBytes = utf8ToBytes(notePayload);
  const ciphertext = gcm(noteKey, noteIv).encrypt(plaintextBytes);

  const encryptedNoteKey = await encryptNoteKeyWithRSA(
  rsaKeyPair.publicKey,
  new Uint8Array(noteKey)
  );

  return {
    version: 1,
    algorithm: "AES-256-GCM + RSA-OAEP",

    noteIv: bytesToHex(noteIv),
    ciphertext: bytesToHex(ciphertext),

    encryptedNoteKey,
    createdAt: new Date().toISOString(),
  };
}

export async function decryptNoteWithAESRSA(
  encryptedNote: AESRSANote,
  rsaKeyPair: RSAKeyPair
): Promise<{
  title: string;
  body: string;
  encryptedAt?: string;
}> {
  const noteKey = new Uint8Array(
  await decryptNoteKeyWithRSA(
    rsaKeyPair.privateKey,
    encryptedNote.encryptedNoteKey
  )
  );

  const noteIv = hexToBytes(encryptedNote.noteIv);
  const ciphertext = hexToBytes(encryptedNote.ciphertext);

  const plaintextBytes = gcm(noteKey, noteIv).decrypt(ciphertext);
  const plaintext = bytesToUtf8(plaintextBytes);

  return JSON.parse(plaintext);
}