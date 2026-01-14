/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';

import Img from '../Img';
import Button from '../Button';
import { useNavigate } from '@tanstack/react-router';

export interface MostRelevantResultProp {
  resultType: 'artist' | 'song' | 'album' | 'playlist' | 'genre';
  title: string;
  id: number;
  infoType1?: string;
  infoType2?: string;
  artworkPaths: ArtworkPaths;
  onlineArtworkPath?: string;
  contextMenuItems: ContextMenuItem[];
}

export const MostRelevantResult = (props: MostRelevantResultProp) => {
  const { playSong, updateContextMenuData } = useContext(AppUpdateContext);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const {
    id,
    title,
    infoType1,
    infoType2,
    resultType,
    artworkPaths,
    contextMenuItems,
    onlineArtworkPath
  } = props;

  const goToSongInfoPage = useCallback(
    (songId: number) =>
      navigate({ to: '/main-player/songs/$songId', params: { songId: String(songId) } }),
    [navigate]
  );

  const goToArtistInfoPage = useCallback(
    (artistId: number) =>
      navigate({ to: '/main-player/artists/$artistId', params: { artistId: String(artistId) } }),
    [navigate]
  );

  const goToAlbumInfoPage = useCallback(
    (albumId: number) =>
      navigate({ to: '/main-player/albums/$albumId', params: { albumId: String(albumId) } }),
    [navigate]
  );

  const goToGenreInfoPage = useCallback(
    (genreId: number) =>
      navigate({ to: '/main-player/genres/$genreId', params: { genreId: String(genreId) } }),
    [navigate]
  );

  return (
    <div
      className={`result appear-from-bottom group most-relevant-${resultType.toLowerCase()} active bg-background-color-2 hover:bg-background-color-3 dark:bg-dark-background-color-2 dark:hover:bg-dark-background-color-3 mr-4 grid h-40 w-fit max-w-md min-w-[20rem] cursor-pointer grid-cols-[10rem_1fr] items-center rounded-lg py-3 pr-4 pl-3`}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        updateContextMenuData(true, contextMenuItems, e.pageX, e.pageY);
      }}
      onClick={() => {
        if (resultType === 'song') return goToSongInfoPage(id);
        if (resultType === 'artist') return goToArtistInfoPage(id);
        if (resultType === 'album') return goToAlbumInfoPage(id);
        if (resultType === 'genre') return goToGenreInfoPage(id);

        return undefined;
      }}
    >
      <div className="result-img-container relative mr-4 flex h-full w-fit items-center justify-center overflow-hidden">
        {resultType.toLowerCase() !== 'artist' && (
          <Button
            className="absolute z-10 m-0! rounded-none! border-0! p-0! opacity-75 outline-offset-1 transition-opacity group-hover:opacity-100 hover:opacity-100 focus-visible:outline!"
            iconName="play_circle"
            iconClassName="text-4xl! leading-none! text-font-color-white"
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
          className={`max-h-full ${resultType === 'artist' ? 'rounded-full' : 'rounded-md'}`}
        />
      </div>
      <div className="result-info-container text-font-color-black group-hover:text-font-color-black dark:text-font-color-white dark:group-hover:text-font-color-black max-w-[50%]">
        <div className="title overflow-hidden text-2xl text-ellipsis whitespace-nowrap">
          {title}
        </div>
        {infoType1 && (
          <div className="info-type-1 overflow-hidden text-base text-ellipsis whitespace-nowrap">
            {infoType1}
          </div>
        )}
        {infoType2 && (
          <div className="info-type-2 overflow-hidden text-sm text-ellipsis whitespace-nowrap">
            {infoType2}
          </div>
        )}
        <div className="result-type bg-background-color-3 text-font-color-black group-hover:bg-background-color-1 group-hover:text-font-color-black dark:bg-dark-background-color-3 dark:text-font-color-black dark:group-hover:bg-dark-background-color-1 dark:group-hover:text-font-color-white mt-3 w-fit -translate-x-1 overflow-hidden rounded-2xl px-3 py-1 font-medium text-ellipsis whitespace-nowrap uppercase">
          {t(`common.${resultType}_one`)}
        </div>
      </div>
    </div>
  );
};
