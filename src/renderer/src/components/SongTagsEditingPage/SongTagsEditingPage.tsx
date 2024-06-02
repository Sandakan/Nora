/* eslint-disable promise/catch-or-return */
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { AppContext } from '../../contexts/AppContext';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';

import useNetworkConnectivity from '../../hooks/useNetworkConnectivity';
import hasDataChanged, { isDataChanged } from '../../utils/hasDataChanged';

import Button from '../Button';
import MainContainer from '../MainContainer';
import SongMetadataResultsSelectPage from './SongMetadataResultsSelectPrompt';
import SongArtwork from './SongArtwork';
import SongNameInput from './input_containers/SongNameInput';
import SongYearInput from './input_containers/SongYearInput';
import SongArtistsInput from './input_containers/SongArtistsInput';
import SongAlbumInput from './input_containers/SongAlbumInput';
import SongGenresInput from './input_containers/SongGenresInput';
import SongComposerInput from './input_containers/SongComposerInput';
import SongLyricsEditorInput from './input_containers/SongLyricsEditorInput';

import { appPreferences } from '../../../../../package.json';
import SongTrackNumberInput from './input_containers/SongTrackNumberInput';
import ResetTagsToDefaultPrompt from './ResetTagsToDefaultPrompt';
import SongAlbumArtistsInput from './input_containers/SongAlbumArtistInput';

export interface MetadataKeywords {
  albumKeyword?: string;
  artistKeyword?: string;
  genreKeyword?: string;
}

type ArtistResult = {
  artistId?: string;
  name: string;
  artworkPath?: string;
  onlineArtworkPaths?: OnlineArtistArtworks;
};

type AlbumResult = {
  title: string;
  albumId?: string;
  noOfSongs?: number;
  artists?: string[];
  artworkPath?: string;
};

type GenreResult = { genreId?: string; name: string; artworkPath?: string };

const { metadataEditingSupportedExtensions } = appPreferences;

function SongTagsEditingPage() {
  const { currentlyActivePage, currentSongData } = React.useContext(AppContext);
  const {
    addNewNotifications,
    changePromptMenuData,
    updateCurrentSongData,
    updatePageHistoryIndex
  } = React.useContext(AppUpdateContext);
  const { t } = useTranslation();

  const { isOnline } = useNetworkConnectivity();

  const [songInfo, setSongInfo] = React.useState({
    title: ''
  } as SongTags);
  const [defaultValues, setDefaultValues] = React.useState({
    title: ''
  } as SongTags);

  const [artistKeyword, setArtistKeyword] = React.useState('');
  const [artistResults, setArtistResults] = React.useState<ArtistResult[]>([]);

  const [albumKeyword, setAlbumKeyword] = React.useState('');
  const [albumResults, setAlbumResults] = React.useState<AlbumResult[]>([]);

  const [albumArtistKeyword, setAlbumArtistKeyword] = React.useState('');
  const [albumArtistResults, setAlbumArtistResults] = React.useState<ArtistResult[]>([]);

  const [genreKeyword, setGenreKeyword] = React.useState('');
  const [genreResults, setGenreResults] = React.useState<GenreResult[]>([]);

  const [isMetadataUpdatesPending, setIsMetadataUpdatesPending] = React.useState(false);

  const { songId, songPath, isKnownSource } = React.useMemo(
    () => ({
      songId: currentlyActivePage.data.songId as string,
      songPath: currentlyActivePage.data.songPath as string,
      isKnownSource: (currentlyActivePage.data.isKnownSource as boolean) ?? true
    }),
    [currentlyActivePage.data]
  );

  const pathExt = React.useMemo(() => window.api.utils.getExtension(songPath), [songPath]);

  const isMetadataEditingSupported = React.useMemo(() => {
    const isASupportedFormat = metadataEditingSupportedExtensions.includes(pathExt);

    return isASupportedFormat;
  }, [pathExt]);

  const getSongId3Tags = React.useCallback(() => {
    if (songId)
      window.api.songUpdates
        .getSongId3Tags(isKnownSource ? songId : songPath, isKnownSource)
        .then((res) => {
          if (res) {
            console.log(res);
            const data = {
              ...res,
              title: res.title
            };

            setDefaultValues(data);
            setSongInfo(data);
            setIsMetadataUpdatesPending(!!data.isMetadataSavePending);
          }
          return undefined;
        })
        .catch((err) => console.error(err));
  }, [isKnownSource, songId, songPath]);

  React.useEffect(() => {
    getSongId3Tags();
  }, [getSongId3Tags]);

  React.useEffect(() => {
    const manageMetadataUpdatesInSongsTagsEditingPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>).detail;
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (event.dataType === 'songs/updatedSong')
            window.api.songUpdates.isMetadataUpdatesPending(songPath).then((currentState) =>
              setIsMetadataUpdatesPending((prevState) => {
                if (prevState === true && currentState === false) getSongId3Tags();
                return currentState;
              })
            );
        }
      }
    };
    document.addEventListener('app/dataUpdates', manageMetadataUpdatesInSongsTagsEditingPage);
    return () => {
      document.removeEventListener('app/dataUpdates', manageMetadataUpdatesInSongsTagsEditingPage);
    };
  }, [getSongId3Tags, songPath]);

  React.useEffect(() => {
    if (artistKeyword.trim()) {
      window.api.search
        .search('Artists', artistKeyword, false, false)
        .then((res) => {
          console.log(res);
          if (res.artists.length > 0)
            setArtistResults(
              res.artists
                .filter((_, index) => index < 50)
                .map((artist) => ({
                  name: artist.name,
                  artistId: artist.artistId,
                  artworkPaths: artist.artworkPaths,
                  onlineArtworkPaths: artist.onlineArtworkPaths
                }))
            );
          else setArtistResults([]);
          return undefined;
        })
        .catch((err) => console.error(err));
    } else setArtistResults([]);
  }, [artistKeyword]);

  React.useEffect(() => {
    if (albumKeyword.trim()) {
      window.api.search
        .search('Albums', albumKeyword, false, false)
        .then((res) => {
          console.log(res);
          if (res.albums.length > 0)
            setAlbumResults(
              res.albums
                .filter((_, index) => index < 50)
                .map((album) => ({
                  title: album.title,
                  albumId: album.albumId,
                  noOfSongs: album.songs.length,
                  artworkPath: album?.artworkPaths?.artworkPath
                }))
            );
          else setAlbumResults([]);
          return undefined;
        })
        .catch((err) => console.error(err));
    } else setAlbumResults([]);
  }, [albumKeyword]);

  React.useEffect(() => {
    if (albumArtistKeyword.trim()) {
      window.api.search
        .search('Artists', albumArtistKeyword, false, false)
        .then((res) => {
          console.log(res);
          if (res.artists.length > 0)
            setAlbumArtistResults(
              res.artists
                .filter((_, index) => index < 50)
                .map((artist) => ({
                  name: artist.name,
                  artistId: artist.artistId,
                  artworkPaths: artist.artworkPaths,
                  onlineArtworkPaths: artist.onlineArtworkPaths
                }))
            );
          else setAlbumArtistResults([]);
          return undefined;
        })
        .catch((err) => console.error(err));
    } else setAlbumArtistResults([]);
  }, [albumArtistKeyword]);

  React.useEffect(() => {
    if (genreKeyword.trim()) {
      window.api.search
        .search('Genres', genreKeyword, false, false)
        .then((res) => {
          console.log(res);
          if (res.genres.length > 0)
            setGenreResults(
              res.genres
                .filter((_, index) => index < 50)
                .map((genre) => ({
                  name: genre.name,
                  genreId: genre.genreId,
                  artworkPaths: genre.artworkPaths
                }))
            );
          else setGenreResults([]);
          return undefined;
        })
        .catch((err) => console.error(err));
    } else setGenreResults([]);
  }, [genreKeyword]);

  const updateSongInfo = React.useCallback(
    (callback: (prevData: SongTags) => SongTags) => {
      const updatedData = callback(songInfo);
      setSongInfo(updatedData);
    },
    [songInfo]
  );

  const updateArtistKeyword = React.useCallback((keyword: string) => setArtistKeyword(keyword), []);
  const updateAlbumKeyword = React.useCallback((keyword: string) => setAlbumKeyword(keyword), []);
  const updateAlbumArtistKeyword = React.useCallback(
    (keyword: string) => setAlbumArtistKeyword(keyword),
    []
  );
  const updateGenreKeyword = React.useCallback((keyword: string) => setGenreKeyword(keyword), []);

  const fetchSongDataFromNet = React.useCallback(() => {
    if (songInfo.title) {
      changePromptMenuData(
        true,
        <SongMetadataResultsSelectPage
          songTitle={songInfo.title}
          songArtists={songInfo.artists?.map((x) => x.name) ?? []}
          updateSongInfo={updateSongInfo}
        />
      );
    }
  }, [songInfo.title, songInfo.artists, changePromptMenuData, updateSongInfo]);

  const saveTags = (
    _: unknown,
    setIsDisabled: (state: boolean) => void,
    setIsPending: (state: boolean) => void
  ) => {
    setIsDisabled(true);
    setIsPending(true);
    console.log(songInfo);
    window.api.songUpdates
      .updateSongId3Tags(
        isKnownSource ? songId : songPath,
        songInfo,
        songId === currentSongData.songId,
        isKnownSource
      )
      .then((res) => {
        if (res.success) {
          console.log('successfully updated the song.', res);
          if (res.updatedData && songId === currentSongData.songId) {
            const { updatedData } = res;
            updateCurrentSongData((prevData) => ({
              ...prevData,
              ...updatedData
            }));
          }
          // addNewNotifications([
          //   {
          //     id: `songDataUpdated`,
          //     content: `Successfully updated the song.`,
          //     iconName: 'done',
          //   },
          // ]);
          return window.api.songUpdates.getSongId3Tags(
            isKnownSource ? songId : songPath,
            isKnownSource
          );
        }
        throw new Error('Error ocurred when updating song ID3 tags.');
      })
      .then((res) => {
        setSongInfo(res);
        setDefaultValues(res);
        setIsMetadataUpdatesPending(!!res.isMetadataSavePending);
        return undefined;
      })
      .catch((err) => {
        addNewNotifications([
          {
            id: `songDataUpdateFailed`,
            content: t('notifications.songDataUpdateFailed'),
            iconName: 'warning',
            iconClassName: 'material-icons-round-outlined icon'
          }
        ]);
        console.error(err);
      })
      .finally(() => {
        setIsDisabled(false);
        setIsPending(false);
      });
  };

  const resetDataToDefaults = () => {
    const data = hasDataChanged(defaultValues, songInfo);
    const entries = Object.entries(data);
    if (!Object.values(data).every((x: boolean) => !x)) {
      changePromptMenuData(
        true,
        <ResetTagsToDefaultPrompt
          dataEntries={entries}
          resetButtonHandler={() => {
            changePromptMenuData(false);
            setSongInfo(defaultValues);
            setAlbumKeyword('');
            setAlbumResults([]);
            setArtistKeyword('');
            setArtistResults([]);
            setGenreKeyword('');
            setGenreResults([]);
          }}
        />
      );
    } else
      addNewNotifications([
        {
          id: 'songDataUnedited',
          content: t('notifications.noSongDataEdits')
        }
      ]);
  };

  const areThereDataChanges = React.useMemo(
    () => isDataChanged(defaultValues, songInfo),
    [defaultValues, songInfo]
  );

  const songNameFromPath = React.useMemo(() => {
    if (songPath) {
      const fileName = songPath.split('\\').at(-1);
      if (fileName) return fileName?.replace(/\.\w{3,5}$/gm, '');
    }
    return t('common.unknownTitle');
  }, [songPath, t]);

  const isEditingCurrentlyPlayingSong = React.useMemo(
    () => currentSongData.songId === songId,
    [currentSongData.songId, songId]
  );

  return (
    <MainContainer className="main-container appear-from-bottom id3-tags-updater-container h-full [scrollbar-gutter:stable]">
      <>
        {(songId || songPath) && isMetadataEditingSupported && (
          <>
            <div className="title-container mb-8 mt-1 flex items-center pr-4 text-3xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
              {t('songTagsEditingPage.songMetadataEditor')}{' '}
              {!isKnownSource && (
                <span
                  className="material-icons-round-outlined ml-6 cursor-help text-xl hover:underline"
                  title="You are editing a song outside the library."
                >
                  error
                </span>
              )}
            </div>
            <div className="song-information-container bl-4 mb-12 flex text-font-color-black dark:text-font-color-white">
              <SongArtwork artworkPath={songInfo.artworkPath} updateSongInfo={updateSongInfo} />
              <div className="song-info-container flex w-[70%] flex-col justify-center">
                <div className="song-title mb-2 text-4xl">
                  {songInfo.title || songNameFromPath}
                  {!isKnownSource && (
                    <span
                      className="material-icons-round-outlined ml-6 cursor-help text-2xl text-font-color-highlight hover:underline dark:text-dark-font-color-highlight"
                      title="You are editing a song outside the library."
                    >
                      error
                    </span>
                  )}
                </div>
                <div className="song-artists">
                  {songInfo.artists && songInfo.artists.length > 0
                    ? songInfo.artists.map((x) => x.name).join(', ')
                    : t('common.unknownArtist')}
                </div>
                <div className="song-album">{songInfo.album?.title}</div>
                <Button
                  label={t('songTagsEditingPage.searchMetadataOnInternet')}
                  iconName="download"
                  iconClassName="mr-2"
                  className="download-data-from-lastfm-btn mt-4 w-fit"
                  clickHandler={fetchSongDataFromNet}
                  tooltipLabel={isOnline ? undefined : t('common.noInternet')}
                  isDisabled={!isOnline}
                />
              </div>
            </div>
            <div
              className="inputs-container grid grid-flow-row grid-cols-2 content-around gap-8 text-font-color-black 
            dark:text-font-color-white"
            >
              <SongNameInput songTitle={songInfo.title} updateSongInfo={updateSongInfo} />
              <SongYearInput songYear={songInfo.releasedYear} updateSongInfo={updateSongInfo} />
              {/* ? SONG ARTSITS */}
              <SongArtistsInput
                artistResults={artistResults}
                artistKeyword={artistKeyword}
                songArtists={songInfo.artists}
                updateArtistKeyword={updateArtistKeyword}
                updateSongInfo={updateSongInfo}
              />
              {/* ? SONG ALBUM ARTSITS */}
              <SongAlbumArtistsInput
                artistResults={albumArtistResults}
                albumArtistKeyword={albumArtistKeyword}
                songAlbum={songInfo.album}
                songAlbumArtists={songInfo.albumArtists}
                updateAlbumArtistKeyword={updateAlbumArtistKeyword}
                updateSongInfo={updateSongInfo}
              />
              {/* ALBUM NAME */}
              <SongAlbumInput
                albumKeyword={albumKeyword}
                albumResults={albumResults}
                updateAlbumKeyword={updateAlbumKeyword}
                updateSongInfo={updateSongInfo}
                songAlbum={songInfo.album}
              />
              {/* SONG GENRES */}
              <SongGenresInput
                songGenres={songInfo.genres}
                genreKeyword={genreKeyword}
                genreResults={genreResults}
                updateSongInfo={updateSongInfo}
                updateGenreKeyword={updateGenreKeyword}
              />
              {/* SONG COMPOSER NAME */}
              <SongComposerInput songComposer={songInfo.composer} updateSongInfo={updateSongInfo} />
              {/* SONG TRACK NUMBER */}
              <SongTrackNumberInput
                songTrackNumber={songInfo.trackNumber}
                updateSongInfo={updateSongInfo}
              />
              <hr className="horizontal-rule col-span-2 h-[0.1rem] w-[95%] border-0 bg-background-color-2 dark:bg-dark-background-color-2" />
              {/* SONG LYRICS EDITOR */}
              <SongLyricsEditorInput
                songTitle={songInfo.title}
                songId={songId}
                songArtists={songInfo.artists}
                songPath={songPath}
                album={songInfo.album?.title}
                duration={songInfo.duration}
                synchronizedLyrics={songInfo.synchronizedLyrics}
                unsynchronizedLyrics={songInfo.unsynchronizedLyrics}
                isLyricsSavingPending={songInfo.isLyricsSavePending}
                updateSongInfo={updateSongInfo}
              />
              <hr className="horizontal-rule col-span-2 h-[0.1rem] w-[95%] border-0 bg-background-color-2 dark:bg-dark-background-color-2" />
            </div>

            <div className="id3-control-buttons-container mt-4 flex p-4">
              <Button
                key={0}
                label={t('songTagsEditingPage.saveTags')}
                iconName="save"
                iconClassName="material-icons-round-outlined"
                isDisabled={!areThereDataChanges}
                className="update-song-tags-btn"
                clickHandler={saveTags}
              />
              <Button
                key={1}
                label={t('resetTagsToDefaultPrompt.resetToDefault')}
                iconName="restart_alt"
                className="reset-song-tags-btn"
                isDisabled={!areThereDataChanges}
                clickHandler={resetDataToDefaults}
              />
            </div>
            {isEditingCurrentlyPlayingSong && areThereDataChanges && (
              <p className="appear-from-bottom mb-2 ml-2 flex items-center text-sm font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
                <span className="material-icons-round-outlined mr-2 text-xl">error</span>{' '}
                {t('songTagsEditingPage.updateAddedToBeSavedLater')}
              </p>
            )}
            {isMetadataUpdatesPending && (
              <p className="appear-from-bottom mb-2 ml-2 flex items-center text-sm font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
                <span className="material-icons-round-outlined mr-2 text-xl">error</span>{' '}
                {t('songTagsEditingPage.pendingUpdateAvailable')}
              </p>
            )}
          </>
        )}

        {!isMetadataEditingSupported && (
          <div className="flex !h-full flex-col items-center justify-center dark:text-white/80">
            <span className="material-icons-round-outlined text-6xl">campaign</span>
            <p className="mt-2 text-2xl">{t('songTagsEditingPage.saveTagsNotSupportedTitle')}</p>
            <p
              className="mt-4 cursor-pointer text-xs font-light opacity-50"
              title={window.api.utils.removeDefaultAppProtocolFromFilePath(songPath)}
            >
              {window.api.utils.getBaseName(songPath)}
            </p>
            <Trans
              i18nKey="songTagsEditingPage.saveTagsNotSupportedDescription"
              components={{
                P1: <p className="mt-2 px-8 font-light" />,
                P2: <p className="px-8 font-light" />,
                Format: (
                  <span className="font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
                    {pathExt}
                  </span>
                ),
                SupportedFormat: (
                  <span className="font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
                    mp3
                  </span>
                )
              }}
            />

            <Button
              label={t('common.goBack')}
              iconName="arrow_back"
              className="mt-4"
              clickHandler={() => updatePageHistoryIndex('decrement')}
            />
          </div>
        )}
      </>
    </MainContainer>
  );
}

export default SongTagsEditingPage;
