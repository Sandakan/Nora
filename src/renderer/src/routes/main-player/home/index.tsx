import roundTo from '@common/roundTo';
import Button from '@renderer/components/Button';
import MostLovedArtists from '@renderer/components/HomePage/MostLovedArtists';
import MostLovedSongs from '@renderer/components/HomePage/MostLovedSongs';
import RecentlyAddedSongs from '@renderer/components/HomePage/RecentlyAddedSongs';
import RecentlyPlayedArtists from '@renderer/components/HomePage/RecentlyPlayedArtists';
import RecentlyPlayedSongs from '@renderer/components/HomePage/RecentlyPlayedSongs';
import MainContainer from '@renderer/components/MainContainer';
import { AppUpdateContext } from '@renderer/contexts/AppUpdateContext';
import useResizeObserver from '@renderer/hooks/useResizeObserver';
import storage from '@renderer/utils/localStorage';
import { createFileRoute } from '@tanstack/react-router';
import { lazy, useCallback, useContext, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
// import DataFetchingImage from '../../../assets/images/svg/Umbrella_Monochromatic.svg';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { queryClient } from '@renderer/index';
import { songQuery } from '@renderer/queries/songs';
import { artistQuery } from '@renderer/queries/aritsts';
import NavLink from '@renderer/components/NavLink';
import SecondaryContainer from '@renderer/components/SecondaryContainer';
import Img from '@renderer/components/Img';

import favoritesPlaylistCoverImage from '../../../assets/images/webp/favorites-playlist-icon.webp';
import historyPlaylistCoverImage from '../../../assets/images/webp/history-playlist-icon.webp';

// TODO: Implement logic to fetch recently played songs from the backend or local storage.
const fetchRecentlyPlayedSongs = async (): Promise<SongData[]> => [];
// TODO: Implement logic to fetch recent song artists from the backend or local storage.
const fetchRecentSongArtists = async (): Promise<Artist[]> => [];
const fetchMostLovedSongs = async (): Promise<AudioInfo[]> => [];

const recentlyPlayedSongQueryOptions = queryOptions({
  queryKey: ['recentlyPlayedSongs'],
  queryFn: () => fetchRecentlyPlayedSongs()
});
const recentSongArtistsQueryOptions = queryOptions({
  queryKey: ['recentSongArtists'],
  queryFn: () => fetchRecentSongArtists()
});
const mostLovedSongsQueryOptions = queryOptions({
  queryKey: ['mostLovedSongs'],
  queryFn: () => fetchMostLovedSongs()
});

export const Route = createFileRoute('/main-player/home/')({
  component: HomePage,
  loader: async () => {
    await queryClient.ensureQueryData(
      songQuery.all({ sortType: 'dateAddedDescending', start: 0, end: 30 })
    );
    await queryClient.ensureQueryData(recentlyPlayedSongQueryOptions);
    await queryClient.ensureQueryData(recentSongArtistsQueryOptions);
    await queryClient.ensureQueryData(mostLovedSongsQueryOptions);
    await queryClient.ensureQueryData(
      artistQuery.all({
        sortType: 'mostLovedDescending',
        filterType: 'notSelected',
        start: 0,
        end: 30
      })
    );
  }
});

const ErrorPrompt = lazy(() => import('@renderer/components/ErrorPrompt'));
const AddMusicFoldersPrompt = lazy(
  () => import('@renderer/components/MusicFoldersPage/AddMusicFoldersPrompt')
);

function HomePage() {
  const { updateContextMenuData, changePromptMenuData, addNewNotifications } =
    useContext(AppUpdateContext);
  const { t } = useTranslation();

  const {
    data: { data: latestSongs }
  } = useSuspenseQuery(songQuery.all({ sortType: 'dateAddedDescending', start: 0, end: 30 }));
  const { data: recentlyPlayedSongs } = useSuspenseQuery(recentlyPlayedSongQueryOptions);

  const { data: recentSongArtists } = useSuspenseQuery(recentSongArtistsQueryOptions);

  const { data: mostLovedSongs } = useSuspenseQuery(mostLovedSongsQueryOptions);

  const {
    data: { data: mostLovedArtists }
  } = useSuspenseQuery(artistQuery.all({ sortType: 'aToZ', start: 0, end: 30 }));

  const SONG_CARD_MIN_WIDTH = 280;
  const ARTIST_WIDTH = 175;

  const recentlyAddedSongsContainerRef = useRef<HTMLDivElement>(null);
  const recentlyAddedSongsContainerDiamensions = useResizeObserver(recentlyAddedSongsContainerRef);
  const { noOfRecentlyAddedSongCards, noOfRecentandLovedArtists, noOfRecentandLovedSongCards } =
    useMemo(() => {
      const { width } = recentlyAddedSongsContainerDiamensions;

      return {
        noOfRecentlyAddedSongCards: Math.floor(width / SONG_CARD_MIN_WIDTH) * 2 || 5,
        noOfRecentandLovedSongCards: Math.floor(width / SONG_CARD_MIN_WIDTH) || 3,
        noOfRecentandLovedArtists: Math.floor(width / ARTIST_WIDTH) || 5
      };
    }, [recentlyAddedSongsContainerDiamensions]);

  // const fetchRecentlyPlayedSongs = useCallback(async () => {
  //   const recentSongs = await window.api.playlistsData
  //     .getPlaylistData(['History'])
  //     .catch((err) => console.error(err));
  //   if (
  //     Array.isArray(recentSongs) &&
  //     recentSongs.length > 0 &&
  //     Array.isArray(recentSongs[0].songs) &&
  //     recentSongs[0].songs.length > 0
  //   )
  //     window.api.audioLibraryControls
  //       .getSongInfo(
  //         recentSongs[0].songs,
  //         undefined,
  //         undefined,
  //         noOfRecentandLovedSongCards + 5,
  //         true
  //       )
  //       .then(
  //         (res) =>
  //           Array.isArray(res) &&
  //           dispatch({
  //             type: 'RECENTLY_PLAYED_SONGS_DATA',
  //             data: res
  //           })
  //       )
  //       .catch((err) => console.error(err));
  // }, [noOfRecentandLovedSongCards]);

  // const fetchRecentSongArtistsData = useCallback(() => {
  //   if (content.recentlyPlayedSongs.length > 0) {
  //     const artistIds = [
  //       ...new Set(
  //         content.recentlyPlayedSongs
  //           .map((song) => (song.artists ? song.artists.map((artist) => artist.artistId) : []))
  //           .flat()
  //       )
  //     ];

  //     if (artistIds.length > 0)
  //       window.api.artistsData
  //         .getArtistData(artistIds, undefined, undefined, noOfRecentandLovedArtists)
  //         .then(
  //           (res) =>
  //             Array.isArray(res) &&
  //             dispatch({
  //               type: 'RECENT_SONGS_ARTISTS',
  //               data: res
  //             })
  //         )
  //         .catch((err) => console.error(err));
  //   }
  // }, [content.recentlyPlayedSongs, noOfRecentandLovedArtists]);

  // // ? Most loved songs are fetched after the user have made at least one favorite song from the library.
  // const fetchMostLovedSongs = useCallback(() => {
  //   window.api.playlistsData
  //     .getPlaylistData(['Favorites'])
  //     .then((res) => {
  //       if (Array.isArray(res) && res.length > 0) {
  //         return window.api.audioLibraryControls.getSongInfo(
  //           res[0].songs,
  //           'allTimeMostListened',
  //           undefined,
  //           noOfRecentandLovedSongCards + 5,
  //           true
  //         );
  //       }
  //       return undefined;
  //     })
  //     .then(
  //       (lovedSongs) =>
  //         Array.isArray(lovedSongs) &&
  //         lovedSongs.length > 0 &&
  //         dispatch({ type: 'MOST_LOVED_SONGS', data: lovedSongs })
  //     )
  //     .catch((err) => console.error(err));
  // }, [noOfRecentandLovedSongCards]);

  // const fetchMostLovedArtists = useCallback(() => {
  //   if (content.mostLovedSongs.length > 0) {
  //     const artistIds = [
  //       ...new Set(
  //         content.mostLovedSongs
  //           .map((song) => (song.artists ? song.artists.map((artist) => artist.artistId) : []))
  //           .flat()
  //       )
  //     ];
  //     window.api.artistsData
  //       .getArtistData(artistIds, undefined, undefined, noOfRecentandLovedArtists)
  //       .then(
  //         (res) =>
  //           Array.isArray(res) &&
  //           dispatch({
  //             type: 'MOST_LOVED_ARTISTS',
  //             data: res
  //           })
  //       )
  //       .catch((err) => console.error(err));
  //   }
  // }, [content.mostLovedSongs, noOfRecentandLovedArtists]);

  const addNewSongs = useCallback(() => {
    changePromptMenuData(
      true,
      <AddMusicFoldersPrompt
      // onSuccess={(songs) => {
      //   const relevantSongsData: AudioInfo[] = songs.map((song) => {
      //     return {
      //       title: song.title,
      //       songId: song.songId,
      //       artists: song.artists,
      //       duration: song.duration,
      //       palette: song.paletteData,
      //       path: song.path,
      //       artworkPaths: song.artworkPaths,
      //       addedDate: song.addedDate,
      //       isAFavorite: song.isAFavorite,
      //       isBlacklisted: song.isBlacklisted
      //     };
      //   });
      //   // dispatch({ type: 'SONGS_DATA', data: relevantSongsData });
      // }}
      // onFailure={() => dispatch({ type: 'SONGS_DATA', data: [null] })}
      />
    );
  }, [changePromptMenuData]);

  const importAppData = useCallback(
    (
      _: unknown,
      setIsDisabled: (state: boolean) => void,
      setIsPending: (state: boolean) => void
    ) => {
      setIsDisabled(true);
      setIsPending(true);

      return window.api.settingsHelpers
        .importAppData()
        .then((res) => {
          if (res) storage.setAllItems(res);
          return undefined;
        })
        .finally(() => {
          setIsDisabled(false);
          setIsPending(false);
        })
        .catch((err) => console.error(err));
    },
    []
  );

  const homePageContextMenus: ContextMenuItem[] = useMemo(
    () =>
      window.api.properties.isInDevelopment
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
                        This prompt is used to develop the prompt menu. Instead of clicking doing
                        something that will open a prompt and also result in consequences, this
                        approach is much better because nothing will change when opening this
                        prompt.
                      </>
                    }
                    showSendFeedbackBtn
                  />,
                  'error-alert-prompt'
                )
            },
            {
              label: 'Show Notification',
              iconName: 'notifications_active',
              handlerFunction: () => {
                const duration = Math.random() * 10000;
                addNewNotifications([
                  {
                    id: duration.toString(),
                    duration: 5 * 60 * 1000,
                    // duration,
                    content: `This is a notification with a number ${roundTo(Math.random(), 2)}`,
                    iconName: 'notifications_active',
                    type: 'WITH_PROGRESS_BAR'
                  }
                ]);
              }
            }
          ]
        : [],
    [changePromptMenuData, addNewNotifications]
  );

  return (
    <MainContainer
      className="home-page relative h-full! overflow-y-auto pl-0! [scrollbar-gutter:stable]"
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (homePageContextMenus.length > 0)
          updateContextMenuData(true, homePageContextMenus, e.pageX, e.pageY);
      }}
      ref={recentlyAddedSongsContainerRef}
    >
      <>
        <SecondaryContainer className="appear-from-bottom mt-4 h-fit max-h-full w-full pb-4 pl-8">
          <div className="title-container text-font-color-highlight dark:text-dark-font-color-highlight mt-1 mb-4 flex items-center justify-between text-2xl font-medium">
            {t('homePage.favoritesAndRecaps')}
          </div>
          <div className="flex gap-4">
            <NavLink
              to="/main-player/playlists/favorites"
              className="bg-background-color-2/70 hover:bg-background-color-2! dark:bg-dark-background-color-2/70 dark:hover:bg-dark-background-color-2! text-font-color dark:text-dark-font-color flex h-24 min-w-60 items-center gap-4 rounded-xl px-4 py-4"
            >
              <Img
                src={favoritesPlaylistCoverImage}
                className="aspect-square h-full w-auto rounded-lg"
              />
              <span className="text-xl">Favorites</span>
            </NavLink>
            <NavLink
              to="/main-player/playlists/history"
              className="bg-background-color-2/70 hover:bg-background-color-2! dark:bg-dark-background-color-2/70 dark:hover:bg-dark-background-color-2! text-font-color dark:text-dark-font-color flex h-24 min-w-60 items-center gap-4 rounded-xl px-4 py-4"
            >
              <Img
                src={historyPlaylistCoverImage}
                className="aspect-square h-full w-auto rounded-lg"
              />
              <span className="text-xl">History</span>
            </NavLink>
          </div>
        </SecondaryContainer>
        {recentlyAddedSongsContainerRef.current && (
          <>
            {latestSongs[0] !== null && (
              <RecentlyAddedSongs
                latestSongs={latestSongs}
                noOfVisibleSongs={noOfRecentlyAddedSongCards}
              />
            )}
            <RecentlyPlayedSongs
              recentlyPlayedSongs={recentlyPlayedSongs.slice(0, noOfRecentandLovedSongCards)}
              noOfVisibleSongs={noOfRecentandLovedSongCards}
            />
            <RecentlyPlayedArtists
              recentlyPlayedSongArtists={recentSongArtists}
              noOfVisibleArtists={noOfRecentandLovedArtists}
            />
            <MostLovedSongs
              mostLovedSongs={mostLovedSongs.slice(0, noOfRecentandLovedSongCards)}
              noOfVisibleSongs={noOfRecentandLovedSongCards}
            />
            <MostLovedArtists
              mostLovedArtists={mostLovedArtists}
              noOfVisibleArtists={noOfRecentandLovedArtists}
            />
          </>
        )}

        {latestSongs.length === 0 && (
          <div className="no-songs-container appear-from-bottom text-font-color-black dark:text-font-color-white flex h-full w-full flex-col items-center justify-center text-center text-xl">
            <span className="material-icons-round-outlined text-font-color-highlight dark:text-dark-font-color-highlight mb-4 text-6xl">
              brightness_empty
            </span>{' '}
            <div className="text-font-color-highlight dark:text-dark-font-color-highlight mb-2 text-2xl font-medium">
              {t('homePage.empty')}
            </div>
            <p className="text-sm">{t('homePage.emptyDescription')}</p>
            <div className="mt-4 flex items-center justify-between gap-4">
              <Button
                className="mr-0!"
                label={t('foldersPage.addFolder')}
                iconName="create_new_folder"
                iconClassName="material-icons-round-outlined"
                clickHandler={addNewSongs}
              />
              <Button
                className="mr-0!"
                label={t('settingsPage.importAppData')}
                iconName="publish"
                clickHandler={importAppData}
              />
            </div>
          </div>
        )}
        {/* {recentlyPlayedSongs.length === 0 && latestSongs.length === 0 && (
          <div className="no-songs-container text-font-color-dimmed dark:text-dark-font-color-dimmed flex h-full w-full flex-col items-center justify-center text-center text-xl">
            <Img src={DataFetchingImage} className="mb-8 w-48" alt={t('homePage.stayCalm')} />
            <span> {t('homePage.loading')}</span>
          </div>
        )} */}
        {latestSongs.length > 0 && latestSongs[0] !== null && recentlyPlayedSongs.length === 0 && (
          <div className="no-songs-container flex h-full w-full flex-col items-center justify-center text-center text-lg font-normal text-black/60 dark:text-white/60">
            <span className="material-icons-round-outlined mb-1 text-4xl">headphones</span>{' '}
            <p className="text-sm">{t('homePage.listenMoreToShowMetrics')}</p>
          </div>
        )}
      </>
    </MainContainer>
  );
}
