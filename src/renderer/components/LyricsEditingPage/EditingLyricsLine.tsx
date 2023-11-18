import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { SongPositionContext } from 'renderer/contexts/SongPositionContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';

import {
  EditingLyricsLineData,
  ExtendedEditingLyricsLineData,
  LyricsLineData,
} from './LyricsEditingPage';
import Button from '../Button';

interface Props extends ExtendedEditingLyricsLineData {
  isPlaying: boolean;
  updateLineData: (
    callback: (
      prevLineData: ExtendedEditingLyricsLineData[],
    ) => ExtendedEditingLyricsLineData[],
  ) => void;
}

type EditingLyricsLineDataActions =
  | { type: 'UPDATE_LYRICS_TEXT'; payload: string | LyricsLineData[] }
  | { type: 'UPDATE_LYRICS_START_TAG'; payload: number }
  | { type: 'UPDATE_LYRICS_END_TAG'; payload: number }
  | { type: 'UPDATE_ALL_CONTENT'; payload: EditingLyricsLineData };

const reducerFunction = (
  state: EditingLyricsLineData,
  action: EditingLyricsLineDataActions,
): EditingLyricsLineData => {
  switch (action.type) {
    case 'UPDATE_LYRICS_TEXT':
      return { ...state, text: action.payload };
    case 'UPDATE_LYRICS_START_TAG':
      return { ...state, start: action.payload };
    case 'UPDATE_LYRICS_END_TAG':
      return { ...state, end: action.payload };
    case 'UPDATE_ALL_CONTENT':
      return { ...state, ...action.payload };

    default:
      return state;
  }
};

const EditingLyricsLine = (props: Props) => {
  const { songPosition } = React.useContext(SongPositionContext);
  const { localStorageData } = React.useContext(AppContext);
  const { updateSongPosition } = React.useContext(AppUpdateContext);

  const {
    text,
    index,
    isActive,
    end = 0,
    start = 0,
    updateLineData,
    isPlaying,
  } = props;
  const [content, dispatch] = React.useReducer(reducerFunction, {
    text,
    start,
    end,
  } as EditingLyricsLineData);
  const [isEditing, setIsEditing] = React.useState(false);

  const lineRef = React.useRef<HTMLDivElement>(null);
  const isActiveRef = React.useRef(false);
  const resetLineDataRef = React.useRef<EditingLyricsLineData>({
    text,
    start,
    end,
  });

  const isEditingEnhancedSyncedLyrics = React.useMemo(
    () => typeof text !== 'string',
    [text],
  );

  React.useEffect(() => {
    dispatch({
      type: 'UPDATE_ALL_CONTENT',
      payload: {
        text,
        start,
        end,
      },
    });
  }, [end, text, start]);

  const isInRange =
    start !== 0 && end !== 0 && start < songPosition && end > songPosition;

  const shouldBeScrolledWhenPlaying = isPlaying && isInRange;
  const shouldBeScrolledWhenActive = !isPlaying && isActive;

  const shouldHighlight =
    (!isPlaying && isActive) || shouldBeScrolledWhenPlaying;

  React.useEffect(() => {
    if (
      lineRef.current &&
      (shouldBeScrolledWhenPlaying || shouldBeScrolledWhenActive)
    ) {
      if (!isActiveRef.current) {
        isActiveRef.current = true;
        lineRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center',
        });
      }
    } else isActiveRef.current = false;
  }, [shouldBeScrolledWhenActive, shouldBeScrolledWhenPlaying]);

  const lyricsLineComponent = !isEditing ? (
    <span
      className={`scale-75 cursor-pointer text-center text-5xl font-medium opacity-50 transition-[opacity,transform] ${
        shouldHighlight ? '!scale-100 !opacity-100 group-hover:opacity-75' : ''
      } ${
        typeof content.text === 'object' &&
        'flex flex-wrap items-center justify-center text-wrap'
      }`}
    >
      {typeof content.text === 'string'
        ? content.text
        : content.text.map((word) => {
            const {
              text: wordText,
              end: wordEnd = 0,
              start: wordStart = 0,
            } = word;

            const TRANSITION_DURATION = 0;
            const position = songPosition - TRANSITION_DURATION;
            const isWordInRange =
              wordStart !== 0 &&
              wordEnd !== 0 &&
              wordStart < position &&
              wordEnd > position;
            return (
              <div
                className={`mr-3 flex flex-col items-start opacity-50 hover:opacity-100 ${
                  shouldHighlight && isWordInRange && '!opacity-100'
                }`}
              >
                <span className="text-xs">{wordStart}</span>
                <span>{wordText}</span>
              </div>
            );
          })}
    </span>
  ) : undefined;

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className={`group mb-2 flex flex-col items-center justify-center rounded-xl py-4 ${
        isEditing &&
        `w-full bg-background-color-2 shadow-xl dark:bg-dark-background-color-2 `
      } `}
      ref={lineRef}
      onKeyDown={(e) => isEditing && e.stopPropagation()}
      onDoubleClick={() => {
        if (isPlaying) updateSongPosition(start);
        else
          updateLineData((prevLineData) => {
            const updatedLineData = prevLineData.map((lineData, i) => {
              lineData.isActive = i === index;

              return lineData;
            });
            return updatedLineData;
          });
      }}
    >
      <span className="text-xs opacity-50">
        {index < 10 ? `0${index}` : index}
      </span>
      {isEditing ? (
        <input
          type="text"
          placeholder="Lyrics Text"
          className="my-2 w-[90%] rounded-xl border-[3px] border-background-color-1 bg-background-color-1 px-4 py-4 text-center dark:border-dark-background-color-1 dark:bg-dark-background-color-1"
          value={
            typeof content.text === 'string'
              ? content.text
              : content.text.map((data) => data.text).join(' ')
          }
          onChange={(e) => {
            const { value } = e.currentTarget;
            const lineData = isEditingEnhancedSyncedLyrics
              ? value.split(' ').map((line): LyricsLineData => ({ text: line }))
              : value;

            dispatch({
              type: 'UPDATE_LYRICS_TEXT',
              payload: lineData,
            });
          }}
        />
      ) : (
        lyricsLineComponent
      )}
      {isEditing ? (
        <div className="flex items-center justify-center">
          From{' '}
          <input
            type="number"
            placeholder="Start in seconds"
            className="mx-2 my-1 min-w-[20%] rounded-xl border-[3px] border-background-color-1 bg-background-color-1 px-1 py-2 text-center dark:border-dark-background-color-1 dark:bg-dark-background-color-1"
            value={content.start ?? 0}
            onChange={(e) =>
              dispatch({
                type: 'UPDATE_LYRICS_START_TAG',
                payload: e.currentTarget.valueAsNumber,
              })
            }
          />{' '}
          to{' '}
          <input
            type="number"
            placeholder="End in seconds"
            className="mx-2 my-1 min-w-[20%] rounded-xl border-[3px] border-background-color-1 bg-background-color-1 px-1 py-2 text-center dark:border-dark-background-color-1 dark:bg-dark-background-color-1"
            value={content.end ?? 0}
            onChange={(e) =>
              dispatch({
                type: 'UPDATE_LYRICS_END_TAG',
                payload: e.currentTarget.valueAsNumber,
              })
            }
          />
        </div>
      ) : (
        <span className="text-xs opacity-75">
          From {content.start || '0.00'} to {content.end || '0.00'}
        </span>
      )}
      <div className="flex flex-wrap items-center justify-center">
        {isEditing && (
          <>
            <Button
              className={`my-2 text-xs opacity-75 ${
                isEditing &&
                '!border-background-color-1 hover:!border-background-color-3 dark:!border-dark-background-color-1 dark:hover:!border-dark-background-color-3'
              }`}
              label="Reset"
              iconName="restart_alt"
              clickHandler={() =>
                dispatch({
                  type: 'UPDATE_ALL_CONTENT',
                  payload: resetLineDataRef.current,
                })
              }
            />
            <Button
              className={`my-2 text-xs opacity-75 ${
                isEditing &&
                '!border-background-color-1 hover:!border-background-color-3 dark:!border-dark-background-color-1 dark:hover:!border-dark-background-color-3'
              }`}
              label="Delete Line"
              iconName="delete"
              clickHandler={() =>
                updateLineData((prevLineData) => {
                  const filteredLineData = prevLineData.filter(
                    (lineData) => lineData.index !== index,
                  );
                  return filteredLineData;
                })
              }
            />
            <Button
              className={`my-2 text-xs opacity-75 ${
                isEditing &&
                '!border-background-color-1 hover:!border-background-color-3 dark:!border-dark-background-color-1 dark:hover:!border-dark-background-color-3'
              }`}
              label="Add line above"
              iconName="step_out"
              clickHandler={() =>
                updateLineData((prevLineData) => {
                  const pos = index - 1 < 0 ? 0 : index - 1;
                  prevLineData.splice(pos, 0, {
                    index: 0,
                    isActive: false,
                    text: '•••',
                  });

                  return prevLineData.map((lineData, i) => ({
                    ...lineData,
                    index: i,
                  }));
                })
              }
            />
            <Button
              className={`my-2 text-xs opacity-75 ${
                isEditing &&
                '!border-background-color-1 hover:!border-background-color-3 dark:!border-dark-background-color-1 dark:hover:!border-dark-background-color-3'
              }`}
              label="Add line below"
              iconName="step_into"
              clickHandler={() =>
                updateLineData((prevLineData) => {
                  const pos =
                    index + 1 >= prevLineData.length
                      ? prevLineData.length
                      : index + 1;
                  prevLineData.splice(pos, 0, {
                    index: 0,
                    isActive: false,
                    text: '•••',
                  });

                  return prevLineData.map((lineData, i) => ({
                    ...lineData,
                    index: i,
                  }));
                })
              }
            />
          </>
        )}
        {shouldHighlight && (
          <Button
            className={`my-2 text-xs opacity-75 ${
              isEditing &&
              '!border-background-color-1 hover:!border-background-color-3 dark:!border-dark-background-color-1 dark:hover:!border-dark-background-color-3'
            }`}
            label="Add Instrumental Line Below"
            iconName="music_note"
            clickHandler={() => {
              updateLineData((prevLineData) => {
                const pos =
                  index + 1 >= prevLineData.length
                    ? prevLineData.length
                    : index + 1;
                prevLineData.splice(pos, 0, {
                  index: 0,
                  isActive: false,
                  text: ' ♪ ',
                });

                return prevLineData.map((lineData, i) => ({
                  ...lineData,
                  index: i,
                }));
              });
            }}
          />
        )}
        <Button
          className={`my-2 !mr-0 text-xs opacity-75 ${
            isEditing &&
            '!border-background-color-1 hover:!border-background-color-3 dark:!border-dark-background-color-1 dark:hover:!border-dark-background-color-3'
          }`}
          label={isEditing ? 'Finish Editing' : 'Edit Line'}
          iconName={isEditing ? 'done' : 'edit'}
          clickHandler={() => {
            setIsEditing((isEditingState) => {
              if (isEditingState === true)
                updateLineData((prevLineData) => {
                  prevLineData[index] = {
                    ...prevLineData[index],
                    text: content.text || text,
                    start: content.start || start,
                    end: content.end || end,
                  };

                  if (
                    localStorageData.lyricsEditorSettings
                      .editNextAndCurrentStartAndEndTagsAutomatically
                  ) {
                    if (prevLineData[index - 1])
                      prevLineData[index - 1].end = content.start;
                    if (prevLineData[index + 1])
                      prevLineData[index + 1].start = content.end;
                  }

                  return prevLineData;
                });
              return !isEditingState;
            });
          }}
        />
      </div>
    </div>
  );
};

export default EditingLyricsLine;
