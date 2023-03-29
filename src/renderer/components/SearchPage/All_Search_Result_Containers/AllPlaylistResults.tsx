import React, { CSSProperties } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import useResizeObserver from 'renderer/hooks/useResizeObserver';
import { Playlist } from 'renderer/components/PlaylistsPage/Playlist';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import useSelectAllHandler from 'renderer/hooks/useSelectAllHandler';
import MainContainer from 'renderer/components/MainContainer';

type Props = { playlistData: Playlist[] };

const AllPlaylistResults = (prop: Props) => {
  const { currentlyActivePage } = React.useContext(AppContext);
  const { updateCurrentlyActivePageData } = React.useContext(AppUpdateContext);
  const { playlistData } = prop;

  const scrollOffsetTimeoutIdRef = React.useRef(null as NodeJS.Timeout | null);
  const containerRef = React.useRef(null as HTMLDivElement | null);
  const { height, width } = useResizeObserver(containerRef);
  const MIN_ITEM_WIDTH = 175;
  const MIN_ITEM_HEIGHT = 220;
  const noOfColumns = Math.floor(width / MIN_ITEM_WIDTH);
  const noOfRows = Math.ceil(playlistData.length / noOfColumns);
  const itemWidth =
    MIN_ITEM_WIDTH + ((width % MIN_ITEM_WIDTH) - 10) / noOfColumns;

  const selectAllHandler = useSelectAllHandler(
    playlistData,
    'playlist',
    'playlistId'
  );
  const row = React.useCallback(
    (props: {
      columnIndex: number;
      rowIndex: number;
      style: CSSProperties;
    }) => {
      const { columnIndex, rowIndex, style } = props;
      const index = rowIndex * noOfColumns + columnIndex;
      if (index < playlistData.length) {
        const playlist = playlistData[index];
        return (
          <div style={{ ...style, display: 'flex', justifyContent: 'center' }}>
            <Playlist
              index={index}
              name={playlist.name}
              createdDate={playlist.createdDate}
              playlistId={playlist.playlistId}
              songs={playlist.songs}
              isArtworkAvailable={playlist.isArtworkAvailable}
              artworkPaths={playlist.artworkPaths}
              key={playlist.playlistId}
              selectAllHandler={selectAllHandler}
            />
          </div>
        );
      }
      return <div style={style} />;
    },
    [noOfColumns, playlistData, selectAllHandler]
  );

  return (
    <MainContainer
      className="playlists-container flex h-full flex-wrap"
      ref={containerRef}
      focusable
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key === 'a') {
          e.stopPropagation();
          selectAllHandler();
        }
      }}
    >
      {playlistData && playlistData.length > 0 && (
        <Grid
          className="appear-from-bottom delay-100"
          columnCount={noOfColumns || 5}
          columnWidth={itemWidth}
          rowCount={noOfRows || 5}
          rowHeight={MIN_ITEM_HEIGHT}
          height={height || 300}
          width={width || 500}
          overscanRowCount={2}
          initialScrollTop={currentlyActivePage.data?.scrollTopOffset ?? 0}
          onScroll={(data) => {
            if (scrollOffsetTimeoutIdRef.current)
              clearTimeout(scrollOffsetTimeoutIdRef.current);
            if (!data.scrollUpdateWasRequested && data.scrollTop !== 0)
              scrollOffsetTimeoutIdRef.current = setTimeout(
                () =>
                  updateCurrentlyActivePageData((currentPageData) => ({
                    ...currentPageData,
                    scrollTopOffset: data.scrollTop,
                  })),
                500
              );
          }}
        >
          {row}
        </Grid>
      )}
    </MainContainer>
  );
};

export default AllPlaylistResults;
