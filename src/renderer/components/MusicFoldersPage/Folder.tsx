// import React from 'react';
import Img from '../Img';

import FolderImg from '../../../../assets/images/png/empty-folder.png';

type Props = {
  folderName: string;
};

const Folder = (props: Props) => {
  const { folderName } = props;
  return (
    <div className="mb-1 flex h-16 w-full cursor-pointer items-center rounded-md px-4 py-2 odd:bg-background-color-2/30 hover:bg-background-color-2 dark:text-font-color-white dark:odd:bg-dark-background-color-2/30 dark:hover:bg-dark-background-color-2">
      <Img src={FolderImg} className="w-8 self-center" />
      <div className="folder-info ml-6 flex flex-col">
        <span className="folder-name">{folderName}</span>
        <span className="no-of-songs text-xs font-thin">0 songs</span>
      </div>
    </div>
  );
};

export default Folder;
