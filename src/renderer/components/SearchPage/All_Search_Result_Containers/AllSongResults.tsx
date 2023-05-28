import React from 'react';
import { FixedSizeList as List } from 'react-window';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import useResizeObserver from 'renderer/hooks/useResizeObserver';
import useSelectAllHandler from 'renderer/hooks/useSelectAllHandler';

import Song from 'renderer/components/SongsPage/Song';
import SecondaryContainer from 'renderer/components/SecondaryContainer';

type Props = { songData: SongData[] };

const AllSongResults = (prop: Props) => {
  const { currentlyActivePage, localStorageData } =
    React.useContext(AppContext);
  const { updateCurrentlyActivePageData } = React.useContext(AppUpdateContext);

  const { songData } = prop;
  const scrollOffsetTimeoutIdRef = React.useRef(null as NodeJS.Timeout | null);
  const songsContainerRef = React.useRef(null as HTMLDivElement | null);
  const { width, height } = useResizeObserver(songsContainerRef);

  const selectAllHandler = useSelectAllHandler(songData, 'songs', 'songId');

  const songs = React.useCallback(
    (props: { index: number; style: React.CSSProperties }) => {
      const { index, style } = props;
      const {
        songId,
        title,
        artists,
        album,
        duration,
        isAFavorite,
        artworkPaths,
        year,
        path,
        isBlacklisted,
      } = songData[index];
      return (
        <div style={style}>
          <Song
            key={index}
            index={index}
            isIndexingSongs={
              localStorageData?.preferences?.isSongIndexingEnabled
            }
            title={title}
            songId={songId}
            artists={artists}
            album={album}
            artworkPaths={artworkPaths}
            duration={duration}
            year={year}
            path={path}
            isAFavorite={isAFavorite}
            isBlacklisted={isBlacklisted}
            selectAllHandler={selectAllHandler}
          />
        </div>
      );
    },
    [
      localStorageData?.preferences?.isSongIndexingEnabled,
      selectAllHandler,
      songData,
    ]
  );

  return (
    <SecondaryContainer
      className="songs-container h-full flex-1"
      ref={songsContainerRef}
      focusable
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key === 'a') {
          e.stopPropagation();
          selectAllHandler();
        }
      }}
    >
      {songData && songData.length > 0 && (
        <List
          className="appear-from-bottom delay-100"
          itemCount={songData.length}
          itemSize={60}
          width={width || '100%'}
          height={height || 450}
          overscanCount={10}
          initialScrollOffset={currentlyActivePage.data?.scrollTopOffset ?? 0}
          onScroll={(data) => {
            if (scrollOffsetTimeoutIdRef.current)
              clearTimeout(scrollOffsetTimeoutIdRef.current);
            if (!data.scrollUpdateWasRequested && data.scrollOffset !== 0)
              scrollOffsetTimeoutIdRef.current = setTimeout(
                () =>
                  updateCurrentlyActivePageData((currentPageData) => ({
                    ...currentPageData,
                    scrollTopOffset: data.scrollOffset,
                  })),
                500
              );
          }}
        >
          {songs}
        </List>
      )}
    </SecondaryContainer>
  );
};

export default AllSongResults;
