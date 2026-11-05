import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('electron', () => ({
  safeStorage: {
    isAsyncEncryptionAvailable: vi.fn(),
    encryptStringAsync: vi.fn(),
    decryptStringAsync: vi.fn()
  }
}));

vi.mock('../../../../src/main/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    info: vi.fn()
  }
}));

import { safeStorage } from 'electron';

import { decrypt, encrypt, isEncryptionAvailable } from '../../../../src/main/utils/safeStorage';

const mockedSafeStorage = vi.mocked(safeStorage);

describe('safeStorage utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isEncryptionAvailable', () => {
    test('returns true when safeStorage.isAsyncEncryptionAvailable returns true', async () => {
      mockedSafeStorage.isAsyncEncryptionAvailable.mockResolvedValueOnce(true);
      const available = await isEncryptionAvailable();
      expect(available).toBe(true);
      expect(mockedSafeStorage.isAsyncEncryptionAvailable).toHaveBeenCalledTimes(1);
    });

    test('returns false when safeStorage.isAsyncEncryptionAvailable returns false', async () => {
      mockedSafeStorage.isAsyncEncryptionAvailable.mockResolvedValueOnce(false);
      const available = await isEncryptionAvailable();
      expect(available).toBe(false);
    });
  });

  describe('encrypt', () => {
    test('encrypts plaintext into base64 ciphertext when available', async () => {
      mockedSafeStorage.isAsyncEncryptionAvailable.mockResolvedValueOnce(true);
      mockedSafeStorage.encryptStringAsync.mockResolvedValueOnce(Buffer.from('encrypted_payload'));

      const result = await encrypt('super-secret-token');

      expect(mockedSafeStorage.encryptStringAsync).toHaveBeenCalledWith('super-secret-token');
      expect(result).toBe(Buffer.from('encrypted_payload').toString('base64'));
    });

    test('throws error if OS encryption is unavailable', async () => {
      mockedSafeStorage.isAsyncEncryptionAvailable.mockResolvedValueOnce(false);

      await expect(encrypt('super-secret-token')).rejects.toThrow(
        'OS credential encryption is unavailable on this system.'
      );
      expect(mockedSafeStorage.encryptStringAsync).not.toHaveBeenCalled();
    });

    test('propagates encryption errors', async () => {
      mockedSafeStorage.isAsyncEncryptionAvailable.mockResolvedValueOnce(true);
      mockedSafeStorage.encryptStringAsync.mockRejectedValueOnce(new Error('Hardware key failure'));

      await expect(encrypt('super-secret-token')).rejects.toThrow('Hardware key failure');
    });
  });

  describe('decrypt', () => {
    test('decrypts base64 encoded ciphertext and returns string result', async () => {
      const base64Input = Buffer.from('encrypted_bytes').toString('base64');
      mockedSafeStorage.decryptStringAsync.mockResolvedValueOnce({
        result: 'decrypted-token',
        shouldReEncrypt: false
      });

      const decrypted = await decrypt(base64Input);

      expect(mockedSafeStorage.decryptStringAsync).toHaveBeenCalledWith(
        Buffer.from('encrypted_bytes')
      );
      expect(decrypted).toBe('decrypted-token');
    });

    test('throws error when safeStorage.decryptStringAsync fails', async () => {
      mockedSafeStorage.decryptStringAsync.mockRejectedValueOnce(new Error('Bad ciphertext'));

      await expect(decrypt('invalid_base64')).rejects.toThrow('Bad ciphertext');
    });
  });
});
