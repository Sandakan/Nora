/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { AppContext } from 'renderer/contexts/AppContext';

import Img from '../Img';

import FolderImg from '../../../../assets/images/png/empty-folder.png';

type Props = {
  folderPath: string;
  songIds: string[];
};

const Folder = (props: Props) => {
  const { currentlyActivePage } = React.useContext(AppContext);
  const { changeCurrentActivePage } = React.useContext(AppUpdateContext);

  const { folderPath, songIds } = props;
  const { length: noOfSongs } = songIds;

  const { folderName, prevDir } = React.useMemo(() => {
    if (folderPath) {
      const path = folderPath.split('\\');
      const name = path.pop() || 'Unknown Folder Name';

      return { prevDir: path.join('\\'), folderName: name };
    }
    return { prevDir: undefined, folderName: undefined };
  }, [folderPath]);

  const openMusicFolderInfoPage = React.useCallback(() => {
    if (folderPath) {
      return currentlyActivePage.pageTitle === 'MusicFolderInfo' &&
        currentlyActivePage.data?.folderPath === folderPath
        ? changeCurrentActivePage('Home')
        : changeCurrentActivePage('MusicFolderInfo', {
            folderPath,
          });
    }
    return undefined;
  }, [
    changeCurrentActivePage,
    currentlyActivePage.data?.folderPath,
    currentlyActivePage.pageTitle,
    folderPath,
  ]);

  return (
    <div
      className="group mb-2 flex h-16 w-full cursor-pointer items-center rounded-md px-4 py-2 odd:bg-background-color-2/50 hover:bg-background-color-2 dark:text-font-color-white dark:odd:bg-dark-background-color-2/30 dark:hover:bg-dark-background-color-2"
      onClick={openMusicFolderInfoPage}
    >
      <Img src={FolderImg} className="w-8 self-center" />
      <div className="folder-info ml-6 flex flex-col">
        <span className="folder-name" title={`${prevDir}\\${folderName}`}>
          {folderName}
        </span>
        <div className="flex items-center opacity-75">
          <span className="no-of-songs mr-2 text-xs font-thin">
            {noOfSongs} song{noOfSongs === 1 ? '' : 's'}
          </span>
          <span className="invisible text-xs font-thin opacity-0 transition-[visibility,opacity] group-hover:visible group-hover:opacity-100">
            &bull;
            <span className="folder-path ml-2">{prevDir}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Folder;
