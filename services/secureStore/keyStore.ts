import * as SecureStore from "expo-secure-store";
import { randomBytes } from "@noble/ciphers/utils.js";
import { base64ToBytes, bytesToBase64 } from "../../utils/encoding";

const MASTER_KEY_STORAGE_KEY = "secure_notes_master_key_v1";

export async function getOrCreateMasterKey(): Promise<Uint8Array> {
  const existingKey = await SecureStore.getItemAsync(MASTER_KEY_STORAGE_KEY);

  if (existingKey) {
    return base64ToBytes(existingKey);
  }

  // 32 bytes = 256-bit key untuk AES-256-GCM.
  const newKey = randomBytes(32);

  await SecureStore.setItemAsync(MASTER_KEY_STORAGE_KEY, bytesToBase64(newKey));

  return newKey;
}

export async function deleteMasterKey(): Promise<void> {
  await SecureStore.deleteItemAsync(MASTER_KEY_STORAGE_KEY);
}
