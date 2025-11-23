import { useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';

import Button from '../Button';
import EditingLyricWord from './EditingLyricWord';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store/store';

interface Props extends ExtendedEditingLyricsLineData {
  isPlaying: boolean;
  updateLineData: (
    callback: (prevLineData: ExtendedEditingLyricsLineData[]) => ExtendedEditingLyricsLineData[]
  ) => void;
}

type EditingLyricsLineDataActions =
  | { type: 'UPDATE_LYRICS_TEXT'; payload: string | LyricsLineData[] }
  | { type: 'UPDATE_LYRICS_START_TAG'; payload: number }
  | { type: 'UPDATE_LYRICS_END_TAG'; payload: number }
  | { type: 'UPDATE_ALL_CONTENT'; payload: EditingLyricsLineData };

const reducerFunction = (
  state: EditingLyricsLineData,
  action: EditingLyricsLineDataActions
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
  const lyricsEditorSettings = useStore(store, (state) => state.localStorage.lyricsEditorSettings);

  const { updateSongPosition } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const { text, index, isActive, end = 0, start = 0, updateLineData, isPlaying } = props;
  const [content, dispatch] = useReducer(reducerFunction, {
    text,
    start,
    end
  } as EditingLyricsLineData);
  const [isEditing, setIsEditing] = useState(false);
  const [shouldHighlight, setShouldHighlight] = useState(false);

  const lineRef = useRef<HTMLDivElement>(null);
  const isActiveRef = useRef(false);
  const resetLineDataRef = useRef<EditingLyricsLineData>({
    text,
    start,
    end
  });

  const isEditingEnhancedSyncedLyrics = useMemo(() => typeof text !== 'string', [text]);

  useEffect(() => {
    dispatch({
      type: 'UPDATE_ALL_CONTENT',
      payload: {
        text,
        start,
        end
      }
    });
  }, [end, text, start]);

  const handleLyricsActivity = useCallback(
    (e: Event) => {
      if ('detail' in e && !Number.isNaN(e.detail)) {
        const songPosition = e.detail as number;

        const isInRange = start !== 0 && end !== 0 && start < songPosition && end > songPosition;

        const shouldBeScrolledWhenPlaying = isPlaying && isInRange;
        const shouldBeScrolledWhenActive = !isPlaying && isActive;
        const shouldBeHighlighted = (!isPlaying && isActive) || shouldBeScrolledWhenPlaying;

        setShouldHighlight(shouldBeHighlighted);
        if (lineRef.current && (shouldBeScrolledWhenPlaying || shouldBeScrolledWhenActive)) {
          if (!isActiveRef.current) {
            isActiveRef.current = true;
            lineRef.current.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'center'
            });
          }
        } else isActiveRef.current = false;
      }
    },
    [end, isActive, isPlaying, start]
  );

  useEffect(() => {
    document.addEventListener('player/positionChange', handleLyricsActivity);

    return () => document.removeEventListener('player/positionChange', handleLyricsActivity);
  }, [handleLyricsActivity]);

  const lyricsLineComponent = !isEditing ? (
    <span
      className={`scale-75 cursor-pointer text-center text-5xl font-medium opacity-50 transition-[opacity,transform] ${shouldHighlight && 'text-font-color-highlight dark:text-dark-font-color-highlight'} ${
        shouldHighlight ? 'scale-100! opacity-100! group-hover:opacity-75' : ''
      } ${typeof content.text === 'object' && 'flex flex-wrap items-center justify-center text-wrap'}`}
    >
      {typeof content.text === 'string'
        ? content.text
        : content.text.map((word, i) => (
            <EditingLyricWord isPlaying={isPlaying} wordData={word} key={i} />
          ))}
    </span>
  ) : undefined;

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className={`group mb-2 flex flex-col items-center justify-center rounded-xl py-4 ${
        isEditing && `bg-background-color-2/50 dark:bg-dark-background-color-2/50 w-full shadow-xl`
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
      <span className="text-xs opacity-50">{index < 10 ? `0${index}` : index}</span>
      {isEditing ? (
        <input
          type="text"
          placeholder={t('lyricsEditingPage.lyricsText')}
          className="border-background-color-1 bg-background-color-1 dark:border-dark-background-color-1 dark:bg-dark-background-color-1 my-2 w-[90%] rounded-xl border-[3px] px-4 py-4 text-center"
          value={
            typeof content.text === 'string'
              ? content.text
              : content.text.map((data) => data.text).join(' ')
          }
          onChange={(e) => {
            const { value } = e.currentTarget;
            const lineData = isEditingEnhancedSyncedLyrics
              ? value.split(' ').map((line): LyricsLineData => ({ text: line, isActive: false }))
              : value;

            dispatch({
              type: 'UPDATE_LYRICS_TEXT',
              payload: lineData
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
            placeholder={t('lyricsEditingPage.startInSeconds')}
            className="border-background-color-1 bg-background-color-1 dark:border-dark-background-color-1 dark:bg-dark-background-color-1 mx-2 my-1 min-w-[20%] rounded-xl border-[3px] px-1 py-2 text-center"
            value={content.start ?? 0}
            onChange={(e) =>
              dispatch({
                type: 'UPDATE_LYRICS_START_TAG',
                payload: e.currentTarget.valueAsNumber
              })
            }
          />{' '}
          to{' '}
          <input
            type="number"
            placeholder={t('lyricsEditingPage.endInSeconds')}
            className="border-background-color-1 bg-background-color-1 dark:border-dark-background-color-1 dark:bg-dark-background-color-1 mx-2 my-1 min-w-[20%] rounded-xl border-[3px] px-1 py-2 text-center"
            value={content.end ?? 0}
            onChange={(e) =>
              dispatch({
                type: 'UPDATE_LYRICS_END_TAG',
                payload: e.currentTarget.valueAsNumber
              })
            }
          />
        </div>
      ) : (
        <span className="text-xs opacity-75">
          {t('lyricsEditingPage.fromTo', {
            start: content.start || '0.00',
            end: content.end || '0.00'
          })}
        </span>
      )}
      <div className="flex flex-wrap items-center justify-center">
        {isEditing && (
          <>
            <Button
              className={`my-2 text-xs opacity-75 ${
                isEditing &&
                'border-background-color-1! hover:border-background-color-3! dark:border-dark-background-color-1! dark:hover:border-dark-background-color-3!'
              }`}
              label={t('settingsPage.reset')}
              iconName="restart_alt"
              clickHandler={() =>
                dispatch({
                  type: 'UPDATE_ALL_CONTENT',
                  payload: resetLineDataRef.current
                })
              }
            />
            <Button
              className={`my-2 text-xs opacity-75 ${
                isEditing &&
                'border-background-color-1! hover:border-background-color-3! dark:border-dark-background-color-1! dark:hover:border-dark-background-color-3!'
              }`}
              label={t('lyricsEditingPage.deleteLine')}
              iconName="delete"
              clickHandler={() =>
                updateLineData((prevLineData) => {
                  const filteredLineData = prevLineData.filter(
                    (lineData) => lineData.index !== index
                  );
                  return filteredLineData.map((lineData, i) => {
                    lineData.index = i;
                    return lineData;
                  });
                })
              }
            />
            <Button
              className={`my-2 text-xs opacity-75 ${
                isEditing &&
                'border-background-color-1! hover:border-background-color-3! dark:border-dark-background-color-1! dark:hover:border-dark-background-color-3!'
              }`}
              label={t('lyricsEditingPage.addLineAbove')}
              iconName="step_out"
              clickHandler={() =>
                updateLineData((prevLineData) => {
                  const pos = index - 1 < 0 ? 0 : index;
                  prevLineData.splice(pos, 0, {
                    index: 0,
                    isActive: false,
                    text: '•••'
                  });

                  return prevLineData.map((lineData, i) => ({
                    ...lineData,
                    index: i
                  }));
                })
              }
            />
            <Button
              className={`my-2 text-xs opacity-75 ${
                isEditing &&
                'border-background-color-1! hover:border-background-color-3! dark:border-dark-background-color-1! dark:hover:border-dark-background-color-3!'
              }`}
              label={t('lyricsEditingPage.addLineBelow')}
              iconName="step_into"
              clickHandler={() =>
                updateLineData((prevLineData) => {
                  const pos = index + 1 >= prevLineData.length ? prevLineData.length : index + 1;
                  prevLineData.splice(pos, 0, {
                    index: 0,
                    isActive: false,
                    text: '•••'
                  });

                  return prevLineData.map((lineData, i) => ({
                    ...lineData,
                    index: i
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
              'border-background-color-1! hover:border-background-color-3! dark:border-dark-background-color-1! dark:hover:border-dark-background-color-3!'
            }`}
            label={t('lyricsEditingPage.addInstrumentalLineBelow')}
            iconName="music_note"
            clickHandler={() => {
              updateLineData((prevLineData) => {
                const pos = index + 1 >= prevLineData.length ? prevLineData.length : index + 1;
                prevLineData.splice(pos, 0, {
                  index: 0,
                  isActive: false,
                  text: ' ♪ '
                });

                return prevLineData.map((lineData, i) => ({
                  ...lineData,
                  index: i
                }));
              });
            }}
          />
        )}
        <Button
          className={`my-2 !mr-0 text-xs opacity-75 ${
            isEditing &&
            'border-background-color-1! hover:border-background-color-3! dark:border-dark-background-color-1! dark:hover:border-dark-background-color-3!'
          }`}
          label={t(`lyricsEditingPage.${isEditing ? 'finishEditing' : 'editLine'}`)}
          iconName={isEditing ? 'done' : 'edit'}
          clickHandler={() => {
            setIsEditing((isEditingState) => {
              if (isEditingState === true)
                updateLineData((prevLineData) => {
                  const lineData = prevLineData.find((line) => line.index === index);

                  if (lineData) {
                    lineData.text = content.text || text;
                    lineData.start = content.start || start;
                    lineData.end = content.end || end;
                  }

                  if (lyricsEditorSettings.editNextAndCurrentStartAndEndTagsAutomatically) {
                    if (prevLineData[index - 1]) prevLineData[index - 1].end = content.start;
                    if (prevLineData[index + 1]) prevLineData[index + 1].start = content.end;
                  }

                  return prevLineData.slice();
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
