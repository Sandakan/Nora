import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppContext';
import Button from '../Button';

interface BlacklistedSongProp {
  songPath: string;
  index: number;
}

const BlacklistedSong = (props: BlacklistedSongProp) => {
  const { updateNotificationPanelData } = React.useContext(AppUpdateContext);
  const { songPath, index } = props;
  const songNameArray = (songPath.split('\\').at(-1) as string).split('.');
  songNameArray.pop();
  const songName = songNameArray.join('.');
  return (
    <div className="blacklisted-song w-full mb-2 only:mb-0 flex justify-between items-center px-4 py-2">
      <span
        className="blacklisted-song-name w-1/4 overflow-hidden text-ellipsis whitespace-nowrap"
        title={songName}
      >
        <span className="mr-4">{index}.</span>
        <span>{songName}</span>
      </span>
      <span
        className="blacklisted-song-path w-1/2 text-sm overflow-hidden text-ellipsis whitespace-nowrap"
        title={songPath}
      >
        {songPath}
      </span>
      <Button
        className="blacklisted-song-restore-btn text-background-color-3 dark:text-dark-background-color-3 rounded-none border-none font-medium text-base mr-0"
        label="RESTORE"
        clickHandler={() =>
          window.api
            .restoreBlacklistedSong(songPath)
            .then(() =>
              updateNotificationPanelData(
                5000,
                <span>&apos;{songName}&apos; song restored successfully.</span>,
                <span className="material-icons-round icon">check</span>
              )
            )
        }
      />
    </div>
  );
};

export default BlacklistedSong;
