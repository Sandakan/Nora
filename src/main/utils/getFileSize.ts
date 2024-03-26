import fs from 'fs/promises';
import log from '../log';
import { isAnErrorWithCode } from './isAnErrorWithCode';

const getFileSize = async (filePath: string) => {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch (error) {
    if (isAnErrorWithCode(error) && error.code === 'ENOENT') return 0;
    log(
      'Error occurred when trying to calculate file size of a file.',
      { error, filePath },
      'ERROR'
    );
  }
  return 0;
};

export default getFileSize;
