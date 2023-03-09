import React, { CSSProperties } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import useResizeObserver from 'renderer/hooks/useResizeObserver';
import { Artist } from 'renderer/components/ArtistPage/Artist';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';

type Props = { artistData: Artist[] };

const AllArtistResults = (prop: Props) => {
  const { currentlyActivePage } = React.useContext(AppContext);
  const { updateCurrentlyActivePageData } = React.useContext(AppUpdateContext);

  const { artistData } = prop;

  const scrollOffsetTimeoutIdRef = React.useRef(null as NodeJS.Timeout | null);
  const containerRef = React.useRef(null as HTMLDivElement | null);
  const { height, width } = useResizeObserver(containerRef);
  const MIN_ITEM_WIDTH = 175;
  const MIN_ITEM_HEIGHT = 200;
  const noOfColumns = Math.floor(width / MIN_ITEM_WIDTH);
  const noOfRows = Math.ceil(artistData.length / noOfColumns);
  const itemWidth =
    MIN_ITEM_WIDTH + ((width % MIN_ITEM_WIDTH) - 10) / noOfColumns;

  const row = React.useCallback(
    (props: {
      columnIndex: number;
      rowIndex: number;
      style: CSSProperties;
    }) => {
      const { columnIndex, rowIndex, style } = props;
      const index = rowIndex * noOfColumns + columnIndex;
      // eslint-disable-next-line no-console
      // console.log(index);
      if (index < artistData.length) {
        const {
          artistId,
          name,
          onlineArtworkPaths,
          songs,
          artworkPaths,
          isAFavorite,
        } = artistData[index];
        return (
          <div style={{ ...style, display: 'flex', justifyContent: 'center' }}>
            <Artist
              index={index}
              key={artistId}
              className="mb-4"
              artistId={artistId}
              name={name}
              artworkPaths={artworkPaths}
              onlineArtworkPaths={onlineArtworkPaths}
              songIds={songs.map((song) => song.songId)}
              isAFavorite={isAFavorite}
            />
          </div>
        );
      }
      return <div style={style} />;
    },
    [artistData, noOfColumns]
  );

  return (
    <div
      className="artists-container flex !h-full flex-wrap"
      ref={containerRef}
    >
      {artistData && artistData.length > 0 && (
        <Grid
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
    </div>
  );
};

export default AllArtistResults;
