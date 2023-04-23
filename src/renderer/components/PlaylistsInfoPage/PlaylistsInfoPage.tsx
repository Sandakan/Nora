/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-console */
/* eslint-disable react/no-array-index-key */
/* eslint-disable no-restricted-syntax */
/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
/* eslint-disable react/require-default-props */
/* eslint-disable react/destructuring-assignment */
import React, { useContext } from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { AppContext } from 'renderer/contexts/AppContext';
import calculateTimeFromSeconds from 'renderer/utils/calculateTimeFromSeconds';
import useSelectAllHandler from 'renderer/hooks/useSelectAllHandler';

import Button from '../Button';
import Song from '../SongsPage/Song';
import SensitiveActionConfirmPrompt from '../SensitiveActionConfirmPrompt';
import Img from '../Img';
import MainContainer from '../MainContainer';
import Dropdown from '../Dropdown';

import DefaultPlaylistCover from '../../../../assets/images/webp/playlist_cover_default.webp';
import MultipleArtworksCover from '../PlaylistsPage/MultipleArtworksCover';

const dropdownOptions: { label: string; value: SongSortTypes }[] = [
  { label: 'Added Order', value: 'addedOrder' },
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

const PlaylistInfoPage = () => {
  const { currentlyActivePage, queue, localStorageData } =
    useContext(AppContext);
  const {
    updateQueueData,
    changePromptMenuData,
    addNewNotifications,
    createQueue,
    updateCurrentlyActivePageData,
  } = React.useContext(AppUpdateContext);

  const [playlistData, setPlaylistData] = React.useState({} as Playlist);
  const [playlistSongs, setPlaylistSongs] = React.useState([] as SongData[]);
  const [sortingOrder, setSortingOrder] = React.useState<SongSortTypes>(
    currentlyActivePage?.data?.sortingOrder || 'addedOrder'
  );

  const fetchPlaylistData = React.useCallback(() => {
    if (currentlyActivePage.data?.playlistId) {
      window.api
        .getPlaylistData([currentlyActivePage.data.playlistId])
        .then((res) => {
          if (res && res.length > 0 && res[0]) setPlaylistData(res[0]);
        });
    }
  }, [currentlyActivePage.data]);

  const fetchPlaylistSongsData = React.useCallback(() => {
    if (playlistData.songs && playlistData.songs.length > 0) {
      window.api
        .getSongInfo(
          playlistData.playlistId === 'History'
            ? playlistData.songs.reverse()
            : playlistData.songs,
          sortingOrder,
          undefined,
          sortingOrder === 'addedOrder'
        )
        .then((songsData) => {
          if (songsData && songsData.length > 0)
            setPlaylistSongs(songsData.reverse());
        });
    }
  }, [playlistData.songs, playlistData.playlistId, sortingOrder]);

  React.useEffect(() => {
    fetchPlaylistData();
    const managePlaylistUpdatesInPlaylistsInfoPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>)
          .detail;
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (event.dataType === 'playlists') fetchPlaylistData();
        }
      }
    };
    document.addEventListener(
      'app/dataUpdates',
      managePlaylistUpdatesInPlaylistsInfoPage
    );
    return () => {
      document.removeEventListener(
        'app/dataUpdates',
        managePlaylistUpdatesInPlaylistsInfoPage
      );
    };
  }, [fetchPlaylistData]);

  React.useEffect(() => {
    fetchPlaylistSongsData();
    const managePlaylistSongUpdatesInPlaylistInfoPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>)
          .detail;
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (
            event.dataType === 'playlists/newSong' ||
            event.dataType === 'playlists/deletedSong' ||
            event.dataType === 'blacklist/songBlacklist' ||
            (event.dataType === 'songs/likes' && event.eventData.length > 1)
          )
            fetchPlaylistSongsData();
        }
      }
    };
    document.addEventListener(
      'app/dataUpdates',
      managePlaylistSongUpdatesInPlaylistInfoPage
    );
    return () => {
      document.removeEventListener(
        'app/dataUpdates',
        managePlaylistSongUpdatesInPlaylistInfoPage
      );
    };
  }, [fetchPlaylistSongsData]);

  const totalPlaylistDuration = React.useMemo(() => {
    const { hours, minutes, seconds } = calculateTimeFromSeconds(
      playlistSongs.reduce((prev, current) => prev + current.duration, 0)
    );
    return `${
      hours >= 1 ? `${hours} hour${hours === 1 ? '' : 's'} ` : ''
    }${minutes} minute${minutes === 1 ? '' : 's'} ${seconds} second${
      seconds === 1 ? '' : 's'
    }`;
  }, [playlistSongs]);

  const selectAllHandler = useSelectAllHandler(
    playlistSongs,
    'songs',
    'songId'
  );
  const songComponents = React.useMemo(
    () =>
      playlistSongs.length > 0
        ? playlistSongs.map((song, index) => {
            return (
              <Song
                key={index}
                index={index}
                isIndexingSongs={
                  localStorageData?.preferences?.isSongIndexingEnabled
                }
                title={song.title}
                artists={song.artists}
                duration={song.duration}
                songId={song.songId}
                artworkPaths={song.artworkPaths}
                path={song.path}
                year={song.year}
                isAFavorite={song.isAFavorite}
                isBlacklisted={song.isBlacklisted}
                additionalContextMenuItems={[
                  {
                    label: 'Remove from this Playlist',
                    iconName: 'playlist_remove',
                    handlerFunction: () =>
                      window.api
                        .removeSongFromPlaylist(
                          playlistData.playlistId,
                          song.songId
                        )
                        .then(
                          (res) =>
                            res.success &&
                            addNewNotifications([
                              {
                                id: `${song.songId}Removed`,
                                delay: 5000,
                                content: (
                                  <span>
                                    '{song.title}' removed from '
                                    {playlistData.name}' playlist successfully.
                                  </span>
                                ),
                              },
                            ])
                        )
                        .catch((err) => console.error(err)),
                  },
                ]}
                selectAllHandler={selectAllHandler}
              />
            );
          })
        : [],
    [
      playlistSongs,
      localStorageData?.preferences?.isSongIndexingEnabled,
      selectAllHandler,
      playlistData.playlistId,
      playlistData.name,
      addNewNotifications,
    ]
  );

  return (
    <MainContainer
      className="main-container playlist-info-page-container !h-full px-8 pb-8 pr-4 pt-4"
      focusable
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key === 'a') {
          e.stopPropagation();
          selectAllHandler();
        }
      }}
    >
      <>
        {Object.keys(playlistData).length > 0 && (
          <div className="playlist-img-and-info-container appear-from-bottom mb-8 flex flex-row items-center justify-start">
            <div className="playlist-cover-container mt-2">
              {localStorageData?.preferences.enableArtworkFromSongCovers &&
              playlistData.songs.length > 1 ? (
                <div className="relative h-60 w-60">
                  <MultipleArtworksCover
                    songIds={playlistData.songs}
                    className="h-60 w-60"
                    type={1}
                  />
                  <Img
                    src={playlistData.artworkPaths.artworkPath}
                    alt="Playlist Cover"
                    loading="lazy"
                    className="absolute bottom-2 right-2 h-16 w-16 !rounded-lg"
                  />
                </div>
              ) : (
                <Img
                  src={
                    playlistData.artworkPaths
                      ? playlistData.artworkPaths.artworkPath
                      : DefaultPlaylistCover
                  }
                  className="w-52 rounded-xl lg:w-48"
                  alt="Playlist Cover"
                />
              )}
            </div>
            <div className="playlist-info-container ml-8 text-font-color-black dark:text-font-color-white">
              <div className="font-semibold tracking-wider opacity-50">
                PLAYLIST
              </div>
              <div className="playlist-name mb-2 w-full overflow-hidden text-ellipsis whitespace-nowrap text-5xl text-font-color-highlight dark:text-dark-font-color-highlight">
                {playlistData.name}
              </div>
              <div className="playlist-no-of-songs w-full overflow-hidden text-ellipsis whitespace-nowrap text-base">
                {`${playlistData.songs.length} song${
                  playlistData.songs.length === 1 ? '' : 's'
                }`}
              </div>
              {playlistSongs.length > 0 && (
                <div className="playlist-total-duration">
                  {totalPlaylistDuration}
                </div>
              )}
              <div className="playlist-created-date">
                {`Created on ${new Date(
                  playlistData.createdDate
                ).toUTCString()}`}
              </div>
            </div>
          </div>
        )}
        {playlistSongs.length > 0 && (
          <div className="songs-list-container">
            <div className="title-container mb-4 mt-1 flex items-center justify-between pr-4 text-2xl text-font-color-black dark:text-font-color-white">
              Songs
              <div className="other-controls-container flex">
                {playlistData.songs && playlistData.songs.length > 0 && (
                  <div className="playlist-buttons flex">
                    {playlistData.playlistId === 'History' && (
                      <Button
                        label="Clear History"
                        iconName="clear"
                        clickHandler={() => {
                          changePromptMenuData(
                            true,
                            <SensitiveActionConfirmPrompt
                              title="Confrim the action to clear Song History"
                              content={
                                <div>
                                  You wouldn't be able to see what you have
                                  listened previously if you decide to continue
                                  this action.
                                </div>
                              }
                              confirmButton={{
                                label: 'Clear History',
                                clickHandler: () => {
                                  window.api
                                    .clearSongHistory()
                                    .then(
                                      (res) =>
                                        res.success &&
                                        addNewNotifications([
                                          {
                                            id: 'queueCleared',
                                            delay: 5000,
                                            content: (
                                              <span>
                                                Cleared the song history
                                                successfully.
                                              </span>
                                            ),
                                          },
                                        ])
                                    )
                                    .catch((err) => console.error(err));
                                },
                              }}
                            />
                          );
                        }}
                      />
                    )}
                    <Button
                      label="Play All"
                      iconName="play_arrow"
                      clickHandler={() =>
                        createQueue(
                          playlistSongs
                            .filter((song) => !song.isBlacklisted)
                            .map((song) => song.songId),
                          'songs',
                          false,
                          playlistData.playlistId,
                          true
                        )
                      }
                    />
                    <Button
                      tooltipLabel="Shuffle and Play"
                      iconName="shuffle"
                      clickHandler={() =>
                        createQueue(
                          playlistSongs
                            .filter((song) => !song.isBlacklisted)
                            .map((song) => song.songId),
                          'playlist',
                          true,
                          playlistData.playlistId,
                          true
                        )
                      }
                    />
                    <Button
                      tooltipLabel="Add to Queue"
                      iconName="add"
                      clickHandler={() => {
                        const validSongIds = playlistSongs
                          .filter((song) => !song.isBlacklisted)
                          .map((song) => song.songId);
                        updateQueueData(undefined, [
                          ...queue.queue,
                          ...validSongIds,
                        ]);
                        addNewNotifications([
                          {
                            id: `addedToQueue`,
                            delay: 5000,
                            content: (
                              <span>
                                Added {validSongIds.length} song
                                {validSongIds.length === 1 ? '' : 's'} to the
                                queue.
                              </span>
                            ),
                          },
                        ]);
                      }}
                    />

                    <Dropdown
                      name="PlaylistPageSortDropdown"
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
                  </div>
                )}
              </div>
            </div>
            <div className="songs-container">{songComponents}</div>
          </div>
        )}
        {playlistSongs.length === 0 && (
          <div className="no-songs-container appear-from-bottom relative flex h-full flex-grow flex-col items-center justify-center text-center text-lg font-light text-font-color-black !opacity-80 dark:text-font-color-white">
            <span className="material-icons-round-outlined mb-4 text-5xl">
              brightness_empty
            </span>
            Seems like this playlist is empty.
          </div>
        )}
      </>
    </MainContainer>
  );
};

PlaylistInfoPage.displayName = 'PlaylistInfoPage';
export default PlaylistInfoPage;
