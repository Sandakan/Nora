import path from 'path';
import { File } from 'node-taglib-sharp';

import logger from '../logger';

const m4rMimeType = 'audio/x-m4a';

const extensionToMime: Record<string, string> = {
  '.m4r': m4rMimeType
};

/**
 * Creates a taglib-sharp File object with proper MIME type mapping.
 * taglib-sharp doesn't have built-in support for .m4r extension,
 * so we map it to audio/x-m4a which is the correct MIME type.
 *
 * @param filePath Absolute path to the audio file
 * @returns File object ready for tag operations
 */
export function createTagFile(filePath: string): File {
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = extensionToMime[ext];

  let file: File;

  if (mimeType) {
    file = File.createFromPath(filePath, mimeType);
  } else {
    file = File.createFromPath(filePath);
  }

  logger.debug(`Created tag file for ${filePath}`, { mimeType: mimeType ?? 'auto-detected' });
  return file;
}

/**
 * Wrapper that ensures proper file disposal even if errors occur.
 *
 * @param filePath Absolute path to the audio file
 * @param callback Function to execute with the file handle
 * @returns Result from the callback function
 */
export async function withTagFile<T>(
  filePath: string,
  callback: (file: File) => Promise<T> | T
): Promise<T> {
  const file = createTagFile(filePath);

  try {
    return await callback(file);
  } finally {
    try {
      file.dispose();
    } catch (disposeError) {
      logger.warn('Error disposing tag file', { disposeError, filePath });
    }
  }
}

/**
 * Synchronous version of withTagFile.
 */
export function withTagFileSync<T>(filePath: string, callback: (file: File) => T): T {
  const file = createTagFile(filePath);

  try {
    return callback(file);
  } finally {
    try {
      file.dispose();
    } catch (disposeError) {
      logger.warn('Error disposing tag file', { disposeError, filePath });
    }
  }
}
