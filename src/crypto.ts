import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { gcm } from "@noble/ciphers/aes.js";
import { randomBytes } from "@noble/ciphers/webcrypto.js";
import { utf8ToBytes, bytesToUtf8 } from "@noble/ciphers/utils.js";
import { p256 } from "@noble/curves/nist.js";
import { hkdf } from "@noble/hashes/hkdf.js";
import { sha256 } from "@noble/hashes/sha2.js";
const MASTER_KEY_STORAGE_KEY = "secure_notes_master_key";

export type EncryptedNote = {
  iv: string;
  ciphertext: string;
};

export type DecryptedNote = {
  title: string;
  body: string;
  encryptedAt?: string;
};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

async function saveKey(key: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(MASTER_KEY_STORAGE_KEY, key);
    return;
  }

  await SecureStore.setItemAsync(MASTER_KEY_STORAGE_KEY, key);
}

async function loadKey(): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(MASTER_KEY_STORAGE_KEY);
  }

  return SecureStore.getItemAsync(MASTER_KEY_STORAGE_KEY);
}

async function getOrCreateMasterKey(): Promise<Uint8Array> {
  const existingKey = await loadKey();

  if (existingKey) {
    return base64ToBytes(existingKey);
  }

  // 32 byte = AES-256
  const newKey = randomBytes(32);
  const encodedKey = bytesToBase64(newKey);

  await saveKey(encodedKey);

  return newKey;
}

export async function initVault(): Promise<void> {
  await getOrCreateMasterKey();
}

export async function encryptNote(
  title: string,
  body: string
): Promise<EncryptedNote> {
  const masterKey = await getOrCreateMasterKey();

  // 12 byte nonce direkomendasikan untuk AES-GCM
  const iv = randomBytes(12);

  const notePayload = JSON.stringify({
    title,
    body,
    encryptedAt: new Date().toISOString(),
  });

  const plaintextBytes = utf8ToBytes(notePayload);

  const aes = gcm(masterKey, iv);
  const ciphertext = aes.encrypt(plaintextBytes);

  return {
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(ciphertext),
  };
}

export async function decryptNote(
  encryptedNote: EncryptedNote
): Promise<DecryptedNote> {
  const masterKey = await getOrCreateMasterKey();

  const iv = base64ToBytes(encryptedNote.iv);
  const ciphertext = base64ToBytes(encryptedNote.ciphertext);

  const aes = gcm(masterKey, iv);
  const plaintextBytes = aes.decrypt(ciphertext);

  const plaintext = bytesToUtf8(plaintextBytes);

  return JSON.parse(plaintext);
}

export function generateECCKeyPair() {
  const privateKey = p256.utils.randomPrivateKey();
  const publicKey = p256.getPublicKey(privateKey);

  return {
    privateKey: bytesToBase64(privateKey),
    publicKey: bytesToBase64(publicKey),
  };
}

export function deriveSharedSecret(
  privateKeyBase64: string,
  publicKeyBase64: string
): string {
  const privateKey = base64ToBytes(privateKeyBase64);
  const publicKey = base64ToBytes(publicKeyBase64);

  const sharedSecret = p256.getSharedSecret(privateKey, publicKey);

  const derivedKey = hkdf(
    sha256,
    sharedSecret,
    undefined,
    utf8ToBytes("secure-notes-ecc-shared-secret"),
    32
  );

  return bytesToBase64(derivedKey);
}