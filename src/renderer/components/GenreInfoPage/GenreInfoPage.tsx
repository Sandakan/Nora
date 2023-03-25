/* eslint-disable react/no-array-index-key */
/* eslint-disable no-console */
import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import calculateTimeFromSeconds from 'renderer/utils/calculateTimeFromSeconds';
import Button from '../Button';
import Dropdown from '../Dropdown';
import Img from '../Img';
import MainContainer from '../MainContainer';
import Song from '../SongsPage/Song';

const dropdownOptions: { label: string; value: SongSortTypes }[] = [
  { label: 'A to Z', value: 'aToZ' },
  { label: 'Z to A', value: 'zToA' },
  { label: 'Newest', value: 'dateAddedAscending' },
  { label: 'Oldest', value: 'dateAddedDescending' },
  { label: 'Released Year (Ascending)', value: 'releasedYearAscending' },
  { label: 'Released Year (Descending)', value: 'releasedYearDescending' },
  {
    label: 'Most Listened (All Time)',
    value: 'allTimeMostListened',
  },
  {
    label: 'Least Listened (All Time)',
    value: 'allTimeLeastListened',
  },
  {
    label: 'Most Listened (This Month)',
    value: 'monthlyMostListened',
  },
  {
    label: 'Least Listened (This Month)',
    value: 'monthlyLeastListened',
  },
  {
    label: 'Artist Name (A to Z)',
    value: 'artistNameAscending',
  },
  {
    label: 'Artist Name (Z to A)',
    value: 'artistNameDescending',
  },
  { label: 'Album Name (A to Z)', value: 'albumNameAscending' },
  {
    label: 'Album Name (Z to A)',
    value: 'albumNameDescending',
  },
];

const GenreInfoPage = () => {
  const { currentlyActivePage, queue, localStorageData } =
    React.useContext(AppContext);
  const {
    createQueue,
    updateQueueData,
    addNewNotifications,
    updateCurrentlyActivePageData,
  } = React.useContext(AppUpdateContext);

  const [genreData, setGenreData] = React.useState<Genre>();
  const [genreSongs, setGenreSongs] = React.useState<AudioInfo[]>([]);
  const [sortingOrder, setSortingOrder] = React.useState<SongSortTypes>('aToZ');

  const fetchGenresData = React.useCallback(() => {
    if (currentlyActivePage.data) {
      window.api
        .getGenresData([currentlyActivePage.data.genreId])
        .then((res) => {
          if (res && res.length > 0 && res[0]) setGenreData(res[0]);
          return undefined;
        })
        .catch((err) => console.error(err));
    }
  }, [currentlyActivePage.data]);

  const fetchSongsData = React.useCallback(() => {
    if (genreData && genreData.songs && genreData.songs.length > 0) {
      window.api
        .getSongInfo(
          genreData.songs.map((song) => song.songId),
          sortingOrder
        )
        .then((res) => {
          if (res) return setGenreSongs(res);
          return undefined;
        })
        .catch((err) => console.error(err));
    }
    return undefined;
  }, [genreData, sortingOrder]);

  React.useEffect(() => {
    fetchGenresData();
    const manageGenreUpdatesInGenresInfoPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>)
          .detail;
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (event.dataType === 'genres') fetchGenresData();
        }
      }
    };
    document.addEventListener(
      'app/dataUpdates',
      manageGenreUpdatesInGenresInfoPage
    );
    return () => {
      document.removeEventListener(
        'app/dataUpdates',
        manageGenreUpdatesInGenresInfoPage
      );
    };
  }, [fetchGenresData]);

  React.useEffect(() => {
    fetchSongsData();
    const manageSongUpdatesInGenreInfoPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>)
          .detail;
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (
            event.dataType === 'songs/deletedSong' ||
            event.dataType === 'songs/newSong' ||
            event.dataType === 'blacklist/songBlacklist' ||
            (event.dataType === 'songs/likes' && event.eventData.length > 1)
          )
            fetchSongsData();
        }
      }
    };
    document.addEventListener(
      'app/dataUpdates',
      manageSongUpdatesInGenreInfoPage
    );
    return () => {
      document.removeEventListener(
        'app/dataUpdates',
        manageSongUpdatesInGenreInfoPage
      );
    };
  }, [fetchSongsData]);

  const songComponents = React.useMemo(
    () =>
      genreSongs.map((song, index) => (
        <Song
          key={index}
          index={index}
          isIndexingSongs={localStorageData?.preferences?.isSongIndexingEnabled}
          songId={song.songId}
          title={song.title}
          artists={song.artists}
          duration={song.duration}
          artworkPaths={song.artworkPaths}
          path={song.path}
          isAFavorite={song.isAFavorite}
          year={song.year}
          isBlacklisted={song.isBlacklisted}
        />
      )),
    [genreSongs, localStorageData?.preferences?.isSongIndexingEnabled]
  );

  const totalGenreSongsDuration = React.useMemo(() => {
    const { hours, minutes, seconds } = calculateTimeFromSeconds(
      genreSongs.reduce((prev, current) => prev + current.duration, 0)
    );
    return `${
      hours >= 1 ? `${hours} hour${hours === 1 ? '' : 's'} ` : ''
    }${minutes} minute${minutes === 1 ? '' : 's'} ${seconds} second${
      seconds === 1 ? '' : 's'
    }`;
  }, [genreSongs]);

  return (
    <MainContainer
      className="songs-list-container appear-from-bottom genre-info-page-container !h-full"
      // style={
      //   genreData.backgroundColor && {
      //     background: `linear-gradient(180deg, ${`rgb(${
      //       (genreData.backgroundColor.rgb as number[])[0]
      //     },${(genreData.backgroundColor.rgb as number[])[1]},${
      //       (genreData.backgroundColor.rgb as number[])[2]
      //     })`} 0%, var(--background-color-1) 90%)`,
      //   }
      // }
    >
      <>
        {genreData && genreData.genreId && (
          <div className="genre-img-and-info-container my-4 flex h-fit items-center text-font-color-black dark:text-font-color-white">
            <Img
              src={genreData.artworkPaths.artworkPath}
              className="mr-8 aspect-square max-w-[14rem] rounded-lg"
            />
            <div className="genre-info-container flex-grow">
              <div className="font-semibold tracking-wider opacity-50">
                GENRE
              </div>
              <div className="genre-title h-fit max-w-[80%] overflow-hidden text-ellipsis whitespace-nowrap pb-2 text-6xl text-font-color-highlight dark:text-dark-font-color-highlight">
                {genreData.name}
              </div>
              <div className="genre-no-of-songs">{`${
                genreData.songs.length
              } song${genreData.songs.length !== 1 ? 's' : ''}`}</div>
              <div className="genre-total-duration">
                {totalGenreSongsDuration}
              </div>
            </div>
          </div>
        )}
        {genreSongs.length > 0 && (
          <>
            <div className="other-controls-container mb-4 flex justify-end px-6">
              {genreData && genreSongs.length > 0 && (
                <>
                  <Button
                    label="Play All"
                    iconName="play_arrow"
                    clickHandler={() =>
                      createQueue(
                        genreSongs
                          .filter((song) => !song.isBlacklisted)
                          .map((song) => song.songId),
                        'genre',
                        false,
                        genreData.genreId,
                        true
                      )
                    }
                  />
                  <Button
                    // label="Shuffle and Play"
                    iconName="shuffle"
                    clickHandler={() =>
                      createQueue(
                        genreSongs
                          .filter((song) => !song.isBlacklisted)
                          .map((song) => song.songId),
                        'genre',
                        true,
                        genreData.genreId,
                        true
                      )
                    }
                  />
                  <Button
                    // label="Add to Queue"
                    iconName="add"
                    clickHandler={() => {
                      updateQueueData(
                        undefined,
                        [
                          ...queue.queue,
                          ...genreSongs.map((song) => song.songId),
                        ],
                        false,
                        false
                      );
                      addNewNotifications([
                        {
                          id: genreData.genreId,
                          delay: 5000,
                          content: (
                            <span>
                              Added {genreSongs.length} song
                              {genreSongs.length === 1 ? '' : 's'} to the queue.
                            </span>
                          ),
                        },
                      ]);
                    }}
                  />
                  <Dropdown
                    name="songsPageSortDropdown"
                    value={sortingOrder}
                    options={dropdownOptions}
                    onChange={(e) => {
                      const order = e.currentTarget.value as SongSortTypes;
                      updateCurrentlyActivePageData((currentPageData) => ({
                        ...currentPageData,
                        sortingOrder: order,
                      }));
                      setSortingOrder(order);
                    }}
                  />
                </>
              )}
            </div>
            <div className="songs-container">{songComponents}</div>
          </>
        )}
      </>
    </MainContainer>
  );
};

export default GenreInfoPage;
