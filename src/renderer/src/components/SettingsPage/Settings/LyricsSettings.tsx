import { lazy, useContext, useEffect, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import storage from '../../../utils/localStorage';

import { AppUpdateContext } from '../../../contexts/AppUpdateContext';

import Button from '../../Button';
import Checkbox from '../../Checkbox';
import Dropdown, { type DropdownOption } from '../../Dropdown';

import i18n from '../../../i18n';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store/store';

const MusixmatchSettingsPrompt = lazy(() => import('../MusixmatchSettingsPrompt'));
const MusixmatchDisclaimerPrompt = lazy(() => import('../MusixmatchDisclaimerPrompt'));

const automaticallySaveLyricsOptions: DropdownOption<AutomaticallySaveLyricsTypes>[] = [
  {
    label: i18n.t('settingsPage.doNotSaveLyricsAutomatically'),
    value: 'NONE'
  },
  { label: i18n.t('settingsPage.syncedLyricsOnly'), value: 'SYNCED' },
  {
    label: i18n.t('settingsPage.saveEitherLyrics'),
    value: 'SYNCED_OR_UN_SYNCED'
  }
];

const LyricsSettings = () => {
  const userData = useStore(store, (state) => state.userData);

  const { changePromptMenuData, updateUserData } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const [lyricsAutomaticallySaveState, setLyricsAutomaticallySaveState] =
    useState<AutomaticallySaveLyricsTypes>('NONE');

  useEffect(() => {
    const lyricsSaveState = storage.preferences.getPreferences('lyricsAutomaticallySaveState');

    setLyricsAutomaticallySaveState(lyricsSaveState);
  }, []);

  const [autoTranslateLyrics, setAutoTranslateLyrics] = useState(false);

  useEffect(() => {
    const autoTranslateLyrics = storage.preferences.getPreferences('autoTranslateLyrics');

    setAutoTranslateLyrics(autoTranslateLyrics);
  }, []);

  const [autoConvertLyrics, setAutoConvertLyrics] = useState(false);

  useEffect(() => {
    const autoConvertLyrics = storage.preferences.getPreferences('autoConvertLyrics');

    setAutoConvertLyrics(autoConvertLyrics);
  }, []);

  return (
    <li className="main-container audio-playback-settings-container mb-16">
      <div className="title-container text-font-color-highlight dark:text-dark-font-color-highlight mt-1 mb-4 flex items-center text-2xl font-medium">
        <span className="material-icons-round-outlined mr-2">notes</span>
        {t('settingsPage.lyrics')}
      </div>
      <ul className="marker:bg-font-color-highlight dark:marker:bg-dark-font-color-highlight list-disc pl-6">
        <li className="secondary-container enable-musixmatch-lyrics mb-4">
          <div className="description">
            {t('settingsPage.enableMusixmatchLyricsDescription')}
            <div className="mt-1 ml-2 text-sm font-light">
              <Trans
                i18nKey="settingsPage.musixmatchDisclaimerNotice"
                components={{
                  Button: (
                    <Button
                      className="text-font-color-highlight-2! dark:text-dark-font-color-highlight-2! m-0! inline! rounded-none! border-0! bg-transparent! p-0! px-2 outline-offset-1 hover:underline focus-visible:outline! dark:bg-transparent!"
                      clickHandler={() => {
                        changePromptMenuData(true, <MusixmatchDisclaimerPrompt />);
                      }}
                    />
                  )
                }}
              />
            </div>
          </div>
          <div className="mt-4 flex">
            {userData?.preferences.isMusixmatchLyricsEnabled && (
              <Button
                label={t('settingsPage.editMusixmatchSettings')}
                iconName="settings"
                clickHandler={() =>
                  changePromptMenuData(
                    true,
                    <MusixmatchSettingsPrompt />,
                    'edit-musixmatch-settings'
                  )
                }
              />
            )}
            <Button
              label={
                userData?.preferences.isMusixmatchLyricsEnabled
                  ? t('settingsPage.musixmatchEnabled')
                  : t('settingsPage.enableMusixmatch')
              }
              iconName={userData?.preferences.isMusixmatchLyricsEnabled ? 'done' : undefined}
              clickHandler={() => {
                const state = !userData?.preferences.isMusixmatchLyricsEnabled;
                window.api.userData
                  .saveUserData('preferences.isMusixmatchLyricsEnabled', state)
                  .then(() =>
                    updateUserData((prevData) => ({
                      ...prevData,
                      preferences: {
                        ...prevData.preferences,
                        isMusixmatchLyricsEnabled: state
                      }
                    }))
                  )
                  .catch((err) => console.error(err));
              }}
              isDisabled={userData?.preferences.isMusixmatchLyricsEnabled}
            />
          </div>
        </li>

        <li className="save-lyrics-automatically mb-4">
          <div className="description">{t('settingsPage.saveLyricsAutomaticallyDescription')}</div>
          <div className="mt-4 flex flex-row items-center">
            <Dropdown
              name="lyricsAutomaticallySaveState"
              value={lyricsAutomaticallySaveState}
              options={automaticallySaveLyricsOptions}
              onChange={(e) => {
                const val = e.currentTarget.value as AutomaticallySaveLyricsTypes;
                setLyricsAutomaticallySaveState(val);
                storage.preferences.setPreferences('lyricsAutomaticallySaveState', val);
              }}
            />
            <span
              className="material-icons-round-outlined text-font-color-highlight dark:text-dark-font-color-highlight ml-4 cursor-pointer text-2xl"
              title={t('settingsPage.saveLyricsAutomaticallyInfo')}
            >
              help
            </span>
          </div>
        </li>

        <li className="secondary-container always-save-lrc-files mb-4">
          <div className="description">{t('settingsPage.saveLyricsInLrcFilesDescription')}</div>
          <Checkbox
            id="saveLyricsInLrcFilesForSupportedSongs"
            isChecked={
              userData !== undefined && userData?.preferences.saveLyricsInLrcFilesForSupportedSongs
            }
            checkedStateUpdateFunction={(state) =>
              window.api.userData
                .saveUserData('preferences.saveLyricsInLrcFilesForSupportedSongs', state)
                .then(() =>
                  updateUserData((prevUserData) => ({
                    ...prevUserData,
                    preferences: {
                      ...prevUserData.preferences,
                      saveLyricsInLrcFilesForSupportedSongs: state
                    }
                  }))
                )
            }
            labelContent={t('settingsPage.saveLyricsInLrcFiles')}
          />
        </li>

        <li className="lrc-files-custom-save-location mb-4">
          <div className="description">
            {t('settingsPage.lrcFileCustomSaveLocationDescription')}
          </div>
          <div className="mt-4 ml-2 flex-row text-sm">
            {userData?.customLrcFilesSaveLocation && (
              <>
                <span>{t('settingsPage.selectedCustomLocation')}: </span>
                <span className="text-font-color-highlight dark:text-dark-font-color-highlight mr-4">
                  {userData.customLrcFilesSaveLocation}
                </span>
              </>
            )}
          </div>
          <div className="mt-4 flex flex-row items-center">
            <Button
              label={t('settingsPage.setCustomLocation')}
              iconName="location_on"
              iconClassName="material-icons-round-outlined"
              clickHandler={() =>
                window.api.settingsHelpers
                  .getFolderLocation()
                  .then((folderPath) =>
                    window.api.userData
                      .saveUserData('customLrcFilesSaveLocation', folderPath)
                      .then(() =>
                        updateUserData((prevUserData) => ({
                          ...prevUserData,
                          customLrcFilesSaveLocation: folderPath
                        }))
                      )
                  )
                  .catch((err) => console.warn(err))
              }
            />
          </div>
        </li>

        <li className="secondary-container auto-translate-lyrics mb-4">
          <div className="description">{t('settingsPage.autoTranslateLyricsDescription')}</div>
          <Checkbox
            id="autoTranslateLyrics"
            isChecked={autoTranslateLyrics}
            checkedStateUpdateFunction={(state) => {
              setAutoTranslateLyrics(state);
              storage.preferences.setPreferences('autoTranslateLyrics', state);
            }}
            labelContent={t('settingsPage.autoTranslateLyrics')}
          />
        </li>

        <li className="secondary-container auto-convert-lyrics mb-4">
          <div className="description">{t('settingsPage.autoConvertLyricsDescription')}</div>
          <Checkbox
            id="autoConvertLyrics"
            isChecked={autoConvertLyrics}
            checkedStateUpdateFunction={(state) => {
              setAutoConvertLyrics(state);
              storage.preferences.setPreferences('autoConvertLyrics', state);
            }}
            labelContent={t('settingsPage.autoConvertLyrics')}
          />
        </li>
      </ul>
    </li>
  );
};

export default LyricsSettings;
