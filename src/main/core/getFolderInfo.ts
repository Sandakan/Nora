import { BrowserWindow, dialog, OpenDialogOptions } from 'electron';
import fs from 'fs/promises';
import log from '../log';
import { appPreferences } from '../../../package.json';
import { getDirectories } from '../filesystem';

const openDialogOptions: OpenDialogOptions = {
  title: 'Select a Music Folder',
  buttonLabel: 'Add folder',
  filters: [
    {
      name: 'Audio Files',
      extensions: appPreferences.supportedMusicExtensions,
    },
  ],
  properties: ['openFile', 'openDirectory'],
};

export const generateFolderStructure = async (dir: string) => {
  try {
    const stats = await fs.stat(dir);
    const props: FolderStructure = {
      path: dir,
      stats: {
        lastModifiedDate: stats.mtime,
        lastChangedDate: stats.ctime,
        fileCreatedDate: stats.birthtime,
        lastParsedDate: new Date(),
      },
      subFolders: [],
    };

    const subDirs = await getDirectories(dir);
    if (Array.isArray(subDirs) && subDirs.length > 0) {
      const subDirsStructurePromise = subDirs.map((subDir) =>
        generateFolderStructure(subDir)
      );
      const promise = await Promise.allSettled(subDirsStructurePromise);
      const subDirsStructure = (
        promise.filter(
          (prom) => prom.status === 'fulfilled'
        ) as PromiseFulfilledResult<FolderStructure>[]
      ).map((prom) => prom.value);

      props.subFolders.push(...subDirsStructure);
    }
    return props;
  } catch (error) {
    log('Error occurred when analysing folder structure.', { error }, 'ERROR');
    throw error;
  }
};

export const getFolderInfo = async (mainWindowInstance: BrowserWindow) => {
  const { canceled, filePaths } = await dialog.showOpenDialog(
    mainWindowInstance,
    openDialogOptions
  );

  if (canceled) {
    log('User cancelled the folder selection popup.');
    throw new Error('PROMPT_CLOSED_BEFORE_INPUT' as MessageCodes);
  }

  const musicFolderPath = filePaths[0];

  return generateFolderStructure(musicFolderPath);
};
