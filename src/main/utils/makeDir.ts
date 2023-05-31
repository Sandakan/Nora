import { MakeDirectoryOptions, Mode, PathLike } from 'fs';
import { mkdir } from 'fs/promises';

type MkDirOptions =
  | Mode
  | (MakeDirectoryOptions & {
      recursive?: boolean;
    })
  | null;

const makeDir = async (dir: PathLike, options?: MkDirOptions) => {
  try {
    await mkdir(dir, options);

    return { exist: false };
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'EEXIST')
      return { exist: true };
    throw error;
  }
};

export default makeDir;
