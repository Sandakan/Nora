/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unused-prop-types */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable import/prefer-default-export */
import { ReactElement } from 'react';
import { SongsPage } from './SongsPage/songsPage';
import { HomePage } from './HomePage/homePage';
import { ArtistPage } from './ArtistPage/ArtistPage';
import { AlbumsPage } from './AlbumsPage/AlbumsPage';
import { PlaylistsPage } from './PlaylistsPage/PlaylistsPage';
import { SearchPage } from './SearchPage/SearchPage';
import { SettingsPage } from './SettingsPage/SettingsPage';
import { LyricsPage } from './LyricsPage/LyricsPage';
import CurrentQueuePage from './CurrentQueuePage/CurrentQueuePage';
import SongInfoPage from './SongInfoPage/SongInfoPage';
import ArtistInfoPage from './ArtistInfoPage/ArtistInfoPage';
import AlbumInfoPage from './AlbumInfoPage/AlbumInfoPage';
import PlaylistsInfoPage from './PlaylistsInfoPage/PlaylistsInfoPage';

interface BodyProp {
  currentlyActivePage: { pageTitle: string; data?: any };
  currentSongData: AudioData;
  playSong: (songId: string) => void;
  changeCurrentActivePage: (pageTitle: string, data?: any) => void;
  changePromptMenuData: (
    isVisible: boolean,
    content: ReactElement<any, any>
  ) => void;
  updateDialogMenuData: (
    delay: number,
    content: ReactElement<any, any>
  ) => void;
  updateContextMenuData: (
    isVisible: boolean,
    menuItems: any[],
    pageX?: number,
    pageY?: number
  ) => void;
  // queue: Queue;
  // createQueue: (songData: AudioInfo[]) => void;
  // updateQueueData: (currentSongIndex?: number, queue?: string[]) => void;
}

export const Body = (props: BodyProp) => {
  return (
    <div className="body">
      {props.currentlyActivePage.pageTitle === 'Songs' && (
        <SongsPage
          playSong={props.playSong}
          currentSongData={props.currentSongData}
          updateContextMenuData={props.updateContextMenuData}
          changeCurrentActivePage={props.changeCurrentActivePage}
          currentlyActivePage={props.currentlyActivePage}
          // updateQueueData={props.updateQueueData}
          // queue={props.queue}
        />
      )}
      {props.currentlyActivePage.pageTitle === 'Home' && (
        <HomePage
          playSong={props.playSong}
          updateContextMenuData={props.updateContextMenuData}
          changeCurrentActivePage={props.changeCurrentActivePage}
          currentlyActivePage={props.currentlyActivePage}
          // updateQueueData={props.updateQueueData}
          // queue={props.queue}
        />
      )}
      {props.currentlyActivePage.pageTitle === 'Artists' && (
        <ArtistPage
          changeCurrentActivePage={props.changeCurrentActivePage}
          currentlyActivePage={props.currentlyActivePage}
        />
      )}
      {props.currentlyActivePage.pageTitle === 'Albums' && (
        <AlbumsPage
          changeCurrentActivePage={props.changeCurrentActivePage}
          currentlyActivePage={props.currentlyActivePage}
        />
      )}
      {props.currentlyActivePage.pageTitle === 'Playlists' && (
        <PlaylistsPage
          changePromptMenuData={props.changePromptMenuData}
          updateDialogMenuData={props.updateDialogMenuData}
          changeCurrentActivePage={props.changeCurrentActivePage}
          currentlyActivePage={props.currentlyActivePage}
        />
      )}
      {props.currentlyActivePage.pageTitle === 'Search' && (
        <SearchPage
          playSong={props.playSong}
          currentSongData={props.currentSongData}
          updateContextMenuData={props.updateContextMenuData}
          currentlyActivePage={props.currentlyActivePage}
          changeCurrentActivePage={props.changeCurrentActivePage}
        />
      )}
      {props.currentlyActivePage.pageTitle === 'Settings' && <SettingsPage />}
      {props.currentlyActivePage.pageTitle === 'Lyrics' && (
        <LyricsPage
          songTitle={props.currentSongData.title}
          songArtists={props.currentSongData.artists}
        />
      )}
      {/* {props.currentlyActivePage.pageTitle === 'CurrentQueue' && (
        <CurrentQueuePage
          queue={props.queue}
          currentSongData={props.currentSongData}
          playSong={props.playSong}
        />
      )} */}
      {props.currentlyActivePage.pageTitle === 'SongInfo' && (
        <SongInfoPage
          currentSongData={props.currentSongData}
          changeCurrentActivePage={props.changeCurrentActivePage}
          currentlyActivePage={props.currentlyActivePage}
        />
      )}
      {props.currentlyActivePage.pageTitle === 'ArtistInfo' && (
        <ArtistInfoPage
          data={props.currentlyActivePage.data}
          playSong={props.playSong}
          currentSongData={props.currentSongData}
          updateContextMenuData={props.updateContextMenuData}
          changeCurrentActivePage={props.changeCurrentActivePage}
          currentlyActivePage={props.currentlyActivePage}
        />
      )}
      {props.currentlyActivePage.pageTitle === 'AlbumInfo' &&
        props.currentlyActivePage.data !== '' && (
          <AlbumInfoPage
            data={props.currentlyActivePage.data}
            playSong={props.playSong}
            currentSongData={props.currentSongData}
            updateContextMenuData={props.updateContextMenuData}
            changeCurrentActivePage={props.changeCurrentActivePage}
            currentlyActivePage={props.currentlyActivePage}
          />
        )}
      {props.currentlyActivePage.pageTitle === 'PlaylistInfo' &&
        props.currentlyActivePage.data !== '' && (
          <PlaylistsInfoPage
            data={props.currentlyActivePage.data}
            playSong={props.playSong}
            currentSongData={props.currentSongData}
            updateContextMenuData={props.updateContextMenuData}
            changeCurrentActivePage={props.changeCurrentActivePage}
            currentlyActivePage={props.currentlyActivePage}
          />
        )}
    </div>
  );
};
