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
    const albumData = album ? await window.api.albumsData.getAlbumData([album]) : [];
    const artistData = await window.api.artistsData.getArtistData(artists);
    const genreData = genres ? await window.api.genresData.getGenresData(genres) : [];

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
        album: manageAlbumData(albumData, album, artworkPath),
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
    <div className="mb-2 flex h-32 min-h-[5rem] w-full cursor-pointer items-center justify-between rounded-md bg-background-color-2/70 p-1 backdrop-blur-md hover:bg-background-color-2 dark:bg-dark-background-color-2/70 dark:hover:bg-dark-background-color-2">
      <div className="flex h-full max-w-[70%]">
        <div className="img-container m-1 mr-4 overflow-hidden rounded-md">
          <Img
            src={artworkPaths?.at(-1)}
            fallbackSrc={DefaultSongImage}
            className="aspect-square h-full max-w-full object-cover"
            alt=""
          />
        </div>
        <div className="song-result-info-container flex max-w-[75%] flex-col justify-center text-font-color-black dark:text-font-color-white">
          <p className="song-result-title relative w-full overflow-hidden text-ellipsis whitespace-nowrap text-xl">
            {title}
          </p>
          <p className="song-result-artists font-light text-opacity-75">{artists.join(', ')}</p>
          {album && <p className="song-result-album text-sm font-light text-opacity-75">{album}</p>}
          <span className="song-result-album flex text-sm font-light text-opacity-75">
            {releasedYear && <span>{releasedYear}</span>}
            {releasedYear && <span className="mx-2">&bull;</span>}
            {lyrics && (
              <span className="flex items-center">
                <span className="material-icons-round-outlined mr-2 text-font-color-highlight dark:text-dark-font-color-highlight">
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
          className="h-fit bg-background-color-3! px-8 text-lg text-font-color-black hover:border-background-color-3 dark:bg-dark-background-color-3! dark:text-font-color-black! dark:hover:border-background-color-3"
          clickHandler={addToMetadata}
        />
        <Button
          key={0}
          className="more-options-btn text-sm hover:border-background-color-3! md:text-lg dark:border-dark-background-color-1! dark:hover:border-dark-background-color-3! md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
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
