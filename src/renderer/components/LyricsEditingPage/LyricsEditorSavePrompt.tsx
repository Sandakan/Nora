import React from 'react';

import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import calculateTime from 'renderer/utils/calculateTime';
import isLyricsSynced from 'main/utils/isLyricsSynced';

import { ExtendedEditingLyricsLineData } from './LyricsEditingPage';
import Button from '../Button';
import Hyperlink from '../Hyperlink';

type Props = {
  lyricsLines: ExtendedEditingLyricsLineData[];
  currentSongData: AudioPlayerData;
};

const convertLyricsStrToObj = (
  lyricsLines: ExtendedEditingLyricsLineData[],
  currentSongData: AudioPlayerData
) => {
  const metadataLines: string[] = [];

  const { title, artists, album, duration } = currentSongData;
  const { minutes: min, seconds: sec } = calculateTime(duration, false);
  metadataLines.push(`[ti:${title}]`);
  metadataLines.push(`[length:${min}:${sec}]`);

  if (artists && artists?.length > 0)
    metadataLines.push(`[ar:${artists.map((x) => x.name).join(', ')}]`);
  if (album) metadataLines.push(`[al:${album.name}]`);
  metadataLines.push('');

  const lines = lyricsLines.map((lineData) => {
    const { line, start = 0 } = lineData;
    const { minutes, seconds } = calculateTime(start, false);
    const [secsStr, milliSecsStr = '00'] = seconds.toString().split('.');

    return `[${minutes.length > 1 ? minutes : `0${minutes}`}:${
      secsStr.length > 1 ? secsStr : `0${secsStr}`
    }.${milliSecsStr.length > 1 ? milliSecsStr : `0${milliSecsStr}`}] ${line}`;
  });

  const lyrics = metadataLines.concat(lines).join('\n');

  const isSynced = isLyricsSynced(lyrics);
  const syncedLyrics: SyncedLyricLine[] | undefined =
    lyricsLines.length > 0
      ? lyricsLines.map((line) => {
          return {
            text: line.line,
            start: line.start || 0,
            end: line.end || 0,
          };
        })
      : undefined;

  const obj: SongLyrics = {
    title,
    source: 'IN_SONG_LYRICS',
    lyrics: {
      isSynced,
      unparsedLyrics: lyrics,
      lyrics: lines,
      syncedLyrics,
    },
    lyricsType: isSynced ? 'SYNCED' : 'UN_SYNCED',
    isOfflineLyricsAvailable: false,
  };
  return obj;
};

const LyricsEditorSavePrompt = (props: Props) => {
  const { addNewNotifications, changePromptMenuData } =
    React.useContext(AppUpdateContext);
  const { lyricsLines, currentSongData } = props;

  const parsedLyrics = React.useMemo(
    () => convertLyricsStrToObj(lyricsLines, currentSongData),
    [currentSongData, lyricsLines]
  );

  //   React.useEffect(() => {
  //     const obj = convertLyricsStrToObj(lyricsLines, currentSongData);
  //     setParsedLyrics(obj);
  //   }, [currentSongData, lyricsLines]);

  const copyLyrics = React.useCallback(
    (
      _: unknown,
      setIsDisabled: (state: boolean) => void,
      setIsPending: (state: boolean) => void
    ) => {
      if (parsedLyrics?.lyrics.unparsedLyrics) {
        setIsDisabled(true);
        setIsPending(true);
        navigator.clipboard
          .writeText(parsedLyrics?.lyrics.unparsedLyrics)
          .then(() => {
            return console.log('Text copied to clipboard');
          })
          .catch((error) => {
            console.error('Failed to copy text:', error);
          })
          .finally(() => {
            setIsDisabled(false);
            setIsPending(false);
          });
      }
    },
    [parsedLyrics]
  );

  const saveLyricsToSong = React.useCallback(
    (
      _: unknown,
      setIsDisabled: (state: boolean) => void,
      setIsPending: (state: boolean) => void
    ) => {
      if (parsedLyrics && currentSongData.title === parsedLyrics.title) {
        setIsDisabled(true);
        setIsPending(true);

        window.api.lyrics
          .saveLyricsToSong(currentSongData.path, parsedLyrics)
          .then(() => {
            changePromptMenuData(false);
            return addNewNotifications([
              {
                id: 'lyricsUpdateSuccessful',
                delay: 5000,
                content: <span>Lyrics successfully updated.</span>,
                icon: (
                  <span className="material-icons-round-outlined !text-xl">
                    check
                  </span>
                ),
              },
            ]);
          })
          .catch((err) => console.error(err))
          .finally(() => {
            setIsPending(false);
            setIsDisabled(false);
          });
      }
    },
    [
      addNewNotifications,
      changePromptMenuData,
      currentSongData.path,
      currentSongData.title,
      parsedLyrics,
    ]
  );

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="title-container mb-4 flex w-full items-center text-3xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        <span className="material-icons-round-outlined mr-2 text-4xl">
          save
        </span>{' '}
        Save Edited Lyrics
      </div>
      <textarea
        className="h-[40vh] max-h-full min-h-[10rem] w-full overflow-y-auto rounded-lg bg-background-color-2 p-4 dark:bg-dark-background-color-2"
        readOnly
      >
        {parsedLyrics?.lyrics.unparsedLyrics}
      </textarea>
      <div className="mt-6 flex items-center justify-center">
        <Button
          label="Copy lyrics"
          iconName="content_copy"
          iconClassName="material-icons-round-outlined"
          clickHandler={copyLyrics}
        />
        <Button
          label="Save lyrics to the song"
          iconName="save"
          iconClassName="material-icons-round-outlined"
          clickHandler={saveLyricsToSong}
        />
      </div>
      <p className="mt-2 text-xs font-light">
        * Lyrics are saved in{' '}
        <Hyperlink
          link="https://wikipedia.org/wiki/LRC_(file_format)"
          linkTitle="Read more about LRC format"
          label="LRC format."
        />
        .
      </p>
    </div>
  );
};

export default LyricsEditorSavePrompt;
