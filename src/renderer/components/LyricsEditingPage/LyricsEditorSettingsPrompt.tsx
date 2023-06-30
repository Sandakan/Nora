import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';

import storage from 'renderer/utils/localStorage';
import debounce from 'renderer/utils/debounce';

import Checkbox from '../Checkbox';

const LyricsEditorSettingsPrompt = () => {
  const { localStorageData } = React.useContext(AppContext);
  const [offset, setOffset] = React.useState(
    localStorageData.lyricsEditorSettings.offset || 0
  );

  return (
    <div>
      <div className="title-container mb-4 flex items-center text-3xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        <span className="material-icons-round-outlined mr-2 text-4xl">
          settings
        </span>{' '}
        Lyrics Editor Settings
      </div>
      <ul className="list-disc pl-6 marker:bg-font-color-highlight dark:marker:bg-dark-font-color-highlight">
        <li className="secondary-container show-remaining-song-duration mb-4">
          <p className="description">
            Change the start time tag of the next lyrics line when you edit the
            end time tag of the current lyrics line.
          </p>
          <Checkbox
            id="editNextStartTagWithCurrentEndTag"
            isChecked={
              localStorageData !== undefined &&
              localStorageData.lyricsEditorSettings
                .editNextStartTagWithCurrentEndTag
            }
            checkedStateUpdateFunction={(state) =>
              storage.lyricsEditorSettings.setLyricsEditorSettings(
                'editNextStartTagWithCurrentEndTag',
                state
              )
            }
            labelContent="Edit next line's start tag with the current line's end tag automatically."
          />
        </li>
        <li className="secondary-container show-remaining-song-duration mb-4">
          <p className="description">
            Select a negative or positive offset to add to lyrics lines when
            editing them automatically.
          </p>
          <input
            type="number"
            id="lyric-offset-input"
            className="ml-2 mt-2 w-[90%] max-w-xs rounded-3xl border-[.15rem] border-background-color-2 bg-background-color-2 px-4 py-2 text-font-color-black transition-colors focus:border-font-color-highlight dark:border-dark-background-color-2 dark:bg-dark-background-color-2 dark:text-font-color-white dark:focus:border-dark-font-color-highlight"
            name="offset"
            placeholder="Offset (+ or -)"
            value={offset}
            onKeyDown={(e) => e.stopPropagation()}
            onChange={(e) => {
              const newOffset = e.currentTarget.valueAsNumber;
              setOffset(newOffset);
              debounce(() => {
                storage.lyricsEditorSettings.setLyricsEditorSettings(
                  'offset',
                  newOffset
                );
              }, 250);
            }}
          />
        </li>
      </ul>
    </div>
  );
};

export default LyricsEditorSettingsPrompt;
