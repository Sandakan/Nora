import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';

/* eslint-disable no-console */
export default (props: { folderName: string; absolutePath: string }) => {
  const { changePromptMenuData } = React.useContext(AppContext);
  const { folderName, absolutePath } = props;
  return (
    <>
      <div className="title-container">
        Confirm Delete Folder &apos;{folderName}&apos;
      </div>
      <div className="description">
        Are you sure that do you want to remove this folder from the music
        library. This will remove all the data related to this folder including
        songs data from the music library, but not the contents of the folder in
        your system.
      </div>
      <button
        type="button"
        className="remove-folder-confirm-btn danger-btn"
        disabled={false}
        onClick={() => {
          window.api
            .removeAMusicFolder(absolutePath)
            .then((res) => {
              if (res)
                console.log(
                  '🚀 ~ file: RemoveFolderConfirmationPrompt.tsx ~ line 26 ~ .then ~ res',
                  res
                );
              return changePromptMenuData(false);
            })
            .catch((err) => console.error(err));
        }}
      >
        Delete Folder
      </button>
    </>
  );
};
