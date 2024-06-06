import path from 'path';
import fs, { Dirent } from 'fs';

const isPathADir = (pathOrDir: string | Dirent) => {
  try {
    if (typeof pathOrDir === 'string') {
      const stat = fs.statSync(pathOrDir);

      if (stat.isDirectory()) return true;

      if (!stat.isSymbolicLink()) return false;

      const symlinkTarget = fs.readlinkSync(pathOrDir);

      const symlinkStat = fs.statSync(symlinkTarget);

      return symlinkStat.isDirectory();
    }

    if (pathOrDir.isDirectory()) return true;

    if (!pathOrDir.isSymbolicLink()) return false;

    const symlinkPath = path.join(pathOrDir.path, pathOrDir.name);

    const symlinkStat = fs.statSync(symlinkPath);

    return symlinkStat.isDirectory();
  } catch {
    return false;
  }
};

export default isPathADir;

