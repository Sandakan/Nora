/* eslint-disable promise/catch-or-return */
import { useCallback, useContext, useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import calculateTime from '../../utils/calculateTime';
import isLyricsSynced from '../../../../common/isLyricsSynced';

import { type ExtendedEditingLyricsLineData } from './LyricsEditingPage';
import Button from '../Button';
import Hyperlink from '../Hyperlink';

import { appPreferences } from '../../../../../package.json';

const { metadataEditingSupportedExtensions } = appPreferences;

type Props = {
  lyricsLines: ExtendedEditingLyricsLineData[];
  currentSongData: AudioPlayerData;
  isEditingEnhancedSyncedLyrics: boolean;
};

const generateTimestamp = (start = 0, format: '[]' | '<>' = '[]') => {
  const { minutes, seconds } = calculateTime(start, false);
  const [secsStr, milliSecsStr = '00'] = seconds.toString().split('.');

  const timestampContents = `${minutes.length > 1 ? minutes : `0${minutes}`}:${
    secsStr.length > 1 ? secsStr : `0${secsStr}`
  }.${milliSecsStr.length > 1 ? milliSecsStr : `0${milliSecsStr}`}`;

  if (format === '[]') return `[${timestampContents}]`;
  return `<${timestampContents}>`;
};

const convertLyricsStrToObj = (
  lyricsLines: ExtendedEditingLyricsLineData[],
  currentSongData: AudioPlayerData,
  isEditingEnhancedSyncedLyrics: boolean
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
    const { text, start = 0 } = lineData;

    if (isEditingEnhancedSyncedLyrics && Array.isArray(text))
      return text
        .map((textData, i) => {
          const timestamp = generateTimestamp(textData.start, i === 0 ? '[]' : '<>');
          return `${timestamp} ${textData.text}`;
        })
        .join(' ');

    const timestamp = generateTimestamp(start, '[]');
    return `${timestamp} ${text}`;
  });

  const lyrics = metadataLines.concat(lines).join('\n');

  const isSynced = isLyricsSynced(lyrics);
  const parsedLyrics: LyricLine[] | undefined =
    lyricsLines.length > 0
      ? lyricsLines.map((line) => {
          return {
            originalText: Array.isArray(line.text)
              ? line.text.map((textLine) => textLine.text).join(' ')
              : line.text,
            translatedTexts: [],
            isEnhancedSynced: false,
            start: line.start || 0,
            end: line.end || 0
          };
        })
      : [];

  const obj: SongLyrics = {
    title,
    source: 'IN_SONG_LYRICS',
    lyrics: {
      isTranslated: false,
      isSynced,
      unparsedLyrics: lyrics,
      parsedLyrics,
      offset: 0,
      isReset: false,
      isRomanized: false
    },
    lyricsType: isSynced ? 'SYNCED' : 'UN_SYNCED',
    isOfflineLyricsAvailable: false
  };
  return obj;
};

const LyricsEditorSavePrompt = (props: Props) => {
  const { addNewNotifications, changePromptMenuData } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const { lyricsLines, currentSongData, isEditingEnhancedSyncedLyrics } = props;

  const parsedLyrics = useMemo(
    () => convertLyricsStrToObj(lyricsLines, currentSongData, isEditingEnhancedSyncedLyrics),
    [currentSongData, isEditingEnhancedSyncedLyrics, lyricsLines]
  );

  const pathExt = useMemo(
    () => window.api.utils.getExtension(currentSongData.path),
    [currentSongData.path]
  );

  const isSaveLyricsBtnDisabled = useMemo(
    () => !metadataEditingSupportedExtensions.includes(pathExt),
    [pathExt]
  );

  const copyLyrics = useCallback(
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

  const saveLyricsToSong = useCallback(
    (
      _: unknown,
      setIsDisabled: (state: boolean) => void,
      setIsPending: (state: boolean) => void
    ) => {
      if (
        parsedLyrics &&
        !isSaveLyricsBtnDisabled &&
        currentSongData.title === parsedLyrics.title
      ) {
        setIsDisabled(true);
        setIsPending(true);

        window.api.lyrics
          .saveLyricsToSong(currentSongData.path, parsedLyrics)
          .then(() => {
            changePromptMenuData(false);
            return addNewNotifications([
              {
                id: 'lyricsUpdateSuccessful',
                duration: 5000,
                content: t('lyricsEditorSavePrompt.lyricsUpdateSuccess'),
                iconName: 'check'
              }
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
      isSaveLyricsBtnDisabled,
      parsedLyrics,
      t
    ]
  );

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="title-container mb-4 flex w-full items-center text-3xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        <span className="material-icons-round-outlined mr-2 text-4xl">save</span>{' '}
        {t('lyricsEditorSavePrompt.saveEditedLyrics')}
      </div>
      <textarea
        className="h-[40vh] max-h-full min-h-[10rem] w-full overflow-y-auto rounded-lg bg-background-color-2 p-4 dark:bg-dark-background-color-2"
        value={parsedLyrics?.lyrics.unparsedLyrics}
        readOnly
      />
      <div className="mt-6 flex items-center justify-center">
        <Button
          label={t('lyricsEditorSavePrompt.copyLyrics')}
          iconName="content_copy"
          iconClassName="material-icons-round-outlined"
          clickHandler={copyLyrics}
        />
        <Button
          label={t('lyricsEditorSavePrompt.saveLyricsToSong')}
          iconName="save"
          iconClassName="material-icons-round-outlined"
          clickHandler={saveLyricsToSong}
          isDisabled={isSaveLyricsBtnDisabled}
          tooltipLabel={
            isSaveLyricsBtnDisabled
              ? t('lyricsEditorSavePrompt.saveLyricsNotSupported', {
                  format: pathExt
                })
              : undefined
          }
        />
      </div>
      <p className="mt-2 text-xs font-light">
        <Trans
          i18nKey="lyricsEditorSavePrompt.saveLyricsFormatInfo"
          components={{
            Hyperlink: (
              <Hyperlink
                link="https://wikipedia.org/wiki/LRC_(file_format)"
                linkTitle={t('lyricsEditorSavePrompt.readAboutLrcFormat')}
              />
            )
          }}
        />
      </p>
    </div>
  );
};

export default LyricsEditorSavePrompt;
