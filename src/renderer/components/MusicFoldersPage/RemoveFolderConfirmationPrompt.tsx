import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import Button from '../Button';

const RemoveFolderConfrimationPrompt = (props: {
  folderName: string;
  absolutePath: string;
}) => {
  const { changePromptMenuData } = React.useContext(AppUpdateContext);
  const { folderName, absolutePath } = props;
  return (
    <>
      <div className="title-container mb-4 mt-1 text-3xl font-medium text-font-color-black dark:text-font-color-white">
        Confirm To Remove &apos;{folderName}&apos; Folder
      </div>
      <div className="description">
        Are you sure that do you want to remove this folder from the music
        library. This will remove all the data related to this folder including
        songs data from the music library. <br />
        <br /> But not the contents of the folder in your system.
      </div>
      <div className="buttons-container flex items-center justify-end">
        <Button
          className="remove-folder-confirm-btn danger-btn float-right mt-8 h-10 w-48 cursor-pointer rounded-lg !bg-font-color-crimson font-medium text-font-color-white outline-none ease-in-out hover:border-font-color-crimson dark:!bg-font-color-crimson dark:text-font-color-white dark:hover:border-font-color-crimson"
          label="Remove Folder"
          clickHandler={() => {
            window.api
              .removeAMusicFolder(absolutePath)
              .then(() => changePromptMenuData(false))
              .catch((err) => console.error(err));
          }}
        />
      </div>
    </>
  );
};

export default RemoveFolderConfrimationPrompt;
