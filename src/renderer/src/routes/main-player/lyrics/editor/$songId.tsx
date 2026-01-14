/* eslint-disable jsx-a11y/no-autofocus */
import roundTo from '@common/roundTo';
import Button from '@renderer/components/Button';
import EditingLyricsLine from '@renderer/components/LyricsEditingPage/EditingLyricsLine';
import LyricsEditingPageDurationCounter from '@renderer/components/LyricsEditingPage/LyricsEditingPageDurationCounter';
import MainContainer from '@renderer/components/MainContainer';
import { AppUpdateContext } from '@renderer/contexts/AppUpdateContext';
import { routeStateStore } from '@renderer/store/routeStateStore';
import { store } from '@renderer/store/store';
import { lyricsEditorSchema } from '@renderer/utils/zod/lyricsEditorSchema';
import { createFileRoute } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import {
  lazy,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent
} from 'react';
import { Trans, useTranslation } from 'react-i18next';

export const Route = createFileRoute('/main-player/lyrics/editor/$songId')({
  component: LyricsEditingPage,
  validateSearch: lyricsEditorSchema
});

const LyricsEditorHelpPrompt = lazy(
  () => import('@renderer/components/LyricsEditingPage/LyricsEditorHelpPrompt')
);
const SensitiveActionConfirmPrompt = lazy(
  () => import('@renderer/components/SensitiveActionConfirmPrompt')
);
const LyricsEditorSettingsPrompt = lazy(
  () => import('@renderer/components/LyricsEditingPage/LyricsEditorSettingsPrompt')
);
const LyricsEditorSavePrompt = lazy(
  () => import('@renderer/components/LyricsEditingPage/LyricsEditorSavePrompt')
);
const PageFocusPrompt = lazy(
  () => import('@renderer/components/LyricsEditingPage/PageFocusPrompt')
);

function LyricsEditingPage() {
  const currentSongData = useStore(store, (state) => state.currentSongData);
  const offset = useStore(store, (state) => state.localStorage.lyricsEditorSettings.offset || 0);
  const preferences = useStore(store, (state) => state.localStorage.preferences);
  const playback = useStore(store, (state) => state.localStorage.playback);

  const { changePromptMenuData, playSong, updateContextMenuData } = useContext(AppUpdateContext);
  const { t } = useTranslation();
  const { songId } = Route.useParams({ select: (params) => ({ songId: Number(params.songId) }) });
  const { songTitle, isEditingEnhancedSyncedLyrics } = Route.useSearch();

  const lyrics = useStore(routeStateStore, (state) => {
    const data = state['lyrics-editor'];

    if (data?.songId === songId) return data.lyrics || [];
    return [];
  });
  const songPositionRef = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [lyricsLines, setLyricsLines] = useState<ExtendedEditingLyricsLineData[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const isTheEditingSongTheCurrSong = useMemo(
    () => currentSongData.songId === songId,
    [currentSongData.songId, songId]
  );

  useEffect(() => {
    if (changePromptMenuData && !preferences?.doNotShowHelpPageOnLyricsEditorStartUp) {
      changePromptMenuData(true, <LyricsEditorHelpPrompt showDoNotShowAgainCheckbox />);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (lyrics) {
      const lines: ExtendedEditingLyricsLineData[] = lyrics.map((lineData, index) => ({
        ...lineData,
        text:
          typeof lineData.text === 'string'
            ? lineData.text.trim()
            : lineData.text.map((val) => ({ ...val, isActive: false })),
        index,
        isActive: false
      }));

      setLyricsLines(lines);
    }
  }, [isEditingEnhancedSyncedLyrics, lyrics]);

  useEffect(() => {
    const durationUpdateFunction = (ev: Event) => {
      if ('detail' in ev && !Number.isNaN(ev.detail)) {
        const songPosition = ev.detail as number;
        const roundedSongPostion = roundTo(songPosition + offset, 2);

        songPositionRef.current = roundedSongPostion;
      }
    };

    document.addEventListener('player/positionChange', durationUpdateFunction);

    return () => {
      document.removeEventListener('player/positionChange', durationUpdateFunction);
    };
  }, [offset]);

  const lyricsLineComponents = useMemo(() => {
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

  const updateTextActiveStatus = useCallback(
    <T extends { isActive: boolean; end?: number; start?: number }>(
      textLine: T[],
      shiftKeyEnabled: boolean,
      roundedSongPosition: number
    ) => {
      const slicedPrevTextLine = textLine.slice();
      const lastActiveTextIndex = textLine.findIndex((val) => val.isActive);
      // const wasFirstLineActive = textLine.at(0)?.isActive || false;
      // const wasLastLineActive = textLine.at(-1)?.isActive || false;

      if (shiftKeyEnabled) {
        if (lastActiveTextIndex !== -1) {
          slicedPrevTextLine[lastActiveTextIndex].isActive =
            !slicedPrevTextLine[lastActiveTextIndex].isActive;
        }
        if (lastActiveTextIndex - 1 >= 0) {
          slicedPrevTextLine[lastActiveTextIndex - 1].isActive =
            !slicedPrevTextLine[lastActiveTextIndex - 1].isActive;
        }
      } else {
        if (lastActiveTextIndex !== -1) {
          slicedPrevTextLine[lastActiveTextIndex].isActive =
            !slicedPrevTextLine[lastActiveTextIndex].isActive;
          slicedPrevTextLine[lastActiveTextIndex].end = roundedSongPosition;
        }
        if (lastActiveTextIndex + 1 !== slicedPrevTextLine.length) {
          slicedPrevTextLine[lastActiveTextIndex + 1].isActive =
            !slicedPrevTextLine[lastActiveTextIndex + 1].isActive;
          slicedPrevTextLine[lastActiveTextIndex + 1].start = roundedSongPosition;
        }
      }

      return slicedPrevTextLine;
    },
    []
  );

  const handleShortcuts = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter') {
        e.stopPropagation();

        const roundedSongPosition = songPositionRef.current;

        setLyricsLines((prevLines) => {
          // updateTextActiveStatus(prevLines, e.shiftKey);

          const slicedPrevLines = prevLines.slice();
          const lastActiveLineIndex = prevLines.findIndex((val) => val.isActive);

          // // Is a main line active
          // if (lastActiveLineIndex === -1) {
          //   // Make the first main line active
          //   slicedPrevLines[0].isActive = true;

          //   // has text blocks
          //   if (Array.isArray(slicedPrevLines[0]?.text)) {
          //     // make the first text block active
          //     const textLine = slicedPrevLines[0].text;
          //     const slicedPrevTextLine = textLine.slice();
          //     slicedPrevTextLine[0].isActive = true;

          //     slicedPrevLines[0].text = slicedPrevTextLine;
          //   }
          //   // Is the active main line the last line?
          // } else if (lastActiveLineIndex === slicedPrevLines.length - 1) {
          //   // Remove active from the last main line
          //   slicedPrevLines[lastActiveLineIndex].isActive = false;
          // } else if (
          //   Array.isArray(slicedPrevLines[lastActiveLineIndex]?.text)
          // ) {
          //   const textLine = slicedPrevLines[lastActiveLineIndex]
          //     ?.text as LyricsLineData[];
          //   const lastActiveTextIndex = textLine.findIndex(
          //     (val) => val.isActive,
          //   );

          //   if (lastActiveTextIndex === -1) textLine[0].isActive = true;
          //   else if (lastActiveTextIndex === textLine.length - 1) {
          //     textLine[lastActiveTextIndex].isActive = false;
          //     textLine[lastActiveTextIndex + 1].isActive = true;
          //   } else {
          //     // Make the next main line active
          //   }
          // } else {
          //   // Make the next main line active
          // }
          const textLine = slicedPrevLines[lastActiveLineIndex]?.text;
          if (Array.isArray(textLine) && !textLine.at(-1)?.isActive) {
            slicedPrevLines[lastActiveLineIndex].text = updateTextActiveStatus(
              textLine,
              e.shiftKey,
              roundedSongPosition
            );
          } else {
            if (e.shiftKey) {
              if (lastActiveLineIndex !== -1) {
                slicedPrevLines[lastActiveLineIndex].isActive =
                  !slicedPrevLines[lastActiveLineIndex].isActive;
              }
              if (lastActiveLineIndex - 1 >= 0) {
                slicedPrevLines[lastActiveLineIndex - 1].isActive =
                  !slicedPrevLines[lastActiveLineIndex - 1].isActive;
              }
            } else {
              if (lastActiveLineIndex !== -1) {
                slicedPrevLines[lastActiveLineIndex].isActive =
                  !slicedPrevLines[lastActiveLineIndex].isActive;
                slicedPrevLines[lastActiveLineIndex].end = roundedSongPosition;
              }
              if (lastActiveLineIndex + 1 !== slicedPrevLines.length) {
                slicedPrevLines[lastActiveLineIndex + 1].isActive =
                  !slicedPrevLines[lastActiveLineIndex + 1].isActive;
                slicedPrevLines[lastActiveLineIndex + 1].start = roundedSongPosition;
              }
            }

            if (Array.isArray(textLine))
              slicedPrevLines[lastActiveLineIndex].text = updateTextActiveStatus(
                textLine,
                e.shiftKey,
                roundedSongPosition
              );
          }

          return slicedPrevLines;
        });
      }

      return undefined;
    },
    [updateTextActiveStatus]
  );

  const moreOptionsContextMenuItems = useMemo((): ContextMenuItem[] => {
    return [
      {
        label: t('common.help'),
        iconName: 'help',
        iconClassName: 'material-icons-round-outlined',
        handlerFunction: () => changePromptMenuData(true, <LyricsEditorHelpPrompt />)
      },
      {
        label: '',
        isContextMenuItemSeperator: true,
        handlerFunction: () => true
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
                    span: <span className="text-font-color-crimson font-medium" />
                  }}
                />
              }
              confirmButton={{
                label: t('lyricsEditingPage.resetLyrics'),
                clickHandler: () => {
                  const lines: ExtendedEditingLyricsLineData[] = lyrics.map((lineData, index) => ({
                    ...lineData,
                    text:
                      typeof lineData.text === 'string'
                        ? lineData.text
                        : lineData.text.map((val) => ({
                            ...val,
                            isActive: false
                          })),
                    index,
                    isActive: false
                  }));
                  setLyricsLines(lines);
                }
              }}
            />
          );
        }
      }
    ];
  }, [changePromptMenuData, lyrics, t]);

  return (
    <MainContainer
      className="appear-from-bottom text-font-color-black dark:text-font-color-white relative h-full! overflow-hidden pb-0!"
      onKeyDown={handleShortcuts}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      ref={containerRef}
      focusable
      autoFocus
    >
      {!isTheEditingSongTheCurrSong && (
        <div className="bg-background-color-1/25 dark:bg-dark-background-color-1/25 absolute z-10 flex h-full w-full flex-col items-center justify-center pr-8">
          <span className="material-icons-round-outlined text-font-color-highlight dark:text-dark-font-color-highlight text-5xl">
            error
          </span>
          <p className="text-font-color-highlight dark:text-dark-font-color-highlight mt-2 text-3xl font-medium">
            {t('lyricsEditingPage.incorrectSongTitle')}
          </p>
          <p>{t('lyricsEditingPage.incorrectSongMessage', { title: songTitle })}</p>
          <Button
            label={t('common.play')}
            iconName="play_arrow"
            className="mt-4 mr-0!"
            clickHandler={() => songId && playSong(songId)}
          />
        </div>
      )}
      <div className="title-container text-font-color-highlight dark:text-dark-font-color-highlight mt-1 mb-8 flex items-center pr-4 text-3xl font-medium">
        <div className="gap-4s container grid grid-cols-[clamp(5rem,1fr,10rem)_1fr] items-center">
          {t('lyricsEditingPage.lyricsEditor')}{' '}
          <div className="other-stats-container text-font-color-black dark:text-font-color-white truncate text-xs">
            <span>
              {t('lyricsEditingPage.playbackSpeed')} : {playback.playbackRate}x
            </span>
            <span className="mx-2">&bull;</span>
            <LyricsEditingPageDurationCounter offset={offset} />
          </div>
        </div>
        <div className="other-controls-container flex">
          <Button
            className="more-options-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
            iconName="more_horiz"
            isDisabled={!isTheEditingSongTheCurrSong}
            clickHandler={(e) => {
              e.stopPropagation();
              const button = e.currentTarget;
              const { x, y } = button.getBoundingClientRect();
              updateContextMenuData(true, moreOptionsContextMenuItems, x + 10, y + 50);
            }}
            tooltipLabel={t('common.moreOptions')}
            onContextMenu={(e) => {
              e.preventDefault();
              updateContextMenuData(true, moreOptionsContextMenuItems, e.pageX, e.pageY);
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
                  isEditingEnhancedSyncedLyrics={isEditingEnhancedSyncedLyrics}
                />
              )
            }
          />
          <Button
            label={t(`lyricsEditingPage.${isPlaying ? 'stopAndEditLyrics' : 'playLyrics'}`)}
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
            clickHandler={() => changePromptMenuData(true, <LyricsEditorSettingsPrompt />)}
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
}
