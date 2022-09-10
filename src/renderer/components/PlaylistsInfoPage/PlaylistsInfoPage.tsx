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
import { AppContext, AppUpdateContext } from 'renderer/contexts/AppContext';
import { calculateTime } from 'renderer/utils/calculateTime';
import DefaultPlaylistCover from '../../../../assets/images/png/playlist_cover_default.png';
import Button from '../Button';
import { Song } from '../SongsPage/Song';
import SensitiveActionConfirmPrompt from '../SensitiveActionConfirmPrompt';

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
      window.api.getSongInfo(playlistData.songs).then((songsData) => {
        if (songsData && songsData.length > 0)
          setPlaylistSongs(songsData.reverse());
      });
    }
  }, [playlistData.songs]);

  React.useEffect(() => {
    fetchPlaylistData();
    const managePlaylistUpdatesInPlaylistsInfoPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DataEvent).detail;
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
        const dataEvents = (e as DataEvent).detail;
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

  const calculateTotalTime = React.useCallback(() => {
    const val = calculateTime(
      playlistSongs.reduce((prev, current) => prev + current.duration, 0)
    );
    const duration = val.split(':');
    const hours = Math.floor(Number(duration[0]) / 60);
    const minutes = Math.floor(Number(duration[0]) % 60);
    const seconds = Number(duration[1]);
    return `${
      Number(duration[0]) / 60 >= 1
        ? `${hours} hour${hours === 1 ? '' : 's'} `
        : ''
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
                artworkPath={song.artworkPath}
                path={song.path}
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
    <div className="main-container playlist-info-page-container p-8">
      {Object.keys(playlistData).length > 0 && (
        <div className="playlist-img-and-info-container appear-from-bottom flex flex-row items-center mb-8">
          <div className="playlist-cover-container">
            <img
              src={
                playlistData.artworkPath
                  ? `otomusic://localFiles/${playlistData.artworkPath}`
                  : DefaultPlaylistCover
              }
              className="w-60 rounded-2xl"
              alt="Playlist Cover"
            />
          </div>
          <div className="playlist-info-container text-font-color-black dark:text-font-color-white ml-8">
            <div className="playlist-name text-5xl w-full overflow-hidden text-ellipsis whitespace-nowrap mb-2">
              {playlistData.name}
            </div>
            <div className="playlist-no-of-songs text-base w-full overflow-hidden text-ellipsis whitespace-nowrap">
              {`${playlistData.songs.length} song${
                playlistData.songs.length === 1 ? '' : 's'
              }`}
            </div>
            {playlistSongs.length > 0 && (
              <div className="playlist-total-duration">
                {calculateTotalTime()}
              </div>
            )}
            <div className="playlist-created-date">
              {`Created on ${new Date(playlistData.createdDate).toUTCString()}`}
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
                      undefined,
                      undefined,
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
                      playlistData.songs.sort(() => 0.5 - Math.random()),
                      'songs',
                      undefined,
                      undefined,
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
                            {playlistData.songs.length === 1 ? '' : 's'} to the
                            queue.
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
                              You wouldn't be able to see what you have listened
                              previously if you decide to continue this action.
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
          <div className="title-container mt-1 pr-4 flex items-center mb-4 text-font-color-black text-2xl dark:text-font-color-white">
            Songs
          </div>
          <div className="songs-container">{songComponents}</div>
        </div>
      )}
      {playlistSongs.length === 0 && (
        <div className="no-songs-container h-full mt-12 w-full text-[#ccc] text-center flex flex-col items-center justify-center text-2xl relative inset-0">
          This playlist is empty.
        </div>
      )}
    </div>
  );
};

PlaylistInfoPage.displayName = 'PlaylistInfoPage';
export default PlaylistInfoPage;
