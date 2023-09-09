/* eslint-disable prefer-destructuring */
import crypto from 'crypto';
import log from '../log';

// Encryption function
export function encrypt(data: string) {
  try {
    const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET;
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
    log('Error occurred when encrypting data.', { error }, 'ERROR');
    throw error;
  }
}

// Decryption function
export function decrypt(encryptedData: string): string {
  try {
    const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET;
    if (!ENCRYPTION_SECRET) throw new Error('ENCRYPTION_SECRET not found.');

    const iv = Buffer.from(encryptedData.slice(0, 32), 'hex'); // Extract the IV from the beginning of the string
    const ciphertext = encryptedData.slice(32); // Extract the remaining portion as the ciphertext
    const decryptionKey = crypto.scryptSync(ENCRYPTION_SECRET, 'salt', 32); // Derive the decryption key from the secret
    const decipher = crypto.createDecipheriv('aes-256-cbc', decryptionKey, iv);
    let decryptedData = decipher.update(ciphertext, 'hex', 'utf8');
    decryptedData += decipher.final('utf8');

    return decryptedData;
  } catch (error) {
    log('Error occurred when decrypting data.', { error }, 'ERROR');
    throw error;
  }
}

export function compare(data: string, encryptedData: string) {
  try {
    const decryptedData = decrypt(encryptedData);
    const isTheSame = decryptedData === data;

    return isTheSame;
  } catch (error) {
    log('Error occurred when comparing encrypted data.', { error }, 'ERROR');
    return false;
  }
}

// // Example usage
// const sensitiveData = 'This is sensitive information';

// // Encrypt the data
// const encrypted = encryptData(sensitiveData);
// console.log('Encrypted Data:', encrypted);

// // Decrypt the data
// const decrypted = decryptData(encrypted);
// console.log('Decrypted Data:', decrypted);
