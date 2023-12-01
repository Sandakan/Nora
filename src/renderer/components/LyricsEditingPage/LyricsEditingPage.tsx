import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { SongPositionContext } from 'renderer/contexts/SongPositionContext';

import roundTo from 'renderer/utils/roundTo';

import MainContainer from '../MainContainer';
import EditingLyricsLine from './EditingLyricsLine';
import Button from '../Button';
import LyricsEditorHelpPrompt from './LyricsEditorHelpPrompt';
import SensitiveActionConfirmPrompt from '../SensitiveActionConfirmPrompt';
import LyricsEditorSettingsPrompt from './LyricsEditorSettingsPrompt';
import LyricsEditorSavePrompt from './LyricsEditorSavePrompt';
import PageFocusPrompt from './PageFocusPrompt';

export interface LyricsLineData {
  text: string;
  start?: number;
  end?: number;
}

export interface EditingLyricsLineData {
  text: string | LyricsLineData[];
  start?: number;
  end?: number;
}
export interface ExtendedEditingLyricsLineData extends EditingLyricsLineData {
  index: number;
  isActive: boolean;
}
const LyricsEditingPage = () => {
  const { currentlyActivePage, currentSongData, localStorageData } =
    React.useContext(AppContext);
  const {
    changePromptMenuData,
    playSong,
    updateCurrentlyActivePageData,
    updateContextMenuData,
  } = React.useContext(AppUpdateContext);
  const { songPosition } = React.useContext(SongPositionContext);
  const { t } = useTranslation();

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const [isEditingEnhancedSyncedLyrics, setIsEditingEnhancedSyncedLyrics] =
    React.useState(false);
  const [lyricsLines, setLyricsLines] = React.useState<
    ExtendedEditingLyricsLineData[]
  >([]);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const offset = localStorageData.lyricsEditorSettings.offset || 0;
  const roundedSongPostion = roundTo(songPosition + offset, 2);

  const { songId, lyrics, songTitle } = React.useMemo(() => {
    const { data } = currentlyActivePage;

    setIsEditingEnhancedSyncedLyrics(
      typeof data.lyrics === 'object' && !!data.isEditingEnhancedSyncedLyrics,
    );

    return {
      songId: data.songId as string | undefined,
      lyrics: (data.lyrics || []) as EditingLyricsLineData[],
      songTitle: data.songTitle as string | undefined,
    };
  }, [currentlyActivePage]);

  const isTheEditingSongTheCurrSong = React.useMemo(
    () => currentSongData.songId === songId,
    [currentSongData.songId, songId],
  );

  React.useEffect(() => {
    if (lyrics) {
      const lines: ExtendedEditingLyricsLineData[] = lyrics.map(
        (lineData, index) => ({
          ...lineData,
          text:
            typeof lineData.text === 'string' && isEditingEnhancedSyncedLyrics
              ? lineData.text
                  .trim()
                  .split(' ')
                  .map((text): LyricsLineData => ({ text }))
              : lineData.text,
          index,
          isActive: false,
        }),
      );

      setLyricsLines(lines);
    }
  }, [isEditingEnhancedSyncedLyrics, lyrics]);

  React.useEffect(() => {
    updateCurrentlyActivePageData((prevData) => {
      return {
        ...prevData,
        isLowResponseRequired: isTheEditingSongTheCurrSong && isPlaying,
      };
    });
  }, [isPlaying, isTheEditingSongTheCurrSong, updateCurrentlyActivePageData]);

  const lyricsLineComponents = React.useMemo(() => {
    return lyricsLines.map((lyricsLine, index) => {
      const key =
        typeof lyricsLine.text === 'string'
          ? `${index}-${lyricsLine.text}`
          : `${index}-${lyricsLine.text.map((line) => line.text).join(' ')}`;

      return (
        <EditingLyricsLine
          isActive={lyricsLine.isActive}
          text={lyricsLine.text}
          index={index}
          key={key}
          start={lyricsLine.start}
          end={lyricsLine.end}
          updateLineData={(callback) => {
            setLyricsLines((prevLyricsLines) => {
              const updatedLyricsLines = callback(prevLyricsLines);
              return updatedLyricsLines.slice();
            });
          }}
          isPlaying={isPlaying}
        />
      );
    });
  }, [isPlaying, lyricsLines]);

  const handleShortcuts = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter') {
        e.stopPropagation();
        return setLyricsLines((prevLines) => {
          const slicedPrevLines = prevLines.slice();
          const lastActiveIndex = prevLines.findIndex((val) => val.isActive);

          if (e.shiftKey) {
            if (lastActiveIndex !== -1) {
              slicedPrevLines[lastActiveIndex].isActive =
                !slicedPrevLines[lastActiveIndex].isActive;
            }
            if (lastActiveIndex - 1 >= 0) {
              slicedPrevLines[lastActiveIndex - 1].isActive =
                !slicedPrevLines[lastActiveIndex - 1].isActive;
            }
          } else {
            if (lastActiveIndex !== -1) {
              slicedPrevLines[lastActiveIndex].isActive =
                !slicedPrevLines[lastActiveIndex].isActive;
              slicedPrevLines[lastActiveIndex].end = roundedSongPostion;
            }
            if (lastActiveIndex + 1 !== slicedPrevLines.length) {
              slicedPrevLines[lastActiveIndex + 1].isActive =
                !slicedPrevLines[lastActiveIndex + 1].isActive;
              slicedPrevLines[lastActiveIndex + 1].start = roundedSongPostion;
            }
          }
          return slicedPrevLines;
        });
      }

      return undefined;
    },
    [roundedSongPostion],
  );

  const moreOptionsContextMenuItems = React.useMemo((): ContextMenuItem[] => {
    return [
      {
        label: t('common.help'),
        iconName: 'help',
        iconClassName: 'material-icons-round-outlined',
        handlerFunction: () =>
          changePromptMenuData(true, <LyricsEditorHelpPrompt />),
      },
      {
        label: '',
        isContextMenuItemSeperator: true,
        handlerFunction: () => true,
      },
      {
        label: t('lyricsEditingPage.resetLyrics'),
        iconName: 'restart_alt',
        iconClassName: 'material-icons-round-outlined',
        handlerFunction: () => {
          changePromptMenuData(
            true,
            <SensitiveActionConfirmPrompt
              title={t('lyricsEditingPage.resetLyricsConfirm')}
              content={
                <Trans
                  i18nKey="lyricsEditingPage.resetLyricsConfirmMessage"
                  components={{
                    br: <br />,
                    p: <p />,
                    span: (
                      <span className="font-medium text-font-color-crimson" />
                    ),
                  }}
                />
              }
              confirmButton={{
                label: t('lyricsEditingPage.resetLyrics'),
                clickHandler: () => {
                  const lines: ExtendedEditingLyricsLineData[] = lyrics.map(
                    (lineData, index) => ({
                      ...lineData,
                      text:
                        typeof lineData.text === 'string' &&
                        isEditingEnhancedSyncedLyrics
                          ? lineData.text
                              .split(' ')
                              .map((text): LyricsLineData => ({ text }))
                          : lineData.text,
                      index,
                      isActive: false,
                    }),
                  );
                  setLyricsLines(lines);
                },
              }}
            />,
          );
        },
      },
    ];
  }, [changePromptMenuData, isEditingEnhancedSyncedLyrics, lyrics, t]);

  return (
    <MainContainer
      className="appear-from-bottom relative !h-full overflow-hidden !pb-0 text-font-color-black dark:text-font-color-white"
      onKeyDown={handleShortcuts}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      ref={containerRef}
      focusable
      autoFocus
    >
      {!isTheEditingSongTheCurrSong && (
        <div className="absolute z-10 flex h-full w-full flex-col items-center justify-center bg-background-color-1/25 pr-8 dark:bg-dark-background-color-1/25">
          <span className="material-icons-round-outlined text-5xl">error</span>
          <p className="mt-2 text-3xl font-medium">
            {t('lyricsEditingPage.incorrectSongTitle')}
          </p>
          <p>
            {t('lyricsEditingPage.incorrectSongMessage', { title: songTitle })}
          </p>
          <Button
            label={t('common.play')}
            iconName="play_arrow"
            className="!mr-0 mt-4"
            clickHandler={() => songId && playSong(songId)}
          />
        </div>
      )}
      <div className="title-container mb-8 mt-1 flex items-center pr-4 text-3xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        <div className="gap-4s container grid grid-cols-[clamp(5rem,1fr,10rem)_1fr] items-center">
          {t('lyricsEditingPage.lyricsEditor')}{' '}
          <div className="other-stats-container truncate text-xs text-font-color-black dark:text-font-color-white">
            <span>
              {t('lyricsEditingPage.playbackSpeed')} :{' '}
              {localStorageData.playback.playbackRate}x
            </span>
            <span className="mx-2">&bull;</span>
            <span className="">
              {t('lyricsEditingPage.playbackTime')} : {roundedSongPostion}{' '}
              {localStorageData.lyricsEditorSettings.offset !== 0 && (
                <span className="font-medium uppercase text-font-color-highlight dark:text-dark-font-color-highlight">
                  {localStorageData.lyricsEditorSettings.offset > 0 && '+'}{' '}
                  {t('lyricsEditingPage.offsetWithCount', {
                    count: localStorageData.lyricsEditorSettings.offset,
                  })}
                </span>
              )}
            </span>
          </div>
        </div>
        <div className="other-controls-container flex">
          <Button
            className="more-options-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
            iconName="more_horiz"
            isDisabled={!isTheEditingSongTheCurrSong}
            clickHandler={(e) => {
              e.stopPropagation();
              const button = e.currentTarget || e.target;
              const { x, y } = button.getBoundingClientRect();
              updateContextMenuData(
                true,
                moreOptionsContextMenuItems,
                x + 10,
                y + 50,
              );
            }}
            tooltipLabel={t('common.moreOptions')}
            onContextMenu={(e) => {
              e.preventDefault();
              updateContextMenuData(
                true,
                moreOptionsContextMenuItems,
                e.pageX,
                e.pageY,
              );
            }}
          />
          <Button
            label={t('lyricsEditingPage.saveLyrics')}
            className="select-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
            iconName="save_as"
            iconClassName="material-icons-round-outlined"
            isDisabled={!isTheEditingSongTheCurrSong}
            clickHandler={() =>
              changePromptMenuData(
                true,
                <LyricsEditorSavePrompt
                  lyricsLines={lyricsLines}
                  currentSongData={currentSongData}
                />,
              )
            }
          />
          <Button
            label={t(
              `lyricsEditingPage.${
                isPlaying ? 'stopAndEditLyrics' : 'playLyrics'
              }`,
            )}
            className="select-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
            iconName={isPlaying ? 'edit' : 'play_arrow'}
            iconClassName="material-icons-round"
            isDisabled={!isTheEditingSongTheCurrSong}
            clickHandler={() => setIsPlaying((prevState) => !prevState)}
          />
          <Button
            label={t('lyricsEditingPage.configure')}
            className="select-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
            iconName="settings"
            iconClassName="material-icons-round-outlined"
            isDisabled={!isTheEditingSongTheCurrSong}
            clickHandler={() =>
              changePromptMenuData(true, <LyricsEditorSettingsPrompt />)
            }
          />
        </div>
      </div>
      <div
        className={`lyrics-container flex h-full flex-col items-center overflow-auto py-10 pr-6 transition-[background,opacity] [scrollbar-gutter:stable] ${
          !isTheEditingSongTheCurrSong && 'opacity-10'
        }`}
      >
        {lyricsLineComponents}
      </div>

      <PageFocusPrompt
        isFocused={isFocused}
        isPlaying={isPlaying}
        isTheEditingSongTheCurrSong={isTheEditingSongTheCurrSong}
      />
    </MainContainer>
  );
};

export default LyricsEditingPage;
