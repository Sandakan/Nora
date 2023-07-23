import React from 'react';
import storage from 'renderer/utils/localStorage';

import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { AppContext } from 'renderer/contexts/AppContext';

import Button from 'renderer/components/Button';
import Dropdown, { DropdownOption } from 'renderer/components/Dropdown';
import MusixmatchSettingsPrompt from '../MusixmatchSettingsPrompt';
import MusixmatchDisclaimerPrompt from '../MusixmatchDisclaimerPrompt';

const automaticallySaveLyricsOptions: DropdownOption<AutomaticallySaveLyricsTypes>[] =
  [
    { label: `Don't save lyrics automatically`, value: 'NONE' },
    { label: 'Synced Lyrics Only', value: 'SYNCED' },
    { label: 'Synced or Unsynced Lyrics', value: 'SYNCED_OR_UN_SYNCED' },
  ];

const LyricsSettings = () => {
  const { userData } = React.useContext(AppContext);
  const { changePromptMenuData, updateUserData } =
    React.useContext(AppUpdateContext);

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
        Lyrics
      </div>
      <ul className="list-disc pl-6 marker:bg-font-color-highlight dark:marker:bg-dark-font-color-highlight">
        <li className="secondary-container enable-musixmatch-lyrics mb-4">
          <div className="description">
            Enable Musixmatch Lyrics that provides synced and unsynced lyrics
            for your playlist on-demand.
            <div className="ml-2 mt-1 text-sm font-light">
              Enabling and using this feature means you have accepted the{' '}
              <Button
                className="!m-0 !inline !rounded-none !border-0 !p-0 !text-font-color-highlight-2 outline-1 outline-offset-1 hover:underline focus-visible:!outline dark:!text-dark-font-color-highlight-2"
                clickHandler={() => {
                  changePromptMenuData(true, <MusixmatchDisclaimerPrompt />);
                }}
                label="Musixmatch Lyrics Disclaimer"
              />
              .
            </div>
          </div>
          <div className="mt-4 flex">
            {userData?.preferences.isMusixmatchLyricsEnabled && (
              <Button
                label="Edit Musixmatch Settings"
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
                  ? 'Musixmatch Lyrics is Enabled.'
                  : 'Enable Musixmatch Lyrics'
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
            Select an option to save song lyrics automatically when fetched in
            Lyrics Page.
          </div>
          <Dropdown
            className="mt-4"
            name="lyricsAutomaticallySaveState"
            value={lyricsAutomaticallySaveState}
            options={automaticallySaveLyricsOptions}
            onChange={(e) => {
              const val = e.currentTarget.value as AutomaticallySaveLyricsTypes;
              setLyricsAutomaticallySaveState(val);
              storage.preferences.setPreferences(
                'lyricsAutomaticallySaveState',
                val,
              );
            }}
          />
        </li>
      </ul>
    </li>
  );
};

export default LyricsSettings;
