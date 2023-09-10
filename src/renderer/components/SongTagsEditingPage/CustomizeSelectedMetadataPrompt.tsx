/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react';
import isLyricsSynced from 'main/utils/isLyricsSynced';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import Button from '../Button';
import Checkbox from '../Checkbox';
import Img from '../Img';
import {
  manageAlbumData,
  manageArtistsData,
  manageGenresData,
} from './SongMetadataResult';

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
  const { changePromptMenuData } = React.useContext(AppUpdateContext);
  const {
    title,
    artists,
    genres,
    artworkPaths,
    album,
    lyrics,
    releasedYear,
    updateSongInfo,
  } = props;

  const [selectedArtwork, setSelectedArtwork] = React.useState(
    artworkPaths?.at(-1),
  );
  const [selectedMetadata, setSelectedMetadata] = React.useState({
    isTitleSelected: true,
    isArtistsSelected: true,
    isAlbumSelected: true,
    isReleasedYearSelected: true,
    isGenresSelected: true,
    isLyricsSelected: true,
  });
  const [showLyrics, setShowLyrics] = React.useState(false);

  const artworkComponents = React.useMemo(() => {
    return artworkPaths?.map((artwork) => {
      const isSelectedArtwork = selectedArtwork === artwork;

      return (
        <div
          className={`group mr-4 flex cursor-pointer flex-col items-center rounded-lg p-4 hover:bg-background-color-2/50 dark:hover:bg-dark-background-color-2/50 ${
            isSelectedArtwork &&
            'bg-background-color-2 shadow-lg dark:bg-dark-background-color-2'
          }`}
          onClick={() =>
            setSelectedArtwork((prevArtwork) =>
              prevArtwork === artwork ? '' : artwork,
            )
          }
        >
          <Img
            src={artwork}
            className="w-40 rounded-md"
            showImgPropsOnTooltip
          />
          <Button
            label={isSelectedArtwork ? 'SELECTED' : 'SELECT'}
            className={`!mx-0 mt-4 bg-background-color-2 !py-1 group-hover:bg-background-color-1 dark:bg-dark-background-color-2 dark:group-hover:bg-dark-background-color-1 ${
              isSelectedArtwork &&
              '!dark:bg-dark-background-color-3 !dark:text-font-color-black !border-background-color-3 !bg-background-color-3 font-medium !text-font-color-black dark:!border-dark-background-color-3'
            }`}
            clickHandler={(e) => {
              e.stopPropagation();
              setSelectedArtwork((prevArtwork) =>
                prevArtwork === artwork ? '' : artwork,
              );
            }}
          />
        </div>
      );
    });
  }, [artworkPaths, selectedArtwork]);

  const isLyricsSynchronised = React.useMemo(
    () => isLyricsSynced(lyrics || ''),
    [lyrics],
  );

  const updateSelectedMetadata = React.useCallback(async () => {
    changePromptMenuData(false, undefined, '');

    const {
      isTitleSelected,
      isAlbumSelected,
      isArtistsSelected,
      isGenresSelected,
      isLyricsSelected,
      isReleasedYearSelected,
    } = selectedMetadata;

    const albumData = isAlbumSelected
      ? album
        ? await window.api.albumsData.getAlbumData([album])
        : []
      : undefined;
    const artistData = isArtistsSelected
      ? await window.api.artistsData.getArtistData(artists)
      : undefined;
    const genreData = isGenresSelected
      ? genres
        ? await window.api.genresData.getGenresData(genres)
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
        album: albumData
          ? manageAlbumData(
              albumData,
              album,
              selectedArtwork || prevData?.artworkPath,
            )
          : prevData.album,
        artists: artistData
          ? manageArtistsData(artistData, artists)
          : prevData.artists,
        genres: genreData
          ? manageGenresData(genreData, genres)
          : prevData.genres,
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
    updateSongInfo,
  ]);

  const updateAllMetadata = React.useCallback(async () => {
    changePromptMenuData(false, undefined, '');

    const albumData = album
      ? await window.api.albumsData.getAlbumData([album])
      : [];
    const artistData = await window.api.artistsData.getArtistData(artists);
    const genreData = genres
      ? await window.api.genresData.getGenresData(genres)
      : [];

    updateSongInfo((prevData) => {
      const artworkPath = selectedArtwork || prevData?.artworkPath;
      return {
        ...prevData,
        title: title || prevData?.title,
        releasedYear: releasedYear ?? prevData?.releasedYear,
        synchronizedLyrics:
          isLyricsSynchronised && lyrics
            ? lyrics
            : prevData?.synchronizedLyrics,
        unsynchronizedLyrics:
          !isLyricsSynchronised && lyrics
            ? lyrics
            : prevData?.unsynchronizedLyrics,
        artworkPath,
        artists: manageArtistsData(artistData, artists),
        album: manageAlbumData(albumData, album, artworkPath),
        genres: manageGenresData(genreData, genres),
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
    updateSongInfo,
  ]);

  const isAtLeastOneSelected = React.useMemo(
    () =>
      !(
        (Array.isArray(artworkPaths) &&
          artworkPaths.length > 0 &&
          selectedArtwork) ||
        (title && selectedMetadata.isTitleSelected) ||
        (album && selectedMetadata.isAlbumSelected) ||
        (Array.isArray(artists) &&
          artists.length > 0 &&
          selectedMetadata.isArtistsSelected) ||
        (Array.isArray(genres) &&
          genres.length > 0 &&
          selectedMetadata.isGenresSelected) ||
        (typeof releasedYear === 'number' &&
          selectedMetadata.isReleasedYearSelected) ||
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
      title,
    ],
  );

  const isAllMetadataSelected = React.useMemo(
    () => Object.values(selectedMetadata).every((bool) => bool),
    [selectedMetadata],
  );

  return (
    <div>
      <div className="title-container mb-8 mt-1 flex items-center pr-4 text-3xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        Customize Downloaded Metadata for '{title}'
      </div>
      <div className="artworks-container">
        <div className="title-container mb-4 text-xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
          Select an artwork
        </div>
        <div className="artworks flex">
          {artworkComponents && artworkComponents.length > 0 ? (
            artworkComponents
          ) : (
            <div className="flex w-full flex-col items-center justify-center py-4 opacity-80">
              <span className="material-icons-round-outlined mb-2 text-3xl">
                macro_off
              </span>
              No artworks found
            </div>
          )}
        </div>
      </div>

      <div className="other-info-container mt-10">
        <div className="title-container mb-4 flex justify-between text-xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
          Customize Other Metadata
          <Button
            label={isAllMetadataSelected ? 'Unselect All' : 'Select All'}
            className="select-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
            iconName={isAllMetadataSelected ? 'remove_done' : 'checklist'}
            clickHandler={() =>
              setSelectedMetadata({
                isTitleSelected: !isAllMetadataSelected,
                isArtistsSelected: !isAllMetadataSelected,
                isAlbumSelected: !isAllMetadataSelected,
                isReleasedYearSelected: !isAllMetadataSelected,
                isGenresSelected: !isAllMetadataSelected,
                isLyricsSelected: !isAllMetadataSelected,
              })
            }
          />
        </div>
        <div className="other-infos pl-2">
          {title && (
            <div className="other-info mb-4 flex items-center rounded-lg p-2 odd:bg-background-color-2/50 odd:dark:bg-dark-background-color-2/50">
              <Checkbox
                isChecked={selectedMetadata.isTitleSelected}
                id="songTitle"
                className="!ml-4 !mr-6 !mt-0"
                checkedStateUpdateFunction={() =>
                  setSelectedMetadata((prevData) => ({
                    ...prevData,
                    isTitleSelected: !prevData?.isTitleSelected,
                  }))
                }
              />
              <div
                className={`info transition-opacity ${
                  !selectedMetadata.isTitleSelected && '!opacity-50'
                }`}
              >
                <div className="title text-xs uppercase opacity-50">
                  Song Title
                </div>
                <div className="data text-lg">{title}</div>
              </div>
            </div>
          )}
          {artists && artists.length > 0 && (
            <div className="other-info mb-4 flex items-center rounded-lg p-2 odd:bg-background-color-2/50 odd:dark:bg-dark-background-color-2/50">
              <Checkbox
                isChecked={selectedMetadata.isArtistsSelected}
                id="songArtist"
                className="!ml-4 !mr-6 !mt-0"
                checkedStateUpdateFunction={() =>
                  setSelectedMetadata((prevData) => ({
                    ...prevData,
                    isArtistsSelected: !prevData.isArtistsSelected,
                  }))
                }
              />
              <div
                className={`info transition-opacity ${
                  !selectedMetadata.isArtistsSelected && '!opacity-50'
                }`}
              >
                <div className="title text-xs uppercase opacity-50">
                  Song Artists
                </div>
                <div className="data text-lg">{artists?.join(', ')}</div>
              </div>
            </div>
          )}
          {album && (
            <div className="other-info mb-4 flex items-center rounded-lg p-2 odd:bg-background-color-2/50 odd:dark:bg-dark-background-color-2/50">
              <Checkbox
                isChecked={selectedMetadata.isAlbumSelected}
                id="songAlbum"
                className="!ml-4 !mr-6 !mt-0"
                checkedStateUpdateFunction={() =>
                  setSelectedMetadata((prevData) => ({
                    ...prevData,
                    isAlbumSelected: !prevData.isAlbumSelected,
                  }))
                }
              />
              <div
                className={`info transition-opacity ${
                  !selectedMetadata.isAlbumSelected && '!opacity-50'
                }`}
              >
                <div className="title text-xs uppercase opacity-50">
                  Song Album
                </div>
                <div className="data text-lg">{album}</div>
              </div>
            </div>
          )}
          {genres && genres?.length > 0 && (
            <div className="other-info mb-4 flex items-center rounded-lg p-2 odd:bg-background-color-2/50 odd:dark:bg-dark-background-color-2/50">
              <Checkbox
                isChecked={selectedMetadata.isGenresSelected}
                id="songGenres"
                className="!ml-4 !mr-6 !mt-0"
                checkedStateUpdateFunction={() =>
                  setSelectedMetadata((prevData) => ({
                    ...prevData,
                    isGenresSelected: !prevData.isGenresSelected,
                  }))
                }
              />
              <div
                className={`info transition-opacity ${
                  !selectedMetadata.isGenresSelected && '!opacity-50'
                }`}
              >
                <div className="title text-xs uppercase opacity-50">
                  Song Genres
                </div>
                <div className="data text-lg">{genres?.join(', ')}</div>
              </div>
            </div>
          )}
          {releasedYear && (
            <div className="other-info mb-4 flex items-center rounded-lg p-2 odd:bg-background-color-2/50 odd:dark:bg-dark-background-color-2/50">
              <Checkbox
                isChecked={selectedMetadata.isReleasedYearSelected}
                id="songReleasedYear"
                className="!ml-4 !mr-6 !mt-0"
                checkedStateUpdateFunction={() =>
                  setSelectedMetadata((prevData) => ({
                    ...prevData,
                    isReleasedYearSelected: !prevData.isReleasedYearSelected,
                  }))
                }
              />
              <div
                className={`info transition-opacity ${
                  !selectedMetadata.isReleasedYearSelected && '!opacity-50'
                }`}
              >
                <div className="title text-xs uppercase opacity-50">
                  Released Year
                </div>
                <div className="data text-lg">{releasedYear}</div>
              </div>
            </div>
          )}
          {lyrics && (
            <div className="other-info mb-4 flex items-center overflow-hidden rounded-lg p-2 odd:bg-background-color-2/50 odd:dark:bg-dark-background-color-2/50">
              <Checkbox
                isChecked={selectedMetadata.isLyricsSelected}
                id="songLyrics"
                className="!ml-4 !mr-6 !mt-0"
                checkedStateUpdateFunction={() =>
                  setSelectedMetadata((prevData) => ({
                    ...prevData,
                    isLyricsSelected: !prevData.isLyricsSelected,
                  }))
                }
              />
              <div
                className={`info transition-opacity ${
                  !selectedMetadata.isLyricsSelected && '!opacity-50'
                }`}
              >
                <div className="title text-xs uppercase opacity-50">
                  Song Lyrics
                </div>
                <div className="data line-clamp-2 overflow-hidden truncate text-lg">
                  <div className="flex ">
                    {isLyricsSynchronised && (
                      <span className="material-icons-round-outlined mr-2 text-font-color-highlight dark:text-dark-font-color-highlight">
                        verified
                      </span>
                    )}{' '}
                    {isLyricsSynchronised ? 'Synced' : 'Unsynced'} Lyrics
                    Available
                    <Button
                      iconName={showLyrics ? 'visibility_off' : 'visibility'}
                      clickHandler={() =>
                        setShowLyrics((prevState) => !prevState)
                      }
                      className="!my-0 !ml-4 !mr-0 !border-0 !p-0"
                    />
                  </div>

                  {showLyrics && (
                    <pre className="mt-4 max-h-[400px] min-h-[200px] max-w-[95%] overflow-scroll bg-background-color-1 text-sm dark:bg-dark-background-color-1">
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
          label="Cancel"
          iconName="close"
          clickHandler={() => changePromptMenuData(false)}
        />
        <Button
          label="Add only Selected"
          iconName="add"
          className="!bg-background-color-3 px-4 text-lg text-font-color-black hover:border-background-color-3 dark:!bg-dark-background-color-3 dark:!text-font-color-black dark:hover:border-background-color-3"
          clickHandler={updateSelectedMetadata}
          isDisabled={isAtLeastOneSelected}
        />
        <Button
          label="Add All"
          iconName="done"
          className="!bg-background-color-3 px-4 text-lg text-font-color-black hover:border-background-color-3 dark:!bg-dark-background-color-3 dark:!text-font-color-black dark:hover:border-background-color-3"
          clickHandler={updateAllMetadata}
        />
      </div>
    </div>
  );
};

export default CustomizeSelectedMetadataPrompt;
