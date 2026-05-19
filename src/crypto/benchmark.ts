import { encryptNote, decryptNote } from "./aesecc";
import {
  encryptNoteWithAESRSA,
  decryptNoteWithAESRSA,
  generateRSAKeyPair,
} from "./aesrsa";

export type BenchmarkResult = {
  method: "AES-ECC" | "AES-RSA";
  noteSize: number;

  encryptTimeMs: number;
  decryptTimeMs: number;
  totalTimeMs: number;

  encryptedPayloadSizeBytes: number;
  ciphertextSizeBytes: number;
  encryptedNoteKeySizeBytes: number;

  memoryBeforeMB: number | null;
  memoryAfterEncryptMB: number | null;
  memoryAfterDecryptMB: number | null;
  memoryDeltaEncryptMB: number | null;
  memoryDeltaTotalMB: number | null;
};

function generateNoteBody(size: number): string {
  return "A".repeat(size);
}

function now(): number {
  return performance.now();
}

function getObjectSizeBytes(obj: unknown): number {
  return new TextEncoder().encode(JSON.stringify(obj)).length;
}

/**
 * Karena ciphertext dan encryptedNoteKey disimpan dalam bentuk hex,
 * 2 karakter hex = 1 byte.
 */
function getHexSizeBytes(hex: string): number {
  return Math.ceil(hex.length / 2);
}

/**
 * performance.memory hanya tersedia di beberapa browser berbasis Chromium.
 * Kalau tidak tersedia, hasil memory akan null.
 *
 * Ini tetap aman untuk laporan, karena bisa ditulis sebagai keterbatasan
 * pengukuran memori pada environment tertentu.
 */
function getMemoryMB(): number | null {
  const performanceWithMemory = performance as Performance & {
    memory?: {
      usedJSHeapSize: number;
    };
  };

  if (!performanceWithMemory.memory) {
    return null;
  }

  return Number(
    (performanceWithMemory.memory.usedJSHeapSize / 1024 / 1024).toFixed(4)
  );
}

function countMemoryDelta(
  before: number | null,
  after: number | null
): number | null {
  if (before === null || after === null) {
    return null;
  }

  return Number((after - before).toFixed(4));
}

async function benchmarkAESECC(noteSize: number): Promise<BenchmarkResult> {
  const title = `AES-ECC-${noteSize}`;
  const body = generateNoteBody(noteSize);

  const memoryBefore = getMemoryMB();

  const encryptStart = now();
  const encrypted = await encryptNote(title, body);
  const encryptEnd = now();

  const memoryAfterEncrypt = getMemoryMB();

  const decryptStart = now();
  await decryptNote(encrypted);
  const decryptEnd = now();

  const memoryAfterDecrypt = getMemoryMB();

  return {
    method: "AES-ECC",
    noteSize,

    encryptTimeMs: Number((encryptEnd - encryptStart).toFixed(3)),
    decryptTimeMs: Number((decryptEnd - decryptStart).toFixed(3)),
    totalTimeMs: Number((decryptEnd - encryptStart).toFixed(3)),

    encryptedPayloadSizeBytes: getObjectSizeBytes(encrypted),
    ciphertextSizeBytes: getHexSizeBytes(encrypted.ciphertext),
    encryptedNoteKeySizeBytes: getHexSizeBytes(encrypted.encryptedNoteKey),

    memoryBeforeMB: memoryBefore,
    memoryAfterEncryptMB: memoryAfterEncrypt,
    memoryAfterDecryptMB: memoryAfterDecrypt,
    memoryDeltaEncryptMB: countMemoryDelta(memoryBefore, memoryAfterEncrypt),
    memoryDeltaTotalMB: countMemoryDelta(memoryBefore, memoryAfterDecrypt),
  };
}

async function benchmarkAESRSA(noteSize: number): Promise<BenchmarkResult> {
  const title = `AES-RSA-${noteSize}`;
  const body = generateNoteBody(noteSize);

  const rsaKeyPair = await generateRSAKeyPair();

  const memoryBefore = getMemoryMB();

  const encryptStart = now();
  const encrypted = await encryptNoteWithAESRSA(title, body, rsaKeyPair);
  const encryptEnd = now();

  const memoryAfterEncrypt = getMemoryMB();

  const decryptStart = now();
  await decryptNoteWithAESRSA(encrypted, rsaKeyPair);
  const decryptEnd = now();

  const memoryAfterDecrypt = getMemoryMB();

  return {
    method: "AES-RSA",
    noteSize,

    encryptTimeMs: Number((encryptEnd - encryptStart).toFixed(3)),
    decryptTimeMs: Number((decryptEnd - decryptStart).toFixed(3)),
    totalTimeMs: Number((decryptEnd - encryptStart).toFixed(3)),

    encryptedPayloadSizeBytes: getObjectSizeBytes(encrypted),
    ciphertextSizeBytes: getHexSizeBytes(encrypted.ciphertext),
    encryptedNoteKeySizeBytes: getHexSizeBytes(encrypted.encryptedNoteKey),

    memoryBeforeMB: memoryBefore,
    memoryAfterEncryptMB: memoryAfterEncrypt,
    memoryAfterDecryptMB: memoryAfterDecrypt,
    memoryDeltaEncryptMB: countMemoryDelta(memoryBefore, memoryAfterEncrypt),
    memoryDeltaTotalMB: countMemoryDelta(memoryBefore, memoryAfterDecrypt),
  };
}

export async function runCryptoBenchmark(): Promise<BenchmarkResult[]> {
  const noteSizes = [100, 1000, 10000];
  const results: BenchmarkResult[] = [];

  for (const size of noteSizes) {
    results.push(await benchmarkAESECC(size));
    results.push(await benchmarkAESRSA(size));
  }

  console.table(results);
  return results;
}