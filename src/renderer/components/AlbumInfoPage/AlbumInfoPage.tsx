/* eslint-disable react/no-array-index-key */
/* eslint-disable no-nested-ternary */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable no-restricted-syntax */
/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
/* eslint-disable react/destructuring-assignment */
import React, { useContext } from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import calculateTimeFromSeconds from 'renderer/utils/calculateTimeFromSeconds';
import Button from '../Button';
import Dropdown from '../Dropdown';
import Img from '../Img';
import MainContainer from '../MainContainer';
import Song from '../SongsPage/Song';
import SongArtist from '../SongsPage/SongArtist';

interface AlbumContentReducer {
  albumData: Album;
  songsData: SongData[];
  sortingOrder: SongSortTypes;
}

type AlbumContentReducerActions =
  | 'ALBUM_DATA_UPDATE'
  | 'SONGS_DATA_UPDATE'
  | 'UPDATE_SORTING_ORDER';

const reducer = (
  state: AlbumContentReducer,
  action: { type: AlbumContentReducerActions; data: any }
): AlbumContentReducer => {
  switch (action.type) {
    case 'ALBUM_DATA_UPDATE':
      return {
        ...state,
        albumData: action.data,
      };
    case 'SONGS_DATA_UPDATE':
      return {
        ...state,
        songsData: action.data,
      };
    case 'UPDATE_SORTING_ORDER':
      return {
        ...state,
        sortingOrder: action.data,
      };
    default:
      return state;
  }
};

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

export default () => {
  const { currentlyActivePage, queue, localStorageData } =
    useContext(AppContext);
  const {
    createQueue,
    updateQueueData,
    addNewNotifications,
    updateCurrentlyActivePageData,
  } = useContext(AppUpdateContext);

  const [albumContent, dispatch] = React.useReducer(reducer, {
    albumData: {} as Album,
    songsData: [] as SongData[],
    sortingOrder: 'aToZ',
  });

  const fetchAlbumData = React.useCallback(() => {
    if (currentlyActivePage.data.albumId) {
      window.api
        .getAlbumData([currentlyActivePage.data.albumId as string])
        .then((res) => {
          if (res && res.length > 0 && res[0]) {
            dispatch({ type: 'ALBUM_DATA_UPDATE', data: res[0] });
          }
        });
    }
  }, [currentlyActivePage.data.albumId]);

  const fetchAlbumSongs = React.useCallback(() => {
    if (
      albumContent.albumData.songs &&
      albumContent.albumData.songs.length > 0
    ) {
      window.api
        .getSongInfo(
          albumContent.albumData.songs.map((song) => song.songId),
          albumContent.sortingOrder
        )
        .then((res) => {
          if (res && res.length > 0) {
            dispatch({ type: 'SONGS_DATA_UPDATE', data: res });
          }
        });
    }
  }, [albumContent.albumData, albumContent.sortingOrder]);

  React.useEffect(() => {
    fetchAlbumData();
    const manageDataUpdatesInAlbumsInfoPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>)
          .detail;
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (event.dataType === 'albums') fetchAlbumData();
        }
      }
    };
    document.addEventListener(
      'app/dataUpdates',
      manageDataUpdatesInAlbumsInfoPage
    );
    return () => {
      document.removeEventListener(
        'app/dataUpdates',
        manageDataUpdatesInAlbumsInfoPage
      );
    };
  }, [fetchAlbumData]);

  React.useEffect(() => {
    fetchAlbumSongs();
    const manageAlbumSongUpdatesInAlbumInfoPage = (e: Event) => {
      const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>).detail;
      if ('detail' in e) {
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (
            event.dataType === 'songs/deletedSong' ||
            event.dataType === 'songs/newSong' ||
            event.dataType === 'blacklist/songBlacklist' ||
            (event.dataType === 'songs/likes' && event.eventData.length > 1)
          )
            fetchAlbumSongs();
        }
      }
    };
    document.addEventListener(
      'app/dataUpdates',
      manageAlbumSongUpdatesInAlbumInfoPage
    );
    return () => {
      document.removeEventListener(
        'app/dataUpdates',
        manageAlbumSongUpdatesInAlbumInfoPage
      );
    };
  }, [fetchAlbumSongs]);

  const songComponents = React.useMemo(
    () =>
      albumContent.songsData.length > 0
        ? albumContent.songsData.map((song, index) => {
            return (
              <Song
                key={song.songId}
                index={index}
                isIndexingSongs={
                  localStorageData?.preferences?.isSongIndexingEnabled
                }
                title={song.title}
                artists={song.artists}
                artworkPaths={song.artworkPaths}
                duration={song.duration}
                songId={song.songId}
                path={song.path}
                isAFavorite={song.isAFavorite}
                year={song.year}
                isBlacklisted={song.isBlacklisted}
              />
            );
          })
        : [],
    [
      albumContent.songsData,
      localStorageData?.preferences?.isSongIndexingEnabled,
    ]
  );

  const calculateTotalTime = React.useCallback(() => {
    const { hours, minutes, seconds } = calculateTimeFromSeconds(
      albumContent.songsData.reduce(
        (prev, current) => prev + current.duration,
        0
      )
    );
    return `${
      hours >= 1 ? `${hours} hour${hours === 1 ? '' : 's'} ` : ''
    }${minutes} minute${minutes === 1 ? '' : 's'} ${seconds} second${
      seconds === 1 ? '' : 's'
    }`;
  }, [albumContent.songsData]);

  return (
    <MainContainer className="album-info-page-container appear-from-bottom pb-12 pl-8 pt-4">
      <>
        <div className="album-img-and-info-container flex flex-row items-center">
          <div className="album-cover-container mr-8">
            {albumContent.albumData.artworkPaths && (
              <Img
                src={albumContent.albumData.artworkPaths.artworkPath}
                className="w-52 rounded-xl"
                alt="Album Cover"
              />
            )}{' '}
          </div>
          {albumContent.albumData.title &&
            albumContent.albumData.artists &&
            albumContent.albumData.artists.length > 0 &&
            albumContent.albumData.songs.length > 0 && (
              <div className="album-info-container max-w-[70%] text-font-color-black dark:text-font-color-white">
                <div className="font-semibold tracking-wider opacity-50">
                  ALBUM
                </div>
                <div className="album-title h-fit w-full overflow-hidden text-ellipsis whitespace-nowrap py-2 text-5xl text-font-color-highlight dark:text-dark-font-color-highlight">
                  {albumContent.albumData.title}
                </div>
                <div className="album-artists m-0 flex h-[unset] w-full cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap text-xl">
                  {albumContent.albumData.artists.map((artist, index) => (
                    <>
                      <SongArtist
                        key={artist.artistId}
                        artistId={artist.artistId}
                        name={artist.name}
                        className="!text-lg"
                      />
                      {albumContent.albumData.artists ? (
                        index === albumContent.albumData.artists.length - 1 ? (
                          ''
                        ) : (
                          <span className="mr-1">,</span>
                        )
                      ) : (
                        ''
                      )}
                    </>
                  ))}
                </div>
                {albumContent.songsData.length > 0 && (
                  <div className="album-songs-total-duration">
                    {calculateTotalTime()}
                  </div>
                )}
                <div className="album-no-of-songs w-full overflow-hidden text-ellipsis whitespace-nowrap text-base">{`${
                  albumContent.albumData.songs.length
                } song${
                  albumContent.albumData.songs.length === 1 ? '' : 's'
                }`}</div>
                {albumContent.albumData.year && (
                  <div className="album-year">
                    {albumContent.albumData.year}
                  </div>
                )}
              </div>
            )}
        </div>
        <div className="album-songs-container secondary-container songs-list-container mt-8 h-fit pb-4">
          <div className="title-container ju mt-1 mb-4 flex items-center justify-between pr-4 text-2xl text-font-color-black  dark:text-font-color-white">
            Songs
            <div className="other-controls-container flex">
              {albumContent.songsData.length > 0 && (
                <div className="album-buttons flex">
                  <Button
                    label="Play All"
                    iconName="play_arrow"
                    clickHandler={() =>
                      createQueue(
                        albumContent.songsData
                          .filter((song) => !song.isBlacklisted)
                          .map((song) => song.songId),
                        'songs',
                        false,
                        albumContent.albumData.albumId,
                        true
                      )
                    }
                  />
                  <Button
                    tooltipLabel="Shuffle and Play"
                    iconName="shuffle"
                    clickHandler={() =>
                      createQueue(
                        albumContent.songsData
                          .filter((song) => !song.isBlacklisted)
                          .map((song) => song.songId),
                        'songs',
                        true,
                        albumContent.albumData.albumId,
                        true
                      )
                    }
                  />
                  <Button
                    tooltipLabel="Add to Queue"
                    iconName="add"
                    clickHandler={() => {
                      updateQueueData(
                        undefined,
                        [
                          ...queue.queue,
                          ...albumContent.songsData.map((song) => song.songId),
                        ],
                        false,
                        false
                      );
                      addNewNotifications([
                        {
                          id: albumContent.albumData.albumId,
                          delay: 5000,
                          content: (
                            <span>
                              Added {albumContent.songsData.length} song
                              {albumContent.songsData.length === 1
                                ? ''
                                : 's'}{' '}
                              to the queue.
                            </span>
                          ),
                        },
                      ]);
                    }}
                  />
                </div>
              )}
              <Dropdown
                name="PlaylistPageSortDropdown"
                value={albumContent.sortingOrder}
                options={dropdownOptions}
                onChange={(e) => {
                  const order = e.currentTarget.value as SongSortTypes;
                  updateCurrentlyActivePageData((currentPageData) => ({
                    ...currentPageData,
                    sortingOrder: order,
                  }));
                  dispatch({ type: 'UPDATE_SORTING_ORDER', data: order });
                }}
              />
            </div>
          </div>
          <div className="songs-container relative flex flex-col">
            {songComponents}
          </div>
        </div>
      </>
    </MainContainer>
  );
};
