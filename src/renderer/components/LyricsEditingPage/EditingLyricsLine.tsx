import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { SongPositionContext } from 'renderer/contexts/SongPositionContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';

import {
  EditingLyricsLineData,
  ExtendedEditingLyricsLineData,
} from './LyricsEditingPage';
import Button from '../Button';

interface Props extends ExtendedEditingLyricsLineData {
  isPlaying: boolean;
  updateLineData: (
    callback: (
      prevLineData: ExtendedEditingLyricsLineData[]
    ) => ExtendedEditingLyricsLineData[]
  ) => void;
}

type EditingLyricsLineDataActions =
  | { type: 'UPDATE_LYRICS_TEXT'; payload: string }
  | { type: 'UPDATE_LYRICS_START_TAG'; payload: number }
  | { type: 'UPDATE_LYRICS_END_TAG'; payload: number }
  | { type: 'UPDATE_ALL_CONTENT'; payload: EditingLyricsLineData };

const reducerFunction = (
  state: EditingLyricsLineData,
  action: EditingLyricsLineDataActions
): EditingLyricsLineData => {
  switch (action.type) {
    case 'UPDATE_LYRICS_TEXT':
      return { ...state, line: action.payload };
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
    line,
    index,
    isActive,
    end = 0,
    start = 0,
    updateLineData,
    isPlaying,
  } = props;
  const [content, dispatch] = React.useReducer(reducerFunction, {
    line,
    start,
    end,
  } as EditingLyricsLineData);
  const [isEditing, setIsEditing] = React.useState(false);

  const lineRef = React.useRef<HTMLDivElement>(null);
  const isActiveRef = React.useRef(false);
  const resetLineDataRef = React.useRef<EditingLyricsLineData>({
    line,
    start,
    end,
  });

  React.useEffect(() => {
    dispatch({
      type: 'UPDATE_ALL_CONTENT',
      payload: {
        line,
        start,
        end,
      },
    });
  }, [end, line, start]);

  const isInRange =
    start !== 0 && end !== 0 && start < songPosition && end > songPosition;

  const shouldBeScrolledWhenPlaying = isPlaying && isInRange;
  const shouldBeScrolledWhenActive = !isPlaying && isActive;

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
          className="my-2 w-[90%] rounded-xl border-[3px] border-background-color-1 bg-background-color-2 px-4 py-4 text-center dark:border-dark-background-color-1 dark:bg-dark-background-color-1"
          value={content.line}
          onChange={(e) =>
            dispatch({
              type: 'UPDATE_LYRICS_TEXT',
              payload: e.currentTarget.value,
            })
          }
        />
      ) : (
        <span
          className={`scale-75 cursor-pointer text-center text-5xl font-medium opacity-50 transition-[opacity,transform] group-hover:opacity-75 ${
            ((!isPlaying && isActive) || shouldBeScrolledWhenPlaying) &&
            '!scale-100 !opacity-100'
          }`}
        >
          {content.line}
        </span>
      )}
      {isEditing ? (
        <div className="flex items-center justify-center">
          From{' '}
          <input
            type="number"
            placeholder="Start in seconds"
            className="mx-2 my-1 min-w-[20%] rounded-xl border-[3px] border-background-color-1 bg-background-color-2 px-1 py-2 text-center dark:border-dark-background-color-1 dark:bg-dark-background-color-1"
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
            className="mx-2 my-1 min-w-[20%] rounded-xl border-[3px] border-background-color-1 bg-background-color-2 px-1 py-2 text-center dark:border-dark-background-color-1 dark:bg-dark-background-color-1"
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
              clickHandler={() =>
                updateLineData((prevLineData) => {
                  const filteredLineData = prevLineData.filter(
                    (lineData) => lineData.index !== index
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
              clickHandler={() =>
                updateLineData((prevLineData) => {
                  const pos = index - 1 < 0 ? 0 : index - 1;
                  prevLineData.splice(pos, 0, {
                    index: 0,
                    isActive: false,
                    line: '•••',
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
              clickHandler={() =>
                updateLineData((prevLineData) => {
                  const pos =
                    index + 1 >= prevLineData.length
                      ? prevLineData.length
                      : index + 1;
                  prevLineData.splice(pos, 0, {
                    index: 0,
                    isActive: false,
                    line: '•••',
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
        <Button
          className={`my-2 !mr-0 text-xs opacity-75 ${
            isEditing &&
            '!border-background-color-1 hover:!border-background-color-3 dark:!border-dark-background-color-1 dark:hover:!border-dark-background-color-3'
          }`}
          label={isEditing ? 'Finish Editing' : 'Edit Line'}
          clickHandler={() => {
            setIsEditing((isEditingState) => {
              if (isEditingState === true)
                updateLineData((prevLineData) => {
                  prevLineData[index] = {
                    ...prevLineData[index],
                    line: content.line || line,
                    start: content.start || start,
                    end: content.end || end,
                  };

                  if (
                    localStorageData.lyricsEditorSettings
                      .editNextStartTagWithCurrentEndTag &&
                    prevLineData[index + 1]
                  ) {
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
