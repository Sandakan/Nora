import { useCallback, useContext } from 'react';
import { AppUpdateContext } from '../../../contexts/AppUpdateContext';
import useSelectAllHandler from '../../../hooks/useSelectAllHandler';

import Song from '../../SongsPage/Song';
import SecondaryContainer from '../../SecondaryContainer';
import VirtualizedList from '../../VirtualizedList';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store';

type Props = { songData: SongData[] };

const AllSongResults = (prop: Props) => {
  const currentlyActivePage = useStore(store, (state) => state.currentlyActivePage);
  const preferences = useStore(store, (state) => state.localStorage.preferences);

  const { createQueue, playSong } = useContext(AppUpdateContext);

  const { songData } = prop;

  const selectAllHandler = useSelectAllHandler(songData, 'songs', 'songId');

  const handleSongPlayBtnClick = useCallback(
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
                  isIndexingSongs={preferences?.isSongIndexingEnabled}
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
