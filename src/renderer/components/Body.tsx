/* eslint-disable react/no-unused-prop-types */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable import/prefer-default-export */
import React, { useContext } from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import HomePage from './HomePage/HomePage';
import ArtistPage from './ArtistPage/ArtistPage';
import { AlbumsPage } from './AlbumsPage/AlbumsPage';
import { PlaylistsPage } from './PlaylistsPage/PlaylistsPage';
import SearchPage from './SearchPage/SearchPage';
import SettingsPage from './SettingsPage/SettingsPage';
import { LyricsPage } from './LyricsPage/LyricsPage';
import SongInfoPage from './SongInfoPage/SongInfoPage';
import ArtistInfoPage from './ArtistInfoPage/ArtistInfoPage';
import AlbumInfoPage from './AlbumInfoPage/AlbumInfoPage';
import PlaylistsInfoPage from './PlaylistsInfoPage/PlaylistsInfoPage';
import CurrentQueuePage from './CurrentQueuePage/CurrentQueuePage';
import AllSearchResultsPage from './SearchPage/AllSearchResultsPage';
import GenresPage from './GenresPage/GenresPage';
import GenreInfoPage from './GenreInfoPage/GenreInfoPage';
import SongTagsEditingPage from './SongTagsEditingPage/SongTagsEditingPage';
import { SongsPage } from './SongsPage/SongsPage';
import ErrorBoundary from './ErrorBoundary';
import MusicFoldersPage from './MusicFoldersPage/MusicFoldersPage';
import MusicFolderInfoPage from './MusicFolderInfoPage/MusicFolderInfoPage';

const Body = React.memo(() => {
  const { currentlyActivePage } = useContext(AppContext);
  const bodyRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (typeof currentlyActivePage.data?.scrollToId === 'string') {
      const { scrollToId } = currentlyActivePage.data;
      const element = document.querySelector(scrollToId as string);

      if (element && bodyRef.current?.contains(element))
        setTimeout(
          () =>
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            }),
          250
        );
      else
        console.warn(
          `Element with id ${scrollToId} didn't exist to scroll into view.`
        );
    }
  }, [currentlyActivePage.data?.scrollToId]);

  return (
    <div
      className="body relative order-2 h-full w-full overflow-hidden rounded-tl-lg lg:pl-14 [&>*]:overflow-x-hidden"
      ref={bodyRef}
    >
      <ErrorBoundary>
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
      </ErrorBoundary>
    </div>
  );
});

Body.displayName = 'Body';
export default Body;
