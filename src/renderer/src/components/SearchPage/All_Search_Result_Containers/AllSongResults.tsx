import { useCallback, useContext } from 'react';
import { AppUpdateContext } from '../../../contexts/AppUpdateContext';
import useSelectAllHandler from '../../../hooks/useSelectAllHandler';

import Song from '../../SongsPage/Song';
import SecondaryContainer from '../../SecondaryContainer';
import VirtualizedList from '../../VirtualizedList';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store/store';

type Props = { songData: SongData[]; scrollTopOffset?: number };

const AllSongResults = (prop: Props) => {
  const isSongIndexingEnabled = useStore(
    store,
    (state) => state.localStorage.preferences.isSongIndexingEnabled
  );

  const { createQueue, playSong } = useContext(AppUpdateContext);

  const { songData, scrollTopOffset = 0 } = prop;

  const selectAllHandler = useSelectAllHandler(songData, 'songs', 'songId');

  const handleSongPlayBtnClick = useCallback(
    (currSongId: number) => {
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
      className="songs-container mb-0! h-full flex-1"
      focusable
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key === 'a') {
          e.stopPropagation();
          selectAllHandler();
        }
      }}
    >
      <VirtualizedList
        data={songData}
        fixedItemHeight={60}
        scrollTopOffset={scrollTopOffset}
        // onDebouncedScroll={(instance) => {
        //   const offset = Math.floor(instance.scrollOffset || 0);

        //   navigate({
        //     replace: true,
        //     search: (prev) => ({
        //       ...prev,
        //       scrollTopOffset: offset
        //     })
        //   });
        // }}
        itemContent={(index, dataItem) => (
          <Song
            key={dataItem.songId}
            index={index}
            isIndexingSongs={isSongIndexingEnabled}
            onPlayClick={handleSongPlayBtnClick}
            selectAllHandler={selectAllHandler}
            {...dataItem}
          />
        )}
      />
    </SecondaryContainer>
  );
};

export default AllSongResults;
