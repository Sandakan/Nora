/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-restricted-syntax */
/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
/* eslint-disable react/require-default-props */
/* eslint-disable react/destructuring-assignment */
import React, { useContext } from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { calculateTime } from 'renderer/utils/calculateTime';
import DefaultPlaylistCover from '../../../../assets/images/playlist_cover_default.png';
import { Song } from '../SongsPage/song';

export default () => {
  const { currentlyActivePage } = useContext(AppContext);
  const [playlistData, setPlaylistData] = React.useState({} as Playlist);
  const [playlistSongs, setPlaylistSongs] = React.useState([] as SongData[]);

  React.useEffect(() => {
    if (currentlyActivePage.data.playlistId) {
      window.api
        .getPlaylistData(currentlyActivePage.data.playlistId)
        .then((res) => {
          if (res && !Array.isArray(res)) setPlaylistData(res);
        });
    }
  }, [currentlyActivePage.data]);

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
  }, [currentlyActivePage.data, playlistData.songs]);

  const calculateTotalTime = () => {
    const val = calculateTime(
      playlistSongs.reduce((prev, current) => prev + current.duration, 0)
    );
    const duration = val.split(':');
    return `${
      Number(duration[0]) / 60 >= 1
        ? `${Math.floor(Number(duration[0]) / 60)} hour${
            Math.floor(Number(duration[0]) / 60) === 1 ? '' : 's'
          } `
        : ''
    }${Math.floor(Number(duration[0]) % 60)} minute${
      Math.floor(Number(duration[0]) % 60) === 1 ? '' : 's'
    } ${duration[1]} second${Number(duration[1]) === 1 ? '' : 's'}`;
  };

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
            {playlistSongs.length > 0 && (
              <div className="playlist-total-duration">
                {calculateTotalTime()}
              </div>
            )}
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
                  artworkPath={song.artworkPath}
                  path={song.path}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
