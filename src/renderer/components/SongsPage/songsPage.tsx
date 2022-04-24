/* eslint-disable react/no-array-index-key */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/no-unused-prop-types */
/* eslint-disable no-else-return */
/* eslint-disable promise/catch-or-return */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import { Song } from './song';
import DefaultSongCover from '../../../../assets/images/song_cover_default.png';

interface SongsPageProp {
  playSong: (url: string) => void;
  currentSongData: AudioData;
  updateContextMenuData: (
    isVisible: boolean,
    menuItems: ContextMenuItem[],
    pageX?: number,
    pageY?: number
  ) => void;
  // queue: Queue;
  // updateQueueData: (currentSongIndex?: number, queue?: string[]) => void;
}

export const SongsPage = (props: SongsPageProp) => {
  const songsData: AudioInfo[] = [];
  const [songData, setSongData] = React.useState(songsData);
  const songs = songData.map((song) => {
    return (
      <Song
        key={song.songId}
        title={song.title}
        artworkPath={song.artworkPath || DefaultSongCover}
        path={song.path}
        duration={song.duration}
        songId={song.songId}
        artists={song.artists}
        playSong={props.playSong}
        currentSongData={props.currentSongData}
        updateContextMenuData={props.updateContextMenuData}
        // updateQueueData={props.updateQueueData}
        // queue={props.queue}
      />
    );
  });

  React.useEffect(() => {
    window.api.checkForSongs().then((audioData: AudioInfo[] | undefined) => {
      if (!audioData) return undefined;
      else {
        setSongData(audioData);
        return undefined;
      }
    });
  }, []);

  return (
    <div className="main-container songs-list-container">
      <div className="title-container">Songs</div>
      <div className="songs-container">{songs}</div>
    </div>
  );
};
