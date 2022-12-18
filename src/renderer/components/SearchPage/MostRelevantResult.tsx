/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
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

  const {
    id,
    title,
    infoType1,
    infoType2,
    resultType,
    artworkPaths,
    contextMenuItems,
    onlineArtworkPath,
  } = props;

  const goToSongInfoPage = React.useCallback(
    (songId: string) =>
      currentlyActivePage.pageTitle === 'ArtistInfo' &&
      currentlyActivePage?.data?.songId === songId
        ? changeCurrentActivePage('Home')
        : changeCurrentActivePage('SongInfo', {
            songId,
          }),
    [
      changeCurrentActivePage,
      currentlyActivePage?.data?.songId,
      currentlyActivePage.pageTitle,
    ]
  );

  const goToArtistInfoPage = React.useCallback(
    (artistName: string) => {
      return currentlyActivePage.pageTitle === 'ArtistInfo' &&
        currentlyActivePage?.data?.artistName === artistName
        ? changeCurrentActivePage('Home')
        : changeCurrentActivePage('ArtistInfo', {
            artistName,
          });
    },
    [
      changeCurrentActivePage,
      currentlyActivePage?.data?.artistName,
      currentlyActivePage.pageTitle,
    ]
  );

  const goToGenreInfoPage = React.useCallback(
    (genreId: string) =>
      currentlyActivePage.pageTitle === 'GenreInfo' &&
      currentlyActivePage?.data?.genreId === genreId
        ? changeCurrentActivePage('Home')
        : changeCurrentActivePage('GenreInfo', {
            genreId,
          }),
    [
      changeCurrentActivePage,
      currentlyActivePage?.data?.genreId,
      currentlyActivePage.pageTitle,
    ]
  );

  return (
    <div
      className={`result appear-from-bottom group most-relevant-${resultType.toLowerCase()} active mr-4 flex h-40 w-fit min-w-[20rem] max-w-sm cursor-pointer items-center rounded-lg bg-background-color-2 py-3 pr-4 pl-3 hover:bg-background-color-3 dark:bg-dark-background-color-2 dark:hover:bg-dark-background-color-3`}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        updateContextMenuData(true, contextMenuItems, e.pageX, e.pageY);
      }}
      onClick={() => {
        if (resultType === 'song') return goToSongInfoPage(id);
        if (resultType === 'artist') return goToArtistInfoPage(title);
        if (resultType === 'genre') return goToGenreInfoPage(id);

        return undefined;
      }}
    >
      <div className="result-img-container relative mr-4 flex h-full w-fit items-center justify-center overflow-hidden">
        {resultType.toLowerCase() !== 'artist' && (
          <span
            title="Play Song"
            className="material-icons-round icon absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer text-4xl text-font-color-white text-opacity-0 group-hover:text-font-color-white group-hover:text-opacity-100 dark:group-hover:text-font-color-white"
            onClick={() => playSong(id)}
          >
            play_circle
          </span>
        )}
        <Img
          src={
            navigator.onLine && onlineArtworkPath
              ? onlineArtworkPath
              : artworkPaths.artworkPath
          }
          loading="lazy"
          alt="Most Relevant Result Cover"
          className={`max-h-full ${
            resultType === 'artist' ? 'rounded-full' : 'rounded-md'
          }`}
        />
      </div>
      <div className="result-info-container max-w-[60%] text-font-color-black group-hover:text-font-color-black dark:text-font-color-white dark:group-hover:text-font-color-black">
        <div className="title overflow-hidden text-ellipsis whitespace-nowrap text-2xl">
          {title}
        </div>
        {infoType1 && (
          <div className="info-type-1 overflow-hidden text-ellipsis whitespace-nowrap text-base">
            {infoType1}
          </div>
        )}
        {infoType2 && (
          <div className="info-type-2 overflow-hidden text-ellipsis whitespace-nowrap text-sm">
            {infoType2}
          </div>
        )}
        <div className="result-type mt-3 w-fit -translate-x-1 overflow-hidden text-ellipsis whitespace-nowrap rounded-2xl bg-background-color-3 py-1 px-3 font-medium uppercase text-font-color-black group-hover:bg-background-color-1 group-hover:text-font-color-black dark:bg-dark-background-color-3 dark:text-font-color-black dark:group-hover:bg-dark-background-color-1 dark:group-hover:text-font-color-white">
          {resultType.toUpperCase()}
        </div>
      </div>
    </div>
  );
};
