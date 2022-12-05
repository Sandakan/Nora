import { accessSync, constants } from 'fs';

export const dirExistsSync = (dir: string) => {
  try {
    accessSync(dir, constants.F_OK);
    return true;
  } catch (error) {
    if ('code' in (error as any)) {
      switch ((error as NodeJS.ErrnoException).code) {
        case 'ENOENT':
          // Error:
          // Requested location doesn't exist.
          break;
        case 'EEXIST':
          // Error:
          // Requested location already exists, but it's not a directory.
          break;
        case 'ENOTDIR':
          // Error:
          // The parent hierarchy contains a file with the same name as the dir
          // you're trying to create.
          break;
        default:
          // Some other error like permission denied.
          console.error(error);
          break;
      }
    }
    return false;
  }
};
