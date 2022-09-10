/* eslint-disable promise/no-nesting */
/* eslint-disable no-console */
/* eslint-disable react/no-array-index-key */
/* eslint-disable no-restricted-syntax */
/* eslint-disable react/no-unused-prop-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { AppUpdateContext } from 'renderer/contexts/AppContext';
import { Artist } from '../ArtistPage/Artist';
import { SongCard } from '../SongsPage/SongCard';
import DefaultSongCover from '../../../../assets/images/png/song_cover_default.png';
import NoSongsImage from '../../../../assets/images/svg/Empty Inbox _Monochromatic.svg';
import DataFetchingImage from '../../../../assets/images/svg/Umbrella_Monochromatic.svg';
import ErrorPrompt from '../ErrorPrompt';
import MainContainer from '../MainContainer';
import Button from '../Button';

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

export const HomePage = () => {
  const { updateContextMenuData, changePromptMenuData, addNewNotifications } =
    React.useContext(AppUpdateContext);

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
      Array.isArray(recentSongs[0].songs) &&
      recentSongs[0].songs.length > 0
    )
      window.api
        .getSongInfo(recentSongs[0].songs.reverse(), undefined, 5)
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
          return window.api.getSongInfo(res[0].songs, 'allTimeMostListened', 5);
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
        const dataEvents = (e as DataEvent).detail;
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (event.dataType === 'playlists/history')
            fetchRecentlyPlayedSongs();
          if (
            event.dataType === 'songs/deletedSong' ||
            event.dataType === 'songs/newSong'
          ) {
            fetchLatestSongs();
          }
          if (event.dataType === 'artists/artworks') fetchRecentArtistsData();
          if (
            event.dataType === 'songs/likes' ||
            event.dataType === 'songs/noOfListens'
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
            artworkPath: song.artworkPath,
            addedDate: song.addedDate,
            isAFavorite: song.isAFavorite,
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
                  key={`${songData.songId}-${index}`}
                  title={songData.title}
                  artworkPath={songData.artworkPath || DefaultSongCover}
                  path={songData.path}
                  duration={songData.duration}
                  songId={songData.songId}
                  artists={songData.artists}
                  palette={songData.palette}
                  isAFavorite={songData.isAFavorite}
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
              key={`${song.songId}-${index}`}
              title={song.title}
              artworkPath={song.artworkPath || DefaultSongCover}
              path={song.path}
              duration={song.duration}
              songId={song.songId}
              artists={song.artists}
              palette={song.palette}
              isAFavorite={song.isAFavorite}
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
                    key={`${val.artistId}-${index}`}
                    artworkPath={val.artworkPath}
                    artistId={val.artistId}
                    songIds={val.songs.map((song) => song.songId)}
                    onlineArtworkPaths={val.onlineArtworkPaths}
                    className="mb-4"
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
              key={`${song.songId}-${index}`}
              title={song.title}
              artworkPath={song.artworkPath || DefaultSongCover}
              path={song.path}
              duration={song.duration}
              songId={song.songId}
              artists={song.artists}
              palette={song.palette}
              isAFavorite={song.isAFavorite}
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
                    key={`${val.artistId}-${index}`}
                    artworkPath={val.artworkPath}
                    artistId={val.artistId}
                    songIds={val.songs.map((song) => song.songId)}
                    onlineArtworkPaths={val.onlineArtworkPaths}
                    className="mb-4"
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
      window.api.isDevelopment
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
    <div
      className="home-page overflow-y-auto h-full relative"
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (homePageContextMenus.length > 0)
          updateContextMenuData(true, homePageContextMenus, e.pageX, e.pageY);
      }}
    >
      {/* <div className="title-container text-4xl font-medium text-font-color-black dark:text-font-color-white pl-8 my-4">
        Welcome, Sandakan.
      </div> */}
      {content.latestSongs.length > 0 && content.latestSongs[0] !== null && (
        <MainContainer className="recently-added-songs-container appear-from-bottom h-fit">
          <>
            <div className="title-container mt-1 mb-4 text-font-color-black text-2xl dark:text-font-color-white">
              Recently Added Songs
            </div>
            <div className="songs-container w-full grid grid-rows-1 grid-cols-3 gap-8 pr-2 pb-4">
              {latestSongComponents}
            </div>
          </>
        </MainContainer>
      )}
      {recentlyPlayedSongs.length > 0 && (
        <MainContainer className="recently-played-songs-container appear-from-bottom h-fit flex">
          <>
            <div className="title-container mt-1 mb-4 text-font-color-black text-2xl dark:text-font-color-white">
              Recently Played Songs
            </div>
            <div className="songs-container grid grid-rows-1 grid-cols-3 gap-8 pr-2">
              {recentlyPlayedSongs}
            </div>
          </>
        </MainContainer>
      )}
      {recentlyPlayedSongArtists.length > 0 && (
        <MainContainer className="artists-list-container appear-from-bottom">
          <>
            <div className="title-container mt-1 mb-4 text-font-color-black text-2xl dark:text-font-color-white">
              Recent Artists
            </div>
            <div className="artists-container flex flex-wrap">
              {recentlyPlayedSongArtists}
            </div>
          </>
        </MainContainer>
      )}
      {mostLovedSongComponents.length > 0 && (
        <MainContainer className="recently-played-songs-container appear-from-bottom h-fit flex">
          <>
            <div className="title-container mt-1 mb-4 text-font-color-black text-2xl dark:text-font-color-white">
              Most Loved Songs
            </div>
            <div className="songs-container grid grid-rows-1 grid-cols-3 gap-8 pr-2">
              {mostLovedSongComponents}
            </div>
          </>
        </MainContainer>
      )}
      {mostLovedArtistComponents.length > 0 && (
        <MainContainer className="artists-list-container appear-from-bottom">
          <>
            <div className="title-container mt-1 mb-4 text-font-color-black text-2xl dark:text-font-color-white">
              Most Loved Artists
            </div>
            <div className="artists-container flex flex-wrap">
              {mostLovedArtistComponents}
            </div>
          </>
        </MainContainer>
      )}
      {content.latestSongs[0] === null && (
        <div className="no-songs-container h-full w-full text-font-color-black dark:text-font-color-white text-center flex flex-col items-center justify-center text-2xl">
          <img
            src={NoSongsImage}
            className="w-60 mb-8"
            alt="No songs available."
          />
          <div>There&apos;s nothing here. Do you know where are they?</div>
          <Button
            label="Add Folder"
            className="mt-4 px-8 text-lg w-40 !bg-background-color-3 dark:!bg-dark-background-color-3 text-font-color-black dark:text-font-color-black rounded-md hover:border-background-color-3 dark:hover:border-background-color-3"
            clickHandler={addNewSongs}
          />
        </div>
      )}
      {recentlyPlayedSongs.length === 0 && content.latestSongs.length === 0 && (
        <div className="no-songs-container h-full w-full text-[#ccc] text-center flex flex-col items-center justify-center text-2xl">
          <img src={DataFetchingImage} className="w-60 mb-8" alt="Stay calm" />
          <span>Just hold on. We are readying everything for you...</span>
        </div>
      )}
      {content.latestSongs.length > 0 &&
        content.latestSongs[0] !== null &&
        recentlyPlayedSongs.length === 0 && (
          <div className="no-songs-container mt-12 w-full text-[#ccc] text-center flex flex-col items-center justify-center text-lg font-normal">
            {/* <img src={PlaySomeSongsImage} className="w-60 mb-8" alt="Stay calm" /> */}
            <span>Listen to some songs to show additional metrics.</span>
          </div>
        )}
    </div>
  );
};
