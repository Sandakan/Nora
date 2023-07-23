/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';

import Img from '../Img';
import Button from '../Button';

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
      changeCurrentActivePage('SongInfo', {
        songId,
      }),
    [changeCurrentActivePage],
  );

  const goToArtistInfoPage = React.useCallback(
    (artistName: string, artistId: string) =>
      changeCurrentActivePage('ArtistInfo', {
        artistName,
        artistId,
      }),
    [changeCurrentActivePage],
  );

  const goToAlbumInfoPage = React.useCallback(
    (albumId: string) =>
      changeCurrentActivePage('AlbumInfo', {
        albumId,
      }),
    [changeCurrentActivePage],
  );

  const goToGenreInfoPage = React.useCallback(
    (genreId: string) =>
      changeCurrentActivePage('GenreInfo', {
        genreId,
      }),
    [changeCurrentActivePage],
  );

  return (
    <div
      className={`result appear-from-bottom group most-relevant-${resultType.toLowerCase()} active mr-4 grid h-40 w-fit min-w-[20rem] max-w-md cursor-pointer grid-cols-[10rem_1fr] items-center rounded-lg bg-background-color-2 py-3 pl-3 pr-4 hover:bg-background-color-3 dark:bg-dark-background-color-2 dark:hover:bg-dark-background-color-3`}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        updateContextMenuData(true, contextMenuItems, e.pageX, e.pageY);
      }}
      onClick={() => {
        if (resultType === 'song') return goToSongInfoPage(id);
        if (resultType === 'artist') return goToArtistInfoPage(title, id);
        if (resultType === 'album') return goToAlbumInfoPage(id);
        if (resultType === 'genre') return goToGenreInfoPage(id);

        return undefined;
      }}
    >
      <div className="result-img-container relative mr-4 flex h-full w-fit items-center justify-center overflow-hidden">
        {resultType.toLowerCase() !== 'artist' && (
          <Button
            className="absolute z-10 !m-0 !rounded-none !border-0 !p-0 opacity-75 outline-1 outline-offset-1 transition-opacity hover:opacity-100 focus-visible:!outline group-hover:opacity-100"
            iconName="play_circle"
            iconClassName="!text-4xl !leading-none text-font-color-white"
            clickHandler={(e) => {
              e.stopPropagation();
              playSong(id);
            }}
          />
        )}
        <Img
          src={onlineArtworkPath}
          fallbackSrc={artworkPaths.artworkPath}
          alt="Most Relevant Result Cover"
          className={`max-h-full ${
            resultType === 'artist' ? 'rounded-full' : 'rounded-md'
          }`}
        />
      </div>
      <div className="result-info-container max-w-[50%] text-font-color-black group-hover:text-font-color-black dark:text-font-color-white dark:group-hover:text-font-color-black">
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
        <div className="result-type mt-3 w-fit -translate-x-1 overflow-hidden text-ellipsis whitespace-nowrap rounded-2xl bg-background-color-3 px-3 py-1 font-medium uppercase text-font-color-black group-hover:bg-background-color-1 group-hover:text-font-color-black dark:bg-dark-background-color-3 dark:text-font-color-black dark:group-hover:bg-dark-background-color-1 dark:group-hover:text-font-color-white">
          {resultType.toUpperCase()}
        </div>
      </div>
    </div>
  );
};
