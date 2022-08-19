/* eslint-disable no-nested-ternary */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/require-default-props */
/* eslint-disable react/self-closing-comp */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import { AppContext, AppUpdateContext } from 'renderer/contexts/AppContext';

export interface MostRelevantResultProp {
  resultType: 'artist' | 'song' | 'album' | 'playlist' | 'genre';
  title: string;
  id: string;
  infoType1?: string;
  infoType2?: string;
  artworkPath?: string;
  onlineArtworkPath?: string;
  contextMenuItems: ContextMenuItem[];
}

export const MostRelevantResult = (props: MostRelevantResultProp) => {
  const { currentlyActivePage } = React.useContext(AppContext);
  const { playSong, updateContextMenuData, changeCurrentActivePage } =
    React.useContext(AppUpdateContext);

  return (
    <div
      className={`result group appear-from-bottom most-relevant-${props.resultType.toLowerCase()} active min-w-[20rem] w-fit max-w-sm h-40 flex items-center rounded-lg py-3 pr-4 pl-3 mr-4 bg-background-color-2 dark:bg-dark-background-color-2 hover:bg-background-color-3 dark:hover:bg-dark-background-color-3`}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        updateContextMenuData(true, props.contextMenuItems, e.pageX, e.pageY);
      }}
    >
      <div className="result-img-container h-full w-fit flex items-center justify-center overflow-hidden mr-4 relative">
        {props.resultType.toLowerCase() !== 'artist' && (
          <span
            title="Play Song"
            className="material-icons-round icon absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl cursor-pointer text-opacity-0 text-font-color-white group-hover:text-opacity-100 group-hover:text-font-color-white dark:group-hover:text-font-color-white"
            onClick={() => playSong(props.id)}
          >
            play_circle
          </span>
        )}
        <img
          src={
            navigator.onLine && props.onlineArtworkPath
              ? props.onlineArtworkPath
              : `otomusic://localFiles/${props.artworkPath}`
          }
          loading="lazy"
          alt="Most Relevant Result Cover"
          className={`max-h-full ${
            props.resultType === 'artist' ? 'rounded-full' : 'rounded-xl'
          }`}
        />
      </div>
      <div className="result-info-container max-w-[60%] text-font-color-black dark:text-font-color-white group-hover:text-font-color-black dark:group-hover:text-font-color-black">
        <div
          className="title overflow-hidden text-ellipsis whitespace-nowrap text-2xl"
          onClick={() => {
            props.resultType === 'artist'
              ? currentlyActivePage.pageTitle === 'ArtistInfo' &&
                currentlyActivePage.data.artistName === props.title
                ? changeCurrentActivePage('Home')
                : changeCurrentActivePage('ArtistInfo', {
                    artistName: props.title,
                  })
              : undefined;
          }}
        >
          {props.title}
        </div>
        {props.infoType1 && (
          <div className="info-type-1 overflow-hidden text-ellipsis whitespace-nowrap text-base">
            {props.infoType1}
          </div>
        )}
        {props.infoType2 && (
          <div className="info-type-2 overflow-hidden text-ellipsis whitespace-nowrap text-sm">
            {props.infoType2}
          </div>
        )}
        <div className="result-type font-medium overflow-hidden text-ellipsis whitespace-nowrap uppercase bg-background-color-3 dark:bg-dark-background-color-3 w-fit py-1 px-3 rounded-2xl mt-3 -translate-x-1 text-font-color-black dark:text-font-color-black group-hover:bg-background-color-1 dark:group-hover:bg-dark-background-color-1 group-hover:text-font-color-black dark:group-hover:text-font-color-white">
          {props.resultType.toUpperCase()}
        </div>
      </div>
    </div>
  );
};
