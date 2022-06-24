/* eslint-disable react/no-array-index-key */
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
import Button from '../Button';
// import NoSongsImage from '../../../../assets/images/Beach_Monochromatic.svg';
import { Song } from '../SongsPage/Song';

export default () => {
  const {
    currentlyActivePage,
    queue,
    updateQueueData,
    updateNotificationPanelData,
    createQueue,
  } = useContext(AppContext);
  const [playlistData, setPlaylistData] = React.useState({} as Playlist);
  const [playlistSongs, setPlaylistSongs] = React.useState([] as SongData[]);

  React.useEffect(() => {
    if (currentlyActivePage.data.playlistId) {
      window.api
        .getPlaylistData([currentlyActivePage.data.playlistId])
        .then((res) => {
          if (res && res.length > 0 && res[0]) setPlaylistData(res[0]);
        });
    }
  }, [currentlyActivePage.data]);

  React.useEffect(() => {
    if (playlistData.songs && playlistData.songs.length > 0) {
      window.api.getSongInfo(playlistData.songs).then((songsData) => {
        if (songsData && songsData.length > 0) setPlaylistSongs(songsData);
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
              alt="Playlist Cover"
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
            {playlistData.songs && playlistData.songs.length > 0 && (
              <div className="playlist-buttons">
                <Button
                  label="Play All"
                  iconName="play_arrow"
                  clickHandler={() =>
                    createQueue(playlistData.songs, 'songs', undefined, true)
                  }
                />
                <Button
                  label="Shuffle and Play"
                  iconName="shuffle"
                  clickHandler={() =>
                    createQueue(
                      playlistData.songs.sort(() => 0.5 - Math.random()),
                      'songs',
                      undefined,
                      true
                    )
                  }
                />
                <Button
                  label="Add to Queue"
                  iconName="add"
                  clickHandler={() => {
                    updateQueueData(
                      undefined,
                      [...queue.queue, ...playlistData.songs],
                      false
                    );
                    updateNotificationPanelData(
                      5000,
                      <span>
                        Added {playlistData.songs.length} song
                        {playlistData.songs.length === 1 ? '' : 's'} to the
                        queue.
                      </span>
                    );
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
      {playlistSongs.length > 0 && (
        <div className="songs-list-container">
          <div className="title-container">Songs</div>
          <div className="songs-container">
            {playlistSongs.map((song, index) => {
              return (
                <Song
                  key={index}
                  index={index}
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
        </div>
      )}
      {playlistSongs.length === 0 && (
        <div className="no-songs-container">
          {/* <img src={NoSongsImage} alt="" /> */}
          This playlist is empty.
        </div>
      )}
    </div>
  );
};
