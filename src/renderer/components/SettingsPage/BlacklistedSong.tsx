import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import Button from '../Button';

interface BlacklistedSongProp {
  songPath: string;
  index: number;
}

const BlacklistedSong = (props: BlacklistedSongProp) => {
  const { addNewNotifications } = React.useContext(AppUpdateContext);
  const { songPath, index } = props;
  const songNameArray = (songPath.split('\\').at(-1) as string).split('.');
  songNameArray.pop();
  const songName = songNameArray.join('.');
  return (
    <div className="blacklisted-song mb-2 flex w-full items-center justify-between rounded-md px-4 py-2 last:mb-0 only:mb-0 hover:bg-background-color-2 dark:hover:bg-dark-background-color-2 ">
      <span
        className="blacklisted-song-name w-1/4 overflow-hidden text-ellipsis whitespace-nowrap"
        title={songName}
      >
        <span className="mr-4">{index}.</span>
        <span>{songName}</span>
      </span>
      <span
        className="blacklisted-song-path w-1/2 overflow-hidden text-ellipsis whitespace-nowrap text-xs font-light"
        title={songPath}
      >
        {songPath}
      </span>
      <Button
        className="blacklisted-song-restore-btn mr-0 rounded-none border-none text-base font-medium text-background-color-3 dark:text-dark-background-color-3"
        label="RESTORE"
        clickHandler={() =>
          window.api.restoreBlacklistedSong(songPath).then(() =>
            addNewNotifications([
              {
                id: `${songName}RestoreSuccess`,
                delay: 5000,
                content: (
                  <span>
                    &apos;{songName}&apos; song restored successfully.
                  </span>
                ),
                icon: <span className="material-icons-round icon">check</span>,
              },
            ])
          )
        }
      />
    </div>
  );
};

export default BlacklistedSong;
