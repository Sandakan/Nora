import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import storage from '../../utils/localStorage';
import debounce from '../../utils/debounce';

import Checkbox from '../Checkbox';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store';

const LyricsEditorSettingsPrompt = () => {
  const lyricsEditorSettings = useStore(store, (state) => state.localStorage.lyricsEditorSettings);
  const { t } = useTranslation();

  const [offset, setOffset] = useState(lyricsEditorSettings.offset || 0);

  return (
    <div>
      <div className="title-container mb-4 flex items-center text-3xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        <span className="material-icons-round-outlined mr-2 text-4xl">settings</span>{' '}
        {t('lyricsEditorSettingsPrompt.lyricsEditorSettings')}
      </div>
      <ul className="list-disc pl-6 marker:bg-font-color-highlight dark:marker:bg-dark-font-color-highlight">
        <li className="secondary-container show-remaining-song-duration mb-4">
          <p className="description">
            {t(
              'lyricsEditorSettingsPrompt.editNextAndCurrentStartAndEndTagsAutomaticallyDescription'
            )}
          </p>
          <Checkbox
            id="editNextAndCurrentStartAndEndTagsAutomatically"
            isChecked={lyricsEditorSettings.editNextAndCurrentStartAndEndTagsAutomatically}
            checkedStateUpdateFunction={(state) =>
              storage.lyricsEditorSettings.setLyricsEditorSettings(
                'editNextAndCurrentStartAndEndTagsAutomatically',
                state
              )
            }
            labelContent={t(
              'lyricsEditorSettingsPrompt.editNextAndCurrentStartAndEndTagsAutomatically'
            )}
          />
        </li>
        <li className="secondary-container mb-4">
          <p className="description">
            {t('lyricsEditorSettingsPrompt.lyricOffsetInputDescription')}
          </p>
          <input
            type="number"
            id="lyric-offset-input"
            className="ml-2 mt-2 w-[90%] max-w-xs rounded-3xl border-[.15rem] border-background-color-2 bg-background-color-2 px-4 py-2 text-font-color-black transition-colors focus:border-font-color-highlight dark:border-dark-background-color-2 dark:bg-dark-background-color-2 dark:text-font-color-white dark:focus:border-dark-font-color-highlight"
            name="offset"
            placeholder={t('lyricsEditorSettingsPrompt.lyricOffsetInput')}
            value={offset}
            onKeyDown={(e) => e.stopPropagation()}
            onChange={(e) => {
              const newOffset = e.currentTarget.valueAsNumber;
              setOffset(newOffset);
              debounce(() => {
                storage.lyricsEditorSettings.setLyricsEditorSettings('offset', newOffset);
              }, 250);
            }}
          />
        </li>
      </ul>
    </div>
  );
};

export default LyricsEditorSettingsPrompt;
