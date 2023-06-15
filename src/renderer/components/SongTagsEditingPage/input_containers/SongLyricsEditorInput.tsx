/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import Button from 'renderer/components/Button';
import Hyperlink from 'renderer/components/Hyperlink';
import { syncedLyricsRegex } from 'renderer/components/LyricsPage/LyricsPage';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import useNetworkConnectivity from 'renderer/hooks/useNetworkConnectivity';

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
  songLyrics?: string;
  // eslint-disable-next-line no-unused-vars
  updateSongInfo: (callback: (prevSongInfo: SongTags) => SongTags) => void;
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
    songLyrics,
    updateSongInfo,
    duration,
    songPath,
  } = props;

  const isLyricsSynced = React.useMemo(
    () => syncedLyricsRegex.test(songLyrics || ''),
    [songLyrics]
  );

  const downloadLyrics = React.useCallback(
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
            duration,
            songPath,
          },
          'UN_SYNCED',
          'ONLINE_ONLY'
        )
        .then((res) => {
          if (res) {
            updateSongInfo((prevData) => ({
              ...prevData,
              lyrics: res.lyrics.unparsedLyrics,
            }));
            setIsDisabled(false);
            setIsPending(false);
          }
          return undefined;
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
    ]
  );

  const downloadSyncedLyrics = React.useCallback(
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
            duration,
            songPath,
          },
          'SYNCED',
          'ONLINE_ONLY'
        )
        .then((res) => {
          if (res) {
            updateSongInfo((prevData) => ({
              ...prevData,
              lyrics: res.lyrics.unparsedLyrics,
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
    ]
  );

  return (
    <div className="song-lyrics-editor-container col-span-2 grid w-[95%] grid-cols-[minmax(50%,65%)_1fr] gap-8">
      <div className="tag-input mb-6 flex h-full min-w-[10rem] flex-col">
        <label htmlFor="song-lyrics-id3-tag">Lyrics</label>
        <textarea
          id="song-lyrics-id3-tag"
          className="mt-4 max-h-80 min-h-[12rem] rounded-2xl border-[0.15rem] border-background-color-2 bg-background-color-1 p-4 transition-colors focus:border-font-color-highlight dark:border-dark-background-color-2 dark:bg-dark-background-color-1 dark:focus:border-dark-font-color-highlight"
          name="lyrics"
          placeholder="Lyrics"
          value={songLyrics ?? ''}
          onKeyDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            const lyrics = e.currentTarget.value;
            updateSongInfo((prevData) => ({
              ...prevData,
              lyrics,
            }));
          }}
        />
        <div className="ml-2 mt-1 flex items-center">
          <span
            className={`material-icons-round-outlined mr-2 cursor-pointer !text-lg ${
              isLyricsSynced &&
              'text-font-color-highlight-2 dark:text-dark-font-color-highlight-2'
            }`}
            title={
              songLyrics
                ? isLyricsSynced
                  ? 'Lyrics are synced.'
                  : 'Lyrics are not synced.'
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
        />
        <Button
          key={1}
          label="Download Synced Lyrics"
          iconName="download"
          className="download-synced-lyrics-btn mt-4"
          iconClassName="mr-2"
          clickHandler={downloadSyncedLyrics}
          isDisabled={
            !(isOnline && userData?.preferences.isMusixmatchLyricsEnabled)
          }
          tooltipLabel={
            isOnline
              ? userData?.preferences.isMusixmatchLyricsEnabled
                ? undefined
                : 'You have to enable Musixmatch Lyrics from Settings to use this feature.'
              : 'You are not connected to the internet.'
          }
        />
        <Button
          key={0}
          label="Edit in Lyrics Editor"
          iconName="edit"
          iconClassName="mr-2"
          className="edit-lyrics-btn mt-4"
          clickHandler={() =>
            songLyrics &&
            changeCurrentActivePage('LyricsEditor', {
              lyrics: songLyrics,
              songId,
              songTitle,
            })
          }
          tooltipLabel={
            songLyrics
              ? isLyricsSynced
                ? 'Synced lyrics still not supported.'
                : 'Edit available lyrics in the Lyrics Editor.'
              : 'No lyrics found'
          }
          isDisabled={songLyrics ? isLyricsSynced : true}
        />
      </div>
    </div>
  );
};

export default SongLyricsEditorInput;
