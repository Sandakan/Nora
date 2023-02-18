import React from 'react';
import Button from '../../Button';
import MusicFolder from '../MusicFolder';

type Props = { musicFoldersData: MusicFolderData[] };

const MusicFoldersSettings = (props: Props) => {
  const { musicFoldersData } = props;

  const musicFolders = React.useMemo(
    () =>
      musicFoldersData
        ? musicFoldersData.map((musicFolder, index) => {
            // eslint-disable-next-line react/no-array-index-key
            return <MusicFolder key={index} musicFolder={musicFolder} />;
          })
        : [],
    [musicFoldersData]
  );
  return (
    <>
      <div className="title-container mt-1 mb-4 flex items-center text-2xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        <span className="material-icons-round-outlined mr-2">folder</span>
        Music Folders
      </div>
      <div className="description">
        Tell us where to look for your songs to create you an amazing music
        library.
      </div>
      <div className="music-folders relative mt-4 min-h-[5rem] rounded-xl border-[3px] border-background-color-2 px-2 py-2 empty:after:absolute empty:after:top-1/2 empty:after:left-1/2 empty:after:-translate-x-1/2 empty:after:-translate-y-1/2 empty:after:text-[#ccc] empty:after:content-['There_are_no_folders.'] dark:border-dark-background-color-2">
        {musicFolders}
      </div>
      <Button
        label="Add Music Folder"
        iconName="add"
        iconClassName="mr-4"
        className="add-new-music-folder-btn my-4 rounded-2xl text-base"
        clickHandler={() =>
          window.api.addMusicFolder().catch((err) => console.error(err))
        }
      />
    </>
  );
};

export default MusicFoldersSettings;
