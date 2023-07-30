import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';

import Button from 'renderer/components/Button';
import Checkbox from 'renderer/components/Checkbox';

import LastFMIcon from '../../../../../assets/images/webp/last-fm-logo.webp';

const AccountsSettings = () => {
  const { userData } = React.useContext(AppContext);
  const { updateUserData } = React.useContext(AppUpdateContext);

  const isLastFmConnected = React.useMemo(
    () => !!userData?.lastFmSessionData,
    [userData?.lastFmSessionData],
  );

  return (
    <li className="main-container startup-settings-container mb-16">
      <div className="title-container mb-4 mt-1 flex items-center text-2xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        <span className="material-icons-round-outlined mr-2">
          account_circle
        </span>
        Accounts
      </div>
      <ul className="list-disc pl-6 marker:bg-background-color-3 dark:marker:bg-background-color-3">
        <li className="last-fm-integration mb-4">
          <div className="description">Integrate Last.fm with Nora.</div>
          <div className="p-4 pb-0 flex">
            <img
              src={LastFMIcon}
              alt="LastFm Icon"
              className={`rounded-md w-16 mr-4 h-16 ${
                !isLastFmConnected && 'grayscale brightness-90'
              }`}
            />
            <div className="flex-grow-0">
              <p
                className={`uppercase font-semibold flex items-center ${
                  isLastFmConnected ? 'text-green-500' : 'text-red-500'
                } `}
              >
                {' '}
                <span className="material-icons-round-outlined text-xl mr-2">
                  {isLastFmConnected ? 'done' : 'close'}
                </span>{' '}
                Last.fm {!isLastFmConnected && 'Not '}Connected{' '}
                {isLastFmConnected &&
                  userData?.lastFmSessionData &&
                  `(Logged in as ${userData.lastFmSessionData.name})`}
              </p>
              <ul className="list-disc text-sm list-inside">
                <li>Connect with Last.fm to enable Scrobbling.</li>
                <li>
                  Scrobbling is a way to send information about the music a user
                  is listening to.
                </li>
                <li>
                  Whenever you listen to a song, Last.fm “scrobbles” that song
                  and adds it to your account.
                </li>
                <li>This feature requires an internet connection.</li>
              </ul>
              <Button
                label={
                  isLastFmConnected ? 'Authenticate Again' : 'Login in Browser'
                }
                iconName="open_in_new"
                className="mt-2"
                clickHandler={() =>
                  window.api.settingsHelpers.loginToLastFmInBrowser()
                }
              />
            </div>
          </div>
          <ul className="list-disc mt-4 pl-8 marker:bg-background-color-3 dark:marker:bg-background-color-3">
            <li
              className={`last-fm-integration mb-4 transition-opacity ${
                !isLastFmConnected && 'cursor-not-allowed opacity-50'
              }`}
            >
              <div className="description">
                Enable Last.Fm Scrobbling to send data related to how you listen
                to songs.
              </div>
              <Checkbox
                id="sendSongScrobblingDataToLastFM"
                isChecked={
                  !!userData?.preferences.sendSongScrobblingDataToLastFM
                }
                checkedStateUpdateFunction={(state) =>
                  window.api.userData
                    .saveUserData(
                      'preferences.sendSongScrobblingDataToLastFM',
                      state,
                    )
                    .then(() =>
                      updateUserData((prevUserData) => ({
                        ...prevUserData,
                        preferences: {
                          ...prevUserData.preferences,
                          sendSongScrobblingDataToLastFM: state,
                        },
                      })),
                    )
                }
                labelContent="Enable Last.Fm Scrobbling"
                isDisabled={!isLastFmConnected}
              />
            </li>
            <li
              className={`last-fm-integration mb-4 transition-opacity ${
                !isLastFmConnected && 'cursor-not-allowed opacity-50'
              }`}
            >
              <div className="description">
                Send Favorites data to Last.Fm when you Like/Dislike songs.
              </div>
              <Checkbox
                id="sendSongFavoritesDataToLastFM"
                isChecked={
                  !!userData?.preferences.sendSongFavoritesDataToLastFM
                }
                checkedStateUpdateFunction={(state) =>
                  window.api.userData
                    .saveUserData(
                      'preferences.sendSongFavoritesDataToLastFM',
                      state,
                    )
                    .then(() =>
                      updateUserData((prevUserData) => ({
                        ...prevUserData,
                        preferences: {
                          ...prevUserData.preferences,
                          sendSongFavoritesDataToLastFM: state,
                        },
                      })),
                    )
                }
                labelContent="Send Favorites data"
                isDisabled={!isLastFmConnected}
              />
            </li>
            <li
              className={`last-fm-integration mb-4 transition-opacity ${
                !isLastFmConnected && 'cursor-not-allowed opacity-50'
              }`}
            >
              <div className="description">
                Send Now Playing song data to LastFm automatically when you
                start to play a song.
              </div>
              <Checkbox
                id="sendNowPlayingSongDataToLastFM"
                isChecked={
                  !!userData?.preferences.sendNowPlayingSongDataToLastFM
                }
                checkedStateUpdateFunction={(state) =>
                  window.api.userData
                    .saveUserData(
                      'preferences.sendNowPlayingSongDataToLastFM',
                      state,
                    )
                    .then(() =>
                      updateUserData((prevUserData) => ({
                        ...prevUserData,
                        preferences: {
                          ...prevUserData.preferences,
                          sendNowPlayingSongDataToLastFM: state,
                        },
                      })),
                    )
                }
                labelContent="Send Now Playing Song data"
                isDisabled={!isLastFmConnected}
              />
            </li>
          </ul>
        </li>
      </ul>
    </li>
  );
};

export default AccountsSettings;
