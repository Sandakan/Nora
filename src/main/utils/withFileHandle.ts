import { File } from 'node-taglib-sharp';
import logger from '../logger';

/**
 * Utility wrapper for node-taglib-sharp File operations
 * Ensures proper file disposal even if errors occur
 * 
 * @param filePath Absolute path to the audio file
 * @param callback Function to execute with the file handle
 * @returns Result from the callback function
 * @throws Error if file cannot be opened or callback fails
 */
export async function withFileHandle<T>(
  filePath: string,
  callback: (file: File) => Promise<T> | T
): Promise<T> {
  let file: File | undefined;
  
  try {
    file = File.createFromPath(filePath);
    const result = await callback(file);
    return result;
  } catch (error) {
    logger.error('Error during file handle operation', { error, filePath });
    throw error;
  } finally {
    if (file) {
      try {
        file.dispose();
      } catch (disposeError) {
        logger.warn('Error disposing file handle', { disposeError, filePath });
      }
    }
  }
}

/**
 * Synchronous version of withFileHandle
 * Use when callback doesn't need async operations
 */
export function withFileHandleSync<T>(
  filePath: string,
  callback: (file: File) => T
): T {
  let file: File | undefined;
  
  try {
    file = File.createFromPath(filePath);
    return callback(file);
  } catch (error) {
    logger.error('Error during file handle operation', { error, filePath });
    throw error;
  } finally {
    if (file) {
      try {
        file.dispose();
      } catch (disposeError) {
        logger.warn('Error disposing file handle', { disposeError, filePath });
      }
    }
  }
}
