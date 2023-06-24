import React from 'react';

import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { SongPositionContext } from 'renderer/contexts/SongPositionContext';

import calculateTime from 'renderer/utils/calculateTime';
import roundTo from 'renderer/utils/roundTo';

import MainContainer from '../MainContainer';
import EditingLyricsLine from './EditingLyricsLine';
import Button from '../Button';
import LyricsEditorHelpPrompt from './LyricsEditorHelpPrompt';
import SensitiveActionConfirmPrompt from '../SensitiveActionConfirmPrompt';
import LyricsEditorSettingsPrompt from './LyricsEditorSettingsPrompt';

export interface EditingLyricsLineData {
  line: string;
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

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const [lyricsLines, setLyricsLines] = React.useState<
    ExtendedEditingLyricsLineData[]
  >([]);

  const offset = localStorageData.lyricsEditorSettings.offset || 0;
  const roundedSongPostion = roundTo(songPosition + offset, 2);
  const { songId, lyrics, songTitle } = React.useMemo(() => {
    const { data } = currentlyActivePage;

    return {
      songId: data.songId as string | undefined,
      lyrics: (data.lyrics || []) as EditingLyricsLineData[],
      songTitle: data.songTitle as string | undefined,
    };
  }, [currentlyActivePage]);

  const isTheEditingSongTheCurrSong = React.useMemo(
    () => currentSongData.songId === songId,
    [currentSongData.songId, songId]
  );

  React.useEffect(() => {
    if (lyrics) {
      const lines: ExtendedEditingLyricsLineData[] = lyrics.map(
        (line, index) => ({
          ...line,
          index,
          isActive: false,
        })
      );

      setLyricsLines(lines);
    }
  }, [lyrics]);

  React.useEffect(() => {
    updateCurrentlyActivePageData((prevData) => {
      return {
        ...prevData,
        isLowResponseRequired: isTheEditingSongTheCurrSong && isPlaying,
      };
    });
  }, [isPlaying, isTheEditingSongTheCurrSong, updateCurrentlyActivePageData]);

  const lyricsLineComponents = React.useMemo(() => {
    return lyricsLines.map((lyricsLine, index) => (
      <EditingLyricsLine
        isActive={lyricsLine.isActive}
        line={lyricsLine.line}
        index={index}
        // eslint-disable-next-line react/no-array-index-key
        key={`${index}-${lyricsLine.line}`}
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
    ));
  }, [isPlaying, lyricsLines]);

  const handleShortcuts = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' && e.shiftKey) {
        e.stopPropagation();
        return setLyricsLines((prevLines) => {
          const slicedPrevLines = prevLines.slice();
          const lastActiveIndex = prevLines.findIndex((val) => val.isActive);

          if (lastActiveIndex !== -1) {
            slicedPrevLines[lastActiveIndex].isActive =
              !slicedPrevLines[lastActiveIndex].isActive;
          }
          if (lastActiveIndex - 1 >= 0) {
            slicedPrevLines[lastActiveIndex - 1].isActive =
              !slicedPrevLines[lastActiveIndex - 1].isActive;
          }
          return slicedPrevLines;
        });
      }
      if (e.key === 'Enter') {
        e.stopPropagation();
        return setLyricsLines((prevLines) => {
          const slicedPrevLines = prevLines.slice();
          const lastActiveIndex = prevLines.findIndex((val) => val.isActive);

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
          return slicedPrevLines;
        });
      }

      return undefined;
    },
    [roundedSongPostion]
  );

  const copyLyrics = React.useCallback(() => {
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
      }.${
        milliSecsStr.length > 1 ? milliSecsStr : `0${milliSecsStr}`
      }] ${line}`;
    });

    navigator.clipboard
      .writeText(metadataLines.concat(lines).join('\n'))
      .then(() => {
        return console.log('Text copied to clipboard');
      })
      .catch((error) => {
        console.error('Failed to copy text:', error);
      });
  }, [currentSongData, lyricsLines]);

  const moreOptionsContextMenuItems = React.useMemo((): ContextMenuItem[] => {
    return [
      {
        label: 'Copy lyrics in LRC format',
        iconName: 'content_copy',
        iconClassName: 'material-icons-round-outlined',
        handlerFunction: copyLyrics,
      },
      {
        label: '',
        isContextMenuItemSeperator: true,
        handlerFunction: () => true,
      },
      {
        label: 'Reset Lyrics',
        iconName: 'restart_alt',
        iconClassName: 'material-icons-round-outlined',
        handlerFunction: () => {
          changePromptMenuData(
            true,
            <SensitiveActionConfirmPrompt
              title="Are your sure that you want to Reset Lyrics?"
              content={
                <>
                  <p>
                    You will lose{' '}
                    <span className="font-medium text-font-color-crimson">
                      recent lyrics line modifications
                    </span>{' '}
                    and{' '}
                    <span className="font-medium text-font-color-crimson">
                      start/end synchronization data
                    </span>{' '}
                    if you continue this action.
                  </p>
                  <br /> <p>This action is irreversible.</p>
                </>
              }
              confirmButton={{
                label: 'Reset Lyrics',
                clickHandler: () => {
                  setLyricsLines((lines) =>
                    lines.map((line) => {
                      line.start = undefined;
                      line.end = undefined;
                      line.isActive = false;

                      return line;
                    })
                  );
                },
              }}
            />
          );
        },
      },
    ];
  }, [changePromptMenuData, copyLyrics]);

  return (
    <MainContainer
      className="genres-list-container appear-from-bottom relative !h-full overflow-hidden !pb-0 text-font-color-black dark:text-font-color-white"
      onKeyDown={handleShortcuts}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      focusable
      autoFocus
    >
      {!isTheEditingSongTheCurrSong && (
        <div className="absolute z-10 flex h-full w-full flex-col items-center justify-center bg-background-color-1/25 pr-8 dark:bg-dark-background-color-1/25">
          <span className="material-icons-round-outlined text-5xl">error</span>
          <p className="mt-2 text-3xl font-medium">Not in the right song</p>
          <p className="">To start editing, play '{songTitle}' song.</p>
          <Button
            label="Play"
            iconName="play_arrow"
            className="!mr-0 mt-4"
            clickHandler={() => songId && playSong(songId)}
          />
        </div>
      )}
      {!isFocused && isTheEditingSongTheCurrSong && !isPlaying && (
        <div className="absolute z-10 flex h-full w-full flex-col items-center justify-center bg-background-color-1/25 pr-8 dark:bg-dark-background-color-1/25">
          <span className="material-icons-round-outlined text-5xl">error</span>
          <p className="mt-2 text-3xl font-medium">Page not focused.</p>
          <p className="mt-2">
            Page focus is required for the page-specific shortcuts to work.
          </p>
          <p>Click on this page to gain focus.</p>
        </div>
      )}
      <div className="title-container mb-8 mt-1 flex items-center pr-4 text-3xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        <div className="gap-4s container grid grid-cols-[clamp(5rem,1fr,10rem)_1fr] items-center">
          Lyrics Editor{' '}
          <div className="other-stats-container truncate text-xs text-font-color-black dark:text-font-color-white">
            {/* {isFocused ? ( */}
            <span className="">
              Time : {roundedSongPostion}{' '}
              {localStorageData.lyricsEditorSettings.offset > 0 && (
                <span className="font-medium uppercase text-font-color-highlight dark:text-dark-font-color-highlight">
                  + {localStorageData.lyricsEditorSettings.offset} offset
                </span>
              )}
            </span>
            {/* ) : (
               <span className="flex items-center font-semibold uppercase text-font-color-highlight dark:text-dark-font-color-highlight">
                 <span className="material-icons-round-outlined mr-2 text-xl">
                   error
                 </span>
                 Page not focused
               </span>
             )} */}
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
                y + 50
              );
            }}
            tooltipLabel="More Options"
            onContextMenu={(e) => {
              e.preventDefault();
              updateContextMenuData(
                true,
                moreOptionsContextMenuItems,
                e.pageX,
                e.pageY
              );
            }}
          />
          <Button
            label={isPlaying ? 'Stop and Edit Lyrics' : 'Play Lyrics'}
            className="select-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
            iconName={isPlaying ? 'edit' : 'play_arrow'}
            iconClassName="material-icons-round"
            isDisabled={!isTheEditingSongTheCurrSong}
            clickHandler={() => setIsPlaying((prevState) => !prevState)}
          />
          <Button
            label="Configure"
            className="select-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
            iconName="settings"
            iconClassName="material-icons-round-outlined"
            isDisabled={!isTheEditingSongTheCurrSong}
            clickHandler={() =>
              changePromptMenuData(true, <LyricsEditorSettingsPrompt />)
            }
          />
          <Button
            label="Help"
            className="select-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
            iconName="help"
            iconClassName="material-icons-round-outlined"
            isDisabled={!isTheEditingSongTheCurrSong}
            clickHandler={() =>
              changePromptMenuData(true, <LyricsEditorHelpPrompt />)
            }
          />
        </div>
      </div>
      <div
        className={`lyrics-container flex h-full flex-col items-center overflow-auto py-10 pr-6 ${
          (!isTheEditingSongTheCurrSong || (!isFocused && !isPlaying)) &&
          'opacity-10'
        } `}
      >
        {lyricsLineComponents}
      </div>
    </MainContainer>
  );
};

export default LyricsEditingPage;
