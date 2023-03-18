const { parentPort } = require('worker_threads');
const fs = require('fs/promises');
const path = require('path');

const getDirSize = async (dir) => {
  try {
    const files = await fs.readdir(dir, { withFileTypes: true });

    const paths = files.map(async (file) => {
      try {
        const filepath = path.join(dir, file.name);

        if (file.isDirectory()) return getDirSize(filepath);
        if (file.isFile()) {
          const { size } = await fs.stat(filepath);
          return size;
        }
      } catch (error) {
        console.log(
          'Error occurred when trying to calculate dir size of a directory.'
        );
      }
      return 0;
    });

    const sizesOfPaths = await Promise.all(paths);
    const flatSizes = sizesOfPaths.flat(Infinity);
    const reducedSizes = flatSizes.reduce((i, size) => i + size, 0);

    return reducedSizes;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT')
      return 0;
    console.log(
      'Error occurred when resolving promise to calculate dir size of a directory.'
    );
  }
  return 0;
};

if (parentPort) {
  parentPort.on('message', async (dir) => {
    if (typeof dir === 'string') {
      const dirSize = await getDirSize(dir);
      parentPort?.postMessage(dirSize);
    }
  });
}
