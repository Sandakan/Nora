/* eslint-disable prefer-destructuring */
import crypto from 'crypto';

// Encryption function
export function encrypt(data: string): string {
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
}

// Decryption function
export function decrypt(encryptedData: string): string {
  const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET;
  if (!ENCRYPTION_SECRET) throw new Error('ENCRYPTION_SECRET not found.');

  const iv = Buffer.from(encryptedData.slice(0, 32), 'hex'); // Extract the IV from the beginning of the string
  const ciphertext = encryptedData.slice(32); // Extract the remaining portion as the ciphertext
  const decryptionKey = crypto.scryptSync(ENCRYPTION_SECRET, 'salt', 32); // Derive the decryption key from the secret
  const decipher = crypto.createDecipheriv('aes-256-cbc', decryptionKey, iv);
  let decryptedData = decipher.update(ciphertext, 'hex', 'utf8');
  decryptedData += decipher.final('utf8');

  return decryptedData;
}

// // Example usage
// const sensitiveData = 'This is sensitive information';

// // Encrypt the data
// const encrypted = encryptData(sensitiveData);
// console.log('Encrypted Data:', encrypted);

// // Decrypt the data
// const decrypted = decryptData(encrypted);
// console.log('Decrypted Data:', decrypted);
