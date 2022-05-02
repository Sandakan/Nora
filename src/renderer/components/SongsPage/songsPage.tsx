/* eslint-disable no-console */
/* eslint-disable promise/always-return */
/* eslint-disable consistent-return */
/* eslint-disable no-nested-ternary */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-array-index-key */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/no-unused-prop-types */
/* eslint-disable no-else-return */
/* eslint-disable promise/catch-or-return */
/* eslint-disable import/prefer-default-export */
import React from 'react';
// import { logger } from 'main/logger';
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
  currentlyActivePage: { pageTitle: string; data?: any };
  changeCurrentActivePage: (pageTitle: string, data?: any) => void;
  // queue: Queue;
  // updateQueueData: (currentSongIndex?: number, queue?: string[]) => void;
}

export const SongsPage = (props: SongsPageProp) => {
  const songsData: AudioInfo[] = [];
  const [songData, setSongData] = React.useState(songsData);
  const [sortingOrder, setSortingOrder] = React.useState(
    'aToZ' as SongsPageSortTypes
  );

  React.useEffect(() => {
    window.api
      .checkForSongs()
      .then((audioInfoArray) => {
        if (audioInfoArray) return setSongData(audioInfoArray);
      })
      .catch((err) => console.log(err));
  }, []);

  React.useEffect(() => {
    if (songData && songData.length > 0) {
      let sortedSongData: AudioInfo[];
      if (sortingOrder === 'aToZ')
        sortedSongData = songData.sort((a, b) =>
          a.title.replace(/\W/gi, '') > b.title.replace(/\W/gi, '')
            ? 1
            : a.title.replace(/\W/gi, '') < b.title.replace(/\W/gi, '')
            ? -1
            : 0
        );
      else if (sortingOrder === 'artistName')
        sortedSongData = songData.sort((a, b) =>
          a.artists.join(',') > b.artists.join(',')
            ? 1
            : a.artists.join(',') < b.artists.join(',')
            ? -1
            : 0
        );
      else if (sortingOrder === 'dateAdded')
        sortedSongData = songData.sort((a, b) => {
          if (a.modifiedDate && b.modifiedDate) {
            return new Date(a.modifiedDate).getTime() <
              new Date(b.modifiedDate).getTime()
              ? 1
              : -1;
          }
          return 0;
        });
      else sortedSongData = songData;
      setSongData(sortedSongData);
    }
  }, [songData, sortingOrder]);

  const songs = songData.map((song) => {
    return (
      <Song
        key={song.songId}
        title={song.title}
        artworkPath={song.artworkPath || DefaultSongCover}
        duration={song.duration}
        songId={song.songId}
        artists={song.artists}
        playSong={props.playSong}
        currentSongData={props.currentSongData}
        updateContextMenuData={props.updateContextMenuData}
        changeCurrentActivePage={props.changeCurrentActivePage}
        currentlyActivePage={props.currentlyActivePage}
        // updateQueueData={props.updateQueueData}
        // queue={props.queue}
      />
    );
  });

  return (
    <div className="main-container songs-list-container">
      <div className="title-container">
        Songs
        <select
          name="sortingOrderDropdown"
          id="sortingOrderDropdown"
          value={sortingOrder}
          onChange={(e) =>
            setSortingOrder(e.currentTarget.value as SongsPageSortTypes)
          }
        >
          <option value="aToZ">A to Z</option>
          <option value="dateAdded">Date added</option>
          <option value="artistName">Artist</option>
        </select>
      </div>
      <div className="songs-container">{songs}</div>
    </div>
  );
};
