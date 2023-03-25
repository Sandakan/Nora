import fs from 'fs/promises';
import log from '../log';

const getFileSize = async (filePath: string) => {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT')
      return 0;
    log(
      'Error occurred when trying to calculate file size of a file.',
      { error, filePath },
      'ERROR'
    );
  }
  return 0;
};

export default getFileSize;
