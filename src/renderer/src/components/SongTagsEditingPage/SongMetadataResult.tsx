import { lazy, useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import isLyricsSynced from '../../../../common/isLyricsSynced';

import Button from '../Button';
import Img from '../Img';

import DefaultSongImage from '../../assets/images/webp/song_cover_default.webp';
import {
  manageArtworks,
  manageAlbumData,
  manageArtistsData,
  manageGenresData
} from '../../utils/manageMetadataResults';

const CustomizeSelectedMetadataPrompt = lazy(() => import('./CustomizeSelectedMetadataPrompt'));

interface SongMetadataResultProp {
  title: string;
  artists: string[];
  genres?: string[];
  album?: string;
  releasedYear?: number;
  lyrics?: string;
  artworkPaths?: string[];
  updateSongInfo: (callback: (prevData: SongTags) => SongTags) => void;
}

function SongMetadataResult(props: SongMetadataResultProp) {
  const { changePromptMenuData } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const { title, artists, genres, artworkPaths, album, lyrics, releasedYear, updateSongInfo } =
    props;

  const addToMetadata = useCallback(async () => {
    const albumData = album
      ? await window.api.albumsData.getAlbumData([album]).then((res) => res.data)
      : [];
    const artistData = await window.api.artistsData.getArtistData(artists).then((res) => res.data);
    const genreData = genres
      ? await window.api.genresData.getGenresData(genres).then((res) => res.data)
      : [];

    updateSongInfo((prevData): SongTags => {
      changePromptMenuData(false, undefined, '');

      const artworkPath = manageArtworks(prevData, artworkPaths);
      const isLyricsSynchronised = isLyricsSynced(lyrics || '');

      return {
        ...prevData,
        title: title || prevData.title,
        releasedYear: releasedYear || prevData.releasedYear,
        synchronizedLyrics: lyrics && isLyricsSynchronised ? lyrics : prevData.synchronizedLyrics,
        unsynchronizedLyrics:
          lyrics && !isLyricsSynchronised ? lyrics : prevData.unsynchronizedLyrics,
        artworkPath,
        albums: [manageAlbumData(albumData, album, artworkPath)].filter(
          (x): x is SongTagsAlbumData => x !== undefined
        ),
        artists: manageArtistsData(artistData, artists),
        genres: manageGenresData(genreData, genres)
      };
    });
  }, [
    album,
    artists,
    artworkPaths,
    changePromptMenuData,
    genres,
    lyrics,
    releasedYear,
    title,
    updateSongInfo
  ]);

  return (
    <div className="bg-background-color-2/70 hover:bg-background-color-2 dark:bg-dark-background-color-2/70 dark:hover:bg-dark-background-color-2 mb-2 flex h-32 min-h-[5rem] w-full cursor-pointer items-center justify-between rounded-md p-1 backdrop-blur-md">
      <div className="flex h-full max-w-[70%]">
        <div className="img-container m-1 mr-4 overflow-hidden rounded-md">
          <Img
            src={artworkPaths?.at(-1)}
            fallbackSrc={DefaultSongImage}
            className="aspect-square h-full max-w-full object-cover"
            alt=""
          />
        </div>
        <div className="song-result-info-container text-font-color-black dark:text-font-color-white flex max-w-[75%] flex-col justify-center">
          <p className="song-result-title relative w-full overflow-hidden text-xl text-ellipsis whitespace-nowrap">
            {title}
          </p>
          <p className="song-result-artists text-opacity-75 font-light">{artists.join(', ')}</p>
          {album && <p className="song-result-album text-opacity-75 text-sm font-light">{album}</p>}
          <span className="song-result-album text-opacity-75 flex text-sm font-light">
            {releasedYear && <span>{releasedYear}</span>}
            {releasedYear && <span className="mx-2">&bull;</span>}
            {lyrics && (
              <span className="flex items-center">
                <span className="material-icons-round-outlined text-font-color-highlight dark:text-dark-font-color-highlight mr-2">
                  verified
                </span>{' '}
                {lyrics && t('songTagsEditingPage.lyricsIncluded')}
              </span>
            )}
          </span>
        </div>
      </div>
      <div className="buttons-container flex items-center">
        <Button
          label={t('songTagsEditingPage.addToMetadata')}
          iconName="add"
          className="bg-background-color-3! text-font-color-black hover:border-background-color-3 dark:bg-dark-background-color-3! dark:text-font-color-black! dark:hover:border-background-color-3 h-fit px-8 text-lg"
          clickHandler={addToMetadata}
        />
        <Button
          key={0}
          className="more-options-btn hover:border-background-color-3! dark:border-dark-background-color-1! dark:hover:border-dark-background-color-3! text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
          iconName="tune"
          clickHandler={() => {
            changePromptMenuData(
              true,
              <CustomizeSelectedMetadataPrompt
                title={title}
                artists={artists}
                album={album}
                artworkPaths={artworkPaths?.filter((x) => x.trim())}
                genres={genres}
                lyrics={lyrics}
                releasedYear={releasedYear}
                updateSongInfo={updateSongInfo}
              />
            );
          }}
          tooltipLabel={t('songTagsEditingPage.customizeMetadata')}
        />
      </div>
    </div>
  );
}
export default SongMetadataResult;
