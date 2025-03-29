import fs from 'fs/promises';
import logger from '../logger';
import { isAnErrorWithCode } from './isAnErrorWithCode';

const getFileSize = async (filePath: string) => {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch (error) {
    if (isAnErrorWithCode(error) && error.code === 'ENOENT') return 0;
    logger.error('Failed to calculate file size of a file.', { error, filePath });
  }
  return 0;
};

export default getFileSize;
