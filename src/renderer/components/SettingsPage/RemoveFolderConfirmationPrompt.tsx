import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppContext';
import Button from '../Button';

/* eslint-disable no-console */
export default (props: { folderName: string; absolutePath: string }) => {
  const { changePromptMenuData } = React.useContext(AppUpdateContext);
  const { folderName, absolutePath } = props;
  return (
    <>
      <div className="title-container mt-1 mb-4 text-font-color-black text-3xl dark:text-font-color-white font-medium">
        Confirm Delete Folder &apos;{folderName}&apos;
      </div>
      <div className="description">
        Are you sure that do you want to remove this folder from the music
        library. This will remove all the data related to this folder including
        songs data from the music library, but not the contents of the folder in
        your system.
      </div>
      <Button
        className="remove-folder-confirm-btn danger-btn w-48 h-10 mt-8 rounded-lg outline-none !bg-foreground-color-1 dark:!bg-foreground-color-1 text-font-color-white dark:text-font-color-white border-[transparent] float-right cursor-pointer hover:border-foreground-color-1 dark:hover:border-foreground-color-1 transition-[background,border] ease-in-out"
        label="REMOVE"
        clickHandler={() => {
          window.api
            .removeAMusicFolder(absolutePath)
            .then(() => changePromptMenuData(false))
            .catch((err) => console.error(err));
        }}
      />
    </>
  );
};
