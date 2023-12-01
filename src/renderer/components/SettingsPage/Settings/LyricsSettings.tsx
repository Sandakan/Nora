import React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import storage from 'renderer/utils/localStorage';

import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { AppContext } from 'renderer/contexts/AppContext';

import Button from 'renderer/components/Button';
import Checkbox from 'renderer/components/Checkbox';
import Dropdown, { DropdownOption } from 'renderer/components/Dropdown';
import MusixmatchSettingsPrompt from '../MusixmatchSettingsPrompt';
import MusixmatchDisclaimerPrompt from '../MusixmatchDisclaimerPrompt';
import i18n from '../../../i18n';

const automaticallySaveLyricsOptions: DropdownOption<AutomaticallySaveLyricsTypes>[] =
  [
    {
      label: i18n.t('settingsPage.doNotSaveLyricsAutomatically'),
      value: 'NONE',
    },
    { label: i18n.t('settingsPage.syncedLyricsOnly'), value: 'SYNCED' },
    {
      label: i18n.t('settingsPage.saveEitherLyrics'),
      value: 'SYNCED_OR_UN_SYNCED',
    },
  ];

const LyricsSettings = () => {
  const { userData } = React.useContext(AppContext);
  const { changePromptMenuData, updateUserData } =
    React.useContext(AppUpdateContext);
  const { t } = useTranslation();

  const [lyricsAutomaticallySaveState, setLyricsAutomaticallySaveState] =
    React.useState<AutomaticallySaveLyricsTypes>('NONE');

  React.useEffect(() => {
    const lyricsSaveState = storage.preferences.getPreferences(
      'lyricsAutomaticallySaveState',
    );

    setLyricsAutomaticallySaveState(lyricsSaveState);
  }, []);

  return (
    <li className="main-container audio-playback-settings-container mb-16">
      <div className="title-container mb-4 mt-1 flex items-center text-2xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        <span className="material-icons-round-outlined mr-2">notes</span>
        {t('settingsPage.lyrics')}
      </div>
      <ul className="list-disc pl-6 marker:bg-font-color-highlight dark:marker:bg-dark-font-color-highlight">
        <li className="secondary-container enable-musixmatch-lyrics mb-4">
          <div className="description">
            {t('settingsPage.enableMusixmatchLyricsDescription')}
            <div className="ml-2 mt-1 text-sm font-light">
              <Trans
                i18nKey="settingsPage.musixmatchDisclaimerNotice"
                components={{
                  Button: (
                    <Button
                      className="!m-0 !inline !rounded-none !border-0 !p-0 !text-font-color-highlight-2 outline-1 outline-offset-1 hover:underline focus-visible:!outline dark:!text-dark-font-color-highlight-2"
                      clickHandler={() => {
                        changePromptMenuData(
                          true,
                          <MusixmatchDisclaimerPrompt />,
                        );
                      }}
                    />
                  ),
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
                    'edit-musixmatch-settings',
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
              iconName={
                userData?.preferences.isMusixmatchLyricsEnabled
                  ? 'done'
                  : undefined
              }
              clickHandler={() => {
                const state = !userData?.preferences.isMusixmatchLyricsEnabled;
                window.api.userData
                  .saveUserData('preferences.isMusixmatchLyricsEnabled', state)
                  .then(() =>
                    updateUserData((prevData) => ({
                      ...prevData,
                      preferences: {
                        ...prevData.preferences,
                        isMusixmatchLyricsEnabled: state,
                      },
                    })),
                  )
                  .catch((err) => console.error(err));
              }}
              isDisabled={userData?.preferences.isMusixmatchLyricsEnabled}
            />
          </div>
        </li>

        <li className="save-lyrics-automatically mb-4">
          <div className="description">
            {t('settingsPage.saveLyricsAutomaticallyDescription')}
          </div>
          <div className="flex items-center flex-row mt-4">
            <Dropdown
              name="lyricsAutomaticallySaveState"
              value={lyricsAutomaticallySaveState}
              options={automaticallySaveLyricsOptions}
              onChange={(e) => {
                const val = e.currentTarget
                  .value as AutomaticallySaveLyricsTypes;
                setLyricsAutomaticallySaveState(val);
                storage.preferences.setPreferences(
                  'lyricsAutomaticallySaveState',
                  val,
                );
              }}
            />
            <span
              className="material-icons-round-outlined ml-4 text-2xl cursor-pointer text-font-color-highlight dark:text-dark-font-color-highlight"
              title={t('settingsPage.saveLyricsAutomaticallyInfo')}
            >
              help
            </span>
          </div>
        </li>

        <li className="secondary-container always-save-lrc-files mb-4">
          <div className="description">
            {t('settingsPage.saveLyricsInLrcFilesDescription')}
          </div>
          <Checkbox
            id="saveLyricsInLrcFilesForSupportedSongs"
            isChecked={
              userData !== undefined &&
              userData?.preferences.saveLyricsInLrcFilesForSupportedSongs
            }
            checkedStateUpdateFunction={(state) =>
              window.api.userData.saveUserData(
                'preferences.saveLyricsInLrcFilesForSupportedSongs',
                state,
              )
            }
            labelContent={t('settingsPage.saveLyricsInLrcFiles')}
          />
        </li>

        <li className="lrc-files-custom-save-location mb-4">
          <div className="description">
            {t('settingsPage.lrcFileCustomSaveLocationDescription')}
          </div>
          <div className="flex-row mt-4 text-sm ml-2">
            {userData?.customLrcFilesSaveLocation && (
              <>
                <span>{t('settingsPage.selectedCustomLocation')}: </span>
                <span className="mr-4  text-font-color-highlight dark:text-dark-font-color-highlight">
                  {userData.customLrcFilesSaveLocation}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center flex-row mt-4">
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
                          customLrcFilesSaveLocation: folderPath,
                        })),
                      ),
                  )
                  .catch((err) => console.warn(err))
              }
            />
          </div>
        </li>
      </ul>
    </li>
  );
};

export default LyricsSettings;
