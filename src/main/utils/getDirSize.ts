import fs from 'fs/promises';
import path from 'path';
import { isAnErrorWithCode } from './isAnErrorWithCode';

const getDirSize = async (dir: string) => {
  try {
    const files = await fs.readdir(dir, { withFileTypes: true });

    const paths = files.map(async (file): Promise<number> => {
      try {
        const filepath = path.join(dir, file.name);

        if (file.isDirectory()) return getDirSize(filepath);
        if (file.isFile()) {
          const { size } = await fs.stat(filepath);
          return size;
        }
      } catch (error) {
        console.log(
          'Error occurred when trying to calculate dir size of a directory.',
        );
      }
      return 0;
    });

    const sizesOfPaths = await Promise.all(paths);
    const flatSizes = sizesOfPaths.flat(Number.POSITIVE_INFINITY);
    const reducedSizes = flatSizes.reduce((i, size) => i + size, 0);

    return reducedSizes;
  } catch (error) {
    if (isAnErrorWithCode(error) && error.code === 'ENOENT') return 0;
    console.log(
      'Error occurred when resolving promise to calculate dir size of a directory.',
    );
  }
  return 0;
};

export default getDirSize;
