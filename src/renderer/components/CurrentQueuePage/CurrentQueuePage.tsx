/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable promise/always-return */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable promise/catch-or-return */
import React, { useContext } from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { Song } from '../SongsPage/song';
import DefaultSongCover from '../../../../assets/images/song_cover_default.png';
import DefaultArtistCover from '../../../../assets/images/default_artist_cover.png';
import DefaultAlbumCover from '../../../../assets/images/album-cover-default.png';
import DefaultPlaylistCover from '../../../../assets/images/playlist_cover_default.png';
import { calculateTime } from '../../utils/calculateTime';

interface QueueInfo {
  artworkPath: string;
  title: string;
}

export default () => {
  const { queue } = useContext(AppContext);
  const [queuedSongs, setQueuedSongs] = React.useState([] as AudioInfo[]);
  const [queueInfo, setQueueInfo] = React.useState({
    artworkPath: DefaultSongCover,
    title: '',
  } as QueueInfo);

  React.useEffect(() => {
    window.api.checkForSongs().then((res) => {
      if (res) {
        const x = queue.queue
          .map((songId) => {
            return res.map((y) => {
              if (songId === y.songId) return y;
              return undefined;
            });
          })
          .flat()
          .filter((y) => y !== undefined) as AudioInfo[];
        setQueuedSongs(x);
      }
    });
  }, [queue.queue]);

  React.useEffect(() => {
    if (queue.queueType) {
      if (queue.queueType === 'songs') {
        setQueueInfo((prevData) => {
          return {
            ...prevData,
            artworkPath: DefaultSongCover,
            title: 'All Songs',
          };
        });
      }
      if (queue.queueId) {
        if (queue.queueType === 'artist') {
          window.api.getArtistData(queue.queueId).then((res) => {
            if (res && !Array.isArray(res)) {
              setQueueInfo((prevData) => {
                return {
                  ...prevData,
                  artworkPath: res.artworkPath || DefaultArtistCover,
                  title: res.name,
                };
              });
            }
          });
        }
        if (queue.queueType === 'album') {
          window.api.getAlbumData(queue.queueId).then((res) => {
            if (res && !Array.isArray(res)) {
              setQueueInfo((prevData) => {
                return {
                  ...prevData,
                  artworkPath: res.artworkPath || DefaultAlbumCover,
                  title: res.title,
                };
              });
            }
          });
        }
        if (queue.queueType === 'playlist') {
          window.api.getPlaylistData(queue.queueId).then((res) => {
            if (res && !Array.isArray(res)) {
              setQueueInfo((prevData) => {
                return {
                  ...prevData,
                  artworkPath: res.artworkPath || DefaultPlaylistCover,
                  title: res.name,
                };
              });
            }
          });
        }
      }
    }
  }, [queue.queueId, queue.queueType]);

  const queuedSongComponents = queuedSongs.map((queuedSong) => {
    return (
      <Song
        key={queuedSong.songId}
        title={queuedSong.title}
        songId={queuedSong.songId}
        artists={queuedSong.artists}
        artworkPath={queuedSong.artworkPath}
        duration={queuedSong.duration}
        path={queuedSong.path}
      />
    );
  });

  const calculateTotalTime = () => {
    const val = calculateTime(
      queuedSongs.reduce((prev, current) => prev + current.duration, 0)
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
    <div className="main-container songs-list-container current-queue-container">
      <div className="title-container">Currently Playing Queue</div>
      <div className="queue-info-container">
        <div className="cover-img-container">
          <img
            className={
              queue.queueType === 'artist'
                ? 'artist-img'
                : `${queue.queueType}-img`
            }
            src={`otomusic://localFiles/${queueInfo.artworkPath}`}
            alt="Current Playing Queue Cover"
          />
        </div>
        <div className="queue-info">
          <div className="queue-title">{queueInfo.title}</div>
          <div className="queue-no-of-songs">{`${queuedSongComponents.length} songs`}</div>
          <div className="queue-total-duration">{calculateTotalTime()}</div>
        </div>
      </div>
      <div className="songs-container">{queuedSongComponents}</div>
    </div>
  );
};
