/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AppUpdateContext } from '../../contexts/AppUpdateContext';

import isLyricsSynced from '../../../../common/isLyricsSynced';

import Button from '../Button';
import Checkbox from '../Checkbox';
import Img from '../Img';
import {
  manageAlbumData,
  manageArtistsData,
  manageGenresData
} from '../../utils/manageMetadataResults';

interface SongMetadataResultProp {
  title: string;
  artists: string[];
  genres?: string[];
  album?: string;
  releasedYear?: number;
  lyrics?: string;
  artworkPaths?: string[];
  updateSongInfo: (_callback: (_prevData: SongTags) => SongTags) => void;
}

const CustomizeSelectedMetadataPrompt = (props: SongMetadataResultProp) => {
  const { changePromptMenuData } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const { title, artists, genres, artworkPaths, album, lyrics, releasedYear, updateSongInfo } =
    props;

  const [selectedArtwork, setSelectedArtwork] = useState(artworkPaths?.at(-1));
  const [selectedMetadata, setSelectedMetadata] = useState({
    isTitleSelected: true,
    isArtistsSelected: true,
    isAlbumSelected: true,
    isReleasedYearSelected: true,
    isGenresSelected: true,
    isLyricsSelected: true
  });
  const [showLyrics, setShowLyrics] = useState(false);

  const artworkComponents = useMemo(() => {
    return artworkPaths?.map((artwork, i) => {
      const isSelectedArtwork = selectedArtwork === artwork;

      return (
        <div
          key={i}
          className={`group hover:bg-background-color-2/50 dark:hover:bg-dark-background-color-2/50 mr-4 flex cursor-pointer flex-col items-center rounded-lg p-4 ${
            isSelectedArtwork && 'bg-background-color-2 dark:bg-dark-background-color-2 shadow-lg'
          }`}
          onClick={() =>
            setSelectedArtwork((prevArtwork) => (prevArtwork === artwork ? '' : artwork))
          }
        >
          <Img src={artwork} className="w-40 rounded-md" showImgPropsOnTooltip />
          <Button
            label={t(
              `customizeSelectedMetadataPrompt.${isSelectedArtwork ? 'selected' : 'select'}`
            )}
            className={`bg-background-color-2 group-hover:bg-background-color-1 dark:bg-dark-background-color-2 dark:group-hover:bg-dark-background-color-1 !mx-0 mt-4 !py-1 uppercase ${
              isSelectedArtwork &&
              '!dark:bg-dark-background-color-3 !dark:text-font-color-black border-background-color-3! bg-background-color-3! text-font-color-black! dark:border-dark-background-color-3! font-medium'
            }`}
            clickHandler={(e) => {
              e.stopPropagation();
              setSelectedArtwork((prevArtwork) => (prevArtwork === artwork ? '' : artwork));
            }}
          />
        </div>
      );
    });
  }, [artworkPaths, selectedArtwork, t]);

  const isLyricsSynchronised = useMemo(() => isLyricsSynced(lyrics || ''), [lyrics]);

  const updateSelectedMetadata = useCallback(async () => {
    changePromptMenuData(false, undefined, '');

    const {
      isTitleSelected,
      isAlbumSelected,
      isArtistsSelected,
      isGenresSelected,
      isLyricsSelected,
      isReleasedYearSelected
    } = selectedMetadata;

    const albumData = isAlbumSelected
      ? album
        ? await window.api.albumsData.getAlbumData([album]).then((res) => res.data)
        : []
      : undefined;
    const artistData = isArtistsSelected
      ? await window.api.artistsData.getArtistData(artists).then((res) => res.data)
      : undefined;
    const genreData = isGenresSelected
      ? genres
        ? await window.api.genresData.getGenresData(genres).then((res) => res.data)
        : []
      : undefined;

    updateSongInfo((prevData): SongTags => {
      return {
        ...prevData,
        title: isTitleSelected && title ? title : prevData?.title,
        releasedYear:
          isReleasedYearSelected && typeof releasedYear === 'number'
            ? releasedYear
            : prevData?.releasedYear,
        synchronizedLyrics:
          isLyricsSelected && lyrics && isLyricsSynchronised
            ? lyrics
            : prevData?.synchronizedLyrics,
        unsynchronizedLyrics:
          isLyricsSelected && lyrics && !isLyricsSynchronised
            ? lyrics
            : prevData?.unsynchronizedLyrics,
        artworkPath: selectedArtwork || prevData?.artworkPath,
        albums: albumData
          ? [manageAlbumData(albumData, album, selectedArtwork || prevData?.artworkPath)].filter(
              (x): x is SongTagsAlbumData => x !== undefined
            )
          : prevData.albums,
        artists: artistData ? manageArtistsData(artistData, artists) : prevData.artists,
        genres: genreData ? manageGenresData(genreData, genres) : prevData.genres
      };
    });
  }, [
    album,
    artists,
    changePromptMenuData,
    genres,
    isLyricsSynchronised,
    lyrics,
    releasedYear,
    selectedArtwork,
    selectedMetadata,
    title,
    updateSongInfo
  ]);

  const updateAllMetadata = useCallback(async () => {
    changePromptMenuData(false, undefined, '');

    const albumData = album
      ? await window.api.albumsData.getAlbumData([album]).then((res) => res.data)
      : [];
    const artistData = await window.api.artistsData.getArtistData(artists).then((res) => res.data);
    const genreData = genres
      ? await window.api.genresData.getGenresData(genres).then((res) => res.data)
      : [];

    updateSongInfo((prevData) => {
      const artworkPath = selectedArtwork || prevData?.artworkPath;
      return {
        ...prevData,
        title: title || prevData?.title,
        releasedYear: releasedYear ?? prevData?.releasedYear,
        synchronizedLyrics: isLyricsSynchronised && lyrics ? lyrics : prevData?.synchronizedLyrics,
        unsynchronizedLyrics:
          !isLyricsSynchronised && lyrics ? lyrics : prevData?.unsynchronizedLyrics,
        artworkPath,
        artists: manageArtistsData(artistData, artists),
        albums: [manageAlbumData(albumData, album, artworkPath)].filter(
          (x): x is SongTagsAlbumData => x !== undefined
        ),
        genres: manageGenresData(genreData, genres)
      } as SongTags;
    });
  }, [
    album,
    artists,
    changePromptMenuData,
    genres,
    isLyricsSynchronised,
    lyrics,
    releasedYear,
    selectedArtwork,
    title,
    updateSongInfo
  ]);

  const isAtLeastOneSelected = useMemo(
    () =>
      !(
        (Array.isArray(artworkPaths) && artworkPaths.length > 0 && selectedArtwork) ||
        (title && selectedMetadata.isTitleSelected) ||
        (album && selectedMetadata.isAlbumSelected) ||
        (Array.isArray(artists) && artists.length > 0 && selectedMetadata.isArtistsSelected) ||
        (Array.isArray(genres) && genres.length > 0 && selectedMetadata.isGenresSelected) ||
        (typeof releasedYear === 'number' && selectedMetadata.isReleasedYearSelected) ||
        (lyrics && selectedMetadata.isLyricsSelected)
      ),
    [
      album,
      artists,
      artworkPaths,
      genres,
      lyrics,
      releasedYear,
      selectedArtwork,
      selectedMetadata,
      title
    ]
  );

  const isAllMetadataSelected = useMemo(
    () => Object.values(selectedMetadata).every((bool) => bool),
    [selectedMetadata]
  );

  return (
    <div>
      <div className="title-container text-font-color-highlight dark:text-dark-font-color-highlight mt-1 mb-8 flex items-center pr-4 text-3xl font-medium">
        {t('customizeSelectedMetadataPrompt.title', { title })}
      </div>
      <div className="artworks-container">
        <div className="title-container text-font-color-highlight dark:text-dark-font-color-highlight mb-4 text-xl font-medium">
          {t('customizeSelectedMetadataPrompt.selectArtwork')}
        </div>
        <div className="artworks flex">
          {artworkComponents && artworkComponents.length > 0 ? (
            artworkComponents
          ) : (
            <div className="flex w-full flex-col items-center justify-center py-4 opacity-80">
              <span className="material-icons-round-outlined mb-2 text-3xl">macro_off</span>
              {t('customizeSelectedMetadataPrompt.noArtworksFound')}
            </div>
          )}
        </div>
      </div>

      <div className="other-info-container mt-10">
        <div className="title-container text-font-color-highlight dark:text-dark-font-color-highlight mb-4 flex justify-between text-xl font-medium">
          {t('customizeSelectedMetadataPrompt.customizeOtherMetadata')}
          <Button
            label={t(`common.${isAllMetadataSelected ? 'unselectAll' : 'selectAll'}`)}
            className="select-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
            iconName={isAllMetadataSelected ? 'remove_done' : 'checklist'}
            clickHandler={() =>
              setSelectedMetadata({
                isTitleSelected: !isAllMetadataSelected,
                isArtistsSelected: !isAllMetadataSelected,
                isAlbumSelected: !isAllMetadataSelected,
                isReleasedYearSelected: !isAllMetadataSelected,
                isGenresSelected: !isAllMetadataSelected,
                isLyricsSelected: !isAllMetadataSelected
              })
            }
          />
        </div>
        <div className="other-infos pl-2">
          {title && (
            <div className="other-info odd:bg-background-color-2/50 dark:odd:bg-dark-background-color-2/50 mb-4 flex items-center rounded-lg p-2">
              <Checkbox
                isChecked={selectedMetadata.isTitleSelected}
                id="songTitle"
                className="mt-0! mr-6! ml-4!"
                checkedStateUpdateFunction={() =>
                  setSelectedMetadata((prevData) => ({
                    ...prevData,
                    isTitleSelected: !prevData?.isTitleSelected
                  }))
                }
              />
              <div
                className={`info transition-opacity ${
                  !selectedMetadata.isTitleSelected && 'opacity-50!'
                }`}
              >
                <div className="title text-xs uppercase opacity-50">{t('common.songTitle')}</div>
                <div className="data text-lg">{title}</div>
              </div>
            </div>
          )}
          {artists && artists.length > 0 && (
            <div className="other-info odd:bg-background-color-2/50 dark:odd:bg-dark-background-color-2/50 mb-4 flex items-center rounded-lg p-2">
              <Checkbox
                isChecked={selectedMetadata.isArtistsSelected}
                id="songArtist"
                className="mt-0! mr-6! ml-4!"
                checkedStateUpdateFunction={() =>
                  setSelectedMetadata((prevData) => ({
                    ...prevData,
                    isArtistsSelected: !prevData.isArtistsSelected
                  }))
                }
              />
              <div
                className={`info transition-opacity ${
                  !selectedMetadata.isArtistsSelected && 'opacity-50!'
                }`}
              >
                <div className="title text-xs uppercase opacity-50">{t('common.artist_other')}</div>
                <div className="data text-lg">{artists?.join(', ')}</div>
              </div>
            </div>
          )}
          {album && (
            <div className="other-info odd:bg-background-color-2/50 dark:odd:bg-dark-background-color-2/50 mb-4 flex items-center rounded-lg p-2">
              <Checkbox
                isChecked={selectedMetadata.isAlbumSelected}
                id="songAlbum"
                className="mt-0! mr-6! ml-4!"
                checkedStateUpdateFunction={() =>
                  setSelectedMetadata((prevData) => ({
                    ...prevData,
                    isAlbumSelected: !prevData.isAlbumSelected
                  }))
                }
              />
              <div
                className={`info transition-opacity ${
                  !selectedMetadata.isAlbumSelected && 'opacity-50!'
                }`}
              >
                <div className="title text-xs uppercase opacity-50">{t('common.album_one')}</div>
                <div className="data text-lg">{album}</div>
              </div>
            </div>
          )}
          {genres && genres?.length > 0 && (
            <div className="other-info odd:bg-background-color-2/50 dark:odd:bg-dark-background-color-2/50 mb-4 flex items-center rounded-lg p-2">
              <Checkbox
                isChecked={selectedMetadata.isGenresSelected}
                id="songGenres"
                className="mt-0! mr-6! ml-4!"
                checkedStateUpdateFunction={() =>
                  setSelectedMetadata((prevData) => ({
                    ...prevData,
                    isGenresSelected: !prevData.isGenresSelected
                  }))
                }
              />
              <div
                className={`info transition-opacity ${
                  !selectedMetadata.isGenresSelected && 'opacity-50!'
                }`}
              >
                <div className="title text-xs uppercase opacity-50">{t('common.genre_other')}</div>
                <div className="data text-lg">{genres?.join(', ')}</div>
              </div>
            </div>
          )}
          {releasedYear && (
            <div className="other-info odd:bg-background-color-2/50 dark:odd:bg-dark-background-color-2/50 mb-4 flex items-center rounded-lg p-2">
              <Checkbox
                isChecked={selectedMetadata.isReleasedYearSelected}
                id="songReleasedYear"
                className="mt-0! mr-6! ml-4!"
                checkedStateUpdateFunction={() =>
                  setSelectedMetadata((prevData) => ({
                    ...prevData,
                    isReleasedYearSelected: !prevData.isReleasedYearSelected
                  }))
                }
              />
              <div
                className={`info transition-opacity ${
                  !selectedMetadata.isReleasedYearSelected && 'opacity-50!'
                }`}
              >
                <div className="title text-xs uppercase opacity-50">{t('common.releasedYear')}</div>
                <div className="data text-lg">{releasedYear}</div>
              </div>
            </div>
          )}
          {lyrics && (
            <div className="other-info odd:bg-background-color-2/50 dark:odd:bg-dark-background-color-2/50 mb-4 flex items-center overflow-hidden rounded-lg p-2">
              <Checkbox
                isChecked={selectedMetadata.isLyricsSelected}
                id="songLyrics"
                className="mt-0! mr-6! ml-4!"
                checkedStateUpdateFunction={() =>
                  setSelectedMetadata((prevData) => ({
                    ...prevData,
                    isLyricsSelected: !prevData.isLyricsSelected
                  }))
                }
              />
              <div
                className={`info transition-opacity ${
                  !selectedMetadata.isLyricsSelected && 'opacity-50!'
                }`}
              >
                <div className="title text-xs uppercase opacity-50">{t('common.lyrics')}</div>
                <div className="data line-clamp-2 truncate overflow-hidden text-lg">
                  <div className="flex">
                    {isLyricsSynchronised && (
                      <span className="material-icons-round-outlined text-font-color-highlight dark:text-dark-font-color-highlight mr-2">
                        verified
                      </span>
                    )}{' '}
                    {t(
                      `customizeSelectedMetadataPrompt.${
                        isLyricsSynchronised ? 'syncedLyricsAvailable' : 'unsyncedLyricsAvailable'
                      }`
                    )}
                    <Button
                      iconName={showLyrics ? 'visibility_off' : 'visibility'}
                      clickHandler={() => setShowLyrics((prevState) => !prevState)}
                      className="my-0! mr-0! ml-4! border-0! p-0!"
                    />
                  </div>

                  {showLyrics && (
                    <pre className="bg-background-color-1 dark:bg-dark-background-color-1 mt-4 max-h-[400px] min-h-[200px] max-w-[95%] overflow-scroll text-sm">
                      {lyrics}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="buttons-container mt-10 flex items-center justify-end">
        <Button
          label={t('common.cancel')}
          iconName="close"
          clickHandler={() => changePromptMenuData(false)}
        />
        <Button
          label={t('customizeSelectedMetadataPrompt.addOnlySelected')}
          iconName="add"
          className="bg-background-color-3! text-font-color-black hover:border-background-color-3 dark:bg-dark-background-color-3! dark:text-font-color-black! dark:hover:border-background-color-3 px-4 text-lg"
          clickHandler={updateSelectedMetadata}
          isDisabled={isAtLeastOneSelected}
        />
        <Button
          label={t('customizeSelectedMetadataPrompt.addAll')}
          iconName="done"
          className="bg-background-color-3! text-font-color-black hover:border-background-color-3 dark:bg-dark-background-color-3! dark:text-font-color-black! dark:hover:border-background-color-3 px-4 text-lg"
          clickHandler={updateAllMetadata}
        />
      </div>
    </div>
  );
};

export default CustomizeSelectedMetadataPrompt;
