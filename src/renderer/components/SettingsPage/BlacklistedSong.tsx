import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import Button from '../Button';

interface BlacklistedSongProp {
  songId: string;
  title: string;
  index: number;
  songPath: string;
}

const BlacklistedSong = (props: BlacklistedSongProp) => {
  const { addNewNotifications } = React.useContext(AppUpdateContext);
  const { title, index, songId, songPath } = props;

  return (
    <div className="blacklisted-song mb-2 flex w-full items-center justify-between rounded-md px-4 py-2 last:mb-0 only:mb-0 hover:bg-background-color-2 dark:hover:bg-dark-background-color-2 ">
      <span
        className="blacklisted-song-name w-1/4 overflow-hidden text-ellipsis whitespace-nowrap"
        title={title}
      >
        <span className="mr-4">{index + 1}.</span>
        <span>{title}</span>
      </span>
      <span
        className="blacklisted-song-path w-1/2 overflow-hidden text-ellipsis whitespace-nowrap text-xs font-light"
        title={songPath}
      >
        {songPath}
      </span>
      <Button
        className="blacklisted-song-restore-btn mr-0 rounded-none border-none text-base font-medium hover:!text-font-color-highlight dark:hover:!text-dark-font-color-highlight"
        label="RESTORE"
        clickHandler={() =>
          window.api.restoreBlacklistedSongs([songId]).then(() =>
            addNewNotifications([
              {
                id: `${title}RestoreSuccess`,
                delay: 5000,
                content: (
                  <span>&apos;{title}&apos; song restored successfully.</span>
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
