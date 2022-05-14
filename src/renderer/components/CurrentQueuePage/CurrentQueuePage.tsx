/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable promise/always-return */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable promise/catch-or-return */
import React, { useContext } from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { Song } from '../SongsPage/song';

export default () => {
  const { queue } = useContext(AppContext);
  const [queuedSongs, setQueuedSongs] = React.useState([] as AudioInfo[]);

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
        // res
        //   .map((result) => {
        //     for (let y = 0; y < queue.queue.length; y += 1) {
        //       if (queue.queue[y] === result.songId) return result;
        //     }
        //     // if (queue.queue.includes(result.songId)) return result;
        //     return undefined;
        //   })
        //   .filter((y) => y !== undefined) as AudioInfo[];
        setQueuedSongs(x);
      }
    });
  }, [queue.queue]);

  const queuedSongComponents = queuedSongs.map((queuedSong) => {
    return (
      <Song
        key={queuedSong.songId}
        title={queuedSong.title}
        songId={queuedSong.songId}
        artists={queuedSong.artists}
        artworkPath={queuedSong.artworkPath}
        duration={queuedSong.duration}
      />
    );
  });
  return (
    <div className="main-container songs-list-container current-queue-container">
      <div className="title-container">Currently Playing Queue</div>
      <div className="songs-container">{queuedSongComponents}</div>
    </div>
  );
};
