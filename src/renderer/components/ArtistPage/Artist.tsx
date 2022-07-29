/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/require-default-props */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/self-closing-comp */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import { AppContext, AppUpdateContext } from 'renderer/contexts/AppContext';
import DefaultArtistCover from '../../../../assets/images/song_cover_default.png';

interface ArtistProp {
  className?: string;
  artistId: string;
  name: string;
  artworkPath?: string;
  songIds: string[];
  onlineArtworkPaths?: {
    picture_small: string;
    picture_medium: string;
  };
}

export const Artist = (props: ArtistProp) => {
  const { currentlyActivePage, queue } = React.useContext(AppContext);
  const {
    changeCurrentActivePage,
    updateContextMenuData,
    createQueue,
    updateQueueData,
    updateNotificationPanelData,
  } = React.useContext(AppUpdateContext);

  const showArtistInfoPage = () => {
    return currentlyActivePage.pageTitle === 'ArtistInfo' &&
      currentlyActivePage.data.artistName === props.name
      ? changeCurrentActivePage('Home')
      : changeCurrentActivePage('ArtistInfo', {
          artistName: props.name,
        });
  };
  const playArtistSongs = () =>
    createQueue(props.songIds, 'artist', false, props.artistId, true);

  const artistContextMenus: ContextMenuItem[] = [
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
        updateQueueData(
          undefined,
          [...queue.queue, ...props.songIds],
          false,
          false
        );
        updateNotificationPanelData(
          5000,
          <span>
            Added {props.songIds.length} song
            {props.songIds.length === 1 ? '' : 's'} to the queue.
          </span>
        );
      },
    },
  ];
  return (
    <div
      className={`artist appear-from-bottom w-40 h-40 overflow-hidden flex flex-col justify-between mr-6 rounded-lg cursor-pointer ${props.className}`}
      onContextMenu={(e) => {
        e.stopPropagation();
        updateContextMenuData(true, artistContextMenus, e.pageX, e.pageY);
      }}
    >
      <div className="artist-img-container h-[75%] flex items-center justify-center">
        <img
          src={
            navigator.onLine && props.onlineArtworkPaths
              ? props.onlineArtworkPaths.picture_medium
              : `otomusic://localFiles/${props.artworkPath}` ||
                DefaultArtistCover
          }
          alt="Default song cover"
          className="h-full aspect-square object-cover shadow-xl rounded-full"
          onClick={showArtistInfoPage}
        />
      </div>
      <div className="artist-info-container max-h-1/5">
        <div
          className="name-container text-center text-xl text-text-font-color-black dark:text-font-color-white hover:underline w-full overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer"
          title={props.name === '' ? 'Unknown Artist' : props.name}
          onClick={showArtistInfoPage}
        >
          {props.name === '' ? 'Unknown Artist' : props.name}
        </div>
      </div>
    </div>
  );
};
