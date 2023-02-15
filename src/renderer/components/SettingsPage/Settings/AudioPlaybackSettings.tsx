/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import Button from '../../Button';
import Checkbox from '../../Checkbox';
import Hyperlink from '../../Hyperlink';
import MusixmatchSettingsPrompt from '../MusixmatchSettingsPrompt';

const AudioPlaybackSettings = () => {
  const { userData } = React.useContext(AppContext);
  const { updateUserData, changePromptMenuData } =
    React.useContext(AppUpdateContext);

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
              userData !== undefined &&
              userData.preferences.showSongRemainingTime
            }
            checkedStateUpdateFunction={(state) =>
              updateUserData(async (prevUserData) => {
                await window.api.saveUserData(
                  'preferences.showSongRemainingTime',
                  state
                );
                return {
                  ...prevUserData,
                  preferences: {
                    ...prevUserData.preferences,
                    showSongRemainingTime: state,
                  },
                };
              })
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
              <span
                className="cursor-pointer text-font-color-highlight hover:underline dark:text-dark-font-color-highlight-2"
                onClick={() => {
                  changePromptMenuData(
                    true,
                    <div className="">
                      <div className="mb-4 text-2xl font-semibold">
                        DISCLAIMER - MUSIXMATCH LYRICS
                      </div>
                      <div className="description">
                        <p>
                          Musixmatch Lyrics is added as an evaluation feature to
                          this software. This feature could be removed at any
                          time. You use it at your own risk.
                        </p>
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
                }}
              >
                Musixmatch Lyrics Disclaimer
              </span>
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
      </ul>
    </>
  );
};

export default AudioPlaybackSettings;
