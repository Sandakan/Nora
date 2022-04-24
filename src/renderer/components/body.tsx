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

interface BodyProp {
  currentlyActivePage: string;
  currentSongData: AudioData;
  playSong: (songId: string) => void;
  changeCurrentActivePage: (pageTitle: string) => void;
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
      {props.currentlyActivePage === 'Songs' && (
        <SongsPage
          playSong={props.playSong}
          currentSongData={props.currentSongData}
          updateContextMenuData={props.updateContextMenuData}
          // updateQueueData={props.updateQueueData}
          // queue={props.queue}
        />
      )}
      {props.currentlyActivePage === 'Home' && (
        <HomePage
          playSong={props.playSong}
          updateContextMenuData={props.updateContextMenuData}
          // updateQueueData={props.updateQueueData}
          // queue={props.queue}
        />
      )}
      {props.currentlyActivePage === 'Artists' && <ArtistPage />}
      {props.currentlyActivePage === 'Albums' && <AlbumsPage />}
      {props.currentlyActivePage === 'Playlists' && (
        <PlaylistsPage
          changePromptMenuData={props.changePromptMenuData}
          updateDialogMenuData={props.updateDialogMenuData}
        />
      )}
      {props.currentlyActivePage === 'Search' && (
        <SearchPage
          playSong={props.playSong}
          currentSongData={props.currentSongData}
        />
      )}
      {props.currentlyActivePage === 'Settings' && <SettingsPage />}
      {props.currentlyActivePage === 'Lyrics' && (
        <LyricsPage
          songTitle={props.currentSongData.title}
          songArtists={props.currentSongData.artists}
        />
      )}
      {/* {props.currentlyActivePage === 'CurrentQueue' && (
        <CurrentQueuePage
          queue={props.queue}
          currentSongData={props.currentSongData}
          playSong={props.playSong}
        />
      )} */}
      {props.currentlyActivePage === 'SongInfo' && (
        <SongInfoPage currentSongData={props.currentSongData} />
      )}
    </div>
  );
};
