import { useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AppUpdateContext } from '../../../contexts/AppUpdateContext';
import Button from '../../Button';
import Hyperlink from '../../Hyperlink';
import useNetworkConnectivity from '../../../hooks/useNetworkConnectivity';
import isLyricsSynced, { isLyricsEnhancedSynced } from '../../../../../common/isLyricsSynced';
import { useQuery } from '@tanstack/react-query';
import { settingsQuery } from '@renderer/queries/settings';

type CurrentLyricsTYpe = 'synced' | 'unsynced';

type Props = {
  songTitle: string;
  songId: number;
  songArtists?: {
    artistId?: number | undefined;
    name: string;
    artworkPath?: string | undefined;
    onlineArtworkPaths?: OnlineArtistArtworks | undefined;
  }[];
  songPath: string;
  album?: string;
  duration: number;
  synchronizedLyrics?: string;
  unsynchronizedLyrics?: string;
  isLyricsSavingPending?: boolean;

  updateSongInfo: (callback: (prevSongInfo: SongTags) => SongTags) => void;
};

const SongLyricsEditorInput = (props: Props) => {
  const { data: userData } = useQuery(settingsQuery.all);

  const { addNewNotifications } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const { isOnline } = useNetworkConnectivity();

  const {
    songTitle,
    // songId,
    songArtists,
    synchronizedLyrics,
    unsynchronizedLyrics,
    isLyricsSavingPending = false,
    updateSongInfo,
    duration,
    album,
    songPath
  } = props;

  const [currentLyricsType, setCurrentLyricsType] = useState<CurrentLyricsTYpe>(
    synchronizedLyrics ? 'synced' : 'unsynced'
  );

  const {
    isSynchronizedLyricsSynced,
    isUnsynchronizedLyricsSynced,
    isSynchronizedLyricsEnhancedSynced
  } = useMemo(() => {
    let isSyncedLyricsSynced = false;
    let isSyncedLyricsEnhancedSynced = false;
    let isUnsyncedLyricsSynced = false;

    if (synchronizedLyrics) {
      isSyncedLyricsSynced = isLyricsSynced(synchronizedLyrics);
      isSyncedLyricsEnhancedSynced = isLyricsEnhancedSynced(synchronizedLyrics);
    }
    if (unsynchronizedLyrics) isUnsyncedLyricsSynced = isLyricsSynced(unsynchronizedLyrics);

    return {
      isSynchronizedLyricsSynced: isSyncedLyricsSynced,
      isSynchronizedLyricsEnhancedSynced: isSyncedLyricsEnhancedSynced,
      isUnsynchronizedLyricsSynced: isUnsyncedLyricsSynced
    };
  }, [synchronizedLyrics, unsynchronizedLyrics]);

  // useEffect(() => {
  //   setCurrentLyricsType(synchronizedLyrics ? 'synced' : 'unsynced');
  // }, [synchronizedLyrics]);

  const downloadLyrics = useCallback(
    (
      _: unknown,
      setIsDisabled: (state: boolean) => void,
      setIsPending: (state: boolean) => void
    ) => {
      setIsDisabled(true);
      setIsPending(true);
      window.api.lyrics
        .getSongLyrics(
          {
            songTitle,
            songArtists: songArtists?.map((artist) => artist.name),
            album,
            duration,
            songPath
          },
          'UN_SYNCED',
          'ONLINE_ONLY'
        )
        .then((res) => {
          if (res) {
            updateSongInfo((prevData) => ({
              ...prevData,
              unsynchronizedLyrics: res.lyrics.unparsedLyrics
            }));
          }
          return undefined;
        })
        .finally(() => {
          setIsDisabled(false);
          setIsPending(false);
        })
        .catch((err) => {
          addNewNotifications([
            {
              id: `fetchUnsyncedLyricsFailed`,
              duration: 5000,
              content: <span>Failed to fetch un-synced lyrics.</span>,
              icon: <span className="material-icons-round icon">warning</span>
            }
          ]);
          console.error(err);
        });
    },
    [addNewNotifications, album, duration, songArtists, songPath, songTitle, updateSongInfo]
  );

  const downloadSyncedLyrics = useCallback(
    (
      _: unknown,
      setIsDisabled: (state: boolean) => void,
      setIsPending: (state: boolean) => void
    ) => {
      setIsDisabled(true);
      setIsPending(true);
      window.api.lyrics
        .getSongLyrics(
          {
            songTitle,
            songArtists: songArtists?.map((artist) => artist.name),
            album,
            duration,
            songPath
          },
          'SYNCED',
          'ONLINE_ONLY'
        )
        .then((res) => {
          if (res) {
            updateSongInfo((prevData) => ({
              ...prevData,
              synchronizedLyrics: res.lyrics.unparsedLyrics
            }));
            setIsDisabled(false);
            return setIsPending(false);
          }
          throw new Error('download synced lyrics failed.');
        })
        .catch((err) => {
          addNewNotifications([
            {
              id: `fetchSyncedLyricsFailed`,
              duration: 5000,
              content: t('songTagsEditingPage.syncedLyricsFetchFailed'),
              iconName: 'warning'
            }
          ]);
          setIsPending(false);
          console.error(err);
        });
    },
    [addNewNotifications, album, duration, songArtists, songPath, songTitle, t, updateSongInfo]
  );

  const goToLyricsEditor = useCallback(() => {
    if (synchronizedLyrics || unsynchronizedLyrics) {
      // const lyrics = currentLyricsType === 'synced' ? synchronizedLyrics : unsynchronizedLyrics;
      // const { parsedLyrics } = parseLyrics(lyrics as string);
      // const lines: LyricData[] = parsedLyrics.map((lyric) => ({
      //   text: lyric.originalText,
      //   start: lyric.start,
      //   end: lyric.end
      // }));
      // TODO: Implement lyrics editor page navigation
      // changeCurrentActivePage('LyricsEditor', {
      //   lyrics: lines,
      //   songId,
      //   songTitle,
      //   isEditingEnhancedSyncedLyrics: currentLyricsType === 'synced' && isLyricsEnhancedSynced
      // });
    }
  }, [synchronizedLyrics, unsynchronizedLyrics]);

  return (
    <div className="song-lyrics-editor-container col-span-2 grid w-[95%] grid-cols-[minmax(50%,65%)_1fr] gap-8">
      <div className="tag-input mb-6 flex h-full min-w-[10rem] flex-col">
        {/* <label htmlFor="song-lyrics-id3-tag">Lyrics</label> */}
        <div className="flex items-center">
          <Button
            className={`text-font-color-black mr-3 flex w-fit cursor-pointer list-none items-center !border-0 px-4 py-2 outline-offset-1 transition-[background,color] duration-200 focus-visible:!outline ${
              currentLyricsType === 'synced'
                ? 'bg-background-color-3 dark:bg-dark-background-color-3 dark:text-font-color-black!'
                : 'bg-background-color-2 hover:bg-background-color-3 dark:bg-dark-background-color-2 dark:text-font-color-white dark:hover:bg-dark-background-color-3 dark:hover:text-font-color-black!'
            }`}
            clickHandler={() => setCurrentLyricsType('synced')}
            label={t('common.syncedLyrics')}
            iconName="timer"
            iconClassName="material-icons-round-outlined"
          />
          <Button
            className={`text-font-color-black mr-3 flex w-fit cursor-pointer list-none items-center !border-0 px-4 py-2 outline-offset-1 transition-[background,color] duration-200 focus-visible:!outline ${
              currentLyricsType === 'unsynced'
                ? 'bg-background-color-3 dark:bg-dark-background-color-3 dark:text-font-color-black!'
                : 'bg-background-color-2 hover:bg-background-color-3 dark:bg-dark-background-color-2 dark:text-font-color-white dark:hover:bg-dark-background-color-3 dark:hover:text-font-color-black!'
            }`}
            clickHandler={() => setCurrentLyricsType('unsynced')}
            label={t('common.unsyncedLyrics')}
            iconName="timer_off"
            iconClassName="material-icons-round-outlined"
          />
        </div>

        <textarea
          id="song-lyrics-id3-tag"
          className="border-background-color-2 bg-background-color-2 focus:border-font-color-highlight dark:border-dark-background-color-2 dark:bg-dark-background-color-2 dark:focus:border-dark-font-color-highlight mt-4 max-h-80 min-h-[12rem] rounded-2xl border-[0.15rem] p-4 transition-colors"
          name="lyrics"
          placeholder={t('common.lyrics')}
          value={
            currentLyricsType === 'synced'
              ? (synchronizedLyrics ?? '')
              : (unsynchronizedLyrics ?? '')
          }
          onKeyDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            const lyrics = e.currentTarget.value;
            updateSongInfo((prevData): SongTags => {
              if (currentLyricsType === 'synced')
                return {
                  ...prevData,
                  synchronizedLyrics: lyrics
                };
              return {
                ...prevData,
                unsynchronizedLyrics: lyrics
              };
            });
          }}
        />
        {currentLyricsType === 'synced' && (
          <div className="mt-1 ml-2 flex items-center">
            <span
              className={`material-icons-round-outlined mr-2 cursor-pointer !text-lg ${
                isSynchronizedLyricsEnhancedSynced &&
                'text-font-color-highlight-2 dark:text-dark-font-color-highlight-2'
              }`}
              title={
                synchronizedLyrics
                  ? t(
                      `songTagsEditingPage.${
                        isSynchronizedLyricsEnhancedSynced
                          ? 'lyricsEnhancedSynced'
                          : 'lyricsNotEnhancedSynced'
                      }`
                    )
                  : undefined
              }
            >
              verified
            </span>
            <span className="text-sm font-extralight">
              {t('songTagsEditingPage.enhancedLyricsSupported')}{' '}
              <Hyperlink
                link="https://wikipedia.org/wiki/LRC_(file_format)"
                label={t('songTagsEditingPage.readMoreAboutLrc')}
              />
            </span>
          </div>
        )}

        {synchronizedLyrics && !isSynchronizedLyricsSynced && (
          <p className="text-font-color-highlight dark:text-dark-font-color-highlight mt-2 ml-2 flex items-center text-sm font-medium">
            <span className="material-icons-round-outlined mr-2 text-xl">error</span>{' '}
            {t('songTagsEditingPage.avoidUnsyncedOnSyncedLyricsTab')}
          </p>
        )}
        {unsynchronizedLyrics && isUnsynchronizedLyricsSynced && (
          <p className="text-font-color-highlight dark:text-dark-font-color-highlight mt-2 ml-2 flex text-sm font-medium">
            <span className="material-icons-round-outlined mr-2 text-xl">error</span>{' '}
            {t('songTagsEditingPage.avoidSyncedOnUnsyncedLyricsTab')}
          </p>
        )}

        {isLyricsSavingPending && (
          <p className="text-font-color-highlight dark:text-dark-font-color-highlight mt-2 ml-2 flex items-center text-sm font-medium">
            <span className="material-icons-round-outlined mr-2 text-xl">error</span>{' '}
            {t('songTagsEditingPage.pendingLyricsSavesAvailable')}
          </p>
        )}
      </div>
      <div className="song-lyrics-buttons mt-12 flex flex-col items-end">
        <Button
          key={0}
          label={t('songTagsEditingPage.downloadLyrics')}
          iconName="download"
          iconClassName="mr-2"
          className="download-lyrics-btn"
          clickHandler={downloadLyrics}
          tooltipLabel={isOnline ? undefined : t('common.noInternet')}
          isDisabled={!isOnline}
          isVisible={currentLyricsType === 'unsynced'}
        />
        <Button
          key={1}
          label={t('songTagsEditingPage.downloadSyncedLyrics')}
          iconName="download"
          className="download-synced-lyrics-btn"
          iconClassName="mr-2"
          clickHandler={downloadSyncedLyrics}
          isDisabled={!(isOnline && userData?.isMusixmatchLyricsEnabled)}
          isVisible={currentLyricsType === 'synced'}
          tooltipLabel={
            isOnline
              ? userData?.isMusixmatchLyricsEnabled
                ? undefined
                : t('songTagsEditingPage.musixmatchNotEnabled')
              : t('common.noInternet')
          }
        />
        <Button
          key={2}
          label={t('lyricsPage.editLyrics')}
          iconName="edit"
          iconClassName="mr-2"
          className="edit-lyrics-btn mt-4"
          clickHandler={goToLyricsEditor}
          tooltipLabel={t(`lyricsPage.${synchronizedLyrics ? 'editLyrics' : 'noLyrics'}`)}
          isDisabled={currentLyricsType === 'synced' ? false : !unsynchronizedLyrics}
        />
      </div>
    </div>
  );
};

export default SongLyricsEditorInput;
