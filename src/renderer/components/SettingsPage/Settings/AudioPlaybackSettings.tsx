/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react';
import Dropdown, { DropdownOption } from 'renderer/components/Dropdown';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import storage from 'renderer/utils/localStorage';
import Button from '../../Button';
import Checkbox from '../../Checkbox';
import Hyperlink from '../../Hyperlink';
import MusixmatchSettingsPrompt from '../MusixmatchSettingsPrompt';

const MusixmatchDisclaimerPrompt = () => {
  return (
    <div className="">
      <div className="mb-4 text-2xl font-semibold uppercase">
        Disclaimer - Musixmatch Lyrics
      </div>
      <div className="description">
        <ul className="list-inside list-disc">
          <li>
            Musixmatch Lyrics is added as an evaluation feature to this software
            and could be removed at any time.
          </li>
          <li>
            Nora is in no way affiliated with, authorised, maintained, sponsored
            or endorsed by Musixmatch Lyrics or any of its affiliates or
            subsidiaries.
          </li>
          <li>
            The maintainers of this application call upon the personal
            responsibility of its users to use this feature in a fair way, as it
            is intended to be used by obeying the copyrights implemented by
            Musixmatch Lyrics.
          </li>
        </ul>
        <br />
        <p>
          Implementation from Fashni's
          <Hyperlink
            label="MxLRC"
            link="https://github.com/fashni/MxLRC"
            linkTitle="MxLRC Github Repository"
            className="ml-1"
          />
          .
        </p>
        <br />
        <p>
          If you have any complaints,{' '}
          <Hyperlink
            label="Contact me through my email."
            link="mailto:sandakannipunajith@gmail.com?subject=Regarding Nora"
            linkTitle="Email"
            noValidityCheck
          />
          .
        </p>
      </div>
    </div>
  );
};

const seekbarScrollIntervals: DropdownOption<string>[] = [
  { label: '1 second', value: '1' },
  { label: '2.5 seconds', value: '2.5' },
  { label: '5 seconds', value: '5' },
  { label: '10 seconds', value: '10' },
  { label: '15 seconds', value: '15' },
  { label: '20 seconds', value: '20' },
];

const AudioPlaybackSettings = () => {
  const { userData, localStorageData } = React.useContext(AppContext);
  const { updateUserData, changePromptMenuData } =
    React.useContext(AppUpdateContext);

  const [seekbarScrollInterval, setSeekbarScrollInterval] = React.useState('5');

  React.useEffect(() => {
    const interval = storage.preferences.getPreferences(
      'seekbarScrollInterval'
    );
    setSeekbarScrollInterval(interval.toString());
  }, []);

  return (
    <>
      <div className="title-container mt-1 mb-4 flex items-center text-2xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        <span className="material-icons-round-outlined mr-2">
          slow_motion_video
        </span>
        Audio Playback
      </div>
      <ul className="list-disc pl-6 marker:bg-font-color-highlight dark:marker:bg-dark-font-color-highlight">
        <li className="secondary-container show-remaining-song-duration mb-4">
          <div className="description">
            Shows the remaining duration of the song instead of the default song
            duration.
          </div>
          <Checkbox
            id="toggleShowRemainingSongDuration"
            isChecked={
              localStorageData !== undefined &&
              localStorageData.preferences.showSongRemainingTime
            }
            checkedStateUpdateFunction={(state) =>
              storage.preferences.setPreferences('showSongRemainingTime', state)
            }
            labelContent="Show remaining song duration"
          />
        </li>

        <li className="secondary-container enable-musixmatch-lyrics mb-4">
          <div className="description">
            Enable Musixmatch Lyrics that provides synced and unsynced lyrics
            for your playlist on-demand.
            <div className="mt-1 ml-2 text-sm font-light">
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
                    'edit-musixmatch-settings'
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
                window.api.saveUserData(
                  'preferences.isMusixmatchLyricsEnabled',
                  state
                );
                updateUserData((prevData) => ({
                  ...prevData,
                  preferences: {
                    ...prevData.preferences,
                    isMusixmatchLyricsEnabled: state,
                  },
                }));
              }}
              isDisabled={userData?.preferences.isMusixmatchLyricsEnabled}
            />
          </div>
        </li>

        <li className="seekbar-scroll-interval mb-4">
          <div className="description">
            Change the increment amount when scrolled over audio seek bar and
            volume seek bar.
          </div>
          <Dropdown
            className="mt-4"
            name="seekbarScrollInterval"
            value={seekbarScrollInterval.toString()}
            options={seekbarScrollIntervals}
            onChange={(e) => {
              const val = e.currentTarget.value;
              setSeekbarScrollInterval(val);
              storage.preferences.setPreferences(
                'seekbarScrollInterval',
                parseFloat(val)
              );
            }}
          />
        </li>
      </ul>
    </>
  );
};

export default AudioPlaybackSettings;
