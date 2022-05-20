/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/require-default-props */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/self-closing-comp */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import DefaultArtistCover from '../../../../assets/images/song_cover_default.png';

interface ArtistProp {
  artistId: string;
  name: string;
  artworkPath?: string;
  songIds: string[];
}

export const Artist = (props: ArtistProp) => {
  const {
    currentlyActivePage,
    changeCurrentActivePage,
    updateContextMenuData,
    createQueue,
    queue,
    updateQueueData,
  } = React.useContext(AppContext);

  const showArtistInfoPage = () => {
    return currentlyActivePage.pageTitle === 'ArtistInfo' &&
      currentlyActivePage.data.artistName === props.name
      ? changeCurrentActivePage('Home')
      : changeCurrentActivePage('ArtistInfo', {
          artistName: props.name,
        });
  };
  const playArtistSongs = () =>
    createQueue(props.songIds, 'artist', props.artistId, true);
  return (
    <div
      className="artist"
      onContextMenu={(e) =>
        updateContextMenuData(
          true,
          [
            {
              label: 'Play all Songs',
              iconName: 'play_arrow',
              handlerFunction: playArtistSongs,
            },
            {
              label: 'Info',
              iconName: 'info',
              handlerFunction: showArtistInfoPage,
            },
            {
              label: 'Add to queue',
              iconName: 'queue',
              handlerFunction: () => {
                // const newQueue = queue.queue.filter(
                //   (songId) =>
                //     !(props.songs.map((song) => song.songId) || []).some(
                //       (id) => id === songId
                //     )
                // );
                queue.queue.push(...props.songIds);
                updateQueueData(undefined, queue.queue, false);
              },
            },
          ],
          e.pageX,
          e.pageY
        )
      }
    >
      <div className="artist-img-container">
        <img
          src={
            `otomusic://localFiles/${props.artworkPath}` || DefaultArtistCover
          }
          alt="Default song cover"
          onClick={showArtistInfoPage}
        />
      </div>
      <div className="artist-info-container">
        <div
          className="name-container"
          title={props.name === '' ? 'Unknown Artist' : props.name}
          onClick={showArtistInfoPage}
        >
          {props.name === '' ? 'Unknown Artist' : props.name}
        </div>
      </div>
    </div>
  );
};
