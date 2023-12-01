import React from 'react';
import { useTranslation } from 'react-i18next';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';

import Button from 'renderer/components/Button';
import Checkbox from 'renderer/components/Checkbox';

import LastFMIcon from '../../../../../assets/images/webp/last-fm-logo.webp';

const AccountsSettings = () => {
  const { userData } = React.useContext(AppContext);
  const { updateUserData } = React.useContext(AppUpdateContext);
  const { t } = useTranslation();

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
        {t('settingsPage.accounts')}
      </div>
      <ul className="list-disc pl-6 marker:bg-background-color-3 dark:marker:bg-background-color-3">
        <li className="last-fm-integration mb-4">
          <div className="description">
            {' '}
            {t('settingsPage.integrateLastFm')}
          </div>
          <div className="p-4 pb-0 flex">
            <img
              src={LastFMIcon}
              alt={t('settingsPage.lastFmLogo')}
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
                {t(
                  isLastFmConnected
                    ? 'settingsPage.lastFmConnected'
                    : 'settingsPage.lastFmNotConnected',
                )}{' '}
                {isLastFmConnected &&
                  userData?.lastFmSessionData &&
                  `(${t('settingsPage.loggedInAs')} ${
                    userData.lastFmSessionData.name
                  })`}
              </p>
              <ul className="list-disc text-sm list-inside">
                <li>{t('settingsPage.lastFmDescription1')}</li>
                <li>{t('settingsPage.lastFmDescription2')}</li>
                <li>{t('settingsPage.lastFmDescription3')}</li>
                <li>{t('settingsPage.lastFmDescription4')}</li>
              </ul>
              <Button
                label={
                  isLastFmConnected
                    ? t('settingsPage.authenticateAgain')
                    : t('settingsPage.loginInBrowser')
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
                {t('settingsPage.scrobblingDescription')}
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
                labelContent={t('settingsPage.enableScrobbling')}
                isDisabled={!isLastFmConnected}
              />
            </li>
            <li
              className={`last-fm-integration mb-4 transition-opacity ${
                !isLastFmConnected && 'cursor-not-allowed opacity-50'
              }`}
            >
              <div className="description">
                {t('settingsPage.sendFavoritesToLastFmDescription')}
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
                labelContent={t('settingsPage.sendFavoritesToLastFm')}
                isDisabled={!isLastFmConnected}
              />
            </li>
            <li
              className={`last-fm-integration mb-4 transition-opacity ${
                !isLastFmConnected && 'cursor-not-allowed opacity-50'
              }`}
            >
              <div className="description">
                {t('settingsPage.sendNowPlayingToLastFmDescription')}
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
                labelContent={t('settingsPage.sendNowPlayingToLastFm')}
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
