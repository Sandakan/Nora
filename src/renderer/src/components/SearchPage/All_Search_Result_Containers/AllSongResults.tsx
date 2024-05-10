import React from 'react';
import { AppContext } from '../../../contexts/AppContext';
import { AppUpdateContext } from '../../../contexts/AppUpdateContext';
import useSelectAllHandler from '../../../hooks/useSelectAllHandler';

import Song from '../../SongsPage/Song';
import SecondaryContainer from '../../SecondaryContainer';
import VirtualizedList from '../../VirtualizedList';

type Props = { songData: SongData[] };

const AllSongResults = (prop: Props) => {
  const { currentlyActivePage, localStorageData } = React.useContext(AppContext);
  const { createQueue, playSong } = React.useContext(AppUpdateContext);

  const { songData } = prop;

  const selectAllHandler = useSelectAllHandler(songData, 'songs', 'songId');

  const handleSongPlayBtnClick = React.useCallback(
    (currSongId: string) => {
      const queueSongIds = songData
        .filter((song) => !song.isBlacklisted)
        .map((song) => song.songId);
      createQueue(queueSongIds, 'songs', false, undefined, false);
      playSong(currSongId, true);
    },
    [createQueue, playSong, songData]
  );

  return (
    <SecondaryContainer
      className="songs-container !mb-0 h-full flex-1"
      focusable
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key === 'a') {
          e.stopPropagation();
          selectAllHandler();
        }
      }}
    >
      {songData && songData.length > 0 && (
        <VirtualizedList
          data={songData}
          fixedItemHeight={60}
          scrollTopOffset={currentlyActivePage.data?.scrollTopOffset}
          itemContent={(index, song) => {
            if (song)
              return (
                <Song
                  key={index}
                  index={index}
                  isIndexingSongs={localStorageData?.preferences.isSongIndexingEnabled}
                  onPlayClick={handleSongPlayBtnClick}
                  selectAllHandler={selectAllHandler}
                  {...song}
                />
              );
            return <div>Bad Index</div>;
          }}
        />
      )}
    </SecondaryContainer>
  );
};

export default AllSongResults;
