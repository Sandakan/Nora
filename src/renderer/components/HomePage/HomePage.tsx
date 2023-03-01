/* eslint-disable promise/no-nesting */
/* eslint-disable no-console */
/* eslint-disable react/no-array-index-key */
/* eslint-disable no-restricted-syntax */
/* eslint-disable react/no-unused-prop-types */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable consistent-return */
/* eslint-disable no-else-return */
/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react/self-closing-comp */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { Artist } from '../ArtistPage/Artist';
import SongCard from '../SongsPage/SongCard';
import DefaultSongCover from '../../../../assets/images/webp/song_cover_default.webp';
import NoSongsImage from '../../../../assets/images/svg/Empty Inbox _Monochromatic.svg';
import DataFetchingImage from '../../../../assets/images/svg/Umbrella_Monochromatic.svg';
import ErrorPrompt from '../ErrorPrompt';
import MainContainer from '../MainContainer';
import SecondaryContainer from '../SecondaryContainer';
import Button from '../Button';
import Img from '../Img';

interface HomePageReducer {
  latestSongs: (AudioInfo | null)[];
  recentlyPlayedSongs: SongData[];
  recentSongArtists: Artist[];
  mostLovedSongs: AudioInfo[];
  mostLovedArtists: Artist[];
}

type HomePageReducerActionTypes =
  | 'SONGS_DATA'
  | 'RECENTLY_PLAYED_SONGS_DATA'
  | 'RECENT_SONGS_ARTISTS'
  | 'MOST_LOVED_ARTISTS'
  | 'MOST_LOVED_SONGS';

const reducer = (
  state: HomePageReducer,
  action: { type: HomePageReducerActionTypes; data?: any }
): HomePageReducer => {
  switch (action.type) {
    case 'SONGS_DATA':
      return {
        ...state,
        latestSongs: action.data,
      };
    case 'RECENTLY_PLAYED_SONGS_DATA':
      return {
        ...state,
        recentlyPlayedSongs: action.data,
      };
    case 'RECENT_SONGS_ARTISTS':
      return {
        ...state,
        recentSongArtists: action.data,
      };
    case 'MOST_LOVED_SONGS':
      return {
        ...state,
        mostLovedSongs: action.data,
      };
    case 'MOST_LOVED_ARTISTS':
      return {
        ...state,
        mostLovedArtists: action.data,
      };
    default:
      return state;
  }
};

const HomePage = () => {
  const {
    updateContextMenuData,
    changeCurrentActivePage,
    changePromptMenuData,
    addNewNotifications,
  } = React.useContext(AppUpdateContext);

  const [content, dispatch] = React.useReducer(reducer, {
    latestSongs: [],
    recentlyPlayedSongs: [],
    recentSongArtists: [],
    mostLovedSongs: [],
    mostLovedArtists: [],
  });

  const fetchLatestSongs = React.useCallback(() => {
    window.api.getAllSongs('dateAddedAscending', 1, 5).then((audioData) => {
      if (!audioData || audioData.data.length === 0)
        return dispatch({ type: 'SONGS_DATA', data: [null] });
      else {
        dispatch({
          type: 'SONGS_DATA',
          data: audioData.data,
        });
        return undefined;
      }
    });
  }, []);

  const fetchRecentlyPlayedSongs = React.useCallback(async () => {
    const recentSongs = await window.api
      .getPlaylistData(['History'])
      .catch((err) => console.error(err));
    if (
      Array.isArray(recentSongs) &&
      recentSongs.length > 0 &&
      Array.isArray(recentSongs[0].songs) &&
      recentSongs[0].songs.length > 0
    )
      window.api
        .getSongInfo(recentSongs[0].songs, undefined, 5, true)
        .then((res) => {
          if (res)
            dispatch({
              type: 'RECENTLY_PLAYED_SONGS_DATA',
              data: res,
            });
        })
        .catch((err) => console.error(err));
  }, []);

  const fetchRecentArtistsData = React.useCallback(() => {
    if (content.recentlyPlayedSongs.length > 0) {
      window.api
        .getArtistData(
          [
            ...new Set(
              content.recentlyPlayedSongs
                .map((song) =>
                  song.artists
                    ? song.artists.map((artist) => artist.artistId)
                    : []
                )
                .flat()
            ),
          ].filter((_, index) => index < 5)
        )
        .then((res) => {
          if (res && Array.isArray(res))
            dispatch({
              type: 'RECENT_SONGS_ARTISTS',
              data: res,
            });
        });
    }
  }, [content.recentlyPlayedSongs]);

  // ? Most loved songs are fetched after the user have made at least one favorite song from the library.
  const fetchMostLovedSongs = React.useCallback(() => {
    window.api
      .getPlaylistData(['Favorites'])
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          return window.api.getSongInfo(
            res[0].songs,
            'allTimeMostListened',
            5,
            true
          );
        }
        return undefined;
      })
      .then((lovedSongs) => {
        if (Array.isArray(lovedSongs) && lovedSongs.length > 0)
          dispatch({ type: 'MOST_LOVED_SONGS', data: lovedSongs });
      })
      .catch((err) => console.error(err));
  }, []);

  const fetchMostLovedArtists = React.useCallback(() => {
    if (content.mostLovedSongs.length > 0) {
      window.api
        .getArtistData(
          [
            ...new Set(
              content.mostLovedSongs
                .map((song) =>
                  song.artists
                    ? song.artists.map((artist) => artist.artistId)
                    : []
                )
                .flat()
            ),
          ].filter((_, index) => index < 5)
        )
        .then((res) => {
          if (res && Array.isArray(res))
            dispatch({
              type: 'MOST_LOVED_ARTISTS',
              data: res,
            });
        });
    }
  }, [content.mostLovedSongs]);

  React.useEffect(() => {
    fetchLatestSongs();
    fetchRecentlyPlayedSongs();
    fetchMostLovedSongs();
    const manageDataUpdatesInHomePage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>)
          .detail;
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (event.dataType === 'playlists/history')
            fetchRecentlyPlayedSongs();
          else if (
            event.dataType === 'songs/deletedSong' ||
            event.dataType === 'songs/newSong' ||
            event.dataType === 'blacklist/songBlacklist' ||
            (event.dataType === 'songs/likes' && event.eventData.length > 1)
          ) {
            fetchLatestSongs();
            fetchRecentlyPlayedSongs();
            fetchMostLovedSongs();
          } else if (
            event.dataType === 'artists/artworks' ||
            event.dataType === 'artists/deletedArtist' ||
            event.dataType === 'artists/updatedArtist' ||
            event.dataType === 'artists/newArtist' ||
            (event.dataType === 'artists/likes' && event.eventData.length > 1)
          ) {
            fetchRecentArtistsData();
            fetchMostLovedArtists();
          } else if (
            event.dataType === 'songs/likes' ||
            event.dataType === 'songs/listeningData/listens'
          )
            fetchMostLovedSongs();
        }
      }
    };
    document.addEventListener('app/dataUpdates', manageDataUpdatesInHomePage);
    return () => {
      document.removeEventListener(
        'app/dataUpdates',
        manageDataUpdatesInHomePage
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => fetchRecentArtistsData(), [fetchRecentArtistsData]);
  React.useEffect(() => fetchMostLovedArtists(), [fetchMostLovedArtists]);

  const addNewSongs = () => {
    dispatch({ type: 'SONGS_DATA', data: [] });
    window.api
      .addMusicFolder()
      .then((songs) => {
        const relevantSongsData: AudioInfo[] = songs.map((song) => {
          return {
            title: song.title,
            songId: song.songId,
            artists: song.artists,
            duration: song.duration,
            palette: song.palette,
            path: song.path,
            artworkPaths: song.artworkPaths,
            addedDate: song.addedDate,
            isAFavorite: song.isAFavorite,
            isBlacklisted: song.isBlacklisted,
          };
        });
        dispatch({ type: 'SONGS_DATA', data: relevantSongsData });
      })
      // eslint-disable-next-line no-console
      .catch(() => dispatch({ type: 'SONGS_DATA', data: [null] }));
  };

  const latestSongComponents = React.useMemo(
    () =>
      content.latestSongs.length > 0 && content.latestSongs[0] !== null
        ? content.latestSongs
            .filter((_, index) => index < 5)
            .map((song, index) => {
              const songData = song as AudioInfo;
              return (
                <SongCard
                  index={index}
                  key={songData.songId}
                  title={songData.title}
                  artworkPath={
                    songData.artworkPaths?.artworkPath || DefaultSongCover
                  }
                  path={songData.path}
                  songId={songData.songId}
                  artists={songData.artists}
                  palette={songData.palette}
                  isAFavorite={songData.isAFavorite}
                  isBlacklisted={songData.isBlacklisted}
                />
              );
            })
        : [],
    [content.latestSongs]
  );

  const recentlyPlayedSongs = React.useMemo(
    () =>
      content.recentlyPlayedSongs
        .filter((_, index) => index < 3)
        .map((song, index) => {
          return (
            <SongCard
              index={index}
              key={song.songId}
              title={song.title}
              artworkPath={song.artworkPaths?.artworkPath || DefaultSongCover}
              path={song.path}
              songId={song.songId}
              artists={song.artists}
              palette={song.palette}
              isAFavorite={song.isAFavorite}
              isBlacklisted={song.isBlacklisted}
            />
          );
        }),
    [content.recentlyPlayedSongs]
  );

  const recentlyPlayedSongArtists = React.useMemo(
    () =>
      content.recentlyPlayedSongs.length > 0
        ? content.recentSongArtists
            .map((val, index) => {
              if (val)
                return (
                  <Artist
                    index={index}
                    name={val.name}
                    key={val.artistId}
                    artworkPaths={val.artworkPaths}
                    artistId={val.artistId}
                    songIds={val.songs.map((song) => song.songId)}
                    onlineArtworkPaths={val.onlineArtworkPaths}
                    className="mb-4"
                    isAFavorite={val.isAFavorite}
                  />
                );
              else return undefined;
            })
            .filter((x) => x !== undefined)
        : [],
    [content.recentSongArtists, content.recentlyPlayedSongs.length]
  );

  const mostLovedSongComponents = React.useMemo(
    () =>
      content.mostLovedSongs
        .filter((_, index) => index < 3)
        .map((song, index) => {
          return (
            <SongCard
              index={index}
              key={song.songId}
              title={song.title}
              artworkPath={song.artworkPaths?.artworkPath || DefaultSongCover}
              path={song.path}
              songId={song.songId}
              artists={song.artists}
              palette={song.palette}
              isAFavorite={song.isAFavorite}
              isBlacklisted={song.isBlacklisted}
            />
          );
        }),
    [content.mostLovedSongs]
  );

  const mostLovedArtistComponents = React.useMemo(
    () =>
      content.mostLovedSongs.length > 0
        ? content.mostLovedArtists
            .map((val, index) => {
              if (val)
                return (
                  <Artist
                    index={index}
                    name={val.name}
                    key={val.artistId}
                    artworkPaths={val.artworkPaths}
                    artistId={val.artistId}
                    songIds={val.songs.map((song) => song.songId)}
                    onlineArtworkPaths={val.onlineArtworkPaths}
                    className="mb-4"
                    isAFavorite={val.isAFavorite}
                  />
                );
              else return undefined;
            })
            .filter((x) => x !== undefined)
        : [],
    [content.mostLovedArtists, content.mostLovedSongs.length]
  );

  const homePageContextMenus: ContextMenuItem[] = React.useMemo(
    () =>
      window.api.isInDevelopment
        ? [
            {
              label: 'Alert Error',
              iconName: 'report',
              handlerFunction: () =>
                changePromptMenuData(
                  true,
                  <ErrorPrompt
                    reason="JUST_FOR_FUN"
                    message={
                      <>
                        This prompt is used to develop the prompt menu. Instead
                        of clicking doing something that will open a prompt and
                        also result in consequences, this approach is much
                        better because nothing will change when opening this
                        prompt.
                      </>
                    }
                    showSendFeedbackBtn
                  />,
                  'error-alert-prompt'
                ),
            },
            {
              label: 'Show Notification',
              iconName: 'notifications_active',
              handlerFunction: () =>
                addNewNotifications([
                  {
                    id: 'testNotification',
                    delay: 60000,
                    content: <>This is a notification with a very long text.</>,
                    icon: (
                      <span className="material-icons-round icon">
                        notifications_active
                      </span>
                    ),
                    buttons: [
                      {
                        label: 'Button',
                        iconName: 'sync',
                        className:
                          '!bg-background-color-3 dark:!bg-dark-background-color-3 !text-font-color-black dark:!text-font-color-black !font-light',
                        clickHandler: () => true,
                      },
                    ],
                  },
                ]),
            },
          ]
        : [],
    [changePromptMenuData, addNewNotifications]
  );

  return (
    <MainContainer
      className="home-page relative !h-full overflow-y-auto !pl-0"
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (homePageContextMenus.length > 0)
          updateContextMenuData(true, homePageContextMenus, e.pageX, e.pageY);
      }}
    >
      <>
        {content.latestSongs.length > 0 && content.latestSongs[0] !== null && (
          <SecondaryContainer className="recently-added-songs-container appear-from-bottom h-fit max-h-full flex-col pb-8 pl-8">
            <>
              <div className="title-container my-4 flex items-center justify-between text-2xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
                Recently Added Songs
                <Button
                  label="Show All"
                  tooltipLabel="Opens 'Songs' with 'Newest' sort option."
                  iconName="apps"
                  className="show-all-btn text-sm font-normal"
                  clickHandler={() =>
                    changeCurrentActivePage('Songs', {
                      sortingOrder: 'dateAddedAscending',
                    })
                  }
                />
              </div>
              <div className="songs-container grid grid-cols-3 grid-rows-1 gap-2 pr-2">
                {latestSongComponents}
              </div>
            </>
          </SecondaryContainer>
        )}
        {recentlyPlayedSongs.length > 0 && (
          <SecondaryContainer className="recently-played-songs-container appear-from-bottom flex h-fit max-h-full flex-col pb-8 pl-8">
            <>
              <div className="title-container mt-1 mb-4 flex items-center justify-between text-2xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
                Recently Played Songs
                <Button
                  label="Show All"
                  tooltipLabel="Opens 'Songs' with 'Newest' sort option."
                  iconName="apps"
                  className="show-all-btn text-sm font-normal"
                  clickHandler={() =>
                    changeCurrentActivePage('PlaylistInfo', {
                      playlistId: 'History',
                      sortingOrder: 'addedOrder',
                    })
                  }
                />
              </div>
              <div className="songs-container grid grid-cols-3 grid-rows-1 gap-2 pr-2">
                {recentlyPlayedSongs}
              </div>
            </>
          </SecondaryContainer>
        )}
        {recentlyPlayedSongArtists.length > 0 && (
          <SecondaryContainer className="artists-list-container appear-from-bottom max-h-full flex-col pb-8 pl-8">
            <>
              <div className="title-container mt-1 mb-4 text-2xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
                Recent Artists
              </div>
              <div className="artists-container flex flex-wrap">
                {recentlyPlayedSongArtists}
              </div>
            </>
          </SecondaryContainer>
        )}
        {mostLovedSongComponents.length > 0 && (
          <SecondaryContainer className="recently-played-songs-container appear-from-bottom flex h-fit max-h-full flex-col pb-8 pl-8">
            <>
              <div className="title-container mt-1 mb-4 text-2xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
                Most Loved Songs
              </div>
              <div className="songs-container grid grid-cols-3 grid-rows-1 gap-2 pr-2">
                {mostLovedSongComponents}
              </div>
            </>
          </SecondaryContainer>
        )}
        {mostLovedArtistComponents.length > 0 && (
          <SecondaryContainer className="artists-list-container appear-from-bottom max-h-full flex-col pb-8 pl-8">
            <>
              <div className="title-container mt-1 mb-4 text-2xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
                Most Loved Artists
              </div>
              <div className="artists-container flex flex-wrap">
                {mostLovedArtistComponents}
              </div>
            </>
          </SecondaryContainer>
        )}
        {content.latestSongs[0] === null && (
          <div className="no-songs-container appear-from-bottom flex h-full w-full flex-col items-center justify-center text-center text-xl text-font-color-black dark:text-font-color-white">
            <Img
              src={NoSongsImage}
              className="mb-8 w-60"
              alt="No songs available."
            />
            <div>There&apos;s nothing here. Do you know where are they?</div>
            <Button
              label="Add Folder"
              className="mt-4 w-40 !bg-background-color-3 px-8 text-lg !text-font-color-black hover:border-background-color-3 dark:!bg-dark-background-color-3 dark:!text-font-color-black dark:hover:border-background-color-3"
              clickHandler={addNewSongs}
            />
          </div>
        )}
        {recentlyPlayedSongs.length === 0 &&
          content.latestSongs.length === 0 && (
            <div className="no-songs-container flex h-full w-full flex-col items-center justify-center text-center text-xl text-font-color-dimmed dark:text-dark-font-color-dimmed">
              <Img
                src={DataFetchingImage}
                className="mb-8 w-48"
                alt="Stay calm"
              />
              <span>Just hold on. We are readying everything for you...</span>
            </div>
          )}
        {content.latestSongs.length > 0 &&
          content.latestSongs[0] !== null &&
          recentlyPlayedSongs.length === 0 && (
            <div className="no-songs-container mt-12 flex w-full flex-col items-center justify-center text-center text-xl font-normal text-font-color-dimmed dark:text-dark-font-color-dimmed">
              <span>Listen to some songs to show additional metrics.</span>
            </div>
          )}
      </>
    </MainContainer>
  );
};

export default HomePage;
