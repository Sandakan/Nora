import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import RemoveFolderConfirmationPrompt from './RemoveFolderConfirmationPrompt';

export default (props: { musicFolder: MusicFolderData }) => {
  const { changePromptMenuData } = React.useContext(AppContext);
  const { musicFolder } = props;
  const path = musicFolder.path.split('\\');
  path.pop();
  return (
    <div className="music-folder">
      <span className="material-icons-round icon">folder</span>
      <div className="music-folder-path-container">
        <div className="music-folder-name">
          {musicFolder.path.split('\\').at(-1)}
        </div>
        <div className="music-folder-path" title={musicFolder.path}>
          {path.join('\\')}
        </div>
      </div>
      <button
        type="button"
        className="music-folder-delete-btn"
        onClick={() =>
          changePromptMenuData(
            true,
            <RemoveFolderConfirmationPrompt
              folderName={
                musicFolder.path.split('\\').at(-1) || path.join('\\')
              }
              absolutePath={musicFolder.path}
            />,
            'delete-folder-confirmation-prompt'
          )
        }
      >
        <span className="material-icons-round icon" title="Remove">
          delete
        </span>
      </button>
    </div>
  );
};
