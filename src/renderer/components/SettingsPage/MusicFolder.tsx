import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppContext';
import Button from '../Button';
import RemoveFolderConfirmationPrompt from './RemoveFolderConfirmationPrompt';

export default (props: { musicFolder: MusicFolderData }) => {
  const { changePromptMenuData } = React.useContext(AppUpdateContext);
  const { musicFolder } = props;
  const path = musicFolder.path.split('\\');
  const folderName = musicFolder.path.split('\\').at(-1);
  path.pop();
  return (
    <div className="music-folder mb-2 flex flex-row items-center justify-between p-1">
      <span className="material-icons-round icon mr-4 text-3xl text-[hsla(39,97%,71%,1)] dark:text-[hsla(39,97%,71%,1)]">
        folder
      </span>
      <div className="music-folder-path-container w-3/4 flex flex-col">
        <div className="music-folder-name text-xl text-ellipsis overflow-hidden whitespace-nowrap">
          {folderName}
        </div>
        <div
          className="music-folder-path text-sm text-ellipsis whitespace-nowrap overflow-hidden"
          title={musicFolder.path}
        >
          {path.join('\\')}
        </div>
      </div>
      <Button
        className="music-folder-delete-btn danger-btn !w-25 !h-fit rounded-lg outline-none text-background-color-3 dark:text-dark-background-color-3 border-[transparent] float-right cursor-pointer font-medium border-none hover:text-foreground-color-1 hover:dark:text-foreground-color-1 ease-in-out"
        label="REMOVE"
        clickHandler={() =>
          changePromptMenuData(
            true,
            <RemoveFolderConfirmationPrompt
              folderName={folderName || path.join('\\')}
              absolutePath={musicFolder.path}
            />,
            'delete-folder-confirmation-prompt'
          )
        }
      />
    </div>
  );
};
