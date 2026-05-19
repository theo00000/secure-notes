import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import * as ExpoCrypto from "expo-crypto";

import { gcm } from "@noble/ciphers/aes.js";
import { p256 } from "@noble/curves/nist.js";
import { hkdf } from "@noble/hashes/hkdf.js";
import { sha256 } from "@noble/hashes/sha2.js";

const VAULT_ECC_PRIVATE_KEY = "secure_notes_ecc_private_key";
const VAULT_ECC_PUBLIC_KEY = "secure_notes_ecc_public_key";

const AES_KEY_SIZE = 32;
const AES_GCM_IV_SIZE = 12;

export type EncryptedNote = {
  version: 1;
  algorithm: "AES-256-GCM + ECC-P256";
  curve: "P-256";

  noteIv: string;
  ciphertext: string;

  keyIv: string;
  encryptedNoteKey: string;

  ephemeralPublicKey: string;
  createdAt: string;
};

export type DecryptedNote = {
  title: string;
  body: string;
  encryptedAt?: string;
};

export type ECCKeyPair = {
  privateKey: string;
  publicKey: string;
  curve: "P-256";
};

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

async function saveSecureValue(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function loadSecureValue(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

function generateECCPrivateKeyBytes(): Uint8Array {
  const utils = p256.utils as unknown as {
    randomPrivateKey?: () => Uint8Array;
    randomSecretKey?: () => Uint8Array;
  };

  if (utils.randomPrivateKey) {
    return utils.randomPrivateKey();
  }

  if (utils.randomSecretKey) {
    return utils.randomSecretKey();
  }

  return randomBytes(32);
}

function deriveWrappingKey(
  privateKey: Uint8Array,
  publicKey: Uint8Array
): Uint8Array {
  const sharedSecret = p256.getSharedSecret(privateKey, publicKey);

  return hkdf(
    sha256,
    sharedSecret,
    undefined,
    utf8ToBytes("secure-notes-ecc-p256-aes-key-wrapping"),
    AES_KEY_SIZE
  );
}

async function getOrCreateVaultECCKeyPair(): Promise<{
  privateKey: Uint8Array;
  publicKey: Uint8Array;
}> {
  const storedPrivateKey = await loadSecureValue(VAULT_ECC_PRIVATE_KEY);
  const storedPublicKey = await loadSecureValue(VAULT_ECC_PUBLIC_KEY);

  if (storedPrivateKey && storedPublicKey) {
    return {
      privateKey: hexToBytes(storedPrivateKey),
      publicKey: hexToBytes(storedPublicKey),
    };
  }

  const privateKey = generateECCPrivateKeyBytes();
  const publicKey = p256.getPublicKey(privateKey);

  await saveSecureValue(VAULT_ECC_PRIVATE_KEY, bytesToHex(privateKey));
  await saveSecureValue(VAULT_ECC_PUBLIC_KEY, bytesToHex(publicKey));

  return {
    privateKey,
    publicKey,
  };
}

export async function initVault(): Promise<void> {
  await getOrCreateVaultECCKeyPair();
}

export async function encryptNote(
  title: string,
  body: string
): Promise<EncryptedNote> {
  const vaultKeyPair = await getOrCreateVaultECCKeyPair();

  const noteKey = randomBytes(AES_KEY_SIZE);
  const noteIv = randomBytes(AES_GCM_IV_SIZE);

  const notePayload = JSON.stringify({
    title,
    body,
    encryptedAt: new Date().toISOString(),
  });

  const plaintextBytes = utf8ToBytes(notePayload);
  const ciphertext = gcm(noteKey, noteIv).encrypt(plaintextBytes);

  const ephemeralPrivateKey = generateECCPrivateKeyBytes();
  const ephemeralPublicKey = p256.getPublicKey(ephemeralPrivateKey);

  const wrappingKey = deriveWrappingKey(
    ephemeralPrivateKey,
    vaultKeyPair.publicKey
  );

  const keyIv = randomBytes(AES_GCM_IV_SIZE);
  const encryptedNoteKey = gcm(wrappingKey, keyIv).encrypt(noteKey);

  return {
    version: 1,
    algorithm: "AES-256-GCM + ECC-P256",
    curve: "P-256",

    noteIv: bytesToHex(noteIv),
    ciphertext: bytesToHex(ciphertext),

    keyIv: bytesToHex(keyIv),
    encryptedNoteKey: bytesToHex(encryptedNoteKey),

    ephemeralPublicKey: bytesToHex(ephemeralPublicKey),
    createdAt: new Date().toISOString(),
  };
}

export async function decryptNote(
  encryptedNote: EncryptedNote
): Promise<DecryptedNote> {
  const vaultKeyPair = await getOrCreateVaultECCKeyPair();

  const ephemeralPublicKey = hexToBytes(encryptedNote.ephemeralPublicKey);

  const wrappingKey = deriveWrappingKey(
    vaultKeyPair.privateKey,
    ephemeralPublicKey
  );

  const keyIv = hexToBytes(encryptedNote.keyIv);
  const encryptedNoteKey = hexToBytes(encryptedNote.encryptedNoteKey);

  const noteKey = gcm(wrappingKey, keyIv).decrypt(encryptedNoteKey);

  const noteIv = hexToBytes(encryptedNote.noteIv);
  const ciphertext = hexToBytes(encryptedNote.ciphertext);

  const plaintextBytes = gcm(noteKey, noteIv).decrypt(ciphertext);
  const plaintext = bytesToUtf8(plaintextBytes);

  return JSON.parse(plaintext);
}

export function generateECCKeyPair(): ECCKeyPair {
  const privateKey = generateECCPrivateKeyBytes();
  const publicKey = p256.getPublicKey(privateKey);

  return {
    privateKey: bytesToHex(privateKey),
    publicKey: bytesToHex(publicKey),
    curve: "P-256",
  };
}

export function deriveSharedSecret(
  privateKeyHex: string,
  publicKeyHex: string
): string {
  const privateKey = hexToBytes(privateKeyHex);
  const publicKey = hexToBytes(publicKeyHex);

  const derivedKey = deriveWrappingKey(privateKey, publicKey);

  return bytesToHex(derivedKey);
}

export async function getVaultPublicKey(): Promise<string> {
  const keyPair = await getOrCreateVaultECCKeyPair();
  return bytesToHex(keyPair.publicKey);
}