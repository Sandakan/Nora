/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import Button from 'renderer/components/Button';
import Hyperlink from 'renderer/components/Hyperlink';
import { EditingLyricsLineData } from 'renderer/components/LyricsEditingPage/LyricsEditingPage';
import { syncedLyricsRegex } from 'renderer/components/LyricsPage/LyricsPage';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import useNetworkConnectivity from 'renderer/hooks/useNetworkConnectivity';
import parseLyrics from 'renderer/utils/parseLyrics';

type CurrentLyricsTYpe = 'synced' | 'unsynced';

type Props = {
  songTitle: string;
  songId: string;
  songArtists?: {
    artistId?: string | undefined;
    name: string;
    artworkPath?: string | undefined;
    onlineArtworkPaths?: OnlineArtistArtworks | undefined;
  }[];
  songPath: string;
  duration: number;
  synchronizedLyrics?: string;
  unsynchronizedLyrics?: string;
  isLyricsSavingPending?: boolean;
  // eslint-disable-next-line no-unused-vars
  updateSongInfo: (callback: (prevSongInfo: SongTags) => SongTags) => void;
};

export const extendedSyncedLyricsLineRegex =
  /(?<extSyncTimeStamp><\d+:\d{1,2}\.\d{1,3}>) ?(?=(?<lyric>[^<>\n]+))/gm;

const isLyricsSynchronized = (lyrics: string) => {
  const isSynced = syncedLyricsRegex.test(lyrics);
  syncedLyricsRegex.lastIndex = 0;

  return isSynced;
};

export const isLyricsEnhancedSynced = (syncedLyricsString: string) => {
  const isEnhancedSynced =
    extendedSyncedLyricsLineRegex.test(syncedLyricsString);
  extendedSyncedLyricsLineRegex.lastIndex = 0;

  return isEnhancedSynced;
};

const SongLyricsEditorInput = (props: Props) => {
  const { userData } = React.useContext(AppContext);
  const { addNewNotifications, changeCurrentActivePage } =
    React.useContext(AppUpdateContext);

  const { isOnline } = useNetworkConnectivity();

  const {
    songTitle,
    songId,
    songArtists,
    synchronizedLyrics,
    unsynchronizedLyrics,
    isLyricsSavingPending = false,
    updateSongInfo,
    duration,
    songPath,
  } = props;

  const [currentLyricsType, setCurrentLyricsType] =
    React.useState<CurrentLyricsTYpe>(
      synchronizedLyrics ? 'synced' : 'unsynced',
    );

  const {
    isSynchronizedLyricsSynced,
    isUnsynchronizedLyricsSynced,
    isSynchronizedLyricsEnhancedSynced,
  } = React.useMemo(() => {
    let isSyncedLyricsSynced = false;
    let isSyncedLyricsEnhancedSynced = false;
    let isUnsyncedLyricsSynced = false;

    if (synchronizedLyrics) {
      isSyncedLyricsSynced = isLyricsSynchronized(synchronizedLyrics);
      isSyncedLyricsEnhancedSynced = isLyricsEnhancedSynced(synchronizedLyrics);
    }
    if (unsynchronizedLyrics)
      isUnsyncedLyricsSynced = isLyricsSynchronized(unsynchronizedLyrics);

    return {
      isSynchronizedLyricsSynced: isSyncedLyricsSynced,
      isSynchronizedLyricsEnhancedSynced: isSyncedLyricsEnhancedSynced,
      isUnsynchronizedLyricsSynced: isUnsyncedLyricsSynced,
    };
  }, [synchronizedLyrics, unsynchronizedLyrics]);

  // React.useEffect(() => {
  //   setCurrentLyricsType(synchronizedLyrics ? 'synced' : 'unsynced');
  // }, [synchronizedLyrics]);

  const downloadLyrics = React.useCallback(
    (
      _: unknown,
      setIsDisabled: (state: boolean) => void,
      setIsPending: (state: boolean) => void,
    ) => {
      setIsDisabled(true);
      setIsPending(true);
      window.api.lyrics
        .getSongLyrics(
          {
            songTitle,
            songArtists: songArtists?.map((artist) => artist.name),
            duration,
            songPath,
          },
          'UN_SYNCED',
          'ONLINE_ONLY',
        )
        .then((res) => {
          if (res) {
            updateSongInfo((prevData) => ({
              ...prevData,
              unsynchronizedLyrics: res.lyrics.unparsedLyrics,
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
              delay: 5000,
              content: <span>Failed to fetch un-synced lyrics.</span>,
              icon: <span className="material-icons-round icon">warning</span>,
            },
          ]);
          console.error(err);
        });
    },
    [
      addNewNotifications,
      duration,
      songArtists,
      songPath,
      songTitle,
      updateSongInfo,
    ],
  );

  const downloadSyncedLyrics = React.useCallback(
    (
      _: unknown,
      setIsDisabled: (state: boolean) => void,
      setIsPending: (state: boolean) => void,
    ) => {
      setIsDisabled(true);
      setIsPending(true);
      window.api.lyrics
        .getSongLyrics(
          {
            songTitle,
            songArtists: songArtists?.map((artist) => artist.name),
            duration,
            songPath,
          },
          'SYNCED',
          'ONLINE_ONLY',
        )
        .then((res) => {
          if (res) {
            updateSongInfo((prevData) => ({
              ...prevData,
              synchronizedLyrics: res.lyrics.unparsedLyrics,
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
              delay: 5000,
              content: <span>Failed to fetch synced lyrics.</span>,
              icon: (
                <span className="material-icons-round-outlined icon">
                  warning
                </span>
              ),
            },
          ]);
          setIsPending(false);
          console.error(err);
        });
    },
    [
      addNewNotifications,
      duration,
      songArtists,
      songPath,
      songTitle,
      updateSongInfo,
    ],
  );

  const goToLyricsEditor = React.useCallback(() => {
    if (synchronizedLyrics || unsynchronizedLyrics) {
      const lyrics =
        currentLyricsType === 'synced'
          ? synchronizedLyrics
          : unsynchronizedLyrics;
      let lines: EditingLyricsLineData[] = [];
      const { isSynced, syncedLyrics, unsyncedLyrics } = parseLyrics(
        lyrics as string,
      );

      if (isSynced) lines = syncedLyrics;
      else {
        lines = unsyncedLyrics.map((line) => ({ text: line }));
      }

      changeCurrentActivePage('LyricsEditor', {
        lyrics: lines,
        songId,
        songTitle,
        isEditingEnhancedSyncedLyrics:
          currentLyricsType === 'synced' && isLyricsEnhancedSynced,
      });
    }
  }, [
    changeCurrentActivePage,
    currentLyricsType,
    songId,
    songTitle,
    synchronizedLyrics,
    unsynchronizedLyrics,
  ]);

  return (
    <div className="song-lyrics-editor-container col-span-2 grid w-[95%] grid-cols-[minmax(50%,65%)_1fr] gap-8">
      <div className="tag-input mb-6 flex h-full min-w-[10rem] flex-col">
        {/* <label htmlFor="song-lyrics-id3-tag">Lyrics</label> */}
        <div className="flex items-center">
          <Button
            className={`mr-3 flex w-fit cursor-pointer list-none items-center !border-0 px-4 py-1 text-font-color-black outline-1 outline-offset-1 transition-[background,color] duration-200 focus-visible:!outline ${
              currentLyricsType === 'synced'
                ? 'bg-background-color-3 dark:bg-dark-background-color-3 dark:!text-font-color-black'
                : 'bg-background-color-2 hover:bg-background-color-3 dark:bg-dark-background-color-2 dark:text-font-color-white dark:hover:bg-dark-background-color-3 dark:hover:!text-font-color-black'
            }`}
            clickHandler={() => setCurrentLyricsType('synced')}
            label="Synced Lyrics"
            iconName="timer"
            iconClassName="material-icons-round-outlined"
          />
          <Button
            className={`mr-3 flex w-fit cursor-pointer list-none items-center !border-0 px-4 py-1 text-font-color-black outline-1 outline-offset-1 transition-[background,color] duration-200 focus-visible:!outline ${
              currentLyricsType === 'unsynced'
                ? 'bg-background-color-3 dark:bg-dark-background-color-3 dark:!text-font-color-black'
                : 'bg-background-color-2 hover:bg-background-color-3 dark:bg-dark-background-color-2 dark:text-font-color-white dark:hover:bg-dark-background-color-3 dark:hover:!text-font-color-black'
            }`}
            clickHandler={() => setCurrentLyricsType('unsynced')}
            label="Unsynced Lyrics"
            iconName="timer_off"
            iconClassName="material-icons-round-outlined"
          />
        </div>

        <textarea
          id="song-lyrics-id3-tag"
          className="mt-4 max-h-80 min-h-[12rem] rounded-2xl border-[0.15rem] border-background-color-2 bg-background-color-2 p-4 transition-colors focus:border-font-color-highlight dark:border-dark-background-color-2 dark:bg-dark-background-color-2 dark:focus:border-dark-font-color-highlight"
          name="lyrics"
          placeholder="Lyrics"
          value={
            currentLyricsType === 'synced'
              ? synchronizedLyrics ?? ''
              : unsynchronizedLyrics ?? ''
          }
          onKeyDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            const lyrics = e.currentTarget.value;
            updateSongInfo((prevData): SongTags => {
              if (currentLyricsType === 'synced')
                return {
                  ...prevData,
                  synchronizedLyrics: lyrics,
                };
              return {
                ...prevData,
                unsynchronizedLyrics: lyrics,
              };
            });
          }}
        />
        {currentLyricsType === 'synced' && (
          <div className="ml-2 mt-1 flex items-center">
            <span
              className={`material-icons-round-outlined mr-2 cursor-pointer !text-lg ${
                isSynchronizedLyricsEnhancedSynced &&
                'text-font-color-highlight-2 dark:text-dark-font-color-highlight-2'
              }`}
              title={
                synchronizedLyrics
                  ? isSynchronizedLyricsEnhancedSynced
                    ? 'Lyrics are enhanced synced.'
                    : 'Lyrics are not enhanced synced.'
                  : undefined
              }
            >
              verified
            </span>
            <span className="text-sm font-extralight">
              Enhanced Synced lyrics supported.{' '}
              <Hyperlink
                link="https://wikipedia.org/wiki/LRC_(file_format)"
                linkTitle="Read more about LRC format"
                label="Read more about LRC format."
              />
            </span>
          </div>
        )}

        {synchronizedLyrics && !isSynchronizedLyricsSynced && (
          <p className="ml-2 mt-2 text-sm font-medium flex items-center text-font-color-highlight dark:text-dark-font-color-highlight">
            <span className="material-icons-round-outlined text-xl mr-2">
              error
            </span>{' '}
            Avoid entering Unsynchronized Lyrics in the Synchronized Lyrics Tab.
          </p>
        )}
        {unsynchronizedLyrics && isUnsynchronizedLyricsSynced && (
          <p className="ml-2 mt-2 text-sm font-medium flex text-font-color-highlight dark:text-dark-font-color-highlight">
            <span className="material-icons-round-outlined text-xl mr-2">
              error
            </span>{' '}
            Avoid entering Synchronized Lyrics in the Unsynchronized Lyrics Tab.
          </p>
        )}

        {isLyricsSavingPending && (
          <p className="ml-2 mt-2 text-sm font-medium flex items-center text-font-color-highlight dark:text-dark-font-color-highlight">
            <span className="material-icons-round-outlined text-xl mr-2">
              error
            </span>{' '}
            There are pending lyrics to be saved to this song. They will be
            saved and will be visible here after the current song is finished.
          </p>
        )}
      </div>
      <div className="song-lyrics-buttons mt-12 flex flex-col items-end">
        <Button
          key={0}
          label="Download Lyrics"
          iconName="download"
          iconClassName="mr-2"
          className="download-lyrics-btn"
          clickHandler={downloadLyrics}
          tooltipLabel={
            isOnline ? undefined : 'You are not connected to the internet.'
          }
          isDisabled={!isOnline}
          isVisible={currentLyricsType === 'unsynced'}
        />
        <Button
          key={1}
          label="Download Synced Lyrics"
          iconName="download"
          className="download-synced-lyrics-btn"
          iconClassName="mr-2"
          clickHandler={downloadSyncedLyrics}
          isDisabled={
            !(isOnline && userData?.preferences.isMusixmatchLyricsEnabled)
          }
          isVisible={currentLyricsType === 'synced'}
          tooltipLabel={
            isOnline
              ? userData?.preferences.isMusixmatchLyricsEnabled
                ? undefined
                : 'You have to enable Musixmatch Lyrics from Settings to use this feature.'
              : 'You are not connected to the internet.'
          }
        />
        <Button
          key={2}
          label="Edit in Lyrics Editor"
          iconName="edit"
          iconClassName="mr-2"
          className="edit-lyrics-btn mt-4"
          clickHandler={goToLyricsEditor}
          tooltipLabel={
            synchronizedLyrics
              ? 'Edit available lyrics in the Lyrics Editor.'
              : 'No lyrics found'
          }
          isDisabled={
            currentLyricsType === 'synced' ? false : !unsynchronizedLyrics
          }
        />
      </div>
    </div>
  );
};

export default SongLyricsEditorInput;
