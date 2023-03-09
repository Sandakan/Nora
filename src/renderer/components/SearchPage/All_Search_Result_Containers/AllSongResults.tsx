import React from 'react';
import { FixedSizeList as List } from 'react-window';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import useResizeObserver from 'renderer/hooks/useResizeObserver';
import Song from 'renderer/components/SongsPage/Song';

type Props = { songData: SongData[] };

const AllSongResults = (prop: Props) => {
  const { currentlyActivePage, userData } = React.useContext(AppContext);
  const { updateCurrentlyActivePageData } = React.useContext(AppUpdateContext);

  const { songData } = prop;
  const scrollOffsetTimeoutIdRef = React.useRef(null as NodeJS.Timeout | null);
  const songsContainerRef = React.useRef(null as HTMLDivElement | null);
  const { width, height } = useResizeObserver(songsContainerRef);

  const songs = React.useCallback(
    (props: { index: number; style: React.CSSProperties }) => {
      const { index, style } = props;
      const {
        songId,
        title,
        artists,
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
              userData !== undefined && userData.preferences.songIndexing
            }
            title={title}
            songId={songId}
            artists={artists}
            artworkPaths={artworkPaths}
            duration={duration}
            year={year}
            path={path}
            isAFavorite={isAFavorite}
            isBlacklisted={isBlacklisted}
          />
        </div>
      );
    },
    [songData, userData]
  );

  return (
    <div className="songs-container h-full flex-1" ref={songsContainerRef}>
      {songData && songData.length > 0 && (
        <List
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
    </div>
  );
};

export default AllSongResults;
