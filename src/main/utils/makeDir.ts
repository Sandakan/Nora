import { MakeDirectoryOptions, Mode, PathLike, mkdirSync } from 'fs';
import { mkdir } from 'fs/promises';

type MkDirOptions =
  | Mode
  | (MakeDirectoryOptions & {
      recursive?: boolean;
    })
  | null;

export const makeDirSync = (dir: PathLike, options?: MkDirOptions) => {
  try {
    mkdirSync(dir, options);
    return { exist: false };
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'EEXIST')
      return { exist: true };
    throw error;
  }
};

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
