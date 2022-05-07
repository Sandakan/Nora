/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-restricted-syntax */
/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
/* eslint-disable react/require-default-props */
/* eslint-disable react/destructuring-assignment */
import React from 'react';
import DefaultPlaylistCover from '../../../../assets/images/playlist_cover_default.png';
import { Song } from '../SongsPage/song';

interface PlaylistInfoPageProp {
  data: {
    playlistId: string;
  };
  currentlyActivePage: { pageTitle: string; data?: any };
  changeCurrentActivePage: (pageTitle: string, data?: any) => void;
  playSong: (songId: string) => void;
  currentSongData: AudioData;
  updateContextMenuData: (
    isVisible: boolean,
    menuItems: any[],
    pageX?: number,
    pageY?: number
  ) => void;
}

export default (props: PlaylistInfoPageProp) => {
  const [playlistData, setPlaylistData] = React.useState({} as Playlist);
  const [playlistSongs, setPlaylistSongs] = React.useState([] as SongData[]);

  React.useEffect(() => {
    if (props.data.playlistId) {
      window.api.getPlaylistData(props.data.playlistId).then((res) => {
        if (res && !Array.isArray(res)) setPlaylistData(res);
      });
    }
  }, [props.data]);

  React.useEffect(() => {
    if (playlistData.songs && playlistData.songs.length > 0) {
      const songsData: Promise<SongData | undefined>[] = [];
      playlistData.songs.forEach((songId) => {
        songsData.push(window.api.getSongInfo(songId));
      });
      Promise.all(songsData).then((res) => {
        const y = res.filter((result) => result !== undefined) as SongData[];
        setPlaylistSongs(y);
      });
    }
  }, [props.data, playlistData.songs]);

  return (
    <div className="main-container playlist-info-page-container">
      {Object.keys(playlistData).length > 0 && (
        <div className="playlist-img-and-info-container">
          <div className="playlist-cover-container">
            <img
              src={`otomusic://localFiles/${
                playlistData.artworkPath || DefaultPlaylistCover
              }`}
              alt=""
            />
          </div>
          <div className="playlist-info-container">
            <div className="playlist-name">{playlistData.name}</div>
            <div className="playlist-no-of-songs">
              {`${playlistData.songs.length} song${
                playlistData.songs.length === 1 ? '' : 's'
              }`}
            </div>
            <div className="playlist-created-date">
              {`Created on ${new Date(playlistData.createdDate).toUTCString()}`}
            </div>
          </div>
        </div>
      )}
      <div className="songs-list-container">
        <div className="title-container">Songs</div>
        {playlistSongs.length > 0 && (
          <div className="songs-container">
            {playlistSongs.map((song) => {
              return (
                <Song
                  key={song.songId}
                  title={song.title}
                  artists={song.artists}
                  duration={song.duration}
                  songId={song.songId}
                  changeCurrentActivePage={props.changeCurrentActivePage}
                  currentlyActivePage={props.currentlyActivePage}
                  artworkPath={song.artworkPath}
                  currentSongData={props.currentSongData}
                  playSong={props.playSong}
                  updateContextMenuData={props.updateContextMenuData}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
