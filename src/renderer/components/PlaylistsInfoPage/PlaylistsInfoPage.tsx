/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-console */
/* eslint-disable react/no-array-index-key */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-restricted-syntax */
/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
/* eslint-disable react/require-default-props */
/* eslint-disable react/destructuring-assignment */
import React, { useContext } from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { AppContext } from 'renderer/contexts/AppContext';
import calculateTimeFromSeconds from 'renderer/utils/calculateTimeFromSeconds';
import DefaultPlaylistCover from '../../../../assets/images/png/playlist_cover_default.png';
import Button from '../Button';
import Song from '../SongsPage/Song';
import SensitiveActionConfirmPrompt from '../SensitiveActionConfirmPrompt';
import Img from '../Img';
import MainContainer from '../MainContainer';

const PlaylistInfoPage = () => {
  const { currentlyActivePage, queue, userData } = useContext(AppContext);
  const {
    updateQueueData,
    changePromptMenuData,
    addNewNotifications,
    createQueue,
  } = React.useContext(AppUpdateContext);

  const [playlistData, setPlaylistData] = React.useState({} as Playlist);
  const [playlistSongs, setPlaylistSongs] = React.useState([] as SongData[]);

  const fetchPlaylistData = React.useCallback(() => {
    if (currentlyActivePage.data.playlistId) {
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
            : playlistData.songs
        )
        .then((songsData) => {
          if (songsData && songsData.length > 0)
            setPlaylistSongs(songsData.reverse());
        });
    }
  }, [playlistData.songs, playlistData.playlistId]);

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
          if (event.dataType === 'albums/newAlbum') fetchPlaylistSongsData();
          if (event.dataType === 'albums/deletedAlbum')
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

  const songComponents = React.useMemo(
    () =>
      playlistSongs.length > 0
        ? playlistSongs.map((song, index) => {
            return (
              <Song
                key={index}
                index={index}
                isIndexingSongs={
                  userData !== undefined && userData.preferences.songIndexing
                }
                title={song.title}
                artists={song.artists}
                duration={song.duration}
                songId={song.songId}
                artworkPaths={song.artworkPaths}
                path={song.path}
                year={song.year}
                isAFavorite={song.isAFavorite}
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
              />
            );
          })
        : [],
    [playlistSongs, playlistData, addNewNotifications, userData]
  );

  return (
    <MainContainer className="main-container playlist-info-page-container p-8 pr-4">
      <>
        {Object.keys(playlistData).length > 0 && (
          <div className="playlist-img-and-info-container appear-from-bottom mb-8 flex flex-row items-center justify-start">
            <div className="playlist-cover-container mt-2">
              <Img
                src={
                  playlistData.artworkPaths
                    ? playlistData.artworkPaths.artworkPath
                    : DefaultPlaylistCover
                }
                className="w-60 rounded-2xl lg:w-48 md:w-40"
                alt="Playlist Cover"
              />
            </div>
            <div className="playlist-info-container ml-8 text-font-color-black dark:text-font-color-white">
              <div className="playlist-name mb-2 w-full overflow-hidden text-ellipsis whitespace-nowrap text-5xl">
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
              {playlistData.songs && playlistData.songs.length > 0 && (
                <div className="playlist-buttons mt-8 flex flex-wrap">
                  <Button
                    label="Play All"
                    iconName="play_arrow"
                    className="mb-4"
                    clickHandler={() =>
                      createQueue(
                        playlistData.songs,
                        'songs',
                        false,
                        playlistData.playlistId,
                        true
                      )
                    }
                  />
                  <Button
                    label="Shuffle and Play"
                    iconName="shuffle"
                    className="mb-4"
                    clickHandler={() =>
                      createQueue(
                        playlistData.songs,
                        'playlist',
                        true,
                        playlistData.playlistId,
                        true
                      )
                    }
                  />
                  <Button
                    label="Add to Queue"
                    iconName="add"
                    className="mb-4"
                    clickHandler={() => {
                      updateQueueData(undefined, [
                        ...queue.queue,
                        ...playlistData.songs,
                      ]);
                      addNewNotifications([
                        {
                          id: `addedToQueue`,
                          delay: 5000,
                          content: (
                            <span>
                              Added {playlistData.songs.length} song
                              {playlistData.songs.length === 1 ? '' : 's'} to
                              the queue.
                            </span>
                          ),
                        },
                      ]);
                    }}
                  />
                  {playlistData.playlistId === 'History' && (
                    <Button
                      label="Clear History"
                      iconName="clear"
                      className="mb-4"
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
                </div>
              )}
            </div>
          </div>
        )}
        {playlistSongs.length > 0 && (
          <div className="songs-list-container">
            <div className="title-container mt-1 mb-4 flex items-center pr-4 text-2xl text-font-color-black dark:text-font-color-white">
              Songs
            </div>
            <div className="songs-container">{songComponents}</div>
          </div>
        )}
        {playlistSongs.length === 0 && (
          <div className="no-songs-container relative inset-0 mt-12 flex h-full w-full flex-col items-center justify-center text-center text-xl text-font-color-dimmed dark:text-dark-font-color-dimmed">
            This playlist is empty.
          </div>
        )}
      </>
    </MainContainer>
  );
};

PlaylistInfoPage.displayName = 'PlaylistInfoPage';
export default PlaylistInfoPage;
