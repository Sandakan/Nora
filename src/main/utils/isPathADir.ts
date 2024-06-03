import path from 'path';
import fs, { Dirent } from 'fs';

const isPathADir = (pathForDir: string | Dirent) => {
  if (typeof pathForDir === 'string') {
    const stat = fs.statSync(pathForDir);

    if (stat.isDirectory()) return true;

    if (!stat.isSymbolicLink()) return false;

    const symlinkTarget = fs.readlinkSync(pathForDir);

    const symlinkStat = fs.statSync(symlinkTarget);

    return symlinkStat.isDirectory();
  }

  if (pathForDir.isDirectory()) return true;

  if (!pathForDir.isSymbolicLink()) return false;

  const symlinkPath = path.join(pathForDir.path, pathForDir.name);

  const symlinkStat = fs.statSync(symlinkPath);

  return symlinkStat.isDirectory();
};

export default isPathADir;
