import React, { Suspense, useContext } from 'react';
import { AppContext } from 'renderer/contexts/AppContext';

const HomePage = React.lazy(() => import('./HomePage/HomePage'));
const ArtistPage = React.lazy(() => import('./ArtistPage/ArtistPage'));
const AlbumsPage = React.lazy(() => import('./AlbumsPage/AlbumsPage'));
const PlaylistsPage = React.lazy(() => import('./PlaylistsPage/PlaylistsPage'));
const SearchPage = React.lazy(() => import('./SearchPage/SearchPage'));
const SettingsPage = React.lazy(() => import('./SettingsPage/SettingsPage'));
const LyricsPage = React.lazy(() => import('./LyricsPage/LyricsPage'));
const SongInfoPage = React.lazy(() => import('./SongInfoPage/SongInfoPage'));
const ArtistInfoPage = React.lazy(
  () => import('./ArtistInfoPage/ArtistInfoPage')
);
const AlbumInfoPage = React.lazy(() => import('./AlbumInfoPage/AlbumInfoPage'));
const PlaylistsInfoPage = React.lazy(
  () => import('./PlaylistsInfoPage/PlaylistsInfoPage')
);
const CurrentQueuePage = React.lazy(
  () => import('./CurrentQueuePage/CurrentQueuePage')
);
const AllSearchResultsPage = React.lazy(
  () => import('./SearchPage/AllSearchResultsPage')
);
const GenresPage = React.lazy(() => import('./GenresPage/GenresPage'));
const GenreInfoPage = React.lazy(() => import('./GenreInfoPage/GenreInfoPage'));
const SongTagsEditingPage = React.lazy(
  () => import('./SongTagsEditingPage/SongTagsEditingPage')
);
const LyricsEditingPage = React.lazy(
  () => import('./LyricsEditingPage/LyricsEditingPage')
);
const SongsPage = React.lazy(() => import('./SongsPage/SongsPage'));
const ErrorBoundary = React.lazy(() => import('./ErrorBoundary'));
const MusicFoldersPage = React.lazy(
  () => import('./MusicFoldersPage/MusicFoldersPage')
);
const MusicFolderInfoPage = React.lazy(
  () => import('./MusicFolderInfoPage/MusicFolderInfoPage')
);

const Body = React.memo(() => {
  const { currentlyActivePage } = useContext(AppContext);
  const bodyRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (typeof currentlyActivePage.data?.scrollToId === 'string') {
      const { scrollToId } = currentlyActivePage.data;
      let retryCount = 0;

      const timeoutId = setInterval(() => {
        const element = document.querySelector(scrollToId as string);

        if (retryCount >= 3) {
          clearInterval(timeoutId);
          return console.warn(
            `Element with id ${scrollToId} didn't exist to scroll into view.`
          );
        }
        if (element && bodyRef.current?.contains(element)) {
          clearInterval(timeoutId);
          return element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
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
        <Suspense fallback={<div>Loading...</div>}>
          {currentlyActivePage.pageTitle === 'Songs' && <SongsPage />}
          {currentlyActivePage.pageTitle === 'Home' && <HomePage />}
          {currentlyActivePage.pageTitle === 'Artists' && <ArtistPage />}
          {currentlyActivePage.pageTitle === 'Albums' && <AlbumsPage />}
          {currentlyActivePage.pageTitle === 'Playlists' && <PlaylistsPage />}
          {currentlyActivePage.pageTitle === 'Folders' && <MusicFoldersPage />}
          {currentlyActivePage.pageTitle === 'Search' && <SearchPage />}
          {currentlyActivePage.pageTitle === 'Genres' && <GenresPage />}
          {currentlyActivePage.pageTitle === 'AllSearchResults' && (
            <AllSearchResultsPage />
          )}
          {currentlyActivePage.pageTitle === 'Settings' && <SettingsPage />}
          {currentlyActivePage.pageTitle === 'Lyrics' && <LyricsPage />}
          {currentlyActivePage.pageTitle === 'CurrentQueue' && (
            <CurrentQueuePage />
          )}
          {currentlyActivePage.pageTitle === 'SongInfo' && <SongInfoPage />}
          {currentlyActivePage.pageTitle === 'ArtistInfo' && <ArtistInfoPage />}
          {currentlyActivePage.pageTitle === 'AlbumInfo' &&
            currentlyActivePage.data !== '' && <AlbumInfoPage />}
          {currentlyActivePage.pageTitle === 'PlaylistInfo' &&
            currentlyActivePage.data !== '' && <PlaylistsInfoPage />}
          {currentlyActivePage.pageTitle === 'GenreInfo' && <GenreInfoPage />}
          {currentlyActivePage.pageTitle === 'MusicFolderInfo' &&
            currentlyActivePage.data !== '' && <MusicFolderInfoPage />}
          {currentlyActivePage.pageTitle === 'SongTagsEditor' && (
            <SongTagsEditingPage />
          )}
          {currentlyActivePage.pageTitle === 'LyricsEditor' && (
            <LyricsEditingPage />
          )}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
});

Body.displayName = 'Body';
export default Body;
