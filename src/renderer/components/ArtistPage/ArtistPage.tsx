import React, { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { FixedSizeGrid as Grid } from 'react-window';

import useResizeObserver from 'renderer/hooks/useResizeObserver';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import debounce from 'renderer/utils/debounce';
import useSelectAllHandler from 'renderer/hooks/useSelectAllHandler';
import storage from 'renderer/utils/localStorage';
import i18n from 'renderer/i18n';

import { Artist } from './Artist';
import Dropdown, { DropdownOption } from '../Dropdown';
import MainContainer from '../MainContainer';
import Img from '../Img';
import Button from '../Button';

import NoArtistImage from '../../../../assets/images/svg/Sun_Monochromatic.svg';

const artistSortOptions: DropdownOption<ArtistSortTypes>[] = [
  { label: i18n.t('sortTypes.aToZ'), value: 'aToZ' },
  { label: i18n.t('sortTypes.zToA'), value: 'zToA' },
  {
    label: i18n.t('sortTypes.noOfSongsDescending'),
    value: 'noOfSongsDescending',
  },
  {
    label: i18n.t('sortTypes.noOfSongsAscending'),
    value: 'noOfSongsAscending',
  },
  {
    label: i18n.t('sortTypes.mostLovedDescending'),
    value: 'mostLovedDescending',
  },
  {
    label: i18n.t('sortTypes.mostLovedAscending'),
    value: 'mostLovedAscending',
  },
];

const ArtistPage = () => {
  const {
    currentlyActivePage,
    localStorageData,
    isMultipleSelectionEnabled,
    multipleSelectionsData,
  } = React.useContext(AppContext);
  const { updateCurrentlyActivePageData, toggleMultipleSelections } =
    React.useContext(AppUpdateContext);
  const { t } = useTranslation();

  const [artistsData, setArtistsData] = React.useState([] as Artist[]);
  const [sortingOrder, setSortingOrder] = React.useState<ArtistSortTypes>(
    currentlyActivePage?.data?.sortingOrder ||
      localStorageData?.sortingStates?.artistsPage ||
      'aToZ',
  );

  const containerRef = React.useRef(null as HTMLDivElement | null);
  const { height, width } = useResizeObserver(containerRef);
  const MIN_ITEM_WIDTH = 175;
  const MIN_ITEM_HEIGHT = 200;
  const noOfColumns = Math.floor(width / MIN_ITEM_WIDTH);
  const noOfRows = Math.ceil(artistsData.length / noOfColumns);
  const itemWidth =
    MIN_ITEM_WIDTH + ((width % MIN_ITEM_WIDTH) - 10) / noOfColumns;

  const fetchArtistsData = React.useCallback(
    () =>
      window.api.artistsData.getArtistData([], sortingOrder).then((res) => {
        if (res && Array.isArray(res)) {
          if (res.length > 0) return setArtistsData(res);
          return setArtistsData([]);
        }
        return undefined;
      }),
    [sortingOrder],
  );

  React.useEffect(() => {
    fetchArtistsData();
    const manageArtistDataUpdatesInArtistsPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>)
          .detail;
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (event.dataType === 'artists/likes' && event.dataType.length > 1)
            fetchArtistsData();
          if (event.dataType === 'artists') fetchArtistsData();
        }
      }
    };
    document.addEventListener(
      'app/dataUpdates',
      manageArtistDataUpdatesInArtistsPage,
    );
    return () => {
      document.removeEventListener(
        'app/dataUpdates',
        manageArtistDataUpdatesInArtistsPage,
      );
    };
  }, [fetchArtistsData]);

  React.useEffect(() => {
    storage.sortingStates.setSortingStates('artistsPage', sortingOrder);
  }, [sortingOrder]);

  const selectAllHandler = useSelectAllHandler(
    artistsData,
    'artist',
    'artistId',
  );

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
      if (index < artistsData.length) {
        const {
          artistId,
          name,
          onlineArtworkPaths,
          songs,
          artworkPaths,
          isAFavorite,
        } = artistsData[index];
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
              selectAllHandler={selectAllHandler}
            />
          </div>
        );
      }
      return <div style={style} />;
    },
    [artistsData, noOfColumns, selectAllHandler],
  );

  console.log('offset', currentlyActivePage?.data);
  return (
    <MainContainer
      className="appear-from-bottom artists-list-container !h-full overflow-hidden !pb-0"
      focusable
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key === 'a') {
          e.stopPropagation();
          selectAllHandler();
        }
      }}
    >
      <>
        {artistsData.length > 0 && (
          <div className="title-container mb-8 mt-1 flex items-center pr-4 text-3xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
            <div className="container flex">
              {t('common.artist_other')}{' '}
              <div className="other-stats-container ml-12 flex items-center text-xs text-font-color-black dark:text-font-color-white">
                {isMultipleSelectionEnabled ? (
                  <div className="text-sm text-font-color-highlight dark:text-dark-font-color-highlight">
                    {t('common.selectionWithCount', {
                      count: multipleSelectionsData.multipleSelections.length,
                    })}
                  </div>
                ) : (
                  artistsData &&
                  artistsData.length > 0 && (
                    <span className="no-of-artists">
                      {t('common.artistWithCount', {
                        count: artistsData.length,
                      })}
                    </span>
                  )
                )}
              </div>
            </div>
            <div className="other-control-container flex">
              <Button
                label={t(
                  `common.${
                    isMultipleSelectionEnabled ? 'unselectAll' : 'select'
                  }`,
                )}
                className="select-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
                iconName={
                  isMultipleSelectionEnabled ? 'remove_done' : 'checklist'
                }
                clickHandler={() =>
                  toggleMultipleSelections(
                    !isMultipleSelectionEnabled,
                    'artist',
                  )
                }
              />
              <Dropdown
                name="artistsSortDropdown"
                value={sortingOrder}
                options={artistSortOptions}
                onChange={(e) => {
                  const artistSortType = e.currentTarget
                    .value as ArtistSortTypes;
                  updateCurrentlyActivePageData((currentData) => ({
                    ...currentData,
                    sortingOrder: artistSortType,
                  }));
                  setSortingOrder(artistSortType);
                }}
              />
            </div>
          </div>
        )}
        <div
          className={`artists-container flex !h-full flex-wrap ${
            !(artistsData && artistsData.length > 0) && 'hidden'
          }`}
          ref={containerRef}
        >
          {artistsData && artistsData.length > 0 && (
            <Grid
              className="appear-from-bottom delay-100 [scrollbar-gutter:stable]"
              columnCount={noOfColumns || 5}
              columnWidth={itemWidth}
              rowCount={noOfRows || 5}
              rowHeight={MIN_ITEM_HEIGHT}
              height={height || 300}
              width={width || 500}
              overscanRowCount={2}
              initialScrollLeft={currentlyActivePage?.data?.scrollLeftOffset}
              initialScrollTop={currentlyActivePage?.data?.scrollTopOffset}
              onScroll={(data) => {
                if (!data.scrollUpdateWasRequested && data.scrollTop !== 0)
                  debounce(
                    () =>
                      updateCurrentlyActivePageData((currentPageData) => ({
                        ...currentPageData,
                        scrollTopOffset: data.scrollTop,
                        scrollLeftOffset: data.scrollLeft,
                      })),
                    500,
                  );
              }}
            >
              {row}
            </Grid>
          )}
        </div>
        {/* {artistsData && artistsData.length === 0 && (
          <div className="no-songs-container my-[10%] flex h-full w-full flex-col items-center justify-center text-center text-xl text-font-color-black dark:text-font-color-white">
            <Img
              src={FetchingDataImage}
              alt="No songs available."
              className="mb-8 w-60"
            />
            <div>What about a Lemonade? They are cool, right ?</div>
          </div>
        )} */}
        {artistsData && artistsData.length === 0 && (
          <div className="no-songs-container my-[10%] flex h-full w-full flex-col items-center justify-center text-center text-xl text-font-color-black dark:text-font-color-white">
            <Img
              src={NoArtistImage}
              alt="Sun in a desert"
              className="mb-8 w-60"
            />
            <div>{t('artistsPage.empty')}</div>
          </div>
        )}
      </>
    </MainContainer>
  );
};

export default ArtistPage;
