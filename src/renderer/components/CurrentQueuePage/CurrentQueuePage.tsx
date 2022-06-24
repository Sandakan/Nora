/* eslint-disable react/no-array-index-key */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable promise/always-return */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable promise/catch-or-return */
import React, { useContext } from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { Song } from '../SongsPage/Song';
import Button from '../Button';
import DefaultSongCover from '../../../../assets/images/song_cover_default.png';
import DefaultArtistCover from '../../../../assets/images/default_artist_cover.png';
import DefaultAlbumCover from '../../../../assets/images/album-cover-default.png';
import DefaultPlaylistCover from '../../../../assets/images/playlist_cover_default.png';
import NoSongsImage from '../../../../assets/images/Sun_Monochromatic.svg';
import { calculateTime } from '../../utils/calculateTime';

interface QueueInfo {
  artworkPath: string;
  onlineArtworkPath?: string;
  title: string;
}

export default () => {
  const {
    queue,
    updateQueueData,
    updateNotificationPanelData,
    currentSongData,
  } = useContext(AppContext);
  const [queuedSongs, setQueuedSongs] = React.useState([] as AudioInfo[]);
  const [queueInfo, setQueueInfo] = React.useState({
    artworkPath: DefaultSongCover,
    title: '',
  } as QueueInfo);

  React.useEffect(() => {
    window.api.getAllSongs().then((res) => {
      if (res) {
        const x = queue.queue
          .map((songId) => {
            return res.data.map((y) => {
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
          window.api.getArtistData([queue.queueId]).then((res) => {
            if (res && Array.isArray(res) && res[0]) {
              setQueueInfo((prevData) => {
                return {
                  ...prevData,
                  artworkPath: res[0].artworkPath
                    ? `otomusic://localFiles/${res[0].artworkPath}`
                    : DefaultArtistCover,
                  onlineArtworkPath: res[0].onlineArtworkPaths
                    ? res[0].onlineArtworkPaths.picture_medium
                    : undefined,
                  title: res[0].name,
                };
              });
            }
          });
        }
        if (queue.queueType === 'album') {
          window.api.getAlbumData([queue.queueId]).then((res) => {
            if (res && res.length > 0 && res[0]) {
              setQueueInfo((prevData) => {
                return {
                  ...prevData,
                  artworkPath: res[0].artworkPath
                    ? `otomusic://localFiles/${res[0].artworkPath}`
                    : DefaultAlbumCover,
                  title: res[0].title,
                };
              });
            }
          });
        }
        if (queue.queueType === 'playlist') {
          window.api.getPlaylistData([queue.queueId]).then((res) => {
            if (res && res.length > 0 && res[0]) {
              setQueueInfo((prevData) => {
                return {
                  ...prevData,
                  artworkPath: res[0].artworkPath
                    ? `otomusic://localFiles/${res[0].artworkPath}`
                    : DefaultPlaylistCover,
                  title: res[0].name,
                };
              });
            }
          });
        }
      }
    }
  }, [queue.queueId, queue.queueType]);

  React.useLayoutEffect(() => {
    setTimeout(() => {
      const currentlyPlaying = document.querySelector(
        `.current-queue-container .songs-container .${currentSongData.songId}`
      );
      if (currentlyPlaying) {
        currentlyPlaying.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center',
        });
      }
    }, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const queuedSongComponents = queuedSongs.map((queuedSong, index) => {
    return (
      <Song
        key={index}
        title={queuedSong.title}
        songId={queuedSong.songId}
        artists={queuedSong.artists}
        artworkPath={queuedSong.artworkPath}
        duration={queuedSong.duration}
        path={queuedSong.path}
        additionalContextMenuItems={[
          {
            label: 'Remove from Queue',
            iconName: 'remove_circle_outline',
            handlerFunction: () =>
              updateQueueData(
                undefined,
                queue.queue.filter((songId) => songId !== queuedSong.songId)
              ),
          },
        ]}
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
      {queue.queue.length > 0 && (
        <div className="queue-info-container">
          <div className="cover-img-container">
            <img
              className={
                queue.queueType === 'artist'
                  ? 'artist-img'
                  : `${queue.queueType}-img`
              }
              src={
                queue.queueType === 'artist' &&
                navigator.onLine &&
                queueInfo.onlineArtworkPath
                  ? queueInfo.onlineArtworkPath
                  : queueInfo.artworkPath
              }
              alt="Current Playing Queue Cover"
            />
          </div>
          <div className="queue-info">
            <div className="queue-title">{queueInfo.title}</div>
            <div className="queue-no-of-songs">{`${queuedSongComponents.length} songs`}</div>
            <div className="queue-total-duration">{calculateTotalTime()}</div>
            <div className="queue-buttons">
              <Button
                label="Shuffle All"
                className="shuffle-all-button"
                iconName="shuffle"
                clickHandler={() => {
                  updateQueueData(
                    undefined,
                    queue.queue.sort(() => 0.5 - Math.random())
                  );
                  updateNotificationPanelData(
                    5000,
                    <span>Queue shuffled successfully.</span>,
                    <span className="material-icons-round icon">shuffle</span>
                  );
                }}
              />
              <Button
                label="Clear Queue"
                className="clear-queue-button"
                iconName="clear"
                clickHandler={() => {
                  updateQueueData(undefined, []);
                  updateNotificationPanelData(
                    5000,
                    <span>Queue cleared.</span>,
                    <span className="material-icons-round icon">check</span>
                  );
                }}
              />
            </div>
          </div>
        </div>
      )}
      {queuedSongs.length > 0 && (
        <div className="songs-container">{queuedSongComponents}</div>
      )}
      {queuedSongs.length === 0 && (
        <div className="no-songs-container">
          <img src={NoSongsImage} alt="" /> Queue is empty.
        </div>
      )}
    </div>
  );
};
