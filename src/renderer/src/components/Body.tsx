import { Suspense, lazy, memo, useEffect, useRef } from 'react';

import SuspenseLoader from './SuspenseLoader';
import ErrorBoundary from './ErrorBoundary';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store';

const HomePage = lazy(() => import('./HomePage/HomePage'));
const ArtistPage = lazy(() => import('./ArtistPage/ArtistPage'));
const AlbumsPage = lazy(() => import('./AlbumsPage/AlbumsPage'));
const PlaylistsPage = lazy(() => import('./PlaylistsPage/PlaylistsPage'));
const SearchPage = lazy(() => import('./SearchPage/SearchPage'));
const SettingsPage = lazy(() => import('./SettingsPage/SettingsPage'));
const LyricsPage = lazy(() => import('./LyricsPage/LyricsPage'));
const SongInfoPage = lazy(() => import('./SongInfoPage/SongInfoPage'));
const ArtistInfoPage = lazy(() => import('./ArtistInfoPage/ArtistInfoPage'));
const AlbumInfoPage = lazy(() => import('./AlbumInfoPage/AlbumInfoPage'));
const PlaylistsInfoPage = lazy(() => import('./PlaylistsInfoPage/PlaylistsInfoPage'));
const CurrentQueuePage = lazy(() => import('./CurrentQueuePage/CurrentQueuePage'));
const AllSearchResultsPage = lazy(() => import('./SearchPage/AllSearchResultsPage'));
const GenresPage = lazy(() => import('./GenresPage/GenresPage'));
const GenreInfoPage = lazy(() => import('./GenreInfoPage/GenreInfoPage'));
const SongTagsEditingPage = lazy(() => import('./SongTagsEditingPage/SongTagsEditingPage'));
const LyricsEditingPage = lazy(() => import('./LyricsEditingPage/LyricsEditingPage'));
const SongsPage = lazy(() => import('./SongsPage/SongsPage'));
const MusicFoldersPage = lazy(() => import('./MusicFoldersPage/MusicFoldersPage'));
const MusicFolderInfoPage = lazy(() => import('./MusicFolderInfoPage/MusicFolderInfoPage'));

const isPageDataEmpty = (pageData: PageData | undefined) =>
  !pageData || Object.keys(pageData).length === 0;

const Body = memo(() => {
  const currentlyActivePage = useStore(store, (state) => state.currentlyActivePage);

  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof currentlyActivePage.data?.scrollToId === 'string') {
      const { scrollToId } = currentlyActivePage.data;
      let retryCount = 0;

      const timeoutId = setInterval(() => {
        const element = document.querySelector(scrollToId as string);

        if (retryCount >= 3) {
          clearInterval(timeoutId);
          return console.warn(`Element with id ${scrollToId} didn't exist to scroll into view.`);
        }
        if (element && bodyRef.current?.contains(element)) {
          clearInterval(timeoutId);
          return element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
        retryCount += 1;
        return undefined;
      }, 250);

      return () => clearInterval(timeoutId);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentlyActivePage.data?.scrollToId]);

  return (
    <div
      className="body relative order-2 !h-full w-full overflow-hidden rounded-tl-lg lg:pl-14 [&>*]:overflow-x-hidden"
      ref={bodyRef}
    >
      <ErrorBoundary>
        <Suspense fallback={<SuspenseLoader />}>
          {currentlyActivePage.pageTitle === 'Songs' && <SongsPage />}
          {currentlyActivePage.pageTitle === 'Home' && <HomePage />}
          {currentlyActivePage.pageTitle === 'Artists' && <ArtistPage />}
          {currentlyActivePage.pageTitle === 'Albums' && <AlbumsPage />}
          {currentlyActivePage.pageTitle === 'Playlists' && <PlaylistsPage />}
          {currentlyActivePage.pageTitle === 'Folders' && <MusicFoldersPage />}
          {currentlyActivePage.pageTitle === 'Search' && <SearchPage />}
          {currentlyActivePage.pageTitle === 'Genres' && <GenresPage />}
          {currentlyActivePage.pageTitle === 'AllSearchResults' && <AllSearchResultsPage />}
          {currentlyActivePage.pageTitle === 'Settings' && <SettingsPage />}
          {currentlyActivePage.pageTitle === 'Lyrics' && <LyricsPage />}
          {currentlyActivePage.pageTitle === 'CurrentQueue' && <CurrentQueuePage />}
          {currentlyActivePage.pageTitle === 'SongInfo' && <SongInfoPage />}
          {currentlyActivePage.pageTitle === 'ArtistInfo' && <ArtistInfoPage />}
          {currentlyActivePage.pageTitle === 'AlbumInfo' &&
            !isPageDataEmpty(currentlyActivePage.data) && <AlbumInfoPage />}
          {currentlyActivePage.pageTitle === 'PlaylistInfo' &&
            !isPageDataEmpty(currentlyActivePage.data) && <PlaylistsInfoPage />}
          {currentlyActivePage.pageTitle === 'GenreInfo' && <GenreInfoPage />}
          {currentlyActivePage.pageTitle === 'MusicFolderInfo' &&
            !isPageDataEmpty(currentlyActivePage.data) && <MusicFolderInfoPage />}
          {currentlyActivePage.pageTitle === 'SongTagsEditor' && <SongTagsEditingPage />}
          {currentlyActivePage.pageTitle === 'LyricsEditor' && <LyricsEditingPage />}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
});

Body.displayName = 'Body';
export default Body;
