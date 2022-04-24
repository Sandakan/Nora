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
import { SongCard } from '../SongsPage/songCard';
import DefaultSongCover from '../../../../assets/images/song_cover_default.png';
import NoSongsImage from '../../../../assets/images/empty-folder.png';

interface HomePageProp {
  playSong: (songId: string) => void;
  updateContextMenuData: (
    isVisible: boolean,
    menuItems: any[],
    pageX?: number,
    pageY?: number
  ) => void;
  // updateQueueData: (currentSongIndex?: number, queue?: string[]) => void;
  // queue: Queue;
}

export const HomePage = (props: HomePageProp) => {
  const songsData: SongData[] = [];
  const recentPlayedSongs: SongData[] = [];
  const [songData, setSongData] = React.useState(songsData);
  const [recentlyPlayedSongsData, setRecentlyPlayedSongsData] =
    React.useState(recentPlayedSongs);

  React.useEffect(() => {
    window.api.checkForSongs().then((audioData) => {
      if (!audioData) return undefined;
      else {
        setSongData(audioData);
        return undefined;
      }
    });
  }, []);
  React.useEffect(() => {
    window.api.getUserData().then((res) => {
      if (!res) return undefined;
      setRecentlyPlayedSongsData(res.recentlyPlayedSongs);
      return undefined;
    });
  }, []);

  const addNewSongs = () => {
    window.api.addMusicFolder().then((songs) => {
      setSongData(songs);
    });
  };

  const newlyAddedSongs = songData
    .sort((a, b) =>
      new Date(a.modifiedDate).getTime() < new Date(b.modifiedDate).getTime()
        ? 1
        : -1
    )
    .map((song, index) => {
      if (index < 3) {
        return (
          <SongCard
            key={song.songId}
            title={song.title}
            artworkPath={song.artworkPath || DefaultSongCover}
            path={song.path}
            duration={song.duration}
            songId={song.songId}
            artists={song.artists}
            palette={song.palette}
            playSong={props.playSong}
            updateContextMenuData={props.updateContextMenuData}
          />
        );
      } else return undefined;
    })
    .filter((comp) => comp !== undefined);

  const recentlyPlayedSongs = recentlyPlayedSongsData
    .map((song, index) => {
      if (index < 3) {
        return (
          <SongCard
            key={song.songId}
            title={song.title}
            artworkPath={song.artworkPath || DefaultSongCover}
            path={song.path}
            duration={song.duration}
            songId={song.songId}
            artists={song.artists}
            palette={song.palette}
            playSong={props.playSong}
            updateContextMenuData={props.updateContextMenuData}
          />
        );
      } else return undefined;
    })
    .filter((comp) => comp !== undefined);

  return (
    <div className="main-container home-page">
      {songData.length > 0 && (
        <div className="main-container recently-added-songs-container">
          <div className="title-container">Recently Added Songs</div>
          <div className="songs-container">{newlyAddedSongs}</div>
        </div>
      )}
      {recentlyPlayedSongs.length > 0 && (
        <div className="main-container recently-played-songs-container">
          <div className="title-container">Recently Played Songs</div>
          <div className="songs-container">{recentlyPlayedSongs}</div>
        </div>
      )}
      {recentlyPlayedSongs.length === 0 && songData.length === 0 && (
        <div className="no-songs-container">
          <img src={NoSongsImage} alt="" />
          <span>We couldn't find any songs in your system.</span>
          <button type="button" id="add-new-song-folder" onClick={addNewSongs}>
            <i className="fa-solid fa-plus"></i> Add Folder
          </button>
        </div>
      )}
    </div>
  );
};
