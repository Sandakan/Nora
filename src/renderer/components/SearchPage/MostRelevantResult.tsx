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
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { AppContext } from 'renderer/contexts/AppContext';
import Img from '../Img';

export interface MostRelevantResultProp {
  resultType: 'artist' | 'song' | 'album' | 'playlist' | 'genre';
  title: string;
  id: string;
  infoType1?: string;
  infoType2?: string;
  artworkPaths: ArtworkPaths;
  onlineArtworkPath?: string;
  contextMenuItems: ContextMenuItem[];
}

export const MostRelevantResult = (props: MostRelevantResultProp) => {
  const { currentlyActivePage } = React.useContext(AppContext);
  const { playSong, updateContextMenuData, changeCurrentActivePage } =
    React.useContext(AppUpdateContext);

  return (
    <div
      className={`result appear-from-bottom group most-relevant-${props.resultType.toLowerCase()} active mr-4 flex h-40 w-fit min-w-[20rem] max-w-sm cursor-pointer items-center rounded-lg bg-background-color-2 py-3 pr-4 pl-3 hover:bg-background-color-3 dark:bg-dark-background-color-2 dark:hover:bg-dark-background-color-3`}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        updateContextMenuData(true, props.contextMenuItems, e.pageX, e.pageY);
      }}
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
      <div className="result-img-container relative mr-4 flex h-full w-fit items-center justify-center overflow-hidden">
        {props.resultType.toLowerCase() !== 'artist' && (
          <span
            title="Play Song"
            className="material-icons-round icon absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer text-4xl text-font-color-white text-opacity-0 group-hover:text-font-color-white group-hover:text-opacity-100 dark:group-hover:text-font-color-white"
            onClick={() => playSong(props.id)}
          >
            play_circle
          </span>
        )}
        <Img
          src={
            navigator.onLine && props.onlineArtworkPath
              ? props.onlineArtworkPath
              : props.artworkPaths.artworkPath
          }
          loading="lazy"
          alt="Most Relevant Result Cover"
          className={`max-h-full ${
            props.resultType === 'artist' ? 'rounded-full' : 'rounded-md'
          }`}
        />
      </div>
      <div className="result-info-container max-w-[60%] text-font-color-black group-hover:text-font-color-black dark:text-font-color-white dark:group-hover:text-font-color-black">
        <div className="title overflow-hidden text-ellipsis whitespace-nowrap text-2xl">
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
        <div className="result-type mt-3 w-fit -translate-x-1 overflow-hidden text-ellipsis whitespace-nowrap rounded-2xl bg-background-color-3 py-1 px-3 font-medium uppercase text-font-color-black group-hover:bg-background-color-1 group-hover:text-font-color-black dark:bg-dark-background-color-3 dark:text-font-color-black dark:group-hover:bg-dark-background-color-1 dark:group-hover:text-font-color-white">
          {props.resultType.toUpperCase()}
        </div>
      </div>
    </div>
  );
};
