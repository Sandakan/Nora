import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { AppUpdateContext } from '../../contexts/AppUpdateContext';

import Button from '../Button';

interface BlacklistedSongProp {
  songId: number;
  title: string;
  index: number;
  songPath: string;
}

const BlacklistedSong = (props: BlacklistedSongProp) => {
  const { addNewNotifications } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const { title, index, songId, songPath } = props;

  return (
    <div className="blacklisted-song hover:bg-background-color-2 dark:hover:bg-dark-background-color-2 mb-2 flex w-full items-center justify-between rounded-md px-4 py-2 last:mb-0 only:mb-0">
      <span
        className="blacklisted-song-name w-1/4 overflow-hidden text-ellipsis whitespace-nowrap"
        title={title}
      >
        <span className="mr-4">{index + 1}.</span>
        <span>{title}</span>
      </span>
      <span
        className="blacklisted-song-path w-1/2 overflow-hidden text-xs font-light text-ellipsis whitespace-nowrap"
        title={songPath}
      >
        {songPath}
      </span>
      <Button
        className="blacklisted-song-restore-btn hover:text-font-color-highlight! dark:hover:text-dark-font-color-highlight! mr-0 rounded-none border-none text-base font-medium"
        label="RESTORE"
        clickHandler={() =>
          window.api.audioLibraryControls.restoreBlacklistedSongs([songId]).then(() =>
            addNewNotifications([
              {
                id: `${title}RestoreSuccess`,
                duration: 5000,
                content: t('notifications.songRestoreSuccess'),
                icon: <span className="material-icons-round icon">check</span>
              }
            ])
          )
        }
      />
    </div>
  );
};

export default BlacklistedSong;
