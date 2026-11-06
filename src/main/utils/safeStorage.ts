import { safeStorage } from 'electron';

import logger from '../logger';

export async function isEncryptionAvailable(): Promise<boolean> {
  return await safeStorage.isAsyncEncryptionAvailable();
}

// Encryption function
export async function encrypt(data: string): Promise<string> {
  try {
    const isAvailable = await safeStorage.isAsyncEncryptionAvailable();
    if (!isAvailable) {
      throw new Error('OS credential encryption is unavailable on this system.');
    }

    const buffer = await safeStorage.encryptStringAsync(data);
    return buffer.toString('base64');
  } catch (error) {
    logger.error('Failed to encrypt data with safeStorage.', { error });
    throw error;
  }
}

// Decryption function
export async function decrypt(encryptedData: string): Promise<string> {
  try {
    const buffer = Buffer.from(encryptedData, 'base64');
    const { result } = await safeStorage.decryptStringAsync(buffer);
    return result;
  } catch (error) {
    logger.warn('Failed to decrypt data with safeStorage (legacy or invalid key).', { error });
    throw error;
  }
}
