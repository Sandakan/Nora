import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import Button from '../Button';

interface BlacklistedSongProp {
  songPath: string;
  index: number;
}

const BlacklistedSong = (props: BlacklistedSongProp) => {
  const { updateNotificationPanelData } = React.useContext(AppContext);
  const { songPath, index } = props;
  const songNameArray = (songPath.split('\\').at(-1) as string).split('.');
  songNameArray.pop();
  const songName = songNameArray.join('.');
  return (
    <div className="blacklisted-song">
      <span className="blacklisted-song-name" title={songName}>
        {index}. {songName}
      </span>
      <span className="blacklisted-song-path" title={songPath}>
        {songPath}
      </span>
      <Button
        className="blacklisted-song-restore-btn"
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
