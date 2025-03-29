import crypto from 'crypto';
import logger from '../logger';

// Encryption function
export function encrypt(data: string) {
  try {
    const ENCRYPTION_SECRET = import.meta.env.MAIN_VITE_ENCRYPTION_SECRET;
    if (!ENCRYPTION_SECRET) throw new Error('ENCRYPTION_SECRET not found.');

    const iv = crypto.randomBytes(16); // Generate a random initialization vector
    const encryptionKey = crypto.scryptSync(ENCRYPTION_SECRET, 'salt', 32); // Derive the encryption key from the secret
    const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
    let encryptedData = cipher.update(data, 'utf8', 'hex');
    encryptedData += cipher.final('hex');
    const stringIv = iv.toString('hex');
    const encrypted = stringIv + encryptedData;

    return encrypted;
  } catch (error) {
    logger.debug('Failed to encrypting data.', { error });
    throw error;
  }
}

// Decryption function
export function decrypt(encryptedData: string): string {
  try {
    const ENCRYPTION_SECRET = import.meta.env.MAIN_VITE_ENCRYPTION_SECRET;
    if (!ENCRYPTION_SECRET) throw new Error('ENCRYPTION_SECRET not found.');

    const iv = Buffer.from(encryptedData.slice(0, 32), 'hex'); // Extract the IV from the beginning of the string
    const ciphertext = encryptedData.slice(32); // Extract the remaining portion as the ciphertext
    const decryptionKey = crypto.scryptSync(ENCRYPTION_SECRET, 'salt', 32); // Derive the decryption key from the secret
    const decipher = crypto.createDecipheriv('aes-256-cbc', decryptionKey, iv);
    let decryptedData = decipher.update(ciphertext, 'hex', 'utf8');
    decryptedData += decipher.final('utf8');

    return decryptedData;
  } catch (error) {
    logger.debug('Failed to decrypting data.', { error });
    throw error;
  }
}

export function compare(data: string, encryptedData: string) {
  try {
    const decryptedData = decrypt(encryptedData);
    const isTheSame = decryptedData === data;

    return isTheSame;
  } catch (error) {
    logger.error('Failed to compare encrypted data.', { error });
    return false;
  }
}
