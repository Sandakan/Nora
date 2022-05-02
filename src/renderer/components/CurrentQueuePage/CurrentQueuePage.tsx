/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable promise/always-return */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable promise/catch-or-return */
import React from 'react';
import { Song } from '../SongsPage/song';

interface CurrentQueuePageProp {
  queue: Queue;
  playSong: (songId: string) => void;
  currentSongData: AudioData;
  updateContextMenuData: (
    isVisible: boolean,
    menuItems: any[],
    pageX?: number,
    pageY?: number
  ) => void;
  currentlyActivePage: { pageTitle: string; data?: any };
  changeCurrentActivePage: (pageTitle: string, data?: any) => void;
}

export default (props: CurrentQueuePageProp) => {
  const [queuedSongs, setQueuedSongs] = React.useState([] as AudioInfo[]);
  React.useEffect(() => {
    window.api.checkForSongs().then((res) => {
      if (res) {
        const x = res
          .map((result) => {
            if (props.queue.queue.includes(result.songId)) return result;
            return undefined;
          })
          .filter((y) => y !== undefined) as AudioInfo[];
        setQueuedSongs(x);
      }
    });
  }, [props.queue.queue]);
  const queuedSongComponents = queuedSongs.map((queuedSong) => {
    return (
      <Song
        key={queuedSong.songId}
        title={queuedSong.title}
        songId={queuedSong.songId}
        artists={queuedSong.artists}
        artworkPath={queuedSong.artworkPath}
        duration={queuedSong.duration}
        playSong={props.playSong}
        currentSongData={props.currentSongData}
        updateContextMenuData={props.updateContextMenuData}
        changeCurrentActivePage={props.changeCurrentActivePage}
        currentlyActivePage={props.currentlyActivePage}
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
