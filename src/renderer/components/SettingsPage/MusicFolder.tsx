import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import Button from '../Button';
import RemoveFolderConfirmationPrompt from './RemoveFolderConfirmationPrompt';

export default (props: { musicFolder: MusicFolderData }) => {
  const { changePromptMenuData } = React.useContext(AppUpdateContext);
  const { musicFolder } = props;
  const path = musicFolder.path.split('\\');
  const folderName = path.pop();

  return (
    <div className="music-folder flex flex-row items-center justify-between rounded-md border-b border-background-color-2 p-2 py-2 last:border-b-0 hover:bg-background-color-2 dark:border-dark-background-color-2 dark:hover:bg-dark-background-color-2">
      <div className="flex flex-grow items-center">
        <span className="material-icons-round icon mr-4 text-3xl text-[hsla(39,97%,71%,1)] dark:text-[hsla(39,97%,71%,1)]">
          folder
        </span>
        <div className="music-folder-path-container flex flex-col">
          <div className="music-folder-name overflow-hidden text-ellipsis whitespace-nowrap text-xl">
            {folderName}
          </div>
          <div
            className="music-folder-path overflow-hidden text-ellipsis whitespace-nowrap text-sm opacity-75"
            title={musicFolder.path}
          >
            {path.join('\\')}
          </div>
        </div>
      </div>
      <Button
        className="music-folder-delete-btn danger-btn !w-25 dark:text-dark-hitext-font-color-highlight float-right mr-0 !h-fit cursor-pointer rounded-lg border-none border-[transparent] font-medium text-font-color-highlight outline-none ease-in-out hover:text-font-color-crimson dark:text-dark-font-color-highlight hover:dark:text-font-color-crimson"
        label="REMOVE"
        tooltipLabel={`Remove '${folderName}' Folder`}
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
