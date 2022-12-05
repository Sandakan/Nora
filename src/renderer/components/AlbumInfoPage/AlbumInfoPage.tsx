/* eslint-disable react/no-array-index-key */
/* eslint-disable no-nested-ternary */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable no-restricted-syntax */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
/* eslint-disable react/destructuring-assignment */
import React, { useContext } from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import calculateTimeFromSeconds from 'renderer/utils/calculateTimeFromSeconds';
import Button from '../Button';
import Img from '../Img';
import MainContainer from '../MainContainer';
import { Song } from '../SongsPage/Song';
import SongArtist from '../SongsPage/SongArtist';

interface AlbumContentReducer {
  albumData: Album;
  songsData: SongData[];
}

type AlbumContentReducerActions = 'ALBUM_DATA_UPDATE' | 'SONGS_DATA_UPDATE';

const reducer = (
  state: AlbumContentReducer,
  action: { type: AlbumContentReducerActions; data: any }
): AlbumContentReducer => {
  switch (action.type) {
    case 'ALBUM_DATA_UPDATE':
      return {
        ...state,
        albumData: action.data,
      } as AlbumContentReducer;
    case 'SONGS_DATA_UPDATE':
      return {
        ...state,
        songsData: action.data,
      } as AlbumContentReducer;
    default:
      return state;
  }
};

export default () => {
  const { currentlyActivePage, queue, userData } = useContext(AppContext);
  const { createQueue, updateQueueData, addNewNotifications } =
    useContext(AppUpdateContext);

  const [albumContent, dispatch] = React.useReducer(reducer, {
    albumData: {} as Album,
    songsData: [] as SongData[],
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
        .getSongInfo(albumContent.albumData.songs.map((song) => song.songId))
        .then((res) => {
          if (res && res.length > 0) {
            dispatch({ type: 'SONGS_DATA_UPDATE', data: res });
          }
        });
    }
  }, [albumContent.albumData]);

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
                  userData !== undefined && userData.preferences.songIndexing
                }
                title={song.title}
                artists={song.artists}
                artworkPaths={song.artworkPaths}
                duration={song.duration}
                songId={song.songId}
                path={song.path}
                isAFavorite={song.isAFavorite}
              />
            );
          })
        : [],
    [albumContent.songsData, userData]
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
    <MainContainer className="main-container album-info-page-container pt-8 pb-12 pl-8">
      <>
        <div className="album-img-and-info-container flex flex-row items-center">
          <div className="album-cover-container mr-8">
            {albumContent.albumData.artworkPaths && (
              <Img
                src={albumContent.albumData.artworkPaths.artworkPath}
                className="w-60 rounded-2xl"
                alt="Album Cover"
              />
            )}{' '}
          </div>
          {albumContent.albumData.title &&
            albumContent.albumData.artists &&
            albumContent.albumData.artists.length > 0 &&
            albumContent.albumData.songs.length > 0 && (
              <div className="album-info-container max-w-[70%] text-font-color-black dark:text-font-color-white">
                <div className="album-title w-full overflow-hidden text-ellipsis whitespace-nowrap text-5xl">
                  {albumContent.albumData.title}
                </div>
                <div className="album-artists m-0 inline h-[unset] w-full cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap text-xl">
                  {albumContent.albumData.artists.map((artist, index) => (
                    <>
                      <SongArtist
                        key={artist.artistId}
                        artistId={artist.artistId}
                        name={artist.name}
                      />
                      {albumContent.albumData.artists
                        ? index === albumContent.albumData.artists.length - 1
                          ? ''
                          : ', '
                        : ''}
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
                {albumContent.songsData.length > 0 && (
                  <div className="album-buttons mt-4 flex">
                    <Button
                      label="Play All"
                      iconName="play_arrow"
                      clickHandler={() =>
                        createQueue(
                          albumContent.songsData.map((song) => song.songId),
                          'songs',
                          false,
                          albumContent.albumData.albumId,
                          true
                        )
                      }
                    />
                    <Button
                      label="Shuffle and Play"
                      iconName="shuffle"
                      clickHandler={() =>
                        createQueue(
                          albumContent.songsData.map((song) => song.songId),
                          'songs',
                          true,
                          albumContent.albumData.albumId,
                          true
                        )
                      }
                    />
                    <Button
                      label="Add to Queue"
                      iconName="add"
                      clickHandler={() => {
                        updateQueueData(
                          undefined,
                          [
                            ...queue.queue,
                            ...albumContent.songsData.map(
                              (song) => song.songId
                            ),
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
              </div>
            )}
        </div>
        <div className="album-songs-container secondary-container songs-list-container mt-8 h-fit pb-4">
          <div className="title-container mt-1 mb-4 flex items-center pr-4 text-2xl text-font-color-black  dark:text-font-color-white">
            Songs
          </div>
          <div className="songs-container relative flex flex-col">
            {songComponents}
          </div>
        </div>
      </>
    </MainContainer>
  );
};
